import { IconBadge, type IconBadgeVariant } from '@/components/ui/IconBadge';
import {
  TransactionCard,
  type TransactionAccount,
  type TransactionTone,
} from '@/components/ui/TransactionCard';

const badgeVariants: IconBadgeVariant[] = [
  'recurring',
  'hsbc-debit',
  'hsbc-credit',
  'monzo',
  'halifax',
];

const cards: { tone: TransactionTone; account: TransactionAccount }[] = [
  { tone: 'primary', account: 'hsbc-debit' },
  { tone: 'green', account: 'hsbc-credit' },
  { tone: 'orange', account: 'monzo' },
  { tone: 'amber', account: 'halifax' },
  { tone: 'indigo', account: 'hsbc-debit' },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-stack-m bg-surface-container-off-white-background p-inset-m">
      <div className="flex flex-col gap-stack-xs">
        <div className="flex items-center gap-inline-xs">
          {badgeVariants.map((variant) => (
            <IconBadge key={variant} variant={variant} />
          ))}
        </div>
        <div className="flex items-center gap-inline-xs">
          {badgeVariants.map((variant) => (
            <IconBadge key={variant} variant={variant} size="small" />
          ))}
        </div>
      </div>

      <div className="flex w-[228px] flex-col gap-stack-xs">
        {cards.map(({ tone, account }) => (
          <TransactionCard
            key={tone}
            tone={tone}
            account={account}
            merchant="Costa Coffee"
            amount="£12.57"
            date="Mon 07 Sept"
            recurring
          />
        ))}
      </div>
    </main>
  );
}
