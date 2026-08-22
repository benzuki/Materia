/**
 * Kakeibo spending categories for category badges.
 *
 * Add a row to register a new variant — `CategoryBadge` picks up every entry
 * automatically. Each value must be a single emoji character.
 */
export const categories = {
  groceries: '🛒',
  rent: '🏡',
  shopping: '🛍️',
  bills: '🚰',
  'dining-out': '🍽️',
  takeaway: '🥡',
  museum: '🏛️',
  books: '📚',
  gifts: '🎁',
  repairs: '🛠️',
  entertainment: '🎭',
} as const;

export type CategoryId = keyof typeof categories;

export const categoryIds = Object.keys(categories) as CategoryId[];

export function categoryLabel(id: CategoryId): string {
  const words = id.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
