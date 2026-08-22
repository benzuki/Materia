import type { CSSProperties } from 'react';
import type { TransactionTone } from './TransactionCard';

export type ProgressBarTone = TransactionTone;

const overflowPatterns = {
  primary: '/patterns/progress-overflow-primary.png',
  green: '/patterns/progress-overflow-green.png',
  orange: '/patterns/progress-overflow-orange.png',
  amber: '/patterns/progress-overflow-amber.png',
  indigo: '/patterns/progress-overflow-indigo.png',
} as const satisfies Record<ProgressBarTone, string>;

const paceTicks = {
  solid: '/patterns/progress-tick/solid.svg',
  dashed: '/patterns/progress-tick/dashed.svg',
} as const;

/** Figma OverflowPattern tile size (5.28px). */
const overflowPatternTileSize = '5.28px';

const toneClasses = {
  primary: {
    track: 'bg-component-progress-bar-primary-background',
    fill: 'bg-component-progress-bar-primary-foreground',
    accent: 'bg-component-progress-bar-primary-accent',
  },
  green: {
    track: 'bg-component-progress-bar-green-background',
    fill: 'bg-component-progress-bar-green-foreground',
    accent: 'bg-component-progress-bar-green-accent',
  },
  orange: {
    track: 'bg-component-progress-bar-orange-background',
    fill: 'bg-component-progress-bar-orange-foreground',
    accent: 'bg-component-progress-bar-orange-accent',
  },
  amber: {
    track: 'bg-component-progress-bar-amber-background',
    fill: 'bg-component-progress-bar-amber-foreground',
    accent: 'bg-component-progress-bar-amber-accent',
  },
  indigo: {
    track: 'bg-component-progress-bar-indigo-background',
    fill: 'bg-component-progress-bar-indigo-foreground',
    accent: 'bg-component-progress-bar-indigo-accent',
  },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function overflowPatternStyle(tone: ProgressBarTone, hardCap: number): CSSProperties {
  return {
    left: `${hardCap * 100}%`,
    backgroundImage: `url(${overflowPatterns[tone]})`,
    backgroundSize: `${overflowPatternTileSize} ${overflowPatternTileSize}`,
    backgroundRepeat: 'repeat',
    backgroundPosition: 'top left',
  };
}

type PaceTickVariant = 'solid' | 'dashed';

interface PaceTickProps {
  tone: ProgressBarTone;
  position: number;
  variant: PaceTickVariant;
}

/** Figma PaceTickMark — flattened 2×14 SVG, displayed at 12px (`size-icon-xs`). */
function PaceTick({ tone, position, variant }: PaceTickProps) {
  const { accent } = toneClasses[tone];
  const src = paceTicks[variant];

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-1/2 z-10 h-icon-xs w-[2px] -translate-x-1/2 -translate-y-1/2 opacity-80 ${accent} mask-size-full mask-center mask-no-repeat`}
      style={{
        left: `${clamp(position, 0, 1) * 100}%`,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
      }}
    />
  );
}

export interface ProgressBarProps {
  tone?: ProgressBarTone;
  /** Actual spend as a fraction of the budget (0–1). */
  spent: number;
  /**
   * Expected spend pace / soft cap (0–1).
   * Renders a dashed tick marking where you should be at this point in the period.
   */
  softCap?: number;
  /**
   * Hard budget cap as a fraction of the track (0–1).
   * Below 1, the tail of the track shows an overflow buffer pattern and a solid cap tick.
   */
  hardCap?: number;
  className?: string;
  label?: string;
}

export function ProgressBar({
  tone = 'primary',
  spent,
  softCap,
  hardCap = 1,
  className = '',
  label = 'Budget progress',
}: ProgressBarProps) {
  const { track, fill } = toneClasses[tone];
  const cap = clamp(hardCap, 0, 1);
  const hasOverflowBuffer = cap < 1;
  const spentFraction = clamp(spent, 0, hasOverflowBuffer ? cap : 1);
  const spentPercent = spentFraction * 100;
  const fillRounded = hasOverflowBuffer ? 'rounded-l-selectable-s' : 'rounded-selectable-s';

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(spentFraction * 100)}
      className={`relative h-inset-xs w-full min-w-0 overflow-visible ${className}`}
    >
      <div className={`absolute inset-0 rounded-selectable-s ${track}`} />

      {spentFraction > 0 ? (
        <div
          className={`absolute inset-y-0 left-0 ${fillRounded} ${fill}`}
          style={{ width: `${spentPercent}%` }}
        />
      ) : null}

      {hasOverflowBuffer ? (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 rounded-r-selectable-s"
          style={overflowPatternStyle(tone, cap)}
        />
      ) : null}

      {softCap != null ? (
        <PaceTick tone={tone} position={softCap} variant="dashed" />
      ) : null}

      {hasOverflowBuffer ? <PaceTick tone={tone} position={cap} variant="solid" /> : null}
    </div>
  );
}

/** Figma reference states for previews and Storybook-style demos. */
export const progressBarPresets = {
  default: { spent: 0.5 },
  onPace: { spent: 0.5, softCap: 0.5 },
  aheadOfPace: { spent: 0.448, softCap: 0.3167 },
  behindPace: { spent: 0.6063, softCap: 0.8597 },
  overflow: { spent: 0.8869, hardCap: 0.8869 },
} as const;

export type ProgressBarPreset = keyof typeof progressBarPresets;

export const progressBarPresetIds = Object.keys(progressBarPresets) as ProgressBarPreset[];

export const progressBarPresetLabels: Record<ProgressBarPreset, string> = {
  default: 'Default',
  onPace: 'On pace',
  aheadOfPace: 'Ahead of pace',
  behindPace: 'Behind pace',
  overflow: 'Overflow',
};

export const progressBarTones: ProgressBarTone[] = [
  'primary',
  'green',
  'orange',
  'amber',
  'indigo',
];
