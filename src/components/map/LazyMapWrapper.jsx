import React, { memo, Suspense, lazy, useCallback } from "react";
import { motion } from "framer-motion";

const MapContainer = lazy(() => import("react-leaflet").then(m => ({ default: m.MapContainer })));

const MapLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="w-full h-full bg-secondary/40 flex items-center justify-center"
  >
    <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </motion.div>
);

const LazyMapWrapper = memo(
  function LazyMapWrapper({ children, ...props }) {
    return (
      <Suspense fallback={<MapLoader />}>
        <MapContainer {...props} style={{ overscrollBehavior: 'none' }}>
          {children}
        </MapContainer>
      </Suspense>
    );
  },
  (prevProps, nextProps) => {
    // Memoize by checking key props that affect rendering
    return (
      prevProps.center === nextProps.center &&
      prevProps.zoom === nextProps.zoom &&
      prevProps.className === nextProps.className &&
      prevProps.children === nextProps.children
    );
  }
);

export default LazyMapWrapper;