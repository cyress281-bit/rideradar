import React, { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

export default function GlobalPullToRefresh({ children }) {
  const queryClient = useQueryClient();
  const { scrollContainerRef, progress, handlers } = usePullToRefresh(
    useCallback(async () => {
      // Invalidate all queries to trigger a global refresh
      await queryClient.invalidateQueries();
    }, [queryClient])
  );

  return (
    <div
      ref={scrollContainerRef}
      className="relative overflow-y-auto"
      style={{ overscrollBehavior: "none" }}
      {...handlers}
    >
      {/* Pull-to-refresh indicator */}
      {progress > 0 && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full"
            style={{
              rotate: progress * 360,
              opacity: progress,
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}