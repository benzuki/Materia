/**
 * Turns tokens.json into src/app/tokens.generated.css and src/lib/tokens.ts.
 *
 * tokens.json is a single Token Studio export holding four sets. `light-theme` and
 * `dark-theme` define the same token paths with different values, so they cannot be
 * merged into one dictionary — each theme gets its own build pass over
 * core + alias + that theme's set. `$themes` is empty, so the sets a theme is built
 * from are wired here rather than read from the file.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import type { Config, DesignTokens } from 'style-dictionary/types';
import { register } from '@tokens-studio/sd-transforms';
import {
  createTailwindV4Plugin,
  registerCustomPreprocessors,
  registerCustomTransforms,
} from './tailwind-v4.mts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(repoRoot, 'tokens.json');
const cssOutput = join(repoRoot, 'src', 'app', 'tokens.generated.css');
const tsOutput = join(repoRoot, 'src', 'lib', 'tokens.ts');

const themeSets: Record<string, string> = {
  light: 'light-theme',
  dark: 'dark-theme',
};

const themeSelectors = {
  light: ':root',
  dark: '[data-theme="dark"]',
};

interface TokenFile {
  $metadata?: { tokenSetOrder?: string[] };
  [set: string]: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];
    target[key] = isRecord(value) && isRecord(existing) ? deepMerge(existing, value) : value;
  }
  return target;
}

const file = JSON.parse(readFileSync(source, 'utf8')) as TokenFile;
const setOrder = file.$metadata?.tokenSetOrder ?? Object.keys(file).filter((key) => key[0] !== '$');
const baseSets = setOrder.filter((set) => !Object.values(themeSets).includes(set));

for (const set of [...baseSets, ...Object.values(themeSets)]) {
  if (!isRecord(file[set])) {
    throw new Error(`tokens.json has no token set named "${set}".`);
  }
}

/**
 * Token Studio references omit the set name — `{base.foundations.white}` points into
 * the alias set — so the sets are merged into one tree before Style Dictionary sees
 * them, in `tokenSetOrder` so later sets win.
 */
function tokensForTheme(theme: string): DesignTokens {
  const merged: Record<string, unknown> = {};
  for (const set of [...baseSets, themeSets[theme]]) {
    deepMerge(merged, file[set] as Record<string, unknown>);
  }
  return merged as DesignTokens;
}

register(StyleDictionary);
registerCustomPreprocessors(StyleDictionary);
registerCustomTransforms(StyleDictionary);

const plugin = createTailwindV4Plugin({ themeSelectors });
StyleDictionary.registerFormat({ name: 'materia/tailwind-v4', format: plugin.format });

function configForTheme(theme: string): Config {
  return {
    tokens: tokensForTheme(theme),
    preprocessors: ['materia/math-spacing', 'tokens-studio'],
    platforms: {
      css: {
        transformGroup: 'tokens-studio',
        transforms: ['name/utility-kebab'],
        files: [
          {
            destination: 'tokens.generated.css',
            format: 'materia/tailwind-v4',
            options: { theme },
          },
        ],
      },
    },
    // Silent verbosity: every typography token carries a paragraphSpacing, which
    // has no slot in the CSS `font` shorthand, so the shorthand transform warns
    // about all 17 of them on every run and there is nothing to act on. Broken
    // references still throw.
    log: { verbosity: 'silent', warnings: 'warn' },
  };
}

let css = '';
for (const theme of Object.keys(themeSets)) {
  const dictionary = new StyleDictionary(configForTheme(theme));
  const [output] = await dictionary.formatPlatform('css');
  // Each pass adds one theme to the plugin, so the last one returns the whole file.
  css = String(output.output);
}

const undeclared = plugin.undeclared();
if (undeclared.length > 0) {
  console.warn(
    `Tokens defined outside the base theme, so they have no ${themeSelectors.light} value:\n  ${undeclared.join('\n  ')}`,
  );
}

for (const [path, contents] of [
  [cssOutput, css],
  [tsOutput, plugin.toTypeScript()],
] as const) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, 'utf8');
  console.log(`tokens:build → ${relative(repoRoot, path)}`);
}
