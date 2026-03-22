import React, { Suspense } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';

const LazyMap = ({ children, ...props }) => (
  <LeafletMapContainer {...props}>
    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
    {children}
  </LeafletMapContainer>
);

export default function LazyMapContainer({ children, fallback, ...props }) {
  return (
    <Suspense fallback={fallback || <div className="w-full h-full bg-secondary/40 animate-pulse" />}>
      <LazyMap {...props}>{children}</LazyMap>
    </Suspense>
  );
}