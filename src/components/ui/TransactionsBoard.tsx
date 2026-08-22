'use client';

import { Fragment, useCallback, useLayoutEffect, useState, type TransitionEvent } from 'react';
import { CategoryCard } from './CategoryCard';
import { ProgressHeader } from './ProgressHeader';
import { DraggableTransactionCard } from './DraggableTransactionCard';
import { TransactionCard } from './TransactionCard';
import {
  BoardDragProvider,
  useBoardDrag,
  type CardLocation,
  type DropTargetId,
  type OriginCloseState,
  type StoredBoardTransaction,
} from './BoardDragContext';
import { formatTransactionDate } from '@/lib/format';
import type { BoardCategoryGroup, BoardFeedGroup, BoardLaneState } from '@/lib/content/transactions-board-state';
import type { CategoryId } from '@/lib/content/categories';
import type { ProgressHeaderVariant } from './ProgressHeader';
import type { BoardTransaction } from '@/lib/content/transactions-board';
import type { TransactionTone } from './TransactionCard';

interface TransactionsBoardProps {
  className?: string;
}

interface AnimatedCollapseProps {
  visible: boolean;
  onClosed: () => void;
  children: React.ReactNode | ((open: boolean) => React.ReactNode);
  /** Animates stack-xs spacing with the height — for drop placeholders below cards. */
  spacingBefore?: boolean;
  /** Skip the open animation and start expanded — for origin slot close after drop. */
  startOpen?: boolean;
  className?: string;
}

