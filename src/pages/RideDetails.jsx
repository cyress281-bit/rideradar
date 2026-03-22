import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, MapPin, Clock, Users, Bike, Shield,
  CheckCircle, XCircle, Play, Square, MessageSquare
} from "lucide-react";
import RideChat from "@/components/rides/RideChat";
import { useToast } from "@/components/ui/use-toast";
import { format, formatDistanceToNow, isPast, addMinutes } from "date-fns";
import { motion } from "framer-motion";

const markerIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:36px;height:36px;background:#f97316;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #7c2d12;box-shadow:0 0 16px rgba(249,115,22,0.5)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const vibeLabels = {
  chill: "Chill", fast: "Fast", night_ride: "Night Ride",
  scenic: "Scenic", adventure: "Adventure", commute: "Commute",
};

export default function RideDetails() {
  const rideId = new URLSearchParams(window.location.search).get("id") ||
    window.location.pathname.split("/rides/")[1];
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: ride, isLoading } = useQuery({
    queryKey: ["ride", rideId],
    queryFn: async () => {
      const rides = await base44.entities.Ride.filter({ id: rideId });
      return rides[0];
    },
    enabled: !!rideId,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["participants", rideId],
    queryFn: () => base44.entities.RideParticipant.filter({ ride_id: rideId }),
    enabled: !!rideId,
  });

  const isHost = user?.email && ride?.host_email === user.email;
  const myParticipation = participants.find((p) => p.user_email === user?.email);
  const approvedRiders = participants.filter((p) => p.status === "approved");
  const pendingRequests = participants.filter((p) => p.status === "requested");

  const joinMutation = useMutation({
    mutationFn: async () => {
      const username = user?.username || user?.email?.split("@")[0] || "rider";
      await base44.entities.RideParticipant.create({
        ride_id: rideId,
        user_email: user.email,
        username,
        status: "approved",
        role: "rider",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants", rideId] });
      toast({ title: "You joined the ride!" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (participantId) => {
      await base44.entities.RideParticipant.update(participantId, { status: "approved" });
      await base44.entities.Ride.update(rideId, { rider_count: (ride.rider_count || 1) + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants", rideId] });
      queryClient.invalidateQueries({ queryKey: ["ride", rideId] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (participantId) =>
      base44.entities.RideParticipant.update(participantId, { status: "declined" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["participants", rideId] }),
  });

  const updateStatus = async (newStatus) => {
    await base44.entities.Ride.update(rideId, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ["ride", rideId] });
    toast({ title: `Ride ${newStatus === "active" ? "started" : newStatus}!` });
  };

  const updateStatusMessage = async () => {
    if (!statusMsg.trim()) return;
    await base44.entities.Ride.update(rideId, { status_message: statusMsg });
    queryClient.invalidateQueries({ queryKey: ["ride", rideId] });
    setStatusMsg("");
    toast({ title: "Status updated!" });
  };

  if (isLoading || !ride) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const startTime = new Date(ride.start_time);
  const endTime = addMinutes(startTime, ride.duration_minutes);
  const isExpired = isPast(endTime) && ride.status !== "completed" && ride.status !== "cancelled";

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-border">
        <button 
          onClick={() => navigate(-1)} 
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold truncate">{ride.title}</h1>
      </div>

      {/* Map */}
      <div className="px-5 mb-4">
        <div className="rounded-2xl overflow-hidden border border-border h-44">
          <MapContainer
            center={[ride.meetup_lat, ride.meetup_lng]}
            zoom={14}
            className="h-full w-full"
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[ride.meetup_lat, ride.meetup_lng]} icon={markerIcon} />
          </MapContainer>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-3 flex items-center gap-3 ${
            ride.status === "active" ? "bg-green-500/10 border border-green-500/20" :
            ride.status === "meetup" ? "bg-blue-500/10 border border-blue-500/20" :
            "bg-secondary border border-border"
          }`}
        >
          {ride.status === "active" && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
          )}
          <span className="text-sm font-medium capitalize">
            {ride.status === "meetup" ? "Forming — Meetup Phase" :
             ride.status === "active" ? "Ride in Progress" :
             ride.status}
          </span>
        </motion.div>

        {/* Status message */}
        {ride.status_message && (
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
            <p className="text-sm text-primary italic">"{ride.status_message}"</p>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/40 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider font-medium">Start</span>
            </div>
            <p className="text-sm font-semibold">{format(startTime, "MMM d, h:mm a")}</p>
            <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(startTime, { addSuffix: true })}</p>
          </div>
          <div className="bg-secondary/40 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider font-medium">Duration</span>
            </div>
            <p className="text-sm font-semibold">{ride.duration_minutes} min</p>
            <p className="text-[10px] text-muted-foreground">Ends {format(endTime, "h:mm a")}</p>
          </div>
          <div className="bg-secondary/40 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider font-medium">Riders</span>
            </div>
            <p className="text-sm font-semibold">{approvedRiders.length}{ride.max_riders ? ` / ${ride.max_riders}` : ""}</p>
          </div>
          <div className="bg-secondary/40 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider font-medium">Host</span>
            </div>
            <p className="text-sm font-semibold">@{ride.host_username}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {ride.vibe && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {vibeLabels[ride.vibe] || ride.vibe}
            </Badge>
          )}
          {ride.bike_class && ride.bike_class !== "any" && (
            <Badge variant="outline" className="bg-secondary text-foreground border-border">
              <Bike className="w-3 h-3 mr-1" />
              {ride.bike_class}
            </Badge>
          )}
        </div>

        {ride.requirements && (
          <div className="bg-secondary/30 rounded-xl p-3 border border-border/50">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1">Requirements</p>
            <p className="text-sm">{ride.requirements}</p>
          </div>
        )}

        {ride.meetup_address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{ride.meetup_address}</span>
          </div>
        )}

        {/* Riders list */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Riders</h3>
          <div className="space-y-2">
            {approvedRiders.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-secondary/30 rounded-xl p-3 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{p.username[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium">@{p.username}</span>
                  {p.role === "host" && (
                    <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">Host</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending requests (host only) */}
        {isHost && pendingRequests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Join Requests</h3>
            <div className="space-y-2">
              {pendingRequests.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-secondary/30 rounded-xl p-3 border border-border/50">
                  <span className="text-sm font-medium">@{p.username}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-[44px] min-w-[44px] p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      onClick={() => approveMutation.mutate(p.id)}
                      aria-label="Approve rider"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-[44px] min-w-[44px] p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => declineMutation.mutate(p.id)}
                      aria-label="Decline rider"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Host controls */}
        {isHost && (
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <Input
                placeholder="Update status..."
                value={statusMsg}
                onChange={(e) => setStatusMsg(e.target.value)}
                className="bg-secondary border-border flex-1"
              />
              <Button 
                onClick={updateStatusMessage} 
                size="sm" 
                variant="secondary" 
                className="min-h-[44px] min-w-[44px]"
                aria-label="Send status message"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              {ride.status === "meetup" && (
                <Button
                  onClick={() => updateStatus("active")}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  <Play className="w-4 h-4 mr-1.5" /> Start Ride
                </Button>
              )}
              {(ride.status === "meetup" || ride.status === "active") && (
                <Button
                  onClick={() => updateStatus("completed")}
                  variant="secondary"
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-1.5" /> End Ride
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Join button (non-host) */}
        {!isHost && !myParticipation && ride.status !== "completed" && ride.status !== "cancelled" && (
          <Button
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
          >
            {joinMutation.isPending ? "Joining..." : "Join Ride"}
          </Button>
        )}

        {!isHost && myParticipation && (
          <div className="text-center py-3">
            <Badge variant="outline" className={
              myParticipation.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
              myParticipation.status === "requested" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
              "bg-red-500/10 text-red-400 border-red-500/20"
            }>
              {myParticipation.status === "approved" ? "You're in!" :
               myParticipation.status === "requested" ? "Pending" :
               "Request Declined"}
            </Badge>
          </div>
        )}

        {/* Ride Chat */}
        <RideChat
          rideId={rideId}
          user={user}
          canChat={isHost || myParticipation?.status === "approved"}
        />
      </div>
    </div>
  );
}