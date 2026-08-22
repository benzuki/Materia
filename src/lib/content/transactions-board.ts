import type { CategoryId } from './categories';
import type { ProgressHeaderVariant } from '@/components/ui/ProgressHeader';
import type { TransactionAccount, TransactionTone } from '@/components/ui/TransactionCard';

export interface BoardTransaction {
  merchant: string;
  amount: string;
  date?: Date;
  time?: Date;
  recurring?: boolean;
  account?: TransactionAccount;
}

export interface BoardCategoryGroup {
  category: CategoryId;
  total: string;
  transactions: BoardTransaction[];
}

export interface BoardSwimlane {
  variant: ProgressHeaderVariant;
  tone: TransactionTone;
  spent: number;
  softCap?: number;
  spentAmount: string;
  budgetAmount: string;
  percent: string;
  categories: BoardCategoryGroup[];
}

export interface BankFeedGroup {
  date: Date;
  transactions: BoardTransaction[];
}

const mon07 = new Date('2026-09-07');
const tue08 = new Date('2026-09-08');

const tx = (
  merchant: string,
  amount: string,
  detail: { date?: Date; time?: Date },
  options: Pick<BoardTransaction, 'recurring' | 'account'> = {},
): BoardTransaction => ({
  merchant,
  amount,
  ...detail,
  ...options,
});

/** Figma Transactions_Board reference data (`963:6980`). */
export const transactionsBoardFeed: BankFeedGroup[] = [
  {
    date: tue08,
    transactions: [
      tx('Costa Coffee', '£14.69', { time: new Date('2026-09-08T15:43:00') }, { account: 'hsbc-credit' }),
    ],
  },
  {
    date: mon07,
    transactions: [
      tx('Amazon', '£12.57', { time: new Date('2026-09-07T15:23:00') }, { recurring: true, account: 'hsbc-credit' }),
      tx('Netflix', '£11.99', { time: new Date('2026-09-07T14:45:00') }, { recurring: true, account: 'hsbc-credit' }),
      tx('Tesco', '£72.57', { time: new Date('2026-09-07T09:30:00') }, { recurring: true, account: 'hsbc-credit' }),
    ],
  },
];

export const transactionsBoardSwimlanes: BoardSwimlane[] = [
  {
    variant: 'needs',
    tone: 'green',
    spent: 0.5,
    spentAmount: '£300',
    budgetAmount: '£1000',
    percent: '36%',
    categories: [
      {
        category: 'rent',
        total: '£845.98',
        transactions: [
          tx('Seymours', '£845.98', { date: mon07 }, { recurring: true, account: 'monzo' }),
        ],
      },
      {
        category: 'groceries',
        total: '£150.00',
        transactions: [
          tx('Waitrose & Partners', '£12.57', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
          tx('Marks & Spencer', '£45.00', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
          tx("Sainsbury's", '£92.43', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
        ],
      },
      {
        category: 'bills',
        total: '£300.00',
        transactions: [
          tx('Thames Water', '£12.57', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
          tx('British Gas', '£12.57', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
        ],
      },
    ],
  },
  {
    variant: 'wants',
    tone: 'orange',
    spent: 0.448,
    softCap: 0.3167,
    spentAmount: '£300',
    budgetAmount: '£1000',
    percent: '36%',
    categories: [
      {
        category: 'dining-out',
        total: '£30.00',
        transactions: [
          tx('Pizza Express', '£12.57', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
        ],
      },
      {
        category: 'shopping',
        total: '£84.20',
        transactions: [
          tx('Amazon', '£12.57', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
        ],
      },
      {
        category: 'entertainment',
        total: '£100.00',
        transactions: [
          tx('Pizza Express', '£12.57', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
        ],
      },
    ],
  },
  {
    variant: 'culture',
    tone: 'amber',
    spent: 0.5,
    softCap: 0.4977,
    spentAmount: '£300',
    budgetAmount: '£1000',
    percent: '36%',
    categories: [
      {
        category: 'arts',
        total: '£30.00',
        transactions: [
          tx('British Museum', '£12.57', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
        ],
      },
      {
        category: 'books',
        total: '£84.20',
        transactions: [
          tx('Waterstones', '£12.57', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
        ],
      },
    ],
  },
  {
    variant: 'extra',
    tone: 'indigo',
    spent: 0.6063,
    softCap: 0.8597,
    spentAmount: '£300',
    budgetAmount: '£1000',
    percent: '36%',
    categories: [
      {
        category: 'gifts',
        total: '£30.00',
        transactions: [
          tx('Flowers Co.', '£12.57', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
        ],
      },
      {
        category: 'repairs',
        total: '£84.20',
        transactions: [
          tx('Halfords', '£12.57', { date: mon07 }, { recurring: true, account: 'hsbc-credit' }),
        ],
      },
    ],
  },
];
