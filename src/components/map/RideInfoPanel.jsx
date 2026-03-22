import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Clock, Users, Bike, MapPin, CheckCircle, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";

const vibeColors = {
  chill: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  fast: "bg-red-500/15 text-red-400 border-red-500/20",
  night_ride: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  scenic: "bg-green-500/15 text-green-400 border-green-500/20",
  adventure: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  commute: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

export default function RideInfoPanel({ ride, participants, riderLocations, onClose }) {
  const approved = participants.filter((p) => p.status === "approved");
  const checkedIn = riderLocations.filter((l) => l.checked_in && l.ride_id === ride.id);
  const startTime = new Date(ride.start_time);
  const minsUntil = Math.round((startTime - Date.now()) / 60000);

  return (
    <motion.div
      initial={{ y: 320, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="absolute bottom-20 left-3 right-3 z-[1000] bg-card/97 backdrop-blur-2xl rounded-2xl border border-border shadow-2xl overflow-hidden"
    >
      {/* Top accent line */}
      <div className={`h-1 w-full ${ride.status === "active" ? "bg-primary" : "bg-blue-500"}`} />

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
        <p className="text-xs text-muted-foreground mb-3">by @{ride.host_username}</p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-primary">{checkedIn.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Checked In</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold">{approved.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Approved</p>
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
              <Clock className="w-3 h-3 mr-1" />{ride.duration_minutes}m ride
            </Badge>
          )}
        </div>

        {/* Checked-in riders */}
        {checkedIn.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-primary" /> At Meetup
            </p>
            <div className="flex flex-wrap gap-1.5">
              {checkedIn.map((l) => (
                <span key={l.id} className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-medium">
                  @{l.username}
                </span>
              ))}
            </div>
          </div>
        )}

        {ride.status_message && (
          <p className="text-xs text-primary/80 italic mb-3">"{ride.status_message}"</p>
        )}

        {ride.requirements && (
          <p className="text-[11px] text-muted-foreground mb-3">
            <span className="font-semibold text-foreground/60">Req: </span>{ride.requirements}
          </p>
        )}

        <Link to={`/rides/${ride.id}`}>
          <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl">
            <Navigation className="w-4 h-4 mr-1.5" />
            {ride.status === "active" ? "Join Live Ride" : "View & Join Ride"}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}