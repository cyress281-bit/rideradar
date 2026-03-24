import React, { useEffect, useRef } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";

function createSOSIcon(username) {
  return L.divIcon({
    className: "sos-marker",
    html: `
      <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center">
        <div style="
          position:absolute;
          width:48px;height:48px;
          border-radius:50%;
          background:rgba(239,68,68,0.25);
          animation:pulse-ring 1.2s cubic-bezier(0.215,0.61,0.355,1) infinite;
        "></div>
        <div style="
          position:absolute;
          width:34px;height:34px;
          border-radius:50%;
          background:rgba(239,68,68,0.4);
          animation:pulse-ring 1.2s cubic-bezier(0.215,0.61,0.355,1) 0.4s infinite;
        "></div>
        <div style="
          width:28px;height:28px;
          border-radius:50%;
          background:#ef4444;
          border:2.5px solid #fca5a5;
          box-shadow:0 0 18px rgba(239,68,68,0.9);
          display:flex;align-items:center;justify-content:center;
          font-size:14px;
          z-index:1;
          position:relative;
        ">🚨</div>
        <div style="
          position:absolute;
          bottom:-16px;
          left:50%;
          transform:translateX(-50%);
          background:#ef4444;
          color:#fff;
          font-size:8px;
          font-weight:900;
          padding:1px 5px;
          border-radius:4px;
          white-space:nowrap;
          letter-spacing:0.5px;
        ">BIKER DOWN</div>
      </div>
    `,
    iconSize: [48, 64],
    iconAnchor: [24, 32],
  });
}

export default function SOSPin({ notification, onClick }) {
  if (!notification.meetup_lat || !notification.meetup_lng) return null;

  return (
    <Marker
      position={[notification.meetup_lat, notification.meetup_lng]}
      icon={createSOSIcon(notification.host_username)}
      eventHandlers={{ click: () => onClick?.(notification) }}
      zIndexOffset={2000}
    />
  );
}