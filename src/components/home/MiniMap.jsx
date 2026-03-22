import React from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Expand } from "lucide-react";
import L from "leaflet";
import { mapTileLayerProps } from "@/lib/mapTileConfig";

const meetupIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:28px;height:28px;background:#3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #1e3a5f;box-shadow:0 0 12px rgba(59,130,246,0.5)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const activeIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:28px;height:28px;background:#f97316;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #7c2d12;box-shadow:0 0 12px rgba(249,115,22,0.5);animation:pulse 2s infinite">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4v8l4-4z"/></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function MiniMap({ rides }) {
  const center = [34.05, -118.25]; // Default to LA area

  const markers = rides.slice(0, 10).map((ride) => ({
    position: [ride.meetup_lat, ride.meetup_lng],
    ride,
    icon: ride.status === "active" ? activeIcon : meetupIcon,
  }));

  return (
    <div className="px-5 py-2">
      <div className="relative rounded-2xl overflow-hidden border border-border h-[40vh]">
        <MapContainer
          center={center}
          zoom={10}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
        >
          <TileLayer {...mapTileLayerProps} />
          {markers.map((m, i) => (
            <Marker key={i} position={m.position} icon={m.icon}>
              <Popup className="dark-popup">
                <span className="text-xs font-medium">{m.ride.title}</span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <Link
          to="/grid"
          className="absolute top-3 right-3 z-[1000] bg-card/90 backdrop-blur-sm p-2 rounded-lg border border-border hover:bg-card transition-colors"
        >
          <Expand className="w-4 h-4 text-foreground" />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent z-[999] pointer-events-none" />
      </div>
    </div>
  );
}