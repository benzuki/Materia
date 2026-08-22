import { IconBadge, type IconBadgeVariant } from './IconBadge';
import { formatTransactionDate, formatTransactionTime } from '@/lib/format';

const interactionClasses =
  'cursor-pointer transition-colors duration-interaction ease-interaction motion-reduce:transition-none';

const toneClasses = {
  primary: {
    surface:
      'bg-surface-container-white-background hover:bg-surface-container-white-background-hover active:bg-surface-container-white-background-selected',
    frame: 'border-border-subtle shadow-primary-s',
  },
  green: {
    surface:
      'bg-surface-draggable-green-50-background hover:bg-surface-draggable-green-50-background-hover active:bg-surface-draggable-green-50-background-selected',
    frame: 'border-border-green shadow-green-s',
  },
  orange: {
    surface:
      'bg-surface-draggable-orange-50-background hover:bg-surface-draggable-orange-50-background-hover active:bg-surface-draggable-orange-50-background-selected',
    frame: 'border-border-orange shadow-orange-s',
  },
  amber: {
    surface:
      'bg-surface-draggable-amber-50-background hover:bg-surface-draggable-amber-50-background-hover active:bg-surface-draggable-amber-50-background-selected',
    frame: 'border-border-amber shadow-amber-s',
  },
  indigo: {
    surface:
      'bg-surface-draggable-indigo-50-background hover:bg-surface-draggable-indigo-50-background-hover active:bg-surface-draggable-indigo-50-background-selected',
    frame: 'border-border-indigo shadow-indigo-s',
  },
} as const;

export type TransactionTone = keyof typeof toneClasses;

/** The account a transaction was paid from, minus the non-account badge. */
export type TransactionAccount = Exclude<IconBadgeVariant, 'recurring'>;

export interface TransactionCardProps {
  merchant: string;
  amount: string;
  date?: Date;
  /** Bank feed detail line — shown instead of `date` when set. */
  time?: Date;
  tone?: TransactionTone;
  recurring?: boolean;
  account?: TransactionAccount;
  /** Collapsed hides the date and badges, leaving merchant and amount. */
  expanded?: boolean;
  className?: string;
}

export function TransactionCard({
  merchant,
  amount,
  date,
  time,
  tone = 'primary',
  recurring = false,
  account,
  expanded = true,
  className = '',
}: TransactionCardProps) {
  const showDetail = expanded && Boolean(date || time || recurring || account);
  const { surface, frame } = toneClasses[tone];
  const detailLabel = time
    ? formatTransactionTime(time)
    : date
      ? formatTransactionDate(date)
      : undefined;

  return (
    <div
      className={`flex w-full min-w-0 flex-col gap-stack-xxs rounded-container-s border-[length:var(--token-border-width-selectable-s)] border-dashed p-inset-xs ${interactionClasses} ${surface} ${frame} ${className}`}
    >
      <div className="flex w-full min-w-0 items-center justify-between gap-inline-xxs text-s leading-s font-medium">
        <p className="min-w-0 flex-1 truncate text-text-text-primary" title={merchant}>
          {merchant}
        </p>
        <p className="shrink-0 text-right text-text-text-secondary tabular-nums">{amount}</p>
      </div>

      {showDetail && (
        <div className="flex w-full min-w-0 items-center justify-between gap-inline-xxs">
          {detailLabel ? (
            <p
              className="min-w-0 flex-1 truncate text-xs leading-xs font-normal text-text-text-secondary"
              title={detailLabel}
            >
              {detailLabel}
            </p>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden="true" />
          )}
          <div className="flex shrink-0 items-center gap-inline-xxs">
            {recurring && <IconBadge variant="recurring" size="small" />}
            {account && <IconBadge variant={account} size="small" />}
          </div>
        </div>
      )}
    </div>
  );
}
