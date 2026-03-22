import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Check, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function EventRSVPCard({ event, user, myStatus, onStatusChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formatIcon = {
    stationary: "📍",
    route: "🛣️",
  };

  const handleRSVP = async (status) => {
    if (!user) return;

    const username = user.username || user.email?.split("@")[0] || "rider";
    const existing = await base44.entities.RideParticipant.filter({
      ride_id: event.id,
      user_email: user.email,
    });

    if (existing.length > 0) {
      await base44.entities.RideParticipant.update(existing[0].id, { status });
    } else {
      await base44.entities.RideParticipant.create({
        ride_id: event.id,
        user_email: user.email,
        username,
        status,
        role: "rider",
      });
    }

    toast({
      title: status === "approved" ? "RSVP confirmed!" : "RSVP cancelled",
    });

    queryClient.invalidateQueries({ queryKey: ["my-participations"] });
    onStatusChange?.(status);
  };

  const statusColors = {
    approved: "bg-green-500/15 text-green-400 border-green-500/30",
    requested: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    declined: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/60 border border-border/50 rounded-xl p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-bold text-sm">{event.title}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {formatIcon[event.event_format] || "📅"} {event.location_name}
          </p>
        </div>
        {myStatus && (
          <Badge className={`text-[9px] ${statusColors[myStatus]} border`}>
            {myStatus === "approved"
              ? "Going"
              : myStatus === "requested"
              ? "Pending"
              : "Declined"}
          </Badge>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          {format(new Date(event.start_time), "MMM d, h:mm a")}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          {event.rider_count} rider{event.rider_count !== 1 ? "s" : ""}
        </div>
        {event.meetup_address && (
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <MapPin className="w-3.5 h-3.5" />
            {event.meetup_address}
          </div>
        )}
      </div>

      {/* RSVP Actions */}
      {!myStatus ? (
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => handleRSVP("approved")}
            className="flex-1 h-8 bg-green-600/20 text-green-400 hover:bg-green-600/30 text-xs font-semibold border border-green-500/30"
            variant="outline"
          >
            <Check className="w-3 h-3 mr-1" /> Going
          </Button>
          <Button
            onClick={() => handleRSVP("declined")}
            className="flex-1 h-8 bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs font-semibold border border-red-500/30"
            variant="outline"
          >
            <X className="w-3 h-3 mr-1" /> Can't Go
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => handleRSVP("declined")}
          variant="ghost"
          className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          Change RSVP
        </Button>
      )}
    </motion.div>
  );
}