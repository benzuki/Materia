import { TransactionsBoard } from '@/components/ui/TransactionsBoard';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-surface-container-off-white-background p-inset-m">
      <TransactionsBoard className="mx-auto" />
    </main>
  );
}
