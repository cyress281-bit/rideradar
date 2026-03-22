import { useState, useRef } from "react";

export function usePullToRefresh(onRefresh) {
  const [pullRefresh, setPullRefresh] = useState(0);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef(null);

  const handlePullRefresh = (e) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY > 0) {
        setPullRefresh(Math.min(deltaY / 100, 1));
      }
    }
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = async () => {
    if (pullRefresh > 0.5) {
      await onRefresh();
    }
    setPullRefresh(0);
  };

  return {
    scrollContainerRef,
    pullRefresh,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handlePullRefresh,
      onTouchEnd: handleTouchEnd,
    },
  };
}