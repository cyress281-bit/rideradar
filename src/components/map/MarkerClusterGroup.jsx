import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Simple clustering implementation for mobile performance
export default function MarkerClusterGroup({ markers, maxZoom = 18 }) {
  const map = useMap();
  const clustersRef = useRef({});
  const clusterLayersRef = useRef([]);

  useEffect(() => {
    // Clear previous clusters
    clusterLayersRef.current.forEach((layer) => map.removeLayer(layer));
    clusterLayersRef.current = [];
    clustersRef.current = {};

    if (!markers || markers.length === 0) return;

    const GRID_SIZE = 80; // pixels for clustering grid

    const getClusterKey = (latlng) => {
      const point = map.latLngToContainerPoint(latlng);
      const gridX = Math.floor(point.x / GRID_SIZE);
      const gridY = Math.floor(point.y / GRID_SIZE);
      return `${gridX},${gridY}`;
    };

    // Organize markers into clusters based on zoom level
    markers.forEach((marker) => {
      const key = getClusterKey(marker.position);
      if (!clustersRef.current[key]) {
        clustersRef.current[key] = [];
      }
      clustersRef.current[key].push(marker);
    });

    // Create cluster layers
    Object.entries(clustersRef.current).forEach(([key, clusterMarkers]) => {
      if (clusterMarkers.length === 1) {
        // Single marker, add directly
        const layer = L.marker(clusterMarkers[0].position, {
          icon: clusterMarkers[0].icon,
        });
        if (clusterMarkers[0].onClick) {
          layer.on("click", clusterMarkers[0].onClick);
        }
        layer.addTo(map);
        clusterLayersRef.current.push(layer);
      } else {
        // Multiple markers, create cluster
        const bounds = L.latLngBounds(clusterMarkers.map((m) => m.position));
        const center = bounds.getCenter();
        const count = clusterMarkers.length;

        const clusterIcon = L.divIcon({
          className: "cluster-icon",
          html: `
            <div style="
              width:40px;height:40px;
              background:linear-gradient(135deg,rgb(var(--primary)),rgb(0,180,40));
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              border:2px solid rgb(var(--foreground));
              box-shadow:0 0 16px rgba(0,240,50,0.5);
              font-weight:bold;color:#000;font-size:12px
            ">${count}</div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const clusterMarker = L.marker(center, { icon: clusterIcon });
        clusterMarker.on("click", () => {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        });
        clusterMarker.addTo(map);
        clusterLayersRef.current.push(clusterMarker);
      }
    });
  }, [markers, map]);

  return null;
}