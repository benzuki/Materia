import { categories, categoryLabel, type CategoryId } from '@/lib/content/categories';

export type CategoryBadgeSize = 'medium' | 'large';

const sizes = {
  medium: 'size-icon-m overflow-hidden text-m leading-none',
  large: 'size-icon-l overflow-hidden text-m leading-m',
} as const;

export interface CategoryBadgeProps {
  category: CategoryId;
  size?: CategoryBadgeSize;
  className?: string;
}

export function CategoryBadge({ category, size = 'large', className = '' }: CategoryBadgeProps) {
  const emoji = categories[category];

  return (
    <span
      role="img"
      aria-label={categoryLabel(category)}
      className={`grid shrink-0 place-items-center text-center font-bold font-body ${sizes[size]} ${className}`}
    >
      {emoji}
    </span>
  );
}

export type { CategoryId };
