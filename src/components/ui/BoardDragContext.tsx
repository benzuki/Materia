'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  cardLocationToDropTarget,
  createInitialBoardState,
  laneToneForTarget,
  moveCard,
  parseDropTargetId,
  type BoardState,
  type CardLocation,
  type DropTargetId,
  type StoredBoardTransaction,
} from '@/lib/content/transactions-board-state';
import type { TransactionTone } from './TransactionCard';
import type { BoardTransaction } from '@/lib/content/transactions-board';

export interface ActiveBoardDrag {
  cardId: string;
  source: CardLocation;
  transaction: BoardTransaction;
  tone: TransactionTone;
}

export interface OriginCloseState {
  source: DropTargetId;
  index: number;
  feedDate?: Date;
  transaction: BoardTransaction;
  tone: TransactionTone;
}

interface BoardDragContextValue {
  board: BoardState;
  activeDrag: ActiveBoardDrag | null;
  dropTarget: DropTargetId | null;
  dropTargetRef: React.RefObject<DropTargetId | null>;
  pendingDropTarget: DropTargetId | null;
  dropTargetTone: TransactionTone;
  originClose: OriginCloseState | null;
  startDrag: (drag: ActiveBoardDrag) => void;
  updateDropTarget: (clientX: number, clientY: number) => void;
  lockDropTarget: (target: DropTargetId) => void;
  commitDrop: (cardId: string, target: DropTargetId) => void;
  clearOriginClose: () => void;
  cancelDrag: () => void;
}

const BoardDragContext = createContext<BoardDragContextValue | null>(null);

function dropTargetHitInset(): number {
  if (typeof document === 'undefined') return 8;

  const raw = getComputedStyle(document.documentElement).getPropertyValue('--spacing-inset-xs').trim();
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 8;
}

function distanceToRectCenter(clientX: number, clientY: number, rect: DOMRect): number {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return Math.hypot(clientX - centerX, clientY - centerY);
}

function findDropTargetAtPoint(clientX: number, clientY: number): DropTargetId | null {
  const inset = dropTargetHitInset();
  const elements = document.querySelectorAll('[data-drop-target]');

  let closestTarget: DropTargetId | null = null;
  let closestDistance = Infinity;

  for (const element of elements) {
    const parsed = parseDropTargetId(element.getAttribute('data-drop-target'));
    if (!parsed) continue;

    const rect = element.getBoundingClientRect();
    if (
      clientX < rect.left - inset ||
      clientX > rect.right + inset ||
      clientY < rect.top - inset ||
      clientY > rect.bottom + inset
    ) {
      continue;
    }

    const distance = distanceToRectCenter(clientX, clientY, rect);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestTarget = parsed;
    }
  }

  return closestTarget;
}

function findOriginCloseMeta(
  state: BoardState,
  cardId: string,
  source: CardLocation,
): Pick<OriginCloseState, 'index' | 'feedDate'> {
  if (source.zone === 'feed') {
    for (const group of state.feed) {
      const index = group.transactions.findIndex((transaction) => transaction.id === cardId);
      if (index !== -1) {
        return { index, feedDate: group.date };
      }
    }
    return { index: 0 };
  }

  const lane = state.swimlanes.find((entry) => entry.variant === source.lane);
  const category = lane?.categories.find((entry) => entry.category === source.category);
  const index = category?.transactions.findIndex((transaction) => transaction.id === cardId) ?? -1;

  return { index: index === -1 ? 0 : index };
}

