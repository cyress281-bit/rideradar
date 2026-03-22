import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const tagStyles = {
  chat: "bg-blue-500/15 text-blue-400",
  hazard: "bg-red-500/15 text-red-400",
  route: "bg-green-500/15 text-green-400",
  meetup: "bg-amber-500/15 text-amber-400",
};

function RideThreadRow({ index, style, data }) {
  const thread = data[index];
  const rowStyle = style?.top === undefined
    ? style
    : { ...style, top: style.top + 4, height: style.height - 8 };

  return (
    <div style={rowStyle}>
      <Link
        to={`/rides/${thread.rideId}`}
        className="block p-3 rounded-xl bg-secondary/40 border border-border/50 hover:bg-secondary/60 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight">{thread.ride?.title || "Ride"}</p>
            <p className="text-xs text-muted-foreground truncate">
              @{thread.lastMessage.username}: {thread.lastMessage.text}
            </p>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {thread.tags.map((tag) => (
                <span key={`${thread.rideId}-${tag}`} className={`text-[9px] px-1.5 py-0.5 rounded-md ${tagStyles[tag] || tagStyles.chat}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{thread.count}</span>
        </div>
      </Link>
    </div>
  );
}

export default function RideMessagesList({ messages }) {
  const [listHeight, setListHeight] = useState(() => Math.max(window.innerHeight - 290, 280));
  const rideIds = useMemo(() => Array.from(new Set(messages.map((message) => message.ride_id))), [messages]);

  const { data: rides = [] } = useQuery({
    queryKey: ["ride-message-details", rideIds.join(",")],
    queryFn: async () => {
      if (rideIds.length === 0) return [];
      const results = await Promise.all(rideIds.map((id) => base44.entities.Ride.filter({ id })));
      return results.flat();
    },
    enabled: rideIds.length > 0,
  });

  useEffect(() => {
    const handleResize = () => setListHeight(Math.max(window.innerHeight - 290, 280));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const rideThreads = useMemo(
    () =>
      rideIds.map((rideId) => {
        const rideMessages = messages.filter((message) => message.ride_id === rideId);
        return {
          rideId,
          ride: rides.find((ride) => ride.id === rideId),
          lastMessage: rideMessages[rideMessages.length - 1],
          count: rideMessages.length,
          tags: Array.from(new Set(rideMessages.map((message) => message.tag || "chat"))).slice(0, 4),
        };
      }),
    [messages, rideIds, rides]
  );

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No ride messages yet.</p>
      </div>
    );
  }

  if (rideThreads.length < 10) {
    return (
      <div className="space-y-2">
        {rideThreads.map((thread) => (
          <RideThreadRow key={thread.rideId} index={0} style={{}} data={[thread]} />
        ))}
      </div>
    );
  }

  return (
    <List
      height={listHeight}
      width="100%"
      itemCount={rideThreads.length}
      itemData={rideThreads}
      itemSize={118}
      overscanCount={6}
      itemKey={(index, data) => data[index].rideId}
    >
      {RideThreadRow}
    </List>
  );
}