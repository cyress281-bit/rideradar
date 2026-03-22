import { useState, useRef } from "react";

export function usePullToRefresh(onRefresh) {
  const scrollContainerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const handlers = {
    onTouchStart(e) {
      if (scrollContainerRef.current?.scrollTop === 0 && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY;
      }
    },

    onTouchMove(e) {
      if (isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const scrollTop = scrollContainerRef.current?.scrollTop || 0;

      if (scrollTop === 0 && currentY > touchStartY.current) {
        const distance = currentY - touchStartY.current;
        const calculatedProgress = Math.min(distance / 60, 1);
        setProgress(calculatedProgress);
      }
    },

    async onTouchEnd() {
      if (progress >= 1 && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      setProgress(0);
      touchStartY.current = 0;
    },
  };

  return { scrollContainerRef, progress, isRefreshing, handlers };
}