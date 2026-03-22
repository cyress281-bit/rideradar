import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, Clock, Bike, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { format, formatDistanceToNow, isPast } from "date-fns";

const vibeLabels = {
  chill: "Chill",
  fast: "Fast",
  night_ride: "Night Ride",
  scenic: "Scenic",
  adventure: "Adventure",
  commute: "Commute",
};

const vibeColors = {
  chill: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  fast: "bg-red-500/15 text-red-400 border-red-500/20",
  night_ride: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  scenic: "bg-green-500/15 text-green-400 border-green-500/20",
  adventure: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  commute: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

export default function RideCard({ ride, index = 0 }) {
  const startTime = new Date(ride.start_time);
  const isStarted = isPast(startTime);
  const timeLabel = isStarted
    ? `Started ${formatDistanceToNow(startTime, { addSuffix: true })}`
    : formatDistanceToNow(startTime, { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/rides/${ride.id}`}
        className="block bg-secondary/40 hover:bg-secondary/60 rounded-2xl p-4 transition-all border border-border/50"
      >
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {ride.status === "active" && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
              <h3 className="font-semibold text-sm truncate">{ride.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground">@{ride.host_username}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {timeLabel}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {ride.rider_count || 1}{ride.max_riders ? `/${ride.max_riders}` : ""}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {ride.duration_minutes}m
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {ride.vibe && (
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${vibeColors[ride.vibe] || ""}`}>
              {vibeLabels[ride.vibe] || ride.vibe}
            </Badge>
          )}
          {ride.bike_class && ride.bike_class !== "any" && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-secondary/60 text-muted-foreground border-border">
              <Bike className="w-3 h-3 mr-1" />
              {ride.bike_class}
            </Badge>
          )}
          {ride.status === "meetup" && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border-blue-500/20">
              <MapPin className="w-3 h-3 mr-1" />
              Meetup
            </Badge>
          )}
          {ride.status === "active" && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-400 border-green-500/20">
              Riding Now
            </Badge>
          )}
        </div>

        {ride.status_message && (
          <p className="mt-2.5 text-xs text-primary/80 italic">"{ride.status_message}"</p>
        )}
      </Link>
    </motion.div>
  );
}