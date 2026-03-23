import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Clock, Users, Bike, MapPin, UserPlus, Check, MessageSquare, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow } from "date-fns";
import RideChat from "@/components/rides/RideChat";

const vibeColors = {
  chill: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  fast: "bg-red-500/15 text-red-400 border-red-500/20",
  night_ride: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  scenic: "bg-green-500/15 text-green-400 border-green-500/20",
  adventure: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  commute: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

export default function RideInfoPanel({ ride, participants, riderLocations, user, onClose }) {
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const approved = participants.filter((p) => p.status === "approved");
  const checkedIn = riderLocations.filter((l) => l.checked_in && l.ride_id === ride.id);
  const startTime = new Date(ride.start_time);
  const minsUntil = Math.round((startTime - Date.now()) / 60000);
  const timeLabel = formatDistanceToNow(startTime, { addSuffix: true });

  useEffect(() => {
    if (!user) return;
    setIsHost(ride.host_email === user.email);
    base44.entities.RideParticipant.filter({ ride_id: ride.id, user_email: user.email })
      .then((p) => { if (p.length > 0) setJoined(true); })
      .catch(() => {});
  }, [user, ride.id, ride.host_email]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!user || joining || joined || isHost) return;
    setJoining(true);
    const username = user.username || user.email?.split("@")[0] || "rider";
    await base44.entities.RideParticipant.create({
      ride_id: ride.id,
      user_email: user.email,
      username,
      status: "approved",
      role: "rider",
    });
    await base44.entities.Ride.update(ride.id, { rider_count: (ride.rider_count || 1) + 1 });
    setJoined(true);
    setJoining(false);
  };

  return (
    <motion.div
      initial={{ y: 320, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="absolute bottom-20 left-3 right-3 z-[1000] bg-card/97 backdrop-blur-2xl rounded-2xl border border-border shadow-2xl overflow-hidden"
    >
      {/* Top accent */}
      <div className={`h-1 w-full ${ride.status === "active" ? "bg-primary" : "bg-blue-500"}`} />

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "info" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"
          }`}
        >
          <Info className="w-3.5 h-3.5" /> Info
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "chat" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Chat
        </button>
      </div>

      {activeTab === "chat" ? (
        <div className="p-3">
          <RideChat rideId={ride.id} user={user} canChat={joined || isHost} />
        </div>
      ) : (
      <div className="p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Status + Title */}
        <div className="flex items-center gap-2 mb-0.5 pr-8">
          {ride.status === "active" ? (
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
          ) : (
            <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          )}
          <h3 className="font-bold text-base leading-tight">{ride.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">by @{ride.host_username} · {timeLabel}</p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-primary">{checkedIn.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">At Meetup</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold">{approved.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Riders</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
            <p className={`text-base font-bold ${minsUntil <= 10 && ride.status === "meetup" ? "text-amber-400" : ""}`}>
              {ride.status === "active" ? "LIVE" : minsUntil > 0 ? `${minsUntil}m` : "NOW"}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
              {ride.status === "active" ? "Status" : "Until Start"}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {ride.vibe && (
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${vibeColors[ride.vibe] || ""}`}>
              {ride.vibe.replace("_", " ")}
            </Badge>
          )}
          {ride.bike_class && ride.bike_class !== "any" && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-secondary/60 text-muted-foreground border-border">
              <Bike className="w-3 h-3 mr-1" />{ride.bike_class}
            </Badge>
          )}
          {ride.duration_minutes && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-secondary/60 text-muted-foreground border-border">
              <Clock className="w-3 h-3 mr-1" />{ride.duration_minutes}m
            </Badge>
          )}
        </div>

        {ride.status_message && (
          <p className="text-xs text-primary/80 italic mb-3">"{ride.status_message}"</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {user && !isHost && ride.status !== "completed" && ride.status !== "cancelled" && (
            <button
              onClick={handleJoin}
              disabled={joining || joined}
              className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl border transition-all flex-1 justify-center ${
                joined
                  ? "bg-green-500/15 text-green-400 border-green-500/20"
                  : "bg-primary/15 text-primary border-primary/20 hover:bg-primary/25"
              }`}
            >
              {joined ? (
                <><Check className="w-4 h-4" /> You're In!</>
              ) : joining ? (
                "Joining..."
              ) : (
                <><UserPlus className="w-4 h-4" /> Quick Join</>
              )}
            </button>
          )}
          {isHost && (
            <div className="flex-1 text-center py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
              👑 You're the Host
            </div>
          )}
        </div>
      </div>
  );
}