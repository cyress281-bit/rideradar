import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useMutationWithOptimism } from "@/hooks/useMutationWithOptimism";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Check, X, CreditCard } from "lucide-react";
import { createEventCheckout } from "@/functions/createEventCheckout";
import { format } from "date-fns";

export default function EventRSVPCard({ event, user, myStatus, onStatusChange }) {
  const queryClient = useQueryClient();
  const [optimisticStatus, setOptimisticStatus] = React.useState(myStatus);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const hasFee = event.registration_fee && event.registration_fee > 0;

  const handlePaidRSVP = async () => {
    if (window.self !== window.top) {
      alert("Payment checkout only works from the published app, not inside the editor preview.");
      return;
    }
    setCheckoutLoading(true);
    const res = await createEventCheckout({
      eventId: event.id,
      eventTitle: event.title,
      registrationFee: event.registration_fee,
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    });
    setCheckoutLoading(false);
    if (res.data?.url) {
      window.location.href = res.data.url;
    }
  };

  const formatIcon = {
    stationary: "📍",
    route: "🛣️",
  };

  const rsvpMutation = useMutationWithOptimism(
    async (newStatus) => {
      const username = user.username || user.email?.split("@")[0] || "rider";
      const existing = await base44.entities.RideParticipant.filter({
        ride_id: event.id,
        user_email: user.email,
      });

      if (existing.length > 0) {
        await base44.entities.RideParticipant.update(existing[0].id, { status: newStatus });
      } else {
        await base44.entities.RideParticipant.create({
          ride_id: event.id,
          user_email: user.email,
          username,
          status: newStatus,
          role: "rider",
        });
      }
    },
    {
      onMutate: (newStatus) => {
        setOptimisticStatus(newStatus);
      },
      onError: () => {
        setOptimisticStatus(myStatus);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["my-participations"] });
        onStatusChange?.(optimisticStatus);
      },
      successMessage: optimisticStatus === "approved" ? "RSVP confirmed!" : "RSVP cancelled",
    }
  );

  const handleRSVP = (status) => {
    if (!user) return;
    rsvpMutation.mutate(status);
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
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          {format(new Date(event.start_time), "MMM d, h:mm a")}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          {event.rider_count} rider{event.rider_count !== 1 ? "s" : ""}
        </div>
        {event.meetup_address && (
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            {event.meetup_address}
          </div>
        )}
      </div>

      {/* RSVP Actions */}
      {!optimisticStatus ? (
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => handleRSVP("approved")}
            disabled={rsvpMutation.isPending}
            className="flex-1 h-8 bg-green-600/20 text-green-400 hover:bg-green-600/30 text-xs font-semibold border border-green-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            variant="outline"
          >
            <Check className="w-3 h-3 mr-1" aria-hidden="true" /> Going
          </Button>
          <Button
            onClick={() => handleRSVP("declined")}
            disabled={rsvpMutation.isPending}
            className="flex-1 h-8 bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs font-semibold border border-red-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            variant="outline"
          >
            <X className="w-3 h-3 mr-1" aria-hidden="true" /> Can't Go
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => handleRSVP("declined")}
          variant="ghost"
          className="w-full h-8 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Change RSVP
        </Button>
      )}
    </motion.div>
  );
}