import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutationWithOptimism } from "@/hooks/useMutationWithOptimism";
import { Send, AlertTriangle, Navigation, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LiveRegion from "@/components/accessibility/LiveRegion";
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

export default function RideChat({ rideId, user, canChat }) {
   const queryClient = useQueryClient();
   const [text, setText] = useState("");
   const [tag, setTag] = useState("chat");
   const [liveMessage, setLiveMessage] = useState("");
   const bottomRef = useRef(null);
   const lastAnnouncedMessageIdRef = useRef(null);
   const hasLoadedMessagesRef = useRef(false);

  const { data: messages = [] } = useQuery({
    queryKey: ["ride-chat", rideId],
    queryFn: () => base44.entities.RideMessage.filter({ ride_id: rideId }, "created_date", 100),
    enabled: !!rideId,
    staleTime: 30_000,
  });

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

  // Announce newly added chat messages without re-reading the full thread.
  useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];

    if (!hasLoadedMessagesRef.current) {
      hasLoadedMessagesRef.current = true;
      lastAnnouncedMessageIdRef.current = latestMessage.id;
      return;
    }

    if (latestMessage.id === lastAnnouncedMessageIdRef.current) return;

    lastAnnouncedMessageIdRef.current = latestMessage.id;
    const messagePrefix = latestMessage.user_email === user?.email ? "Message sent" : `New ${latestMessage.tag === "chat" ? "chat" : latestMessage.tag} message from ${latestMessage.username}`;
    setLiveMessage(`${messagePrefix}. ${latestMessage.text.slice(0, 120)}`);
  }, [messages, user?.email]);

  const messageMutation = useMutationWithOptimism(
    async (messageData) => {
      const username = user.username || user.email?.split("@")[0] || "rider";
      await base44.entities.RideMessage.create({
        ride_id: rideId,
        user_email: user.email,
        username,
        text: messageData.text,
        tag: messageData.tag,
      });
    },
    {
      onMutate: async (messageData) => {
        await queryClient.cancelQueries({ queryKey: ["ride-chat", rideId] });
        const previousData = queryClient.getQueryData(["ride-chat", rideId]);
        const optimisticMessage = {
          id: `optimistic-${Date.now()}`,
          ride_id: rideId,
          user_email: user.email,
          username: user.username || user.email?.split("@")[0] || "rider",
          text: messageData.text,
          tag: messageData.tag,
          created_date: new Date().toISOString(),
        };
        queryClient.setQueryData(["ride-chat", rideId], (old) => [...(old || []), optimisticMessage]);
        return previousData;
      },
      onError: (err, _, previousData) => {
        if (previousData) queryClient.setQueryData(["ride-chat", rideId], previousData);
      },
    }
  );

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    const messageText = text.trim();
    const messageTag = tag;
    setText("");
    messageMutation.mutate({ text: messageText, tag: messageTag });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-secondary/20 overflow-hidden">
      <LiveRegion message={liveMessage} politeness="polite" atomic={true} />
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Ride Chat</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div
        className="flex flex-col gap-2.5 p-3 h-64 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
        aria-label="Ride chat messages"
      >
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
              aria-label="Type a ride message"
            />
            <Button
               onClick={sendMessage}
               disabled={!text.trim() || messageMutation.isPending}
               size="icon"
               className="h-9 w-9 bg-primary hover:bg-primary/90 flex-shrink-0"
               aria-label="Send message"
               aria-busy={messageMutation.isPending}
             >
               <Send className="w-3.5 h-3.5" aria-hidden="true" />
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