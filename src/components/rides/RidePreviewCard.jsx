import React, { useState, useEffect } from "react";

import { Users, Clock, MapPin, UserPlus, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";

const vibeColors = {
  chill: "border-blue-500/30",
  fast: "border-red-500/30",
  night_ride: "border-purple-500/30",
  scenic: "border-green-500/30",
  adventure: "border-amber-500/30",
  commute: "border-gray-500/30",
};

const vibeAccent = {
  chill: "text-blue-400",
  fast: "text-red-400",
  night_ride: "text-purple-400",
  scenic: "text-green-400",
  adventure: "text-amber-400",
  commute: "text-gray-400",
};

const vibeEmoji = {
  chill: "😌",
  fast: "⚡",
  night_ride: "🌙",
  scenic: "🏔️",
  adventure: "🧭",
  commute: "🛣️",
};

export default function RidePreviewCard({ ride, index = 0, user }) {
  const [expanded, setExpanded] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const startTime = new Date(ride.start_time);
  const timeLabel = formatDistanceToNow(startTime, { addSuffix: true });
  const borderClass = vibeColors[ride.vibe] || "border-border/50";
  const accentClass = vibeAccent[ride.vibe] || "text-muted-foreground";
  const emoji = vibeEmoji[ride.vibe] || "🏍️";

  useEffect(() => {
    if (!user) return;
    setIsHost(ride.host_email === user.email);
    base44.entities.RideParticipant.filter({ ride_id: ride.id, user_email: user.email })
      .then((p) => { if (p.length > 0) setJoined(true); })
      .catch(() => {});
  }, [user, ride.id, ride.host_email]);

  const handleJoin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border bg-secondary/40 ${borderClass} overflow-hidden`}
    >
      {/* Collapsed row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        {/* Live dot or vibe emoji */}
        {ride.status === "active" ? (
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        ) : (
          <span className="text-sm flex-shrink-0">{emoji}</span>
        )}

        {/* Title */}
        <span className="font-semibold text-xs truncate flex-1">{ride.title}</span>

        {/* Rider count */}
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
          <Users className="w-3 h-3" />
          {ride.rider_count || 1}
        </span>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2.5 border-t border-border/40 pt-2.5">
              {/* Host + time */}
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-medium ${accentClass}`}>@{ride.host_username}</span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {timeLabel}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {ride.rider_count || 1}{ride.max_riders ? `/${ride.max_riders}` : ""} riders
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ride.duration_minutes} min
                </span>
                {ride.status === "meetup" && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Meetup phase
                  </span>
                )}
              </div>

              {/* Status message */}
              {ride.status_message && (
                <p className="text-[10px] text-primary/80 italic">"{ride.status_message}"</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-0.5">

                {user && !isHost && ride.status !== "completed" && ride.status !== "cancelled" && (
                  <button
                    onClick={handleJoin}
                    disabled={joining || joined}
                    className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      joined
                        ? "bg-green-500/15 text-green-400 border-green-500/20"
                        : "bg-primary/15 text-primary border-primary/20 hover:bg-primary/25"
                    }`}
                  >
                    {joined ? <><Check className="w-3 h-3" /> Joined</> : joining ? "..." : <><UserPlus className="w-3 h-3" /> Join</>}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}