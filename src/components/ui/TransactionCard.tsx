import { IconBadge, type IconBadgeVariant } from './IconBadge';

const toneClasses = {
  primary: 'border-border-subtle shadow-primary-s',
  green: 'border-border-green shadow-green-s',
  orange: 'border-border-orange shadow-orange-s',
  amber: 'border-border-amber shadow-amber-s',
  indigo: 'border-border-indigo shadow-indigo-s',
} as const;

export type TransactionTone = keyof typeof toneClasses;

/** The account a transaction was paid from, minus the non-account badge. */
export type TransactionAccount = Exclude<IconBadgeVariant, 'recurring'>;

export interface TransactionCardProps {
  merchant: string;
  amount: string;
  date?: string;
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
  tone = 'primary',
  recurring = false,
  account,
  expanded = true,
  className = '',
}: TransactionCardProps) {
  const showDetail = expanded && Boolean(date || recurring || account);

  return (
    <div
      className={`flex w-full flex-col gap-stack-xxs rounded-container-s border-[length:var(--token-border-width-selectable-s)] border-dashed bg-surface-container-white-background p-inset-xs ${toneClasses[tone]} ${className}`}
    >
      <div className="flex items-center justify-between gap-inline-xxs text-s leading-s font-medium">
        <p className="min-w-0 flex-1 truncate text-text-text-primary" title={merchant}>
          {merchant}
        </p>
        <p className="shrink-0 text-right text-text-text-secondary tabular-nums">{amount}</p>
      </div>

      {showDetail && (
        <div className="flex items-center justify-between gap-inline-xxs">
          <p className="min-w-0 flex-1 truncate text-xs leading-xs font-normal text-text-text-secondary">
            {date}
          </p>
          <div className="flex shrink-0 items-center gap-inline-xxs">
            {recurring && <IconBadge variant="recurring" size="small" />}
            {account && <IconBadge variant={account} size="small" />}
          </div>
        </div>
      )}
    </div>
  );
}
