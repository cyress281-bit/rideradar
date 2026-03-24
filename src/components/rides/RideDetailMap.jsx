import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import RideRoutePolyline from "@/components/map/RideRoutePolyline";

const meetupIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:36px;height:36px;background:#3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #1e3a5f;box-shadow:0 0 16px rgba(59,130,246,0.6)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function createHostIcon(username) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="background:#00f032;color:#000;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:900;border:2px solid #005a14;box-shadow:0 0 14px rgba(0,240,50,0.8);white-space:nowrap">
        👑 @${username}
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #00f032;margin-top:-1px"></div>
    </div>`,
    iconSize: [null, null],
    iconAnchor: [30, 26],
  });
}

function FitBounds({ meetupLat, meetupLng, hostLat, hostLng }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current) return;
    const points = [[meetupLat, meetupLng]];
    if (hostLat && hostLng) points.push([hostLat, hostLng]);
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: false });
    } else {
      map.fitBounds(points, { padding: [40, 40], animate: false });
    }
    fitted.current = true;
  }, [meetupLat, meetupLng, hostLat, hostLng]);
  return null;
}

export default function RideDetailMap({ ride }) {
  const { data: riderLocations = [] } = useQuery({
    queryKey: ["detail-rider-locs", ride.id],
    queryFn: () => base44.entities.RiderLocation.filter({ ride_id: ride.id, is_active: true }),
    refetchInterval: 5000,
  });

  const { data: trackPoints = [] } = useQuery({
    queryKey: ["detail-track-pts", ride.id],
    queryFn: () => base44.entities.RideTrackPoint.filter({ ride_id: ride.id }, "created_date", 500),
    enabled: ride.status === "active",
    refetchInterval: 10000,
  });

  const hostLoc = riderLocations.find(l => l.user_email === ride.host_email);

  return (
    <div className="rounded-2xl overflow-hidden border border-border h-52 relative">
      <MapContainer
        center={[ride.meetup_lat, ride.meetup_lng]}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <FitBounds
          meetupLat={ride.meetup_lat}
          meetupLng={ride.meetup_lng}
          hostLat={hostLoc?.lat}
          hostLng={hostLoc?.lng}
        />

        {/* Meetup pin */}
        <Marker position={[ride.meetup_lat, ride.meetup_lng]} icon={meetupIcon} />

        {/* Route polyline (active rides) */}
        {ride.status === "active" && (
          <RideRoutePolyline trackPoints={trackPoints} rideStatus={ride.status} />
        )}

        {/* Host live location */}
        {hostLoc?.lat && hostLoc?.lng && (
          <Marker
            position={[hostLoc.lat, hostLoc.lng]}
            icon={createHostIcon(ride.host_username)}
          />
        )}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] flex gap-2 pointer-events-none">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 border border-border flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
          <span className="text-[9px] text-muted-foreground font-medium">Meetup</span>
        </div>
        {hostLoc?.lat && (
          <div className="bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 border border-border flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
            <span className="text-[9px] text-primary font-medium">Host Live</span>
          </div>
        )}
      </div>
    </div>
  );
}