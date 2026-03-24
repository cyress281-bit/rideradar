import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Route, Calendar, MapPin, Camera } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function RideHistory({ userEmail }) {
  const { data: rideParticipants = [] } = useQuery({
    queryKey: ["user-rides", userEmail],
    queryFn: () => base44.entities.RideParticipant.filter({ user_email: userEmail }, "-created_date", 50),
    enabled: !!userEmail,
  });

  const { data: rides = [] } = useQuery({
    queryKey: ["ride-details", rideParticipants.map((p) => p.ride_id).join(",")],
    queryFn: async () => {
      if (rideParticipants.length === 0) return [];
      const rideIds = [...new Set(rideParticipants.map((p) => p.ride_id))];
      const results = await Promise.all(
        rideIds.map((id) => base44.entities.Ride.filter({ id }))
      );
      return results.flat();
    },
    enabled: rideParticipants.length > 0,
  });

  const { data: ridePosts = [] } = useQuery({
    queryKey: ["ride-feed-posts", userEmail],
    queryFn: () => base44.entities.FeedPost.filter({ user_email: userEmail, post_type: "ride" }, "-created_date", 20),
    enabled: !!userEmail,
  });

  const visibleRides = rides.filter(r => r.status !== "cancelled");
  const totalMiles = rides.reduce((sum, r) => sum + (r.estimated_miles || 0), 0);

  // Merge ride records + feed posts into a unified timeline
  const rideItems = [
    ...visibleRides.map(r => ({ type: "ride", date: new Date(r.created_date), data: r })),
    ...ridePosts.map(p => ({ type: "post", date: new Date(p.created_date), data: p })),
  ].sort((a, b) => b.date - a.date);

  if (rideParticipants.length === 0) {
    return (
      <div className="text-center py-6">
        <Route className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No rides yet. Start riding!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 rounded-lg p-2.5 text-center border border-primary/20"
        >
          <p className="text-base font-bold text-primary">{rideParticipants.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Total Rides</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-green-500/10 rounded-lg p-2.5 text-center border border-green-500/20"
        >
          <p className="text-base font-bold text-green-400">{totalMiles}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Total Miles</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-500/10 rounded-lg p-2.5 text-center border border-blue-500/20"
        >
          <p className="text-base font-bold text-blue-400">{(totalMiles / rideParticipants.length).toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Avg Miles</p>
        </motion.div>
      </div>

      {/* Unified timeline */}
      <div className="space-y-2">
        {rideItems.slice(0, 10).map((item, idx) => (
          <motion.div
            key={item.data.id + item.type}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-secondary/40 rounded-lg p-3 border border-border/50"
          >
            {item.type === "ride" ? (
              <>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium leading-snug flex-1">{item.data.title}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    item.data.status === "completed" ? "bg-green-500/15 text-green-400" :
                    item.data.status === "active" ? "bg-primary/15 text-primary" :
                    "bg-muted/15 text-muted-foreground"
                  }`}>{item.data.status}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(item.date, { addSuffix: true })}
                  </div>
                  {item.data.estimated_miles && (
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.data.estimated_miles} mi</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    <Route className="w-2.5 h-2.5" /> Ride Post
                  </span>
                  {item.data.media_url && <Camera className="w-3 h-3 text-muted-foreground" />}
                </div>
                <p className="text-sm text-foreground leading-snug mb-1.5">{item.data.content}</p>
                {item.data.media_url && (
                  <div className="rounded-lg overflow-hidden h-28 mt-1.5">
                    <img src={item.data.media_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{formatDistanceToNow(item.date, { addSuffix: true })}
                </p>
              </>
            )}
          </motion.div>
        ))}
        {rideItems.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No ride activity yet.</p>
        )}
      </div>
    </div>
  );
}