# Materia — Agent Instructions

Materia is a Kakeibo-style budgeting app built on Open Banking data. This file is the shared context for any AI agent working in this repo (Cursor, Claude Code, or otherwise). Read it before making changes.

## Stack

- Next.js 16.2, App Router, Turbopack for dev
- React 19, concurrent rendering, modern ref patterns
- TypeScript 5, strict mode
- Tailwind CSS 4, CSS-first config
- Framer Motion 12, for menu, reveals, scroll-linked opacity
- Lucide, icon set for nav and UI chrome
- next-themes, light/dark/system toggle

## Architecture

Three layers, don't blur them:

- `src/app` — App Router pages, layouts, API routes (e.g. `/api/contact`), sitemap and robots.
- `src/components/ui` — presentation primitives: `Button`, `TextLink`, `Pill`, `PageGrid`, `SectionHeader`, etc. Hand-rolled straight from the token layer, no shadcn, Radix, or other component library.
- `src/lib` — content and data. `src/lib/content.ts` currently holds uploaded bank statements for development. Treat this as mock data, not the real data layer. A real backend with a ledger replaces it later — don't build production data-fetching architecture around the mock in the meantime.

## Design tokens

`tokens.json` (exported from Token Studio, synced directly by its GitHub integration) is the single source of truth. Token Studio only reads and writes JSON, so this file has to stay `.json` at whatever path the plugin's GitHub sync setting points at, don't rename or convert it, if it needs to move (e.g. into `src/lib/`), change the path in Token Studio's settings, not by hand. Three tiers:

- `core` — raw primitives: dimension scale, color ramps, radii, shadows
- `alias` — semantic base tokens: `primary`, `neutral`, spacing scale, typography scale
- `light-theme` / `dark-theme` — the mapped layer components actually consume, e.g. `surface.container.white.background`

`src/lib/tokens.ts` and the token block in `globals.css` are generated output, not hand-maintained files. Style Dictionary, using `@tokens-studio/sd-transforms` to resolve Token Studio's reference syntax and typed values, reads `tokens.json` and writes both — light values under `:root`, dark values under `[data-theme="dark"]` (see Theming). The generator owns the `@theme inline` block itself, not just the raw custom properties, so a new token added in Figma becomes a new Tailwind utility automatically, nobody hand-wires it in afterward. Never edit `tokens.ts` or the generated CSS block directly: change tokens in Figma/Token Studio, sync to GitHub, pull, then let the generator run (see Commands).

Hard rule: components reference the theme layer only. Never reach into `core` or `alias` directly from a component, and never hardcode a raw color, spacing, radius, or shadow value where a token already exists for it.

## Theming

Users get an explicit light/dark/system toggle, so switching can't run on `prefers-color-scheme` alone, that's read-only, nothing for a toggle to flip. Mechanism: `next-themes`, `attribute="data-theme"`, `defaultTheme="system"`. It sets `data-theme="dark"` on `<html>` and persists the user's explicit choice once they override the system default.

Tailwind needs one hand-written line in `globals.css` to key its `dark:` variant off that attribute instead of the media query default:

```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

That line is framework wiring, not token data. It's written once, by hand, and the token generator never touches it, it lives alongside the generated token block, not inside it.

## Interface conventions

`interface-cheat-sheet.md` at the repo root is the house style guide — animation timing and easing, typography rules, color and token discipline, accessibility, layout, and copy conventions. Check it before implementing anything visual or interactive rather than re-deriving conventions from scratch.

## Motion

`motion.md` is the second house reference, applied as a deliberate follow-up pass once a component or screen's static layout is settled, not baked in during the first draft. It complements the Animation section in `interface-cheat-sheet.md` rather than replacing it; where the two overlap (button-press scale, transition timing) they agree.

- Prefer `transform` and `opacity` only. Never animate layout properties like `top`, `left`, `width`, `height`.
- One motion language per screen — don't mix easings, durations, or physics within the same view.
- Default UI transitions run 140–220ms. Page-level reveals can be slower but must never block reading.
- Every automatic or scroll-linked animation needs a `prefers-reduced-motion` fallback.
- Stagger small groups only, no decorative loops that don't communicate status or progress.
- Implementation: Framer Motion, already in the stack, for all React motion. Don't reach for GSAP, it isn't part of the current stack, unless a genuinely complex sequencing need comes up and you've deliberately decided to add it.
- Clean up every observer, timer, and animation instance.

## Working style

- One narrow task per turn. Not "build the transactions screen" — one section or component at a time.
- Point at an existing component or pattern to extend before creating a new one. Never build a second `Button`.
- After every change: typecheck, lint, build. Fix what breaks before moving on.
- Ship small diffs, small enough that a bad turn costs one `git diff`, not a rewrite.
- Anything half-built goes behind a flag in `feature-flags.ts` rather than left half-wired into the app.
- Don't touch Open Banking or real data integration yet. The mock data in `src/lib/content.ts` is enough until the app shell and at least one real screen are built and checked against Figma.

## Commands

- `npm run dev` — Next dev server on Turbopack
- `npm run build` — production build, also runs a full TypeScript pass
- `npm start` — serve the production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint via `eslint-config-next`

Still to be built: `tokens:build` (Style Dictionary) turns `tokens.json` into `src/lib/tokens.ts` and the `globals.css` token block, and runs automatically as a `predev`/`prebuild` hook so it never needs to be triggered manually, by you or the agent. That generator needs to exist before any component work starts, everything else in this file assumes it's there. Start from Token Studio's own reference implementation (`tokens-studio/sd-tailwindv4`) rather than writing the Style Dictionary config from scratch.