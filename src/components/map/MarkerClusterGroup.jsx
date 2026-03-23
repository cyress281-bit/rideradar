import React, { useEffect, useRef, memo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Singleton worker — created once, shared across all map instances
let clusterWorker = null;
function getClusterWorker() {
  if (!clusterWorker) {
    clusterWorker = new Worker(new URL("/src/lib/clusterWorker.js", import.meta.url), { type: "module" });
  }
  return clusterWorker;
}

const MarkerClusterGroup = memo(function MarkerClusterGroup({ markers }) {
  const map = useMap();
  const clusterLayersRef = useRef([]);
  const workerRequestRef = useRef(null);

  useEffect(() => {
    clusterLayersRef.current.forEach((layer) => map.removeLayer(layer));
    clusterLayersRef.current = [];

    if (!markers || markers.length === 0) return;

    const zoom = map.getZoom();

    // Offload clustering math to Web Worker
    const worker = getClusterWorker();

    const handleWorkerMessage = ({ data: clusters }) => {
      clusterLayersRef.current.forEach((layer) => map.removeLayer(layer));
      clusterLayersRef.current = [];

      clusters.forEach(({ center, count, positions }) => {
        const label = `${count} rides clustered nearby. Activate to zoom in.`;

        const clusterIcon = L.divIcon({
          className: "cluster-icon",
          html: `<div role="img" aria-label="${label}" style="width:40px;height:40px;background:linear-gradient(135deg,rgb(var(--primary)),rgb(0,180,40));border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid rgb(var(--foreground));box-shadow:0 0 16px rgba(0,240,50,0.5);font-weight:bold;color:#000;font-size:12px">${count}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const bounds = L.latLngBounds(positions);
        const clusterMarker = L.marker(center, { icon: clusterIcon });
        clusterMarker.on("click", () => map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 }));
        clusterMarker.addTo(map);

        requestAnimationFrame(() => {
          const el = clusterMarker.getElement();
          if (!el) return;
          el.setAttribute("role", "button");
          el.setAttribute("tabindex", "0");
          el.setAttribute("aria-label", label);
        });

        clusterLayersRef.current.push(clusterMarker);
      });
    };

    worker.addEventListener("message", handleWorkerMessage, { once: true });
    worker.postMessage({ markers, zoom });

    return () => {
      worker.removeEventListener("message", handleWorkerMessage);
    };
  }, [markers, map]);

  return null;
});

export default MarkerClusterGroup;