'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TransactionCard, type TransactionCardProps } from './TransactionCard';

const grabbedFrameClasses = {
  primary: 'shadow-primary-m',
  green: 'shadow-green-m',
  orange: 'shadow-orange-m',
  amber: 'shadow-amber-m',
  indigo: 'shadow-indigo-m',
} as const satisfies Record<NonNullable<TransactionCardProps['tone']>, string>;

interface DragOverlay {
  x: number;
  y: number;
  width: number;
  height: number;
  returning: boolean;
}

export interface DraggableTransactionCardProps extends TransactionCardProps {
  /** When false, renders a plain `TransactionCard`. */
  draggable?: boolean;
}

export function DraggableTransactionCard({
  draggable = true,
  tone = 'primary',
  className = '',
  ...props
}: DraggableTransactionCardProps) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const overlayRef = useRef<DragOverlay | null>(null);
  const [overlay, setOverlay] = useState<DragOverlay | null>(null);

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

  const finishDrag = useCallback(() => {
    const placeholder = placeholderRef.current;
    if (!placeholder) {
      updateOverlay(null);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      updateOverlay(null);
      return;
    }

    const rect = placeholder.getBoundingClientRect();
    updateOverlay((current) =>
      current
        ? {
            ...current,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            returning: true,
          }
        : null,
    );
  }, [updateOverlay]);

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

    event.currentTarget.setPointerCapture(event.pointerId);
    updateOverlay({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      returning: false,
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    updateOverlay((current) => {
      if (!current || current.returning) return current;

      return {
        ...current,
        x: event.clientX - dragOffsetRef.current.x,
        y: event.clientY - dragOffsetRef.current.y,
      };
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    finishDrag();
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    finishDrag();
  };

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== 'left' || !overlayRef.current?.returning) return;
    updateOverlay(null);
  };

  if (!draggable) {
    return <TransactionCard tone={tone} className={className} {...props} />;
  }

  const isDragging = overlay !== null;
  const grabbedClassName = `${grabbedFrameClasses[tone]} rotate-[4deg] motion-reduce:rotate-0`;

  return (
    <>
      <div
        ref={placeholderRef}
        aria-hidden={isDragging}
        className={`w-full min-w-0 touch-none select-none ${isDragging ? 'opacity-0' : 'cursor-grab active:cursor-grabbing'}`}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <TransactionCard tone={tone} className={className} {...props} />
      </div>

      {overlay && typeof document !== 'undefined'
        ? createPortal(
            <div
              aria-grabbed="true"
              className="pointer-events-none fixed z-50 touch-none select-none"
              style={{
                left: overlay.x,
                top: overlay.y,
                width: overlay.width,
                transition: overlay.returning
                  ? 'left var(--token-duration-interaction) var(--ease-interaction), top var(--token-duration-interaction) var(--ease-interaction)'
                  : undefined,
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              <TransactionCard tone={tone} className={`${grabbedClassName} ${className}`} {...props} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
