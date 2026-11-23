import { useState, useRef, useEffect, useCallback } from 'react';

// Hook que encapsula la lógica para hacer un elemento arrastrable en React usando Pointer Events (compatible con mouse y touch)
export const useDraggable = (
  externalPosition?: { x: number; y: number },
  setExternalPosition?: (pos: { x: number; y: number }) => void
) => {
  const [internalPosition, setInternalPosition] = useState({ x: 0, y: 0 });
  const position = externalPosition ?? internalPosition;
  const setPosition = setExternalPosition ?? setInternalPosition;
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    lastPositionRef.current = position;
  }, [position]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const next = {
      x: lastPositionRef.current.x + deltaX,
      y: Math.max(0, lastPositionRef.current.y + deltaY)
    };
    setPosition(next);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastPositionRef.current = next;
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current?.releasePointerCapture?.(0);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);
    }
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleMouseDown = useCallback((e: React.PointerEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }, []);

  const resetPosition = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return {
    position,
    isDragging,
    dragRef,
    handleMouseDown,
    resetPosition
  };
};