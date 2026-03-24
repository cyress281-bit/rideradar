import React from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";

function createFeedPostIcon(username, hasMedia) {
  return L.divIcon({
    className: "feed-post-marker",
    html: `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
        <div style="
          width:34px;height:34px;
          border-radius:50%;
          background:linear-gradient(135deg,#7c3aed,#a855f7);
          border:2px solid rgba(168,85,247,0.6);
          box-shadow:0 0 12px rgba(168,85,247,0.6);
          display:flex;align-items:center;justify-content:center;
          font-size:15px;
          z-index:1;
          position:relative;
        ">${hasMedia ? "📸" : "🏍️"}</div>
        <div style="
          position:absolute;
          bottom:-14px;
          left:50%;
          transform:translateX(-50%);
          background:rgba(124,58,237,0.9);
          color:#fff;
          font-size:8px;
          font-weight:700;
          padding:1px 5px;
          border-radius:4px;
          white-space:nowrap;
          max-width:70px;
          overflow:hidden;
          text-overflow:ellipsis;
        ">@${username}</div>
      </div>
    `,
    iconSize: [40, 54],
    iconAnchor: [20, 27],
  });
}

export default function FeedPostPin({ post, rideLocation, onClick }) {
  if (!rideLocation?.lat || !rideLocation?.lng) return null;
  return (
    <Marker
      position={[rideLocation.lat, rideLocation.lng]}
      icon={createFeedPostIcon(post.username, !!post.media_url)}
      eventHandlers={{ click: () => onClick?.(post, rideLocation) }}
      zIndexOffset={500}
    />
  );
}