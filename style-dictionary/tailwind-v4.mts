/**
 * Tailwind v4 plugin for Style Dictionary.
 *
 * Derived from tokens-studio/sd-tailwindv4 (`createTailwindV4Plugin`), adapted to
 * two things the reference does not cover:
 *
 *   - The reference reads theme variants from a `_`/`dark` suffix inside one token
 *     tree. Ours are separate Token Studio sets that redefine the same paths, so a
 *     theme cannot be a suffix and arrives as one dictionary per build pass.
 *   - Values live under `:root` / `[data-theme="dark"]` and Tailwind's namespaces
 *     are mapped onto them with `@theme inline`. Without `inline`, Tailwind copies
 *     the light value into its utilities and the dark override never applies.
 */

import type {
  Dictionary,
  FormatFnArguments,
  PreprocessedTokens,
  Preprocessor,
  Transform,
  TransformedToken,
} from 'style-dictionary/types';

export interface ThemeSelectors {
  [theme: string]: string;
}

export interface TailwindNamespaces {
  [group: string]: string;
}

export interface OutputOptions {
  showComments: boolean;
}

export interface PluginConfig {
  /** Selector each theme's custom properties are written under. */
  themeSelectors: ThemeSelectors;
  /** Namespace for the raw value layer. It has to be non-empty and outside
   *  Tailwind's namespaces, or a token whose group already matches its namespace
   *  (`font-weight`) would end up declared as `var()` of itself. */
  propertyPrefix: string;
  /** Token set root components consume. Everything outside it is plumbing. */
  tokenRoot: string;
  /** Groups under the root that stay internal — raw ramps, not semantic tokens. */
  excludeGroups: string[];
  /** Token group -> Tailwind v4 theme namespace. Groups absent here get a custom
   *  property but no utility, because Tailwind has no namespace to hang one on. */
  tailwindNamespaces: TailwindNamespaces;
  outputOptions: OutputOptions;
}

export interface ProcessedToken {
  path: string[];
  type: string;
  /** Custom property name without the leading `--`. */
  key: string;
  value: string;
  /** Tailwind theme variable this token backs, or null if it maps to no namespace. */
  tailwindProperty: string | null;
}

export interface ThemePass {
  theme: string;
  tokens: ProcessedToken[];
}

export const DEFAULT_CONFIG: PluginConfig = {
  themeSelectors: {
    light: ':root',
    dark: '[data-theme="dark"]',
  },
  propertyPrefix: 'token',
  tokenRoot: 'base',
  excludeGroups: ['light', 'dark', 'foundations'],
  tailwindNamespaces: {
    colour: 'color',
    space: 'spacing',
    size: 'spacing',
    'border-radius': 'radius',
    'box-shadow': 'shadow',
    'font-size': 'text',
    'line-height': 'leading',
    'font-family': 'font',
    'font-weight': 'font-weight',
  },
  outputOptions: {
    showComments: true,
  },
};

export function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

/**
 * Token Studio writes multiplications and divisions with whatever spacing the
 * author typed, and `ts/resolveMath` cannot parse an operator that is padded on
 * one side only (`{core.size.SCALE} /100`). It leaves the expression as a string,
 * which then reaches the stylesheet verbatim. Even out the spacing first.
 */
function normaliseMath(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.includes('{') && /[*/]/.test(value)
      ? value.replace(/\s*([*/])\s*/g, ' $1 ')
      : value;
  }
  if (Array.isArray(value)) {
    return value.map(normaliseMath);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normaliseMath(entry)]),
    );
  }
  return value;
}

export const mathSpacingPreprocessor: Preprocessor = {
  name: 'materia/math-spacing',
  preprocessor: (tokens) => normaliseMath(tokens) as PreprocessedTokens,
};

/**
 * The `tokens-studio` transform group ends on `name/camel`; this runs after it and
 * puts every name back into the kebab-case that CSS custom properties want.
 */
export const utilityNameTransform: Transform = {
  name: 'name/utility-kebab',
  type: 'name',
  transform: (token) => {
    const path = token.path[0] === 'utilities' ? token.path.slice(1) : token.path;
    return path.map(toKebabCase).join('-');
  },
};

