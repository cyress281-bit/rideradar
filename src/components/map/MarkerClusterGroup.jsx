import React, { useEffect, useRef, memo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const MarkerClusterGroup = memo(function MarkerClusterGroup({ markers }) {
  const map = useMap();
  const clusterLayersRef = useRef([]);

  useEffect(() => {
    clusterLayersRef.current.forEach((layer) => map.removeLayer(layer));
    clusterLayersRef.current = [];

    if (!markers || markers.length === 0) return;

    const clusters = {};
    const gridSize = 80;
    const getClusterKey = (latlng) => {
      const point = map.latLngToContainerPoint(latlng);
      return `${Math.floor(point.x / gridSize)},${Math.floor(point.y / gridSize)}`;
    };

    markers.forEach((marker) => {
      const key = getClusterKey(marker.position);
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(marker);
    });

    Object.values(clusters).forEach((clusterMarkers) => {
      if (clusterMarkers.length < 2) return;

      const bounds = L.latLngBounds(clusterMarkers.map((marker) => marker.position));
      const center = bounds.getCenter();
      const count = clusterMarkers.length;
      const label = `${count} rides clustered nearby. Activate to zoom in.`;

      const clusterIcon = L.divIcon({
        className: "cluster-icon",
        html: `
          <div role="img" aria-label="${label}" style="
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

      requestAnimationFrame(() => {
        const element = clusterMarker.getElement();
        if (!element) return;
        element.setAttribute("role", "button");
        element.setAttribute("tabindex", "0");
        element.setAttribute("aria-label", label);
      });

      clusterLayersRef.current.push(clusterMarker);
    });
  }, [markers, map]);

  return null;
});

export default MarkerClusterGroup;