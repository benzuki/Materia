import { IconBadge, type IconBadgeVariant } from './IconBadge';
import { formatTransactionDate, formatTransactionTime } from '@/lib/format';

const disabledClasses =
  'bg-surface-selectable-disabled-background border-border-disabled';

const interactionClasses =
  'cursor-pointer transition-colors duration-interaction ease-interaction motion-reduce:transition-none';

const toneClasses = {
  primary: {
    surface:
      'bg-surface-container-white-background hover:bg-surface-container-white-background-hover active:bg-surface-container-white-background-selected',
    border: 'border-border-subtle',
    shadow: { s: 'shadow-primary-s', m: 'shadow-primary-m', l: 'shadow-primary-l' },
  },
  green: {
    surface:
      'bg-surface-draggable-green-50-background hover:bg-surface-draggable-green-50-background-hover active:bg-surface-draggable-green-50-background-selected',
    border: 'border-border-green',
    shadow: { s: 'shadow-green-s', m: 'shadow-green-m', l: 'shadow-green-l' },
  },
  orange: {
    surface:
      'bg-surface-draggable-orange-50-background hover:bg-surface-draggable-orange-50-background-hover active:bg-surface-draggable-orange-50-background-selected',
    border: 'border-border-orange',
    shadow: { s: 'shadow-orange-s', m: 'shadow-orange-m', l: 'shadow-orange-l' },
  },
  amber: {
    surface:
      'bg-surface-draggable-amber-50-background hover:bg-surface-draggable-amber-50-background-hover active:bg-surface-draggable-amber-50-background-selected',
    border: 'border-border-amber',
    shadow: { s: 'shadow-amber-s', m: 'shadow-amber-m', l: 'shadow-amber-l' },
  },
  indigo: {
    surface:
      'bg-surface-draggable-indigo-50-background hover:bg-surface-draggable-indigo-50-background-hover active:bg-surface-draggable-indigo-50-background-selected',
    border: 'border-border-indigo',
    shadow: { s: 'shadow-indigo-s', m: 'shadow-indigo-m', l: 'shadow-indigo-l' },
  },
} as const;

export type TransactionTone = keyof typeof toneClasses;
export type TransactionShadowSize = keyof (typeof toneClasses)[TransactionTone]['shadow'];

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
  /** Muted placeholder styling — used when a card is left behind during drag. */
  disabled?: boolean;
  /** Shadow elevation — `l` is used for the grabbed drag clone. */
  shadowSize?: TransactionShadowSize;
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
  disabled = false,
  shadowSize = 's',
  className = '',
}: TransactionCardProps) {
  const showDetail = expanded && Boolean(date || time || recurring || account);
  const { surface, border, shadow } = toneClasses[tone];
  const detailLabel = time
    ? formatTransactionTime(time)
    : date
      ? formatTransactionDate(date)
      : undefined;

  const frameClasses = disabled
    ? disabledClasses
    : `${surface} ${border} ${shadow[shadowSize]}`;
  const merchantTextClass = disabled ? 'text-text-text-disabled' : 'text-text-text-primary';
  const amountTextClass = disabled ? 'text-text-text-disabled' : 'text-text-text-secondary';
  const detailTextClass = disabled ? 'text-text-text-disabled' : 'text-text-text-secondary';

  return (
    <div
      aria-disabled={disabled || undefined}
      className={`flex w-full min-w-0 flex-col gap-stack-xxs rounded-container-s border-[length:var(--token-border-width-selectable-s)] border-dashed p-inset-xs ${disabled ? '' : interactionClasses} ${frameClasses} ${className}`}
    >
      <div className="flex w-full min-w-0 items-center justify-between gap-inline-xxs text-s leading-s font-medium">
        <p className={`min-w-0 flex-1 truncate ${merchantTextClass}`} title={merchant}>
          {merchant}
        </p>
        <p className={`shrink-0 text-right tabular-nums ${amountTextClass}`}>{amount}</p>
      </div>

      {showDetail && (
        <div className="flex w-full min-w-0 items-center justify-between gap-inline-xxs">
          {detailLabel ? (
            <p
              className={`min-w-0 flex-1 truncate text-xs leading-xs font-normal ${detailTextClass}`}
              title={detailLabel}
            >
              {detailLabel}
            </p>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden="true" />
          )}
          <div className={`flex shrink-0 items-center gap-inline-xxs ${disabled ? 'opacity-50' : ''}`}>
            {recurring && <IconBadge variant="recurring" size="small" />}
            {account && <IconBadge variant={account} size="small" />}
          </div>
        </div>
      )}
    </div>
  );
}
