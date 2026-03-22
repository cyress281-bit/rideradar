import React, { useEffect, useRef, memo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Groups track points by user, draws one polyline per rider
const RideRoutePolyline = memo(function RideRoutePolyline({ trackPoints, rideStatus }) {
  const map = useMap();
  const layersRef = useRef([]);

  useEffect(() => {
    // Remove old layers
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    if (!trackPoints || trackPoints.length === 0) return;

    // Group by user_email
    const byUser = {};
    trackPoints.forEach((pt) => {
      if (!byUser[pt.user_email]) byUser[pt.user_email] = [];
      byUser[pt.user_email].push(pt);
    });

    const colors = ["#00f032", "#3b82f6", "#f59e0b", "#ec4899", "#a78bfa", "#fb923c"];
    let colorIdx = 0;

    Object.entries(byUser).forEach(([, points]) => {
      // Sort by recorded_at
      const sorted = [...points].sort(
        (a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date)
      );

      if (sorted.length < 2) return;

      const latlngs = sorted.map((p) => [p.lat, p.lng]);
      const color = colors[colorIdx % colors.length];
      colorIdx++;

      // Glow effect: wider faint line + thinner bright line
      const glowLine = L.polyline(latlngs, {
        color,
        weight: 6,
        opacity: 0.18,
        smoothFactor: 1.5,
      }).addTo(map);

      const mainLine = L.polyline(latlngs, {
        color,
        weight: 2.5,
        opacity: rideStatus === "active" ? 0.9 : 0.55,
        smoothFactor: 1.5,
        dashArray: rideStatus === "active" ? null : "6 4",
      }).addTo(map);

      layersRef.current.push(glowLine, mainLine);
    });

    return () => {
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];
    };
  }, [trackPoints, map, rideStatus]);

  return null;
}, (prevProps, nextProps) => {
  // Only re-render if track points count or ride status changes
  return prevProps.trackPoints.length === nextProps.trackPoints.length &&
         prevProps.rideStatus === nextProps.rideStatus;
});

export default RideRoutePolyline;