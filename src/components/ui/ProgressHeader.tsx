import { ProgressBar, type ProgressBarProps, type ProgressBarTone } from './ProgressBar';

export type ProgressHeaderVariant = 'needs' | 'wants' | 'culture' | 'extra';

const variants = {
  needs: {
    label: 'Needs',
    tone: 'green',
    icon: '/icons/bucket-earth.svg',
    iconInset: 'inset-[12.5%_8.94%_16.16%_8.94%]',
    percentTone: 'text-icon-green',
  },
  wants: {
    label: 'Wants',
    tone: 'orange',
    icon: '/icons/bucket-fire.svg',
    iconInset: 'inset-[13.33%_8.94%_15.33%_8.94%]',
    percentTone: 'text-icon-orange',
  },
  culture: {
    label: 'Culture',
    tone: 'amber',
    icon: '/icons/bucket-air.svg',
    iconInset: 'inset-[13.33%_8.94%_15.33%_8.94%]',
    percentTone: 'text-icon-amber',
  },
  extra: {
    label: 'Extra',
    tone: 'indigo',
    icon: '/icons/bucket-water.svg',
    iconInset: 'inset-[12.5%_8.94%_16.16%_8.94%]',
    percentTone: 'text-icon-indigo',
  },
} as const satisfies Record<
  ProgressHeaderVariant,
  {
    label: string;
    tone: ProgressBarTone;
    icon: string;
    iconInset: string;
    percentTone: string;
  }
>;

export interface ProgressHeaderProps
  extends Pick<ProgressBarProps, 'spent' | 'softCap' | 'hardCap' | 'className'> {
  variant: ProgressHeaderVariant;
  /** Formatted spend amount, e.g. "£300". */
  spentAmount: string;
  /** Formatted budget cap, e.g. "£1000". */
  budgetAmount: string;
  /** Formatted utilisation figure shown beside the meta row, e.g. "36%". */
  percent: string;
}

export function ProgressHeader({
  variant,
  spent,
  softCap,
  hardCap,
  spentAmount,
  budgetAmount,
  percent,
  className = '',
}: ProgressHeaderProps) {
  const { label, tone, icon, iconInset, percentTone } = variants[variant];
  const metaLabel = `${spentAmount} of ${budgetAmount}`;

  return (
    <header className={`flex w-full min-w-0 flex-col gap-stack-xs ${className}`}>
      <div className="flex w-full min-w-0 items-center gap-inline-xxs overflow-hidden">
        <span className="relative size-icon-l shrink-0 overflow-clip">
          <span className={`absolute ${iconInset}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Figma bucket glyph with fixed palette */}
            <img alt="" src={icon} className="block size-full max-w-none" />
          </span>
        </span>
        <h2 className="min-w-0 flex-1 text-l leading-l font-bold text-text-text-primary">{label}</h2>
      </div>

      <ProgressBar
        tone={tone}
        spent={spent}
        softCap={softCap}
        hardCap={hardCap}
        label={`${label} budget progress`}
      />

      <div className="flex h-icon-xs w-full min-w-0 items-start justify-between overflow-hidden text-xs leading-xs">
        <p className="min-w-0 flex-1 font-medium text-text-text-secondary tabular-nums">{metaLabel}</p>
        <p className={`shrink-0 font-bold tabular-nums ${percentTone}`}>{percent}</p>
      </div>
    </header>
  );
}

/** Figma reference states for previews (`963:4797`). */
export const progressHeaderPresets = {
  needs: {
    variant: 'needs',
    spent: 0.5,
    spentAmount: '£300',
    budgetAmount: '£1000',
    percent: '36%',
  },
  wants: {
    variant: 'wants',
    spent: 0.448,
    softCap: 0.3167,
    spentAmount: '£300',
    budgetAmount: '£1000',
    percent: '36%',
  },
  culture: {
    variant: 'culture',
    spent: 0.5,
    softCap: 0.4977,
    spentAmount: '£300',
    budgetAmount: '£1000',
    percent: '36%',
  },
  extra: {
    variant: 'extra',
    spent: 0.6063,
    softCap: 0.8597,
    spentAmount: '£300',
    budgetAmount: '£1000',
    percent: '36%',
  },
} as const;

export const progressHeaderVariants = Object.keys(variants) as ProgressHeaderVariant[];
