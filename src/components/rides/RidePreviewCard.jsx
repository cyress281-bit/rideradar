import React from "react";
import { Link } from "react-router-dom";
import { Users, Clock, Zap, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow, isPast } from "date-fns";

const vibeColors = {
  chill: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
  fast: "from-red-500/20 to-red-500/5 border-red-500/20",
  night_ride: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
  scenic: "from-green-500/20 to-green-500/5 border-green-500/20",
  adventure: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
  commute: "from-gray-500/20 to-gray-500/5 border-gray-500/20",
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

export default function RidePreviewCard({ ride, index = 0 }) {
  const startTime = new Date(ride.start_time);
  const isStarted = isPast(startTime);
  const timeLabel = isStarted
    ? formatDistanceToNow(startTime, { addSuffix: true })
    : formatDistanceToNow(startTime, { addSuffix: true });

  const gradientClass = vibeColors[ride.vibe] || "from-secondary/60 to-secondary/20 border-border/50";
  const accentClass = vibeAccent[ride.vibe] || "text-muted-foreground";
  const emoji = vibeEmoji[ride.vibe] || "🏍️";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/rides/${ride.id}`}
        className={`block rounded-2xl border bg-gradient-to-br ${gradientClass} p-3 hover:brightness-110 transition-all active:scale-[0.98]`}
      >
        {/* Top row: live indicator + title */}
        <div className="flex items-start gap-2 mb-2">
          {ride.status === "active" ? (
            <span className="relative flex h-2 w-2 mt-1.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          ) : (
            <span className="text-base leading-none mt-0.5">{emoji}</span>
          )}
          <h3 className="font-bold text-sm leading-snug line-clamp-2 flex-1">{ride.title}</h3>
        </div>

        {/* Host */}
        <p className={`text-[11px] font-medium mb-2.5 ${accentClass}`}>@{ride.host_username}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeLabel}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {ride.rider_count || 1}{ride.max_riders ? `/${ride.max_riders}` : ""}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />
            {ride.duration_minutes}m
          </span>
        </div>

        {/* Status message */}
        {ride.status_message && (
          <p className="mt-2 text-[10px] text-primary/80 italic truncate">"{ride.status_message}"</p>
        )}

        {/* Status pill */}
        <div className="mt-2.5 flex">
          {ride.status === "active" ? (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
              Riding Now
            </span>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" /> Meetup
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}