interface Registry {
  registerPreprocessor(preprocessor: Preprocessor): void;
  registerTransform(transform: Transform): void;
}

export function registerCustomPreprocessors(registry: Registry): void {
  registry.registerPreprocessor(mathSpacingPreprocessor);
}

export function registerCustomTransforms(registry: Registry): void {
  registry.registerTransform(utilityNameTransform);
}

export class PluginConfiguration {
  config: PluginConfig;

  constructor(userConfig: Partial<PluginConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...userConfig,
      themeSelectors: { ...DEFAULT_CONFIG.themeSelectors, ...userConfig.themeSelectors },
      tailwindNamespaces: {
        ...DEFAULT_CONFIG.tailwindNamespaces,
        ...userConfig.tailwindNamespaces,
      },
      outputOptions: { ...DEFAULT_CONFIG.outputOptions, ...userConfig.outputOptions },
    };

    if (Object.keys(this.config.themeSelectors).length === 0) {
      throw new Error('themeSelectors must name at least one theme.');
    }
    if (!this.config.propertyPrefix) {
      throw new Error(
        "propertyPrefix must be non-empty to keep the raw value layer out of Tailwind's namespaces.",
      );
    }
  }

  get<K extends keyof PluginConfig>(key: K): PluginConfig[K] {
    return this.config[key];
  }

  /** Custom property the raw value of a token is declared as. */
  property(key: string): string {
    return `--${this.config.propertyPrefix}-${key}`;
  }

  getThemeSelector(theme: string): string {
    const selector = this.config.themeSelectors[theme];
    if (!selector) {
      const known = Object.keys(this.config.themeSelectors).join(', ');
      throw new Error(`No themeSelectors entry for "${theme}". Known themes: ${known}.`);
    }
    return selector;
  }
}

export class TokenProcessingEngine {
  config: PluginConfiguration;

  constructor(config: PluginConfiguration) {
    this.config = config;
  }

  processTokens(dictionary: Dictionary): ProcessedToken[] {
    const processed: ProcessedToken[] = [];
    for (const token of dictionary.allTokens) {
      const result = this.processToken(token);
      if (result) processed.push(result);
    }
    return processed;
  }

  canProcess(token: TransformedToken): boolean {
    const [root, group] = token.path;
    if (root !== this.config.get('tokenRoot')) return false;
    return Boolean(group) && !this.config.get('excludeGroups').includes(group);
  }

  processToken(token: TransformedToken): ProcessedToken | null {
    if (!this.canProcess(token)) return null;

    const rootPrefix = `${toKebabCase(this.config.get('tokenRoot'))}-`;
    if (!token.name.startsWith(rootPrefix)) {
      throw new Error(
        `Token "${token.path.join('.')}" resolved to the name "${token.name}", which is not kebab-case. ` +
          'Add the `name/utility-kebab` transform to the platform.',
      );
    }

    const key = token.name.slice(rootPrefix.length);
    return {
      path: token.path,
      type: token.$type ?? 'unknown',
      key,
      value: String(token.$value),
      tailwindProperty: this.tailwindPropertyFor(token, key),
    };
  }

  tailwindPropertyFor(token: TransformedToken, key: string): string | null {
    const namespace = this.config.get('tailwindNamespaces')[token.path[1]];
    if (!namespace) return null;

    const groupPrefix = `${toKebabCase(token.path[1])}-`;
    if (!key.startsWith(groupPrefix)) return null;

    return `--${namespace}-${key.slice(groupPrefix.length)}`;
  }
}

export class TailwindCSSGenerator {
  config: PluginConfiguration;

  constructor(config: PluginConfiguration) {
    this.config = config;
  }

  rule(selector: string, declarations: string[]): string {
    return `${selector} {\n${declarations.map((line) => `  ${line}`).join('\n')}\n}`;
  }

  comment(text: string): string | null {
    return this.config.get('outputOptions').showComments ? `/* ${text} */` : null;
  }

