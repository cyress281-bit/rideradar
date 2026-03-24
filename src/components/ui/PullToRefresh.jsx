import React, { useRef, useState } from "react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setPullDistance(Math.min(delta * 0.5, THRESHOLD + 20));
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
  };

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      {pullDistance > 0 || refreshing ? (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: refreshing ? THRESHOLD : pullDistance }}
        >
          <div
            className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
            style={{
              animation: refreshing ? "spin 0.7s linear infinite" : "none",
              transform: `rotate(${progress * 270}deg)`,
            }}
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}