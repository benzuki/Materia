import { CategoryCard } from './CategoryCard';
import { ProgressHeader } from './ProgressHeader';
import { DraggableTransactionCard } from './DraggableTransactionCard';
import {
  transactionsBoardFeed,
  transactionsBoardSwimlanes,
  type BankFeedGroup,
  type BoardSwimlane,
} from '@/lib/content/transactions-board';
import { formatTransactionDate } from '@/lib/format';

interface TransactionsBoardProps {
  className?: string;
}

function BankFeedColumn({ groups }: { groups: BankFeedGroup[] }) {
  return (
    <aside className="flex w-[215px] shrink-0 flex-col self-stretch overflow-hidden border-r-[length:var(--token-border-width-selectable-s)] border-border-subtle bg-surface-container-primary-50-background">
      <div className="flex w-full flex-col">
        <div className="flex items-center justify-center p-inset-s">
          <h2 className="shrink-0 text-l leading-l font-bold text-text-text-primary">Transactions</h2>
        </div>
        <div
          aria-hidden="true"
          className="h-[length:var(--token-border-width-selectable-s)] w-full bg-border-subtle"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-stack-s p-inset-s">
        {groups.map((group) => (
          <div key={group.date.toISOString()} className="flex w-full flex-col items-center gap-stack-xs">
            <p className="shrink-0 text-xs leading-xs text-text-text-secondary">
              {formatTransactionDate(group.date)}
            </p>
            <div className="flex w-full flex-col gap-stack-xs">
              {group.transactions.map((transaction) => (
                <DraggableTransactionCard
                  key={`${transaction.merchant}-${transaction.amount}-${transaction.time?.toISOString() ?? transaction.date?.toISOString()}`}
                  tone="primary"
                  {...transaction}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Swimlane({ lane }: { lane: BoardSwimlane }) {
  const { variant, tone, categories, ...header } = lane;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-stack-s">
      <ProgressHeader variant={variant} {...header} />

      {categories.map((group) => (
        <CategoryCard key={group.category} category={group.category} total={group.total} tone={tone}>
          {group.transactions.map((transaction) => (
            <DraggableTransactionCard
              key={`${group.category}-${transaction.merchant}-${transaction.amount}`}
              tone={tone}
              {...transaction}
            />
          ))}
        </CategoryCard>
      ))}
    </div>
  );
}

export function TransactionsBoard({ className = '' }: TransactionsBoardProps) {
  return (
    <div
      className={`flex w-full min-w-0 overflow-x-auto rounded-container-l border-[length:var(--token-border-width-selectable-s)] border-solid border-border-subtle ${className}`}
    >
      <div className="flex min-w-[1075px] items-stretch">
        <BankFeedColumn groups={transactionsBoardFeed} />

        <div className="flex min-w-0 flex-1 gap-inline-s bg-surface-container-white-background p-inset-s">
          {transactionsBoardSwimlanes.map((lane) => (
            <Swimlane key={lane.variant} lane={lane} />
          ))}
        </div>
      </div>
    </div>
  );
}
