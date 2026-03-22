import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { X, MapPin, Users, Clock, ChevronRight, Bike } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const meetupIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:36px;height:36px;background:#3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #1e3a5f;box-shadow:0 0 16px rgba(59,130,246,0.4)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const activeIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:36px;height:36px;background:#f97316;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #7c2d12;box-shadow:0 0 16px rgba(249,115,22,0.5)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1"><circle cx="12" cy="12" r="4"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export default function LiveGrid() {
  const [selectedRide, setSelectedRide] = useState(null);

  const { data: rides = [] } = useQuery({
    queryKey: ["rides-grid"],
    queryFn: () => base44.entities.Ride.filter(
      { status: { $in: ["meetup", "active"] } },
      "-created_date",
      100
    ),
  });

  const center = rides.length > 0
    ? [rides[0].meetup_lat, rides[0].meetup_lng]
    : [34.05, -118.25];

  return (
    <div className="h-screen relative">
      <MapContainer
        center={center}
        zoom={11}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {rides.map((ride) => (
          <Marker
            key={ride.id}
            position={[ride.meetup_lat, ride.meetup_lng]}
            icon={ride.status === "active" ? activeIcon : meetupIcon}
            eventHandlers={{ click: () => setSelectedRide(ride) }}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-[1000] bg-card/90 backdrop-blur-xl rounded-xl p-3 border border-border">
        <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Legend</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-foreground">Meetup Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-foreground">Active Ride</span>
          </div>
        </div>
      </div>

      {/* Ride count badge */}
      <div className="absolute top-4 right-4 z-[1000] bg-card/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-border">
        <span className="text-xs font-semibold text-foreground">{rides.length} on radar</span>
      </div>

      {/* Selected ride panel */}
      <AnimatePresence>
        {selectedRide && (
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            className="absolute bottom-20 left-4 right-4 z-[1000] bg-card/95 backdrop-blur-xl rounded-2xl p-5 border border-border shadow-2xl"
          >
            <button
              onClick={() => setSelectedRide(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              {selectedRide.status === "active" && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
              <h3 className="font-bold text-base">{selectedRide.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">@{selectedRide.host_username}</p>

            <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDistanceToNow(new Date(selectedRide.start_time), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {selectedRide.rider_count || 1} rider{(selectedRide.rider_count || 1) !== 1 ? "s" : ""}
              </span>
            </div>

            <Link to={`/rides/${selectedRide.id}`}>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                View Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}