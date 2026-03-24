import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, MapPin, Clock, Bike, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import RideChat from "@/components/rides/RideChat";
import RideDetailMap from "@/components/rides/RideDetailMap";
import HostControls from "@/components/rides/HostControls";

const vibeColors = {
  chill: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  fast: "bg-red-500/15 text-red-400 border-red-500/20",
  night_ride: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  scenic: "bg-green-500/15 text-green-400 border-green-500/20",
  adventure: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  commute: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

export default function RideDetail() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [showRiders, setShowRiders] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: ride } = useQuery({
    queryKey: ["ride-detail", rideId],
    queryFn: () => base44.entities.Ride.filter({ id: rideId }),
    enabled: !!rideId,
    select: (data) => data?.[0],
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["ride-participants", rideId],
    queryFn: () => base44.entities.RideParticipant.filter({ ride_id: rideId, status: "approved" }),
    enabled: !!rideId,
  });

  useEffect(() => {
    if (!user || !ride) return;
    setIsHost(ride.host_email === user.email);
    setJoined(participants.some((p) => p.user_email === user.email));
  }, [user, ride, participants]);

  const handleJoin = async () => {
    if (!user || joining || joined || isHost) return;
    setJoining(true);
    const username = user.username || user.email?.split("@")[0] || "rider";
    await base44.entities.RideParticipant.create({
      ride_id: rideId,
      user_email: user.email,
      username,
      status: "approved",
      role: "rider",
    });
    await base44.entities.Ride.update(rideId, { rider_count: (ride.rider_count || 1) + 1 });
    setJoined(true);
    setJoining(false);
  };

  if (!ride) {
    return (
      <div className="min-h-screen pb-28">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <BackButton />
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold truncate">{ride.title}</h1>
          <p className="text-xs text-muted-foreground">@{ride.host_username}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Status + Tags */}
        <div className="space-y-2">
          {ride.status === "active" && (
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/15 px-3 py-2 rounded-lg border border-green-500/20">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Active Ride in Progress
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {ride.vibe && (
              <Badge className={`${vibeColors[ride.vibe] || ""}`}>
                {ride.vibe.replace("_", " ")}
              </Badge>
            )}
            {ride.bike_class && ride.bike_class !== "any" && (
              <Badge variant="outline">
                <Bike className="w-3 h-3 mr-1" />
                {ride.bike_class}
              </Badge>
            )}
            {ride.duration_minutes && (
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {ride.duration_minutes}m
              </Badge>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowRiders(true)}
            className="bg-secondary/50 rounded-xl p-3 hover:bg-secondary/70 transition-colors text-left"
          >
            <p className="text-xs text-muted-foreground mb-1">Riders</p>
            <p className="text-lg font-bold">{participants.length}</p>
          </button>
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Duration</p>
            <p className="text-lg font-bold">{ride.duration_minutes}m</p>
          </div>
        </div>

        {/* Map */}
        {ride.meetup_lat && ride.meetup_lng && (
          <RideDetailMap ride={ride} />
        )}

        {/* Location */}
        {ride.meetup_address && (
          <div className="bg-secondary/30 rounded-xl p-3 flex gap-2">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Meetup Point</p>
              <p className="text-sm font-medium">{ride.meetup_address}</p>
            </div>
          </div>
        )}

        {/* Status message */}
        {ride.status_message && (
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Host Message</p>
            <p className="text-sm italic text-primary/80">"{ride.status_message}"</p>
          </div>
        )}



        {/* Join Button */}
        {user && !isHost && ride.status !== "completed" && ride.status !== "cancelled" && new Date(ride.start_time) > new Date() && (
          <button
            onClick={handleJoin}
            disabled={joining || joined}
            className={`w-full text-sm font-bold px-4 py-3 rounded-lg border transition-all ${
              joined
                ? "bg-green-500/15 text-green-400 border-green-500/20"
                : "bg-primary/15 text-primary border-primary/20 hover:bg-primary/25"
            }`}
          >
            {joined ? "✓ You're Joined" : joining ? "Joining..." : "Join Ride"}
          </button>
        )}

        {isHost && (
          <div className="space-y-2">
            <div className="w-full text-sm font-bold px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-center">
              👑 You're the Host
            </div>
            <HostControls ride={ride} rideId={rideId} />
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="px-4 py-4">
        <RideChat 
          rideId={rideId} 
          user={user} 
          canChat={joined || isHost} 
          isHost={isHost}
          rideStatus={ride.status}
        />
      </div>

      {/* Riders Modal */}
      <AnimatePresence>
        {showRiders && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRiders(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border max-h-[70vh] overflow-y-auto"
            >
              <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm">
                <h2 className="font-bold">Riders ({participants.length})</h2>
                <button
                  onClick={() => setShowRiders(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-border">
                {participants.map((participant) => (
                  <Link
                    key={participant.id}
                    to={`/profile?email=${encodeURIComponent(participant.user_email)}`}
                    onClick={() => setShowRiders(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{participant.username[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{participant.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{participant.user_email}</p>
                    </div>
                    {participant.role === "host" && (
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">HOST</span>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}