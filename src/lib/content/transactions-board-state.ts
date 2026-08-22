import type { CategoryId } from './categories';
import {
  transactionsBoardFeed,
  transactionsBoardSwimlanes,
  type BoardTransaction,
  type BoardSwimlane,
} from './transactions-board';
import type { ProgressHeaderVariant } from '@/components/ui/ProgressHeader';
import type { TransactionTone } from '@/components/ui/TransactionCard';

export interface StoredBoardTransaction extends BoardTransaction {
  id: string;
}

export interface BoardFeedGroup {
  date: Date;
  transactions: StoredBoardTransaction[];
}

export interface BoardCategoryGroup {
  category: CategoryId;
  total: string;
  transactions: StoredBoardTransaction[];
}

export interface BoardLaneState {
  variant: ProgressHeaderVariant;
  tone: TransactionTone;
  spent: number;
  softCap?: number;
  spentAmount: string;
  budgetAmount: string;
  percent: string;
  categories: BoardCategoryGroup[];
}

export interface BoardState {
  feed: BoardFeedGroup[];
  swimlanes: BoardLaneState[];
}

export type CardLocation =
  | { zone: 'feed' }
  | { zone: 'category'; lane: ProgressHeaderVariant; category: CategoryId };

export type DropTargetId = 'feed' | `category:${ProgressHeaderVariant}:${CategoryId}`;

let nextTransactionId = 0;

function createId(): string {
  nextTransactionId += 1;
  return `tx-${nextTransactionId}`;
}

function withIds(transactions: BoardTransaction[]): StoredBoardTransaction[] {
  return transactions.map((transaction) => ({ ...transaction, id: createId() }));
}

export function createInitialBoardState(): BoardState {
  nextTransactionId = 0;

  return {
    feed: transactionsBoardFeed.map((group) => ({
      date: group.date,
      transactions: withIds(group.transactions),
    })),
    swimlanes: transactionsBoardSwimlanes.map((lane) => ({
      ...lane,
      categories: lane.categories.map((category) => ({
        ...category,
        transactions: withIds(category.transactions),
      })),
    })),
  };
}

export function cardLocationToDropTarget(location: CardLocation): DropTargetId {
  if (location.zone === 'feed') return 'feed';
  return `category:${location.lane}:${location.category}`;
}

export function parseDropTargetId(value: string | null): DropTargetId | null {
  if (value === 'feed') return 'feed';
  if (value?.startsWith('category:')) return value as DropTargetId;
  return null;
}

export function dropTargetToCategory(
  target: DropTargetId,
): { lane: ProgressHeaderVariant; category: CategoryId } | null {
  if (target === 'feed') return null;
  const [, lane, category] = target.split(':') as [string, ProgressHeaderVariant, CategoryId];
  return { lane, category };
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function normalizeForCategory(
  transaction: StoredBoardTransaction,
  feedDate?: Date,
): StoredBoardTransaction {
  const date = transaction.date ?? feedDate ?? (transaction.time ? new Date(transaction.time) : new Date());
  return {
    id: transaction.id,
    merchant: transaction.merchant,
    amount: transaction.amount,
    date,
    recurring: transaction.recurring,
    account: transaction.account,
  };
}

function normalizeForFeed(
  transaction: StoredBoardTransaction,
  feedDate?: Date,
): StoredBoardTransaction {
  const time = transaction.time ?? new Date(feedDate ?? transaction.date ?? Date.now());
  return {
    id: transaction.id,
    merchant: transaction.merchant,
    amount: transaction.amount,
    time,
    recurring: transaction.recurring,
    account: transaction.account,
  };
}

function removeCard(state: BoardState, cardId: string): {
  state: BoardState;
  card: StoredBoardTransaction | null;
  from: CardLocation | null;
  feedDate?: Date;
} {
  for (const group of state.feed) {
    const index = group.transactions.findIndex((transaction) => transaction.id === cardId);
    if (index === -1) continue;

    const card = group.transactions[index];
    const feed = state.feed
      .map((entry) =>
        entry === group
          ? { ...entry, transactions: entry.transactions.filter((transaction) => transaction.id !== cardId) }
          : entry,
      )
      .filter((entry) => entry.transactions.length > 0);

    return { state: { ...state, feed }, card, from: { zone: 'feed' }, feedDate: group.date };
  }

  for (const lane of state.swimlanes) {
    for (const category of lane.categories) {
      const index = category.transactions.findIndex((transaction) => transaction.id === cardId);
      if (index === -1) continue;

      const card = category.transactions[index];
      const swimlanes = state.swimlanes.map((entry) =>
        entry.variant === lane.variant
          ? {
              ...entry,
              categories: entry.categories.map((group) =>
                group.category === category.category
                  ? {
                      ...group,
                      transactions: group.transactions.filter((transaction) => transaction.id !== cardId),
                    }
                  : group,
              ),
            }
          : entry,
      );

      return {
        state: { ...state, swimlanes },
        card,
        from: { zone: 'category', lane: lane.variant, category: category.category },
      };
    }
  }

  return { state, card: null, from: null };
}

function insertIntoCategory(
  state: BoardState,
  card: StoredBoardTransaction,
  lane: ProgressHeaderVariant,
  category: CategoryId,
  feedDate?: Date,
): BoardState {
  const normalized = normalizeForCategory(card, feedDate);

  return {
    ...state,
    swimlanes: state.swimlanes.map((entry) =>
      entry.variant === lane
        ? {
            ...entry,
            categories: entry.categories.map((group) =>
              group.category === category
                ? { ...group, transactions: [...group.transactions, normalized] }
                : group,
            ),
          }
        : entry,
    ),
  };
}

function insertIntoFeed(state: BoardState, card: StoredBoardTransaction, feedDate?: Date): BoardState {
  const normalized = normalizeForFeed(card, feedDate);
  const targetDate = normalized.time ?? new Date();
  const existingGroup = state.feed.find((group) => isSameDay(group.date, targetDate));

  if (existingGroup) {
    return {
      ...state,
      feed: state.feed.map((group) =>
        group === existingGroup
          ? { ...group, transactions: [...group.transactions, normalized] }
          : group,
      ),
    };
  }

  return {
    ...state,
    feed: [{ date: targetDate, transactions: [normalized] }, ...state.feed],
  };
}

export function moveCard(state: BoardState, cardId: string, target: DropTargetId): BoardState {
  const { state: withoutCard, card, feedDate } = removeCard(state, cardId);
  if (!card) return state;

  if (target === 'feed') {
    return insertIntoFeed(withoutCard, card, feedDate);
  }

  const categoryTarget = dropTargetToCategory(target);
  if (!categoryTarget) return state;

  return insertIntoCategory(
    withoutCard,
    card,
    categoryTarget.lane,
    categoryTarget.category,
    feedDate,
  );
}

export function laneToneForTarget(state: BoardState, target: DropTargetId): TransactionTone {
  if (target === 'feed') return 'primary';

  const categoryTarget = dropTargetToCategory(target);
  if (!categoryTarget) return 'primary';

  return state.swimlanes.find((lane) => lane.variant === categoryTarget.lane)?.tone ?? 'primary';
}

export type { BoardSwimlane };
