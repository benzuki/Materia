import {
  ProgressBar,
  progressBarPresetIds,
  progressBarPresetLabels,
  progressBarPresets,
  progressBarTones,
} from '@/components/ui/ProgressBar';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { IconBadge, type IconBadgeVariant } from '@/components/ui/IconBadge';
import {
  TransactionCard,
  type TransactionAccount,
  type TransactionTone,
} from '@/components/ui/TransactionCard';
import { categoryIds } from '@/lib/content';

const badgeVariants: IconBadgeVariant[] = [
  'recurring',
  'hsbc-debit',
  'hsbc-credit',
  'monzo',
  'halifax',
];

const categoryCards: {
  tone: TransactionTone;
  category: (typeof categoryIds)[number];
  total: string;
  account: TransactionAccount;
  merchant: string;
  date: Date;
}[] = [
  {
    tone: 'primary',
    category: 'groceries',
    total: '£150.00',
    account: 'hsbc-debit',
    merchant: 'Costa Coffee',
    date: new Date('2026-09-07'),
  },
  {
    tone: 'green',
    category: 'shopping',
    total: '£84.20',
    account: 'hsbc-credit',
    merchant: 'Waitrose & Partners Kensington High Street',
    date: new Date('2026-09-12'),
  },
  {
    tone: 'orange',
    category: 'dining-out',
    total: '£62.15',
    account: 'monzo',
    merchant: 'Transport for London',
    date: new Date('2026-08-01'),
  },
  {
    tone: 'amber',
    category: 'bills',
    total: '£210.00',
    account: 'halifax',
    merchant: 'Amazon Marketplace UK Services Ltd',
    date: new Date('2026-12-28'),
  },
  {
    tone: 'indigo',
    category: 'entertainment',
    total: '£38.50',
    account: 'hsbc-debit',
    merchant: 'The National Gallery Café',
    date: new Date('2026-11-04'),
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-stretch gap-stack-m bg-surface-container-off-white-background p-inset-m">
      <div className="flex flex-wrap items-center gap-inline-xs">
        {categoryIds.map((category) => (
          <CategoryBadge key={category} category={category} />
        ))}
      </div>

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

      <div className="flex w-full min-w-0 flex-col gap-stack-s">
        {progressBarTones.map((tone) => (
          <div key={tone} className="grid w-full min-w-0 grid-cols-1 gap-stack-xs sm:grid-cols-5">
            {progressBarPresetIds.map((preset) => (
              <div key={`${tone}-${preset}`} className="flex min-w-0 flex-col gap-stack-xxs">
                <p className="text-xs leading-xs text-text-text-secondary">
                  {progressBarPresetLabels[preset]}
                </p>
                <ProgressBar tone={tone} {...progressBarPresets[preset]} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-stack-s sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {categoryCards.map(({ tone, category, total, account, merchant, date }) => (
          <CategoryCard key={tone} category={category} total={total} tone={tone}>
            <TransactionCard
              tone={tone}
              account={account}
              merchant={merchant}
              amount="£12.57"
              date={date}
              recurring
            />
          </CategoryCard>
        ))}
      </div>
    </main>
  );
}
