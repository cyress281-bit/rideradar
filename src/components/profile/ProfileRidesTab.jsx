import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, Bike, ChevronRight, Route } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const STATUS_STYLES = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  meetup: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-secondary text-muted-foreground border-border",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ProfileRidesTab({ rides, user }) {
  if (!rides.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
          <Route className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">No rides yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Your past rides will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      <p className="text-xs text-muted-foreground font-medium">{rides.length} ride{rides.length !== 1 ? "s" : ""}</p>
      {rides.map((ride, i) => (
        <motion.div
          key={ride.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Link
            to={`/rides/${ride.id}`}
            className="block bg-card border border-border/60 rounded-2xl p-4 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[ride.status] || STATUS_STYLES.completed}`}>
                    {ride.status}
                  </span>
                  {ride.vibe && (
                    <span className="text-[10px] text-muted-foreground capitalize">{ride.vibe}</span>
                  )}
                </div>
                <p className="font-bold text-sm leading-tight truncate">{ride.title}</p>
                {ride.meetup_address && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">{ride.meetup_address}</p>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {ride.start_time
                      ? format(new Date(ride.start_time), "MMM d, yyyy · h:mm a")
                      : "—"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            </div>

            {ride.host_email === user?.email && (
              <div className="mt-2 pt-2 border-t border-border/40">
                <span className="text-[10px] text-primary font-semibold">Host</span>
              </div>
            )}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}