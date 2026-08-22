import type { DropTargetId } from '@/lib/content/transactions-board-state';
import { CategoryBadge } from './CategoryBadge';
import type { TransactionTone } from './TransactionCard';
import { categoryLabel, type CategoryId } from '@/lib/content/categories';

const toneClasses = {
  primary: {
    surface: 'bg-surface-container-off-white-background',
    frame: 'border-border-subtle shadow-primary-m',
  },
  green: {
    surface: 'bg-surface-draggable-green-100-background',
    frame: 'border-border-green shadow-green-m',
  },
  orange: {
    surface: 'bg-surface-draggable-orange-100-background',
    frame: 'border-border-orange shadow-orange-m',
  },
  amber: {
    surface: 'bg-surface-draggable-amber-100-background',
    frame: 'border-border-amber shadow-amber-m',
  },
  indigo: {
    surface: 'bg-surface-draggable-indigo-100-background',
    frame: 'border-border-indigo shadow-indigo-m',
  },
} as const;

export type CategoryTone = TransactionTone;

export interface CategoryCardProps {
  category: CategoryId;
  total: string;
  tone?: CategoryTone;
  children?: React.ReactNode;
  className?: string;
  /** When false, renders header only (no transaction body slot). */
  showBody?: boolean;
  /** Registers the full bucket as a drag-and-drop target. */
  dropTargetId?: DropTargetId;
}

export function CategoryCard({
  category,
  total,
  tone = 'primary',
  children,
  className = '',
  showBody = true,
  dropTargetId,
}: CategoryCardProps) {
  const { surface, frame } = toneClasses[tone];
  const label = categoryLabel(category);

  return (
    <section
      aria-label={label}
      {...(dropTargetId ? { 'data-drop-target': dropTargetId } : {})}
      className={`flex w-full min-w-0 flex-col rounded-container-m border-[length:var(--token-border-width-selectable-s)] border-solid p-inset-xs ${surface} ${frame} ${className}`}
    >
      <header className="flex w-full min-w-0 items-center justify-between gap-inline-xxs">
        <div className="flex min-w-0 flex-1 items-center gap-inline-xxs">
          <CategoryBadge category={category} size="medium" />
          <p className="min-w-0 flex-1 truncate text-s leading-s font-bold text-text-text-primary" title={label}>
            {label}
          </p>
        </div>
        <p className="shrink-0 text-right text-s leading-s font-bold text-text-text-primary tabular-nums">
          {total}
        </p>
      </header>

      {showBody && children ? (
        <div className="flex w-full min-w-0 flex-col gap-stack-xs">{children}</div>
      ) : null}
    </section>
  );
}

export type { CategoryId };
