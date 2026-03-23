import React from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";

function createActiveIcon(riderCount) {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position:relative;width:48px;height:48px">
        <div style="position:absolute;inset:0;border-radius:50%;background:#00f032;opacity:0.15;animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite;transform:scale(1.5)"></div>
        <div style="width:48px;height:48px;background:linear-gradient(135deg,#00f032,#00a822);border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #003d0d;box-shadow:0 0 22px rgba(0,240,50,0.55);position:relative">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4v8l4-4z"/></svg>
          ${riderCount > 0 ? `<div style="position:absolute;top:-6px;right:-6px;background:#fff;color:#000;border-radius:999px;font-size:9px;font-weight:800;padding:1px 5px;border:2px solid #000;min-width:16px;text-align:center">${riderCount}</div>` : ""}
        </div>
      </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

export default function ActiveRidePin({ ride, onClick }) {
  return (
    <Marker
      position={[ride.meetup_lat, ride.meetup_lng]}
      icon={createActiveIcon(ride.rider_count || 1)}
      eventHandlers={{ click: onClick }}
    />
  );
}