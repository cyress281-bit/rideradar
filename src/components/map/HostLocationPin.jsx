import React from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";

function createHostIcon(username) {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center">
        <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(0,240,50,0.25);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
        <div style="background:#00f032;color:#000;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:900;border:2px solid #005a14;box-shadow:0 0 16px rgba(0,240,50,0.8);white-space:nowrap;display:flex;align-items:center;gap:4px;position:relative">
          <span style="font-size:10px">👑</span>
          @${username}
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #00f032;margin-top:-1px"></div>
      </div>`,
    iconSize: [null, null],
    iconAnchor: [35, 30],
  });
}

export default function HostLocationPin({ ride, riderLocations }) {
  const hostLocation = riderLocations.find(
    (l) => l.ride_id === ride.id && l.user_email === ride.host_email && l.is_active
  );

  if (!hostLocation?.lat || !hostLocation?.lng) return null;

  return (
    <Marker
      position={[hostLocation.lat, hostLocation.lng]}
      icon={createHostIcon(ride.host_username)}
    />
  );
}