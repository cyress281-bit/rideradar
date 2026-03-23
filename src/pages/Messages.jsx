import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import RideChat from "@/components/rides/RideChat";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Rides where user is a participant or host
  const { data: participations = [] } = useQuery({
    queryKey: ["my-participations", user?.email],
    queryFn: () => base44.entities.RideParticipant.filter({ user_email: user.email, status: "approved" }),
    enabled: !!user?.email,
  });

  const { data: hostedRides = [] } = useQuery({
    queryKey: ["my-hosted-rides", user?.email],
    queryFn: () => base44.entities.Ride.filter({ host_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const participatedRideIds = participations.map((p) => p.ride_id);

  const { data: participatedRides = [] } = useQuery({
    queryKey: ["participated-rides", participatedRideIds.join(",")],
    queryFn: async () => {
      if (participatedRideIds.length === 0) return [];
      const results = await Promise.all(
        participatedRideIds.map((id) => base44.entities.Ride.filter({ id }))
      );
      return results.flat();
    },
    enabled: participatedRideIds.length > 0,
  });

  // Merge hosted + participated, dedupe by id
  const allRides = [...hostedRides, ...participatedRides].reduce((acc, r) => {
    if (!acc.find((x) => x.id === r.id)) acc.push(r);
    return acc;
  }, []).filter((r) => r.status !== "cancelled");

  // Latest message per ride for preview
  const { data: latestMessages = [] } = useQuery({
    queryKey: ["latest-messages", allRides.map((r) => r.id).join(",")],
    queryFn: async () => {
      if (allRides.length === 0) return [];
      const results = await Promise.all(
        allRides.map((r) =>
          base44.entities.RideMessage.filter({ ride_id: r.id }, "-created_date", 1)
        )
      );
      return results.flat();
    },
    enabled: allRides.length > 0,
    refetchInterval: 10000,
  });

  const getLatestMessage = (rideId) => latestMessages.find((m) => m.ride_id === rideId);

  const statusDot = (status) => {
    if (status === "active") return <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>;
    if (status === "meetup") return <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />;
    return <span className="w-2 h-2 rounded-full bg-muted-foreground flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight">Messages</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your ride group chats</p>
      </div>

      <AnimatePresence mode="wait">
        {selectedRide ? (
          <motion.div
            key="chat"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-[calc(100vh-140px)]"
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
              <button
                onClick={() => setSelectedRide(null)}
                className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-lg"
              >
                ‹
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {statusDot(selectedRide.status)}
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{selectedRide.title}</p>
                  <p className="text-[10px] text-muted-foreground">@{selectedRide.host_username}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <RideChat
                rideId={selectedRide.id}
                user={user}
                canChat={true}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {allRides.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm font-semibold text-muted-foreground">No ride chats yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Join or host a ride to start chatting</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allRides.map((ride, i) => {
                  const latest = getLatestMessage(ride.id);
                  const isHost = ride.host_email === user?.email;
                  return (
                    <motion.button
                      key={ride.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedRide(ride)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors text-left"
                    >
                      {/* Icon */}
                      <div className="w-11 h-11 rounded-2xl bg-secondary/60 border border-border flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {statusDot(ride.status)}
                          <p className="text-sm font-semibold truncate">{ride.title}</p>
                          {isHost && (
                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">HOST</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {latest
                            ? `@${latest.username}: ${latest.photo_url && !latest.text.includes("📷") ? "📷 Photo" : latest.text}`
                            : "No messages yet"}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="text-right flex-shrink-0">
                        {latest && (
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(latest.created_date), { addSuffix: false })}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1 justify-end text-[10px] text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {ride.rider_count || 1}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}