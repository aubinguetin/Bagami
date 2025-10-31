import { useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 60,
  resistance = 2,
  enabled = true
}: PullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number | null>(null);
  const scrollElement = useRef<HTMLElement | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (!enabled || isRefreshing) return;
    
    const element = scrollElement.current;
    if (!element) return;

    // Only start pull if we're at the top of the scroll container
    if (element.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!enabled || isRefreshing || startY.current === null) return;

    const element = scrollElement.current;
    if (!element) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;

    // Only allow pull down when at top
    if (element.scrollTop === 0 && deltaY > 0) {
      e.preventDefault();
      const distance = Math.max(0, deltaY / resistance);
      setPullDistance(distance);
      setIsPulling(distance > 10);
    }
  };

  const handleTouchEnd = async () => {
    if (!enabled || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
    startY.current = null;
  };

  const bindToElement = (element: HTMLElement | null) => {
    scrollElement.current = element;
  };

  useEffect(() => {
    const element = scrollElement.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, resistance]);

  return {
    bindToElement,
    isPulling,
    isRefreshing,
    pullDistance,
    canRefresh: pullDistance >= threshold
  };
};