function AnimatedCollapse({
  visible,
  onClosed,
  children,
  spacingBefore = false,
  startOpen = false,
  className = '',
}: AnimatedCollapseProps) {
  const [entered, setEntered] = useState(false);
  const [holdMount, setHoldMount] = useState(visible);
  const open = visible && entered;

  const finishClosed = useCallback(() => {
    onClosed();
    setHoldMount(false);
  }, [onClosed]);

  useLayoutEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- open lifecycle
      setHoldMount(true);
      if (startOpen) {
        setEntered(true);
        return;
      }
      const frame = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(frame);
    }

    setEntered(false);
  }, [startOpen, visible]);

  useLayoutEffect(() => {
    if (visible || open) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion close lifecycle
    finishClosed();
  }, [finishClosed, open, visible]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (visible || open || event.propertyName !== 'grid-template-rows') return;
    finishClosed();
  };

  if (!holdMount) return null;

  const spacingTransition = spacingBefore ? ',padding-top' : '';
  const spacingClasses = spacingBefore ? (open ? 'pt-stack-xs' : 'pt-0') : '';

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      className={`grid w-full min-w-0 transition-[grid-template-rows${spacingTransition}] duration-interaction ease-interaction motion-reduce:transition-none ${
        open ? `grid-rows-[1fr] ${spacingClasses}` : `grid-rows-[0fr] ${spacingBefore ? 'pt-0' : ''}`
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        {typeof children === 'function' ? children(open) : children}
      </div>
    </div>
  );
}

interface DropPlaceholderProps {
  targetId: DropTargetId;
  tone: TransactionTone;
  transaction: BoardTransaction;
  visible: boolean;
  onClosed: () => void;
}

function DropPlaceholder({ targetId, tone, transaction, visible, onClosed }: DropPlaceholderProps) {
  return (
    <AnimatedCollapse visible={visible} onClosed={onClosed} spacingBefore>
      {(open) => (
        <div
          data-drop-placeholder={targetId}
          className={`transition-[transform,opacity] duration-interaction ease-interaction motion-reduce:transition-none ${
            open ? 'translate-y-0 opacity-100' : '-translate-y-stack-xxs opacity-0'
          }`}
        >
          <TransactionCard disabled tone={tone} {...transaction} />
        </div>
      )}
    </AnimatedCollapse>
  );
}

interface OriginClosePlaceholderProps {
  tone: TransactionTone;
  transaction: BoardTransaction;
  spacingBefore?: boolean;
  onClosed: () => void;
}

function OriginClosePlaceholder({
  tone,
  transaction,
  spacingBefore = false,
  onClosed,
}: OriginClosePlaceholderProps) {
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(false));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <AnimatedCollapse visible={visible} startOpen spacingBefore={spacingBefore} onClosed={onClosed}>
      {(open) => (
        <div
          className={`transition-[transform,opacity] duration-interaction ease-interaction motion-reduce:transition-none ${
            open ? 'translate-y-0 opacity-100' : '-translate-y-stack-xxs opacity-0'
          }`}
        >
          <TransactionCard disabled tone={tone} {...transaction} />
        </div>
      )}
    </AnimatedCollapse>
  );
}

function originCloseMatchesSlot(
  originClose: OriginCloseState | null,
  targetId: DropTargetId,
  index: number,
  feedDate?: Date,
): originClose is OriginCloseState {
  if (!originClose || originClose.source !== targetId || originClose.index !== index) {
    return false;
  }

  if (feedDate === undefined) {
    return originClose.feedDate === undefined;
  }

  return originClose.feedDate?.toDateString() === feedDate.toDateString();
}

interface OriginCloseSlotProps {
  targetId: DropTargetId;
  index: number;
  feedDate?: Date;
  spacingBefore?: boolean;
  onClosed?: () => void;
}

function OriginCloseSlot({
  targetId,
  index,
  feedDate,
  spacingBefore = false,
  onClosed,
}: OriginCloseSlotProps) {
  const { originClose, clearOriginClose } = useBoardDrag();
  const closingHere = originCloseMatchesSlot(originClose, targetId, index, feedDate);
  const [holdClose, setHoldClose] = useState(false);

  useLayoutEffect(() => {
    if (closingHere) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- exit animation lifecycle
      setHoldClose(true);
    }
  }, [closingHere]);

  const handleClosed = useCallback(() => {
    setHoldClose(false);
    clearOriginClose();
    onClosed?.();
  }, [clearOriginClose, onClosed]);

  if (!originClose || !(closingHere || holdClose)) {
    return null;
  }

  return (
    <OriginClosePlaceholder
      tone={originClose.tone}
      transaction={originClose.transaction}
      spacingBefore={spacingBefore}
      onClosed={handleClosed}
    />
  );
}

function stackSpacingBefore(index: number): string {
  return index > 0 ? 'mt-stack-xs' : '';
}

interface BoardDropZoneProps {
  targetId: DropTargetId;
  children: React.ReactNode;
  className?: string;
  /** When true, this element is the hit target. Category buckets register on `CategoryCard` instead. */
  registerDropTarget?: boolean;
  onPlaceholderClosed?: () => void;
}

function BoardDropZone({
  targetId,
  children,
  className = '',
  registerDropTarget = false,
  onPlaceholderClosed,
}: BoardDropZoneProps) {
  const { activeDrag, dropTarget, pendingDropTarget, dropTargetTone } = useBoardDrag();
  const isActiveTarget = dropTarget === targetId || pendingDropTarget === targetId;
  const showPlaceholder = activeDrag !== null && isActiveTarget;
  const placeholderTone = targetId === 'feed' ? 'primary' : dropTargetTone;
  const [holdPlaceholder, setHoldPlaceholder] = useState(false);

  useLayoutEffect(() => {
    if (showPlaceholder) {
      // Keep the placeholder mounted through its close transition.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- exit animation lifecycle
      setHoldPlaceholder(true);
    }
  }, [showPlaceholder]);

  const handlePlaceholderClosed = useCallback(() => {
    setHoldPlaceholder(false);
    onPlaceholderClosed?.();
  }, [onPlaceholderClosed]);

  const renderPlaceholder = activeDrag !== null && (showPlaceholder || holdPlaceholder);

  return (
    <div
      {...(registerDropTarget ? { 'data-drop-target': targetId } : {})}
      className={`flex w-full min-w-0 flex-col ${className}`}
    >
      <div className="flex w-full min-w-0 flex-col">{children}</div>
      {renderPlaceholder && activeDrag ? (
        <DropPlaceholder
          targetId={targetId}
          tone={placeholderTone}
          transaction={activeDrag.transaction}
          visible={showPlaceholder}
          onClosed={handlePlaceholderClosed}
        />
      ) : null}
    </div>
  );
}

function BankFeedColumn({ groups }: { groups: BoardFeedGroup[] }) {
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

      <BoardDropZone targetId="feed" registerDropTarget className="min-h-0 flex-1 p-inset-s">
        <div className="flex min-h-0 flex-1 flex-col gap-stack-s">
          {groups.map((group) => (
            <div key={group.date.toISOString()} className="flex w-full flex-col items-center gap-stack-xs">
              <p className="shrink-0 text-xs leading-xs text-text-text-secondary">
                {formatTransactionDate(group.date)}
              </p>
              <div className="flex w-full flex-col">
                {group.transactions.map((transaction, index) => (
                  <Fragment key={transaction.id}>
                    <OriginCloseSlot
                      targetId="feed"
                      index={index}
                      spacingBefore={index > 0}
                      feedDate={group.date}
                    />
                    <div className={stackSpacingBefore(index)}>
                      <DraggableTransactionCard
                        cardId={transaction.id}
                        source={{ zone: 'feed' }}
                        tone="primary"
                        {...transaction}
                      />
                    </div>
                  </Fragment>
                ))}
                <OriginCloseSlot
                  targetId="feed"
                  index={group.transactions.length}
                  spacingBefore={group.transactions.length > 0}
                  feedDate={group.date}
                />
              </div>
            </div>
          ))}
        </div>
      </BoardDropZone>
    </aside>
  );
}

function categoryDropTarget(lane: ProgressHeaderVariant, category: CategoryId): DropTargetId {
  return `category:${lane}:${category}`;
}

function CategoryBucket({
  group,
  targetId,
  source,
  tone,
}: {
  group: BoardCategoryGroup;
  targetId: DropTargetId;
  source: CardLocation;
  tone: TransactionTone;
}) {
  const { activeDrag, dropTarget, pendingDropTarget, originClose } = useBoardDrag();
  const [holdBody, setHoldBody] = useState(false);
  const hasCards = group.transactions.length > 0;
  const isActiveTarget = dropTarget === targetId || pendingDropTarget === targetId;
  const showPlaceholder = activeDrag !== null && isActiveTarget;
  const originClosingHere = originClose?.source === targetId;
  const bodyVisible = hasCards || showPlaceholder || originClosingHere;
  const renderBody = bodyVisible || holdBody;
  const bodySpacingBefore = hasCards || showPlaceholder || !originClosingHere;

  useLayoutEffect(() => {
    if (bodyVisible) {
      // Keep the body mounted through its close transition.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- exit animation lifecycle
      setHoldBody(true);
    }
  }, [bodyVisible]);

  const handleBodyClosed = useCallback(() => {
    setHoldBody(false);
  }, []);

  const handleOriginCloseClosed = useCallback(() => {
    if (!hasCards) {
      setHoldBody(false);
    }
  }, [hasCards]);

  return (
    <CategoryCard
      category={group.category}
      total={group.total}
      tone={tone}
      dropTargetId={targetId}
      showBody={renderBody}
    >
      {renderBody ? (
        <AnimatedCollapse visible={bodyVisible} spacingBefore={bodySpacingBefore} onClosed={handleBodyClosed}>
          <BoardDropZone targetId={targetId}>
            {group.transactions.map((transaction: StoredBoardTransaction, index) => (
              <Fragment key={transaction.id}>
                <OriginCloseSlot
                  targetId={targetId}
                  index={index}
                  spacingBefore={index > 0}
                  onClosed={handleOriginCloseClosed}
                />
                <div className={stackSpacingBefore(index)}>
                  <DraggableTransactionCard
                    cardId={transaction.id}
                    source={source}
                    tone={tone}
                    {...transaction}
                  />
                </div>
              </Fragment>
            ))}
            <OriginCloseSlot
              targetId={targetId}
              index={group.transactions.length}
              spacingBefore={group.transactions.length > 0 || originClosingHere}
              onClosed={handleOriginCloseClosed}
            />
          </BoardDropZone>
        </AnimatedCollapse>
      ) : null}
    </CategoryCard>
  );
}

function Swimlane({ lane }: { lane: BoardLaneState }) {
  const { variant, tone, categories, ...header } = lane;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-stack-s">
      <ProgressHeader variant={variant} {...header} />

      {categories.map((group) => {
        const targetId = categoryDropTarget(variant, group.category);
        const source: CardLocation = { zone: 'category', lane: variant, category: group.category };

        return (
          <CategoryBucket key={group.category} group={group} targetId={targetId} source={source} tone={tone} />
        );
      })}
    </div>
  );
}

function TransactionsBoardContent({ className = '' }: TransactionsBoardProps) {
  const { board } = useBoardDrag();

  return (
    <div
      className={`flex w-full min-w-0 overflow-x-auto rounded-container-l border-[length:var(--token-border-width-selectable-s)] border-solid border-border-subtle ${className}`}
    >
      <div className="flex min-w-[1075px] items-stretch">
        <BankFeedColumn groups={board.feed} />

        <div className="flex min-w-0 flex-1 gap-inline-s bg-surface-container-white-background p-inset-s">
          {board.swimlanes.map((lane) => (
            <Swimlane key={lane.variant} lane={lane} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TransactionsBoard({ className = '' }: TransactionsBoardProps) {
  return (
    <BoardDragProvider>
      <TransactionsBoardContent className={className} />
    </BoardDragProvider>
  );
}
