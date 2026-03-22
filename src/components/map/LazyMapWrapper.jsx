import React, { memo, Suspense, lazy } from "react";
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

const LazyMapWrapper = memo(function LazyMapWrapper({ children, ...props }) {
  return (
    <Suspense fallback={<MapLoader />}>
      <MapContainer {...props}>
        {children}
      </MapContainer>
    </Suspense>
  );
});

export default LazyMapWrapper;