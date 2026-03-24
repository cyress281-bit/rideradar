import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useGeolocation from "@/hooks/useGeolocation";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { AnimatePresence, motion } from "framer-motion";
import { Radio, Layers, RefreshCw } from "lucide-react";
import MeetupPin from "@/components/map/MeetupPin";
import FeedPostPin from "@/components/map/FeedPostPin";
import ActiveRiderDot from "@/components/map/ActiveRiderDot";
import ActiveRidePin from "@/components/map/ActiveRidePin";
import RideInfoPanel from "@/components/map/RideInfoPanel";
import RideRoutePolyline from "@/components/map/RideRoutePolyline";
import HostLocationPin from "@/components/map/HostLocationPin";
import SOSPin from "@/components/map/SOSPin";

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
  const lastTrackPointTime = useRef({});
  const TRACK_INTERVAL_MS = 15000;

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

  const { position: geoPosition, error: geoError } = useGeolocation({
    onPosition: handlePositionUpdate,
    enabled: true,
  });

  // Fetch active SOS notifications (biker down)
  const { data: sosAlerts = [] } = useQuery({
    queryKey: ["sos-alerts-grid"],
    queryFn: async () => {
      const all = await base44.entities.RideNotification.filter({ ride_id: "sos" }, "-created_date", 20);
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return all.filter((n) => new Date(n.created_date).getTime() > cutoff);
    },
    refetchInterval: 15000,
  });

  const [selectedSOS, setSelectedSOS] = useState(null);
  const [selectedFeedPost, setSelectedFeedPost] = useState(null);

  // Fetch recent ride feed posts (last 48h that have a ride_id)
  const { data: rideFeedPosts = [] } = useQuery({
    queryKey: ["ride-feed-posts-map"],
    queryFn: async () => {
      const posts = await base44.entities.FeedPost.filter({ post_type: "ride" }, "-created_date", 30);
      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      return posts.filter((p) => p.ride_id && new Date(p.created_date).getTime() > cutoff);
    },
    refetchInterval: 30000,
  });

  // Build a map of ride_id -> ride for quick lookup
  const ridesById = Object.fromEntries(rides.map((r) => [r.id, r]));

  const activeRides = rides.filter((r) => r.status === "active");
  const meetupRides = rides.filter((r) => r.status === "meetup");

  return (
    <div className="h-screen relative overflow-hidden">
      <MapContainer
        center={[34.05, -118.25]}
        zoom={11}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url={document.documentElement.classList.contains('light') ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"} />
        <MapAutoCenter rides={rides} />

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

        {/* Host live location pins — visible for ALL rides (helps late-comers) */}
        {rides.map((ride) => (
          <HostLocationPin
            key={`host-${ride.id}`}
            ride={ride}
            riderLocations={riderLocations}
          />
        ))}

        {/* Active ride: show live rider dots */}
        {showOtherRiders && activeRides.map((ride) =>
          riderLocations
            .filter((l) => l.ride_id === ride.id && l.is_active && l.user_email !== ride.host_email)
            .map((loc) => (
              <ActiveRiderDot
                key={loc.id}
                location={loc}
                isCurrentUser={loc.user_email === user?.email}
              />
            ))
        )}

        {/* Feed post ride pins */}
        {rideFeedPosts.map((post) => {
          const ride = ridesById[post.ride_id];
          if (!ride) return null;
          return (
            <FeedPostPin
              key={`feedpost-${post.id}`}
              post={post}
              rideLocation={{ lat: ride.meetup_lat, lng: ride.meetup_lng }}
              onClick={(p, loc) => setSelectedFeedPost({ post: p, ride })}
            />
          );
        })}

        {/* B-DOWN / SOS pins — always on top */}
        {sosAlerts.map((alert) => (
          <SOSPin
            key={alert.id}
            notification={alert}
            onClick={setSelectedSOS}
          />
        ))}
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
            {sosAlerts.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-red-400 font-bold">B-DOWN</span>
              </div>
            )}
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
              >
                {showOtherRiders ? "👁️ Tracking" : "👁️ Hidden"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GPS error */}
      {geoError && (
        <div className="absolute bottom-24 right-4 z-[1000] bg-destructive/90 backdrop-blur-xl rounded-xl px-2.5 py-1.5 border border-destructive/50 max-w-[200px]">
          <p className="text-[10px] text-destructive-foreground">{geoError}</p>
        </div>
      )}

      {/* GPS indicator */}
      {geoPosition && !geoError && (
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

      {/* Feed post popup */}
      <AnimatePresence>
        {selectedFeedPost && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute bottom-20 left-3 right-3 z-[1000] bg-card/97 backdrop-blur-2xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden"
          >
            <div className="h-1 w-full bg-gradient-to-r from-purple-600 to-violet-400" />
            <div className="p-4">
              <button
                onClick={() => setSelectedFeedPost(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <span className="text-xs text-muted-foreground font-bold">✕</span>
              </button>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm">🏍️</div>
                <div>
                  <p className="text-sm font-bold">@{selectedFeedPost.post.username}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedFeedPost.ride.title}</p>
                </div>
              </div>
              {selectedFeedPost.post.content && (
                <p className="text-sm text-foreground/90 mb-3 leading-snug">{selectedFeedPost.post.content}</p>
              )}
              {selectedFeedPost.post.media_url && (
                <div className="rounded-xl overflow-hidden h-32 mb-3">
                  <img src={selectedFeedPost.post.media_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground mb-3">
                <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
                  <span className="block font-semibold text-foreground">{selectedFeedPost.ride.status.toUpperCase()}</span>
                  Ride Status
                </div>
                <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
                  <span className="block font-semibold text-foreground">{selectedFeedPost.ride.rider_count || 1}</span>
                  Riders
                </div>
              </div>
              {selectedFeedPost.ride.status !== "completed" && selectedFeedPost.ride.status !== "cancelled" && (
                <button
                  onClick={async () => {
                    if (!user) return;
                    const username = user.username || user.email?.split("@")[0] || "rider";
                    await base44.entities.RideParticipant.create({
                      ride_id: selectedFeedPost.ride.id,
                      user_email: user.email,
                      username,
                      status: "approved",
                      role: "rider",
                    });
                    setSelectedFeedPost(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 font-bold text-sm hover:bg-purple-600/30 transition-colors"
                >
                  🏍️ Join This Ride
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS detail popup */}
      <AnimatePresence>
        {selectedSOS && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute bottom-20 left-3 right-3 z-[1000] bg-red-950/97 backdrop-blur-2xl rounded-2xl border border-red-500/50 shadow-2xl overflow-hidden"
          >
            <div className="h-1 w-full bg-gradient-to-r from-red-500 to-orange-400" />
            <div className="p-4">
              <button
                onClick={() => setSelectedSOS(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-red-900/60 flex items-center justify-center hover:bg-red-900 transition-colors"
              >
                <span className="text-xs text-red-200 font-bold">✕</span>
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🚨</span>
                <h3 className="font-black text-red-400 text-base">BIKER DOWN</h3>
              </div>
              <p className="text-xs text-red-300/80 mb-3">@{selectedSOS.host_username} has triggered an emergency alert</p>
              {selectedSOS.meetup_lat && selectedSOS.meetup_lng && (
                <a
                  href={`https://maps.google.com/?q=${selectedSOS.meetup_lat},${selectedSOS.meetup_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-colors"
                >
                  📍 Open Location in Maps
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}