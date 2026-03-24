import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Clock, MapPin, UserPlus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";

const vibeColors = {
  chill: "bg-blue-500/15 text-blue-400 border-blue-500/20 border",
  fast: "bg-red-500/15 text-red-400 border-red-500/20 border",
  night_ride: "bg-purple-500/15 text-purple-400 border-purple-500/20 border",
  scenic: "bg-green-500/15 text-green-400 border-green-500/20 border",
  adventure: "bg-amber-500/15 text-amber-400 border-amber-500/20 border",
  commute: "bg-gray-500/15 text-gray-400 border-gray-500/20 border",
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
  const queryClient = useQueryClient();
  const [joined, setJoined] = useState(false);
  const joining = false; // kept for button disabled logic; optimistic handles UI
  const [isHost, setIsHost] = useState(false);
  const [countdown, setCountdown] = useState("");

  const startTime = new Date(ride.start_time);
  const accentClass = vibeAccent[ride.vibe] || "text-muted-foreground";
  const emoji = vibeEmoji[ride.vibe] || "🏍️";

  useEffect(() => {
    if (ride.status !== "meetup" && ride.status !== "active") return;
    
    const updateCountdown = () => {
      const now = Date.now();
      const diff = startTime.getTime() - now;
      
      if (diff <= 0) {
        setCountdown("Live");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [ride.status, startTime]);

  useEffect(() => {
    if (!user) return;
    setIsHost(ride.host_email === user.email);
    base44.entities.RideParticipant.filter({ ride_id: ride.id, user_email: user.email })
      .then((p) => { if (p.length > 0) setJoined(true); })
      .catch(() => {});
  }, [user, ride.id, ride.host_email]);

  const joinMutation = useMutation({
    mutationFn: async () => {
      const username = user.username || user.email?.split("@")[0] || "rider";
      await base44.entities.RideParticipant.create({
        ride_id: ride.id, user_email: user.email, username, status: "approved", role: "rider",
      });
      await base44.entities.Ride.update(ride.id, { rider_count: (ride.rider_count || 1) + 1 });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["rides-home"] });
      const prev = queryClient.getQueryData(["rides-home"]);
      queryClient.setQueryData(["rides-home"], (old = []) =>
        old.map((r) => r.id === ride.id ? { ...r, rider_count: (r.rider_count || 1) + 1 } : r)
      );
      setJoined(true);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(["rides-home"], ctx.prev);
      setJoined(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["rides-home"] });
      queryClient.invalidateQueries({ queryKey: ["rides-grid"] });
      queryClient.invalidateQueries({ queryKey: ["ride-participants", ride.id] });
    },
  });

  const handleJoin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || joining || joined || isHost) return;
    joinMutation.mutate();
  };

  return (
    <Link to={`/ride/${ride.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="rounded-2xl border border-border/60 bg-card overflow-hidden active:bg-secondary/30 transition-colors cursor-pointer"
      >
      {/* Always show details */}
      <div className="px-3 py-3 space-y-2.5">
        {/* Title + Host */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {ride.status === "active" ? (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              ) : (
                <span className="text-sm flex-shrink-0">{emoji}</span>
              )}
              <h3 className="font-bold text-sm truncate">{ride.title}</h3>
            </div>
            <p className={`text-[10px] font-medium ${accentClass}`}>@{ride.host_username}</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
            <Users className="w-3 h-3" />
            {ride.rider_count || 1}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className={`font-semibold ${
            ride.status === "active" ? "text-primary" : "text-foreground"
          }`}>{ride.status === "active" ? "Live" : countdown || "—"}</span>
          <span>·</span>
          <span>{ride.duration_minutes}m</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ride.rider_count || 1}{ride.max_riders ? `/${ride.max_riders}` : ""}</span>
        </div>

        {/* Tags */}
        {(ride.vibe || ride.bike_class) && (
          <div className="flex gap-1.5 flex-wrap">
            {ride.vibe && (
              <span className={`text-[9px] font-semibold px-2 py-1 rounded-full ${vibeColors[ride.vibe] || "bg-secondary text-muted-foreground"}`}>
                {ride.vibe.replace("_", " ")}
              </span>
            )}
            {ride.bike_class && ride.bike_class !== "any" && (
              <span className="text-[9px] font-semibold px-2 py-1 rounded-full bg-secondary/60 text-muted-foreground">
                {ride.bike_class}
              </span>
            )}
          </div>
        )}

        {/* Status message */}
        {ride.status_message && (
          <p className="text-[10px] text-primary/80 italic px-2 py-1 bg-primary/10 rounded-lg">"{ride.status_message}"</p>
        )}

        {/* Join button */}
        {user && !isHost && ride.status !== "completed" && ride.status !== "cancelled" && new Date(ride.start_time) > new Date() && (
          <button
            onClick={handleJoin}
            disabled={joining || joined}
            className={`w-full text-[11px] font-bold px-3 py-2 rounded-lg border transition-all ${
              joined
                ? "bg-green-500/15 text-green-400 border-green-500/20"
                : "bg-primary/15 text-primary border-primary/20 hover:bg-primary/25"
            }`}
          >
            {joined ? (
              <>
                <Check className="w-3 h-3 inline mr-1" /> Joined
              </>
            ) : joining ? (
              "Joining..."
            ) : (
              <>
                <UserPlus className="w-3 h-3 inline mr-1" /> Quick Join
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
    </Link>
  );
}