export function BoardDragProvider({ children }: { children: ReactNode }) {
  const [board, setBoard] = useState<BoardState>(() => createInitialBoardState());
  const [activeDrag, setActiveDrag] = useState<ActiveBoardDrag | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTargetId | null>(null);
  const [pendingDropTarget, setPendingDropTarget] = useState<DropTargetId | null>(null);
  const [originClose, setOriginClose] = useState<OriginCloseState | null>(null);
  const pendingDropTargetRef = useRef<DropTargetId | null>(null);
  const activeDragRef = useRef<ActiveBoardDrag | null>(null);
  const dropTargetRef = useRef<DropTargetId | null>(null);

  useEffect(() => {
    activeDragRef.current = activeDrag;
  }, [activeDrag]);

  useEffect(() => {
    dropTargetRef.current = dropTarget;
  }, [dropTarget]);

  useEffect(() => {
    pendingDropTargetRef.current = pendingDropTarget;
  }, [pendingDropTarget]);

  const setDropTargetSync = useCallback((target: DropTargetId | null) => {
    dropTargetRef.current = target;
    setDropTarget(target);
  }, []);

  const dropTargetTone = dropTarget ? laneToneForTarget(board, dropTarget) : 'primary';

  const startDrag = useCallback((drag: ActiveBoardDrag) => {
    activeDragRef.current = drag;
    setActiveDrag(drag);
    setDropTargetSync(null);
    setPendingDropTarget(null);
  }, [setDropTargetSync]);

  const updateDropTarget = useCallback((clientX: number, clientY: number) => {
    if (pendingDropTargetRef.current) return;

    const drag = activeDragRef.current;
    if (!drag) return;

    const parsedTarget = findDropTargetAtPoint(clientX, clientY);
    const sourceTarget = cardLocationToDropTarget(drag.source);

    if (!parsedTarget || parsedTarget === sourceTarget) {
      setDropTargetSync(null);
      return;
    }

    setDropTargetSync(parsedTarget);
  }, [setDropTargetSync]);

  const lockDropTarget = useCallback((target: DropTargetId) => {
    pendingDropTargetRef.current = target;
    setPendingDropTarget(target);
    setDropTargetSync(target);
  }, [setDropTargetSync]);

  const clearOriginClose = useCallback(() => {
    setOriginClose(null);
  }, []);

  const commitDrop = useCallback((cardId: string, target: DropTargetId) => {
    const drag = activeDragRef.current;
    let originCloseState: OriginCloseState | null = null;

    setBoard((current) => {
      if (drag) {
        const { index, feedDate } = findOriginCloseMeta(current, cardId, drag.source);
        originCloseState = {
          source: cardLocationToDropTarget(drag.source),
          index,
          feedDate,
          transaction: drag.transaction,
          tone: drag.tone,
        };
      }

      return moveCard(current, cardId, target);
    });

    if (originCloseState) {
      setOriginClose(originCloseState);
    }

    activeDragRef.current = null;
    setActiveDrag(null);
    setDropTargetSync(null);
    pendingDropTargetRef.current = null;
    setPendingDropTarget(null);
  }, [setDropTargetSync]);

  const cancelDrag = useCallback(() => {
    activeDragRef.current = null;
    setActiveDrag(null);
    setDropTargetSync(null);
    pendingDropTargetRef.current = null;
    setPendingDropTarget(null);
  }, [setDropTargetSync]);

  const value = useMemo(
    () => ({
      board,
      activeDrag,
      dropTarget,
      dropTargetRef,
      pendingDropTarget,
      dropTargetTone,
      originClose,
      startDrag,
      updateDropTarget,
      lockDropTarget,
      commitDrop,
      clearOriginClose,
      cancelDrag,
    }),
    [
      activeDrag,
      board,
      cancelDrag,
      clearOriginClose,
      commitDrop,
      dropTarget,
      dropTargetTone,
      lockDropTarget,
      originClose,
      pendingDropTarget,
      startDrag,
      updateDropTarget,
    ],
  );

  return <BoardDragContext.Provider value={value}>{children}</BoardDragContext.Provider>;
}

export function useBoardDrag(): BoardDragContextValue {
  const context = useContext(BoardDragContext);
  if (!context) {
    throw new Error('useBoardDrag must be used within BoardDragProvider');
  }
  return context;
}

export type { CardLocation, DropTargetId, StoredBoardTransaction };
