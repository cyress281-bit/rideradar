import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function RideMessagesList({ messages, userEmail }) {
  // Group messages by ride
  const rideIds = Array.from(new Set(messages.map(m => m.ride_id)));

  const { data: rides = [] } = useQuery({
    queryKey: ["ride-message-details", rideIds.join(",")],
    queryFn: async () => {
      if (rideIds.length === 0) return [];
      const results = await Promise.all(
        rideIds.map(id => base44.entities.Ride.filter({ id }))
      );
      return results.flat();
    },
    enabled: rideIds.length > 0,
  });

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No ride messages yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rideIds.map((rideId) => {
        const rideMessages = messages.filter(m => m.ride_id === rideId);
        const ride = rides.find(r => r.id === rideId);
        const lastMessage = rideMessages[rideMessages.length - 1];

        return (
          <motion.div
            key={rideId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              to={`/rides/${rideId}`}
              className="block p-3 rounded-xl bg-secondary/40 border border-border/50 hover:bg-secondary/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{ride?.title || "Ride"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{lastMessage.username}: {lastMessage.text}
                  </p>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {rideMessages.map(msg => {
                      const tagStyles = {
                        chat: "bg-blue-500/15 text-blue-400",
                        hazard: "bg-red-500/15 text-red-400",
                        route: "bg-green-500/15 text-green-400",
                        meetup: "bg-amber-500/15 text-amber-400",
                      };
                      return (
                        <span
                          key={msg.id}
                          className={`text-[9px] px-1.5 py-0.5 rounded-md ${tagStyles[msg.tag] || tagStyles.chat}`}
                        >
                          {msg.tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {rideMessages.length}
                </span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}