import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { AnimatePresence, motion } from "framer-motion";
import { Radio } from "lucide-react";
import MeetupPin from "@/components/map/MeetupPin";
import ActiveRiderDot from "@/components/map/ActiveRiderDot";
import ActiveRidePin from "@/components/map/ActiveRidePin";
import RideInfoPanel from "@/components/map/RideInfoPanel";
import RideRoutePolyline from "@/components/map/RideRoutePolyline";
import MarkerClusterGroup from "@/components/map/MarkerClusterGroup";

const CHECK_IN_RADIUS_METERS = 300;
const LOCATION_UPDATE_INTERVAL = 8000;

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Recenter map when rides load
function MapAutoCenter({ rides }) {
  const map = useMap();
  const centered = useRef(false);
  useEffect(() => {
    if (!centered.current && rides.length > 0) {
      map.setView([rides[0].meetup_lat, rides[0].meetup_lng], 12, { animate: true });
      centered.current = true;
    }
  }, [rides, map]);
  return null;
}

export default function LiveGrid() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [myPosition, setMyPosition] = useState(null);
  const [checkedInRides, setCheckedInRides] = useState(new Set());
  const [showOtherRiders, setShowOtherRiders] = useState(true);
  const locationRecordIds = useRef({}); // ride_id -> riderLocation record id
  const watchIdRef = useRef(null);
  const lastTrackPointTime = useRef({}); // ride_id -> timestamp of last recorded track point
  const TRACK_INTERVAL_MS = 15000; // record a track point every 15 seconds

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch active/meetup rides
  const { data: rides = [], refetch: refetchRides } = useQuery({
    queryKey: ["rides-grid"],
    queryFn: () => base44.entities.Ride.filter({ status: { $in: ["meetup", "active"] } }, "-created_date", 100),
    refetchInterval: 15000,
  });

  // Fetch all participants for rides
  const rideIds = rides.map((r) => r.id);
  const { data: allParticipants = [] } = useQuery({
    queryKey: ["grid-participants", rideIds.join(",")],
    queryFn: async () => {
      if (rideIds.length === 0) return [];
      const results = await Promise.all(
        rideIds.map((id) => base44.entities.RideParticipant.filter({ ride_id: id }))
      );
      return results.flat();
    },
    enabled: rideIds.length > 0,
    refetchInterval: 10000,
  });

  // Fetch track points for active rides
  const activeRideIds = rides.filter((r) => r.status === "active").map((r) => r.id);
  const { data: trackPoints = [] } = useQuery({
    queryKey: ["track-points", activeRideIds.join(",")],
    queryFn: async () => {
      if (activeRideIds.length === 0) return [];
      const results = await Promise.all(
        activeRideIds.map((id) => base44.entities.RideTrackPoint.filter({ ride_id: id }, "created_date", 500))
      );
      return results.flat();
    },
    enabled: activeRideIds.length > 0,
    refetchInterval: 10000,
  });

  // Fetch all rider locations for active/meetup rides
  const { data: riderLocations = [] } = useQuery({
    queryKey: ["rider-locations", rideIds.join(",")],
    queryFn: async () => {
      if (rideIds.length === 0) return [];
      const results = await Promise.all(
        rideIds.map((id) => base44.entities.RiderLocation.filter({ ride_id: id, is_active: true }))
      );
      return results.flat();
    },
    enabled: rideIds.length > 0,
    refetchInterval: 5000,
  });

  // Real-time subscription to RiderLocation changes
  useEffect(() => {
    const unsub = base44.entities.RiderLocation.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["rider-locations"] });
    });
    return unsub;
  }, [queryClient]);

  // Real-time subscription to track points
  useEffect(() => {
    const unsub = base44.entities.RideTrackPoint.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["track-points"] });
    });
    return unsub;
  }, [queryClient]);

  // Real-time subscription to Ride changes
  useEffect(() => {
    const unsub = base44.entities.Ride.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["rides-grid"] });
    });
    return unsub;
  }, [queryClient]);

  // Update or create location record for user in a ride
  const upsertLocation = useCallback(async (ride, lat, lng, checkedIn) => {
    if (!user) return;
    const username = user.username || user.email?.split("@")[0] || "rider";
    const existingId = locationRecordIds.current[ride.id];
    if (existingId) {
      await base44.entities.RiderLocation.update(existingId, { lat, lng, checked_in: checkedIn, is_active: true });
    } else {
      // Check if record already exists in DB
      const existing = await base44.entities.RiderLocation.filter({ ride_id: ride.id, user_email: user.email });
      if (existing.length > 0) {
        locationRecordIds.current[ride.id] = existing[0].id;
        await base44.entities.RiderLocation.update(existing[0].id, { lat, lng, checked_in: checkedIn, is_active: true });
      } else {
        const created = await base44.entities.RiderLocation.create({
          ride_id: ride.id, user_email: user.email, username, lat, lng, checked_in: checkedIn, is_active: true,
        });
        locationRecordIds.current[ride.id] = created.id;
      }
    }
  }, [user]);

  // Auto check-in: if within radius of meetup, mark checked in
  const handlePositionUpdate = useCallback(async (lat, lng) => {
    setMyPosition({ lat, lng });
    if (!user) return;

    // Only act on rides user is approved for
    const myApprovedRideIds = allParticipants
      .filter((p) => p.user_email === user.email && p.status === "approved")
      .map((p) => p.ride_id);

    for (const ride of rides) {
      if (!myApprovedRideIds.includes(ride.id)) continue;

      if (ride.status === "meetup") {
        const dist = getDistance(lat, lng, ride.meetup_lat, ride.meetup_lng);
        const alreadyCheckedIn = checkedInRides.has(ride.id);
        if (dist <= CHECK_IN_RADIUS_METERS && !alreadyCheckedIn) {
          setCheckedInRides((prev) => new Set([...prev, ride.id]));
          await upsertLocation(ride, lat, lng, true);
          // Update ride rider_count
          const checkedInCount = riderLocations.filter((l) => l.ride_id === ride.id && l.checked_in).length + 1;
          await base44.entities.Ride.update(ride.id, {
            rider_count: checkedInCount,
            status_message: `${checkedInCount} rider${checkedInCount !== 1 ? "s" : ""} at meetup`,
          });
          queryClient.invalidateQueries({ queryKey: ["rides-grid"] });
          queryClient.invalidateQueries({ queryKey: ["rider-locations"] });
        } else if (alreadyCheckedIn) {
          await upsertLocation(ride, lat, lng, true);
        }
      } else if (ride.status === "active") {
        // Update position for live tracking
        await upsertLocation(ride, lat, lng, true);
        // Record track point every TRACK_INTERVAL_MS
        const now = Date.now();
        const lastTime = lastTrackPointTime.current[ride.id] || 0;
        if (now - lastTime >= TRACK_INTERVAL_MS) {
          lastTrackPointTime.current[ride.id] = now;
          await base44.entities.RideTrackPoint.create({
            ride_id: ride.id,
            user_email: user.email,
            lat,
            lng,
            recorded_at: new Date().toISOString(),
          });
          queryClient.invalidateQueries({ queryKey: ["track-points"] });
        }
      }
    }
  }, [user, rides, allParticipants, checkedInRides, riderLocations, upsertLocation, queryClient]);

  // Start GPS watch
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handlePositionUpdate(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [handlePositionUpdate]);

  const activeRides = rides.filter((r) => r.status === "active");
  const meetupRides = rides.filter((r) => r.status === "meetup");

  // Prepare clusterable markers (meetup + active rides)
  const clusterMarkers = useMemo(() => {
    return [
      ...meetupRides.map((ride) => ({
        position: [ride.meetup_lat, ride.meetup_lng],
        id: `meetup-${ride.id}`,
        type: "meetup",
        rideId: ride.id,
        icon: null, // Will be rendered by component
      })),
      ...activeRides.map((ride) => ({
        position: [ride.meetup_lat, ride.meetup_lng],
        id: `active-${ride.id}`,
        type: "active",
        rideId: ride.id,
        icon: null,
      })),
    ];
  }, [meetupRides, activeRides]);

  return (
    <div className="h-[calc(100vh-80px)] relative overflow-hidden">
      <MapContainer
        center={[34.05, -118.25]}
        zoom={11}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <MapAutoCenter rides={rides} />
        <MarkerClusterGroup markers={clusterMarkers} />

        {/* Meetup pins */}
        {meetupRides.map((ride) => (
          <MeetupPin
            key={ride.id}
            ride={ride}
            participants={allParticipants.filter((p) => p.ride_id === ride.id)}
            onClick={() => setSelectedRide(ride)}
          />
        ))}

        {/* Active ride route polylines */}
        {activeRides.map((ride) => (
          <RideRoutePolyline
            key={`route-${ride.id}`}
            trackPoints={trackPoints.filter((tp) => tp.ride_id === ride.id)}
            rideStatus={ride.status}
          />
        ))}

        {/* Active ride pins (tappable) */}
        {activeRides.map((ride) => (
          <ActiveRidePin
            key={`pin-${ride.id}`}
            ride={ride}
            onClick={() => setSelectedRide(ride)}
          />
        ))}

        {/* Active ride: show live rider dots */}
        {showOtherRiders && activeRides.map((ride) =>
          riderLocations
            .filter((l) => l.ride_id === ride.id && l.is_active)
            .map((loc) => (
              <ActiveRiderDot
                key={loc.id}
                location={loc}
                isCurrentUser={loc.user_email === user?.email}
              />
            ))
        )}
      </MapContainer>

      {/* HUD Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between gap-3 pointer-events-none">
        {/* Left: Legend */}
        <div className="bg-card/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-border pointer-events-auto">
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Meetup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-muted-foreground">Starting Soon</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Live</span>
            </div>
          </div>
        </div>

        {/* Right: Stats & Toggle */}
        <div className="flex flex-col gap-1.5 items-end pointer-events-auto">
          <div className="bg-card/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-border flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs font-semibold text-foreground">{rides.length} on radar</span>
          </div>
          {activeRides.length > 0 && (
            <div className="flex gap-2">
              <div className="bg-primary/10 backdrop-blur-xl rounded-xl px-3 py-1.5 border border-primary/30">
                <span className="text-[10px] font-bold text-primary">{activeRides.length} LIVE</span>
              </div>
              <button
                onClick={() => setShowOtherRiders(!showOtherRiders)}
                className={`backdrop-blur-xl rounded-xl px-3 py-1.5 border transition-all text-[10px] font-bold ${
                  showOtherRiders
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-card/90 border-border text-muted-foreground"
                }`}
                aria-label={showOtherRiders ? "Hide other riders" : "Show other riders"}
              >
                {showOtherRiders ? "👁️ Tracking" : "👁️ Hidden"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GPS indicator */}
      {myPosition && (
        <div className="absolute bottom-24 right-4 z-[1000] bg-card/90 backdrop-blur-xl rounded-xl px-2.5 py-1.5 border border-primary/30 flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[10px] font-medium text-primary">Tracking</span>
        </div>
      )}

      {/* Ride info panel */}
      <AnimatePresence>
        {selectedRide && (
          <RideInfoPanel
            key={selectedRide.id}
            ride={selectedRide}
            participants={allParticipants.filter((p) => p.ride_id === selectedRide.id)}
            riderLocations={riderLocations}
            user={user}
            onClose={() => setSelectedRide(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}