'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBoardDrag, type CardLocation, type DropTargetId } from './BoardDragContext';
import { TransactionCard, type TransactionCardProps } from './TransactionCard';

interface DragOverlay {
  x: number;
  y: number;
  width: number;
  height: number;
  returning: boolean;
  dropping: boolean;
  flatten: boolean;
}

export interface DraggableTransactionCardProps extends TransactionCardProps {
  cardId: string;
  source: CardLocation;
  /** When false, renders a plain `TransactionCard`. */
  draggable?: boolean;
}

export function DraggableTransactionCard({
  draggable = true,
  cardId,
  source,
  tone = 'primary',
  merchant,
  amount,
  date,
  time,
  recurring,
  account,
  expanded,
  className = '',
}: DraggableTransactionCardProps) {
  const boardDrag = useBoardDrag();
  const placeholderRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);
  const pendingDropTargetRef = useRef<DropTargetId | null>(null);
  const overlayRef = useRef<DragOverlay | null>(null);
  const [overlay, setOverlay] = useState<DragOverlay | null>(null);

  const transaction = { merchant, amount, date, time, recurring, account, expanded };

  const updateOverlay = useCallback((next: DragOverlay | null | ((current: DragOverlay | null) => DragOverlay | null)) => {
    setOverlay((current) => {
      const resolved = typeof next === 'function' ? next(current) : next;
      overlayRef.current = resolved;
      return resolved;
    });
  }, []);

  useEffect(() => {
    if (!overlay || overlay.returning) return;

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = 'grabbing';

    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [overlay]);

  const releasePointerCapture = useCallback(() => {
    const placeholder = placeholderRef.current;
    const pointerId = activePointerIdRef.current;
    if (placeholder && pointerId !== null && placeholder.hasPointerCapture(pointerId)) {
      placeholder.releasePointerCapture(pointerId);
    }
    activePointerIdRef.current = null;
  }, []);

  const beginReturn = useCallback(
    (patch: Pick<DragOverlay, 'x' | 'y' | 'width' | 'dropping'>) => {
      updateOverlay((current) =>
        current
          ? {
              ...current,
              ...patch,
              returning: true,
              flatten: false,
            }
          : null,
      );

      requestAnimationFrame(() => {
        updateOverlay((current) => (current?.returning ? { ...current, flatten: true } : current));
      });
    },
    [updateOverlay],
  );

  const finishDrag = useCallback(() => {
    const placeholder = placeholderRef.current;
    if (!placeholder) {
      updateOverlay(null);
      boardDrag.cancelDrag();
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      updateOverlay(null);
      boardDrag.cancelDrag();
      return;
    }

    const rect = placeholder.getBoundingClientRect();
    beginReturn({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      dropping: false,
    });
  }, [beginReturn, boardDrag, updateOverlay]);

  const dropToTarget = useCallback(
    (target: DropTargetId) => {
      const dropPlaceholder = document.querySelector(`[data-drop-placeholder="${target}"]`);
      if (!dropPlaceholder) {
        finishDrag();
        return;
      }

      pendingDropTargetRef.current = target;
      boardDrag.lockDropTarget(target);

      const destinationRect = dropPlaceholder.getBoundingClientRect();
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        boardDrag.commitDrop(cardId, target);
        pendingDropTargetRef.current = null;
        updateOverlay(null);
        return;
      }

      beginReturn({
        x: destinationRect.left,
        y: destinationRect.top,
        width: destinationRect.width,
        dropping: true,
      });
    },
    [beginReturn, boardDrag, cardId, finishDrag, updateOverlay],
  );

  const cancelDrag = useCallback(() => {
    if (!overlayRef.current) return;

    releasePointerCapture();
    updateOverlay(null);
    pendingDropTargetRef.current = null;
    boardDrag.cancelDrag();
  }, [boardDrag, releasePointerCapture, updateOverlay]);

  const endDrag = useCallback(() => {
    if (!overlayRef.current || overlayRef.current.returning) return;

    releasePointerCapture();

    const target = boardDrag.dropTargetRef.current;
    if (target) {
      dropToTarget(target);
      return;
    }

    finishDrag();
  }, [boardDrag.dropTargetRef, dropToTarget, finishDrag, releasePointerCapture]);

  useEffect(() => {
    if (!overlay || overlay.returning) return;

    const handlePointerMove = (event: PointerEvent) => {
      boardDrag.updateDropTarget(event.clientX, event.clientY);
      updateOverlay((current) => {
        if (!current || current.returning) return current;

        return {
          ...current,
          x: event.clientX - dragOffsetRef.current.x,
          y: event.clientY - dragOffsetRef.current.y,
        };
      });
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) return;
      endDrag();
    };

    const handleWindowBlur = () => {
      cancelDrag();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cancelDrag();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [boardDrag, cancelDrag, endDrag, overlay, updateOverlay]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable || event.button !== 0) return;

    const placeholder = placeholderRef.current;
    if (!placeholder) return;

    event.preventDefault();

    const rect = placeholder.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    activePointerIdRef.current = event.pointerId;
    placeholder.setPointerCapture(event.pointerId);
    boardDrag.startDrag({ cardId, source, transaction, tone });
    updateOverlay({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      returning: false,
      dropping: false,
      flatten: false,
    });
  };

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== 'left' || !overlayRef.current?.returning) return;

    const pendingTarget = pendingDropTargetRef.current;
    if (pendingTarget) {
      boardDrag.commitDrop(cardId, pendingTarget);
      pendingDropTargetRef.current = null;
    } else {
      boardDrag.cancelDrag();
    }

    updateOverlay(null);
  };

  if (!draggable) {
    return <TransactionCard tone={tone} className={className} {...transaction} />;
  }

  const isDragging = overlay !== null;
  const overlayRotation = overlay?.flatten
    ? 'rotate-0'
    : 'rotate-[4deg] motion-reduce:rotate-0';
  const returnTransition =
    'left var(--token-duration-interaction) var(--ease-interaction), top var(--token-duration-interaction) var(--ease-interaction), transform var(--token-duration-interaction) var(--ease-interaction)';

  return (
    <>
      <div
        ref={placeholderRef}
        aria-hidden={isDragging}
        className={`w-full min-w-0 touch-none select-none ${isDragging ? '' : 'cursor-grab active:cursor-grabbing'}`}
        onPointerDown={handlePointerDown}
      >
        <TransactionCard disabled={isDragging} tone={tone} className={className} {...transaction} />
      </div>

      {overlay && typeof document !== 'undefined'
        ? createPortal(
            <div
              aria-grabbed="true"
              className={`pointer-events-none fixed z-50 origin-top-left touch-none select-none ${overlayRotation}`}
              style={{
                left: overlay.x,
                top: overlay.y,
                width: overlay.width,
                transition: overlay.returning ? returnTransition : undefined,
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              <TransactionCard
                shadowSize="l"
                tone={tone}
                className={className}
                {...transaction}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
