import React, { memo } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";

function createRiderIcon(username, isCurrentUser) {
  const bg = isCurrentUser ? "#00f032" : "#ffffff";
  const text = isCurrentUser ? "#000" : "#111";
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position:relative">
        <div style="background:${bg};color:${text};border-radius:999px;padding:3px 8px;font-size:11px;font-weight:800;border:2px solid ${isCurrentUser ? "#005a14" : "#333"};box-shadow:0 0 10px ${isCurrentUser ? "rgba(0,240,50,0.7)" : "rgba(255,255,255,0.3)"};white-space:nowrap">
          ${isCurrentUser ? "● " : ""}@${username}
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${bg};margin:0 auto;width:10px"></div>
      </div>`,
    iconSize: [null, null],
    iconAnchor: [30, 28],
  });
}

const ActiveRiderDot = memo(function ActiveRiderDot({ location, isCurrentUser }) {
  if (!location.lat || !location.lng) return null;
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={createRiderIcon(location.username, isCurrentUser)}
    />
  );
});

export default ActiveRiderDot;