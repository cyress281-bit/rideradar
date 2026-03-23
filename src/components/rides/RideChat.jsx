import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, AlertTriangle, Navigation, MapPin, MessageSquare, ImagePlus, Loader, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";

const TAG_OPTIONS = [
  { value: "chat", label: "Chat", icon: MessageSquare, color: "text-muted-foreground", bg: "bg-secondary" },
  { value: "hazard", label: "Hazard", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  { value: "route", label: "Route", icon: Navigation, color: "text-amber-400", bg: "bg-amber-500/10" },
  { value: "meetup", label: "Meetup", icon: MapPin, color: "text-blue-400", bg: "bg-blue-500/10" },
];

function TagBadge({ tag }) {
  const t = TAG_OPTIONS.find((o) => o.value === tag) || TAG_OPTIONS[0];
  const Icon = t.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${t.bg} ${t.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {t.label}
    </span>
  );
}

export default function RideChat({ rideId, user, canChat, isHost, rideStatus }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [tag, setTag] = useState("chat");
  const [sending, setSending] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const bottomRef = useRef(null);
  const photoInputRef = useRef(null);
  const watchIdRef = useRef(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["ride-chat", rideId],
    queryFn: () => base44.entities.RideMessage.filter({ ride_id: rideId }, "created_date", 100),
    enabled: !!rideId,
    refetchInterval: 8000,
  });

  // Fetch host location
  const { data: hostLocation } = useQuery({
    queryKey: ["host-location", rideId],
    queryFn: () => base44.entities.RiderLocation.filter({ ride_id: rideId, is_active: true }, "-created_date", 1),
    enabled: !!rideId && rideStatus === "active",
    refetchInterval: 5000,
  });

  // Auto-stop location sharing when ride ends
  useEffect(() => {
    if (rideStatus !== "active" && sharingLocation) {
      setSharingLocation(false);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    }
  }, [rideStatus, sharingLocation]);

  // Start/stop GPS tracking for host
  useEffect(() => {
    if (!isHost || !sharingLocation || rideStatus !== "active" || !navigator.geolocation) return;

    const updateLocation = async (lat, lng) => {
      const username = user.username || user.email?.split("@")[0] || "host";
      const existing = await base44.entities.RiderLocation.filter({ ride_id: rideId, user_email: user.email });
      if (existing.length > 0) {
        await base44.entities.RiderLocation.update(existing[0].id, { lat, lng });
      } else {
        await base44.entities.RiderLocation.create({
          ride_id: rideId,
          user_email: user.email,
          username,
          lat,
          lng,
          is_active: true,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["host-location", rideId] });
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isHost, sharingLocation, rideId, user, rideStatus, queryClient]);

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.RideMessage.subscribe((event) => {
      if (event.data?.ride_id === rideId) {
        queryClient.invalidateQueries({ queryKey: ["ride-chat", rideId] });
      }
    });
    return unsub;
  }, [rideId, queryClient]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = async (overrides = {}) => {
    const msgText = overrides.text ?? text.trim();
    if (!msgText && !overrides.photo_url) return;
    if (!user || sending) return;
    setSending(true);
    const username = user.username || user.email?.split("@")[0] || "rider";
    await base44.entities.RideMessage.create({
      ride_id: rideId,
      user_email: user.email,
      username,
      text: msgText,
      tag: overrides.tag ?? tag,
      photo_url: overrides.photo_url ?? undefined,
    });
    if (!overrides.photo_url) setText("");
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["ride-chat", rideId] });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await sendMessage({ text: "📷 Photo", photo_url: file_url, tag: "chat" });
    setUploadingPhoto(false);
    e.target.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-secondary/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Ride Chat</h3>
        {isHost && rideStatus === "active" && (
          <button
            onClick={() => setSharingLocation(!sharingLocation)}
            className={`ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full transition-colors ${
              sharingLocation
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-secondary text-muted-foreground border border-border hover:bg-secondary/80"
            }`}
          >
            <Zap className="w-3 h-3" />
            {sharingLocation ? "Live" : "Share GPS"}
          </button>
        )}
        {!isHost && hostLocation?.length > 0 && rideStatus === "active" && (
          <div className="ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            <MapPin className="w-3 h-3 animate-pulse" />
            Host nearby
          </div>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">{messages.length} messages</span>
      </div>

      {/* Host Location Display */}
      {hostLocation?.length > 0 && rideStatus === "active" && !isHost && (
        <div className="px-3 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <p className="text-[10px] text-primary font-medium">Host is sharing live location</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex flex-col gap-2.5 p-3 h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center py-8">
            <div>
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No messages yet. Say something!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_email === user?.email;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <span className="text-[10px] text-muted-foreground mb-0.5 ml-1">@{msg.username}</span>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-secondary text-foreground rounded-tl-sm"
                }`}>
                  {msg.tag && msg.tag !== "chat" && (
                    <div className="mb-1">
                      <TagBadge tag={msg.tag} />
                    </div>
                  )}
                  <p className="text-sm leading-snug">{msg.text}</p>
                  {msg.photo_url && (
                    <a href={msg.photo_url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
                      <img src={msg.photo_url} alt="photo" className="rounded-xl max-w-full max-h-48 object-cover" />
                    </a>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground mt-0.5 mx-1">
                  {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canChat ? (
        <div className="border-t border-border p-3 space-y-2">
          {/* Tag selector */}
          <div className="flex gap-1.5">
            {TAG_OPTIONS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => setTag(t.value)}
                  className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full transition-all border ${
                    tag === t.value
                      ? `${t.bg} ${t.color} border-current/30`
                      : "bg-transparent text-muted-foreground border-border hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors"
            >
              {uploadingPhoto ? <Loader className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <ImagePlus className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                tag === "hazard" ? "Report a hazard..." :
                tag === "route" ? "Route change..." :
                tag === "meetup" ? "Meetup update..." :
                "Say something..."
              }
              className="bg-secondary border-border flex-1 text-sm h-9"
              maxLength={280}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!text.trim() || sending}
              size="icon"
              className="h-9 w-9 bg-primary hover:bg-primary/90 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Join the ride to participate in chat</p>
        </div>
      )}
    </div>
  );
}