  generate(passes: ThemePass[]): string {
    if (passes.length === 0) {
      throw new Error('No themes were collected. Run at least one build pass.');
    }

    const [base, ...overrides] = passes;
    const baseValues = new Map(base.tokens.map((token) => [token.key, token.value]));
    const blocks: (string | null)[] = [
      this.comment(`Generated by \`npm run tokens:build\` from tokens.json. Do not edit.`),
      this.comment(`${base.theme} values, and every custom property the theme layer defines`),
      this.rule(
        this.config.getThemeSelector(base.theme),
        base.tokens.map((token) => `${this.config.property(token.key)}: ${token.value};`),
      ),
    ];

    for (const pass of overrides) {
      const changed = pass.tokens.filter((token) => baseValues.get(token.key) !== token.value);
      if (changed.length === 0) continue;
      blocks.push(this.comment(`${pass.theme} overrides`));
      blocks.push(
        this.rule(
          this.config.getThemeSelector(pass.theme),
          changed.map((token) => `${this.config.property(token.key)}: ${token.value};`),
        ),
      );
    }

    const mapped = base.tokens.filter((token) => token.tailwindProperty);
    blocks.push(
      this.comment('Tailwind namespaces, mapped inline so utilities resolve per theme'),
      this.rule(
        '@theme inline',
        mapped.map(
          (token) => `${token.tailwindProperty}: var(${this.config.property(token.key)});`,
        ),
      ),
    );

    return `${blocks.filter(Boolean).join('\n\n')}\n`;
  }

  generateTypeScript(passes: ThemePass[]): string {
    const [base] = passes;
    const themes = passes
      .map((pass) => {
        const entries = pass.tokens
          .map((token) => `    ${JSON.stringify(token.key)}: ${JSON.stringify(token.value)},`)
          .join('\n');
        return `  ${pass.theme}: {\n${entries}\n  },`;
      })
      .join('\n');

    return `// Generated by \`npm run tokens:build\` from tokens.json. Do not edit.

export const tokens = {
${themes}
} as const;

export type ThemeName = keyof typeof tokens;

export type TokenName = keyof (typeof tokens)[${JSON.stringify(base.theme)}];

export function tokenVar(name: TokenName): string {
  return \`var(--${this.config.get('propertyPrefix')}-\${name})\`;
}
`;
  }
}

export class TailwindV4Plugin {
  config: PluginConfiguration;
  engine: TokenProcessingEngine;
  generator: TailwindCSSGenerator;
  passes: Map<string, ProcessedToken[]>;

  constructor(userConfig: Partial<PluginConfig> = {}) {
    this.config = new PluginConfiguration(userConfig);
    this.engine = new TokenProcessingEngine(this.config);
    this.generator = new TailwindCSSGenerator(this.config);
    this.passes = new Map();
  }

  /**
   * Records one theme's dictionary and returns the stylesheet for every theme
   * recorded so far, so the final pass returns the complete file.
   */
  format(dictionary: Dictionary, theme: string): string {
    this.config.getThemeSelector(theme);
    this.passes.set(theme, this.engine.processTokens(dictionary));
    return this.generator.generate(this.themePasses());
  }

  toTypeScript(): string {
    return this.generator.generateTypeScript(this.themePasses());
  }

  /** Tokens a later theme adds but the base theme never declares. */
  undeclared(): string[] {
    const [base, ...overrides] = this.themePasses();
    if (!base) return [];
    const declared = new Set(base.tokens.map((token) => token.key));
    const missing = new Set<string>();
    for (const pass of overrides) {
      for (const token of pass.tokens) {
        if (!declared.has(token.key)) missing.add(token.key);
      }
    }
    return [...missing];
  }

  themePasses(): ThemePass[] {
    return [...this.passes].map(([theme, tokens]) => ({ theme, tokens }));
  }
}

export function createTailwindV4Plugin(options: Partial<PluginConfig> = {}) {
  const plugin = new TailwindV4Plugin(options);

  return {
    format: ({ dictionary, options }: FormatFnArguments): string => {
      const { theme } = options as { theme?: string };
      if (!theme) {
        throw new Error('The materia/tailwind-v4 format needs a `theme` file option.');
      }
      return plugin.format(dictionary, theme);
    },
    toTypeScript: (): string => plugin.toTypeScript(),
    undeclared: (): string[] => plugin.undeclared(),
  };
}
