import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, X, Check, MessageSquare, Users, Zap, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function NotificationCenter({ user }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  // Friend requests (incoming)
  const { data: friendRequests = [] } = useQuery({
    queryKey: ["friend-requests", user?.email],
    queryFn: () => base44.entities.UserFriend.filter({ friend_email: user.email, status: "requested" }),
    enabled: !!user?.email,
  });

  // Unread DMs (latest message from each friend)
  const { data: friendships = [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const sent = await base44.entities.UserFriend.filter({ user_email: user.email, status: "accepted" });
      const received = await base44.entities.UserFriend.filter({ friend_email: user.email, status: "accepted" });
      return [...sent, ...received];
    },
    enabled: !!user?.email,
  });

  const friends = friendships.map((f) => (f.user_email === user.email ? f.friend_email : f.user_email));

  const { data: latestDMs = [] } = useQuery({
    queryKey: ["unread-dms", friends.join(",")],
    queryFn: async () => {
      if (friends.length === 0) return [];
      const results = await Promise.all(
        friends.map((f) => {
          const cid = [user.email, f].sort().join("|");
          return base44.entities.DirectMessage.filter({ conversation_id: cid, read: false }, "-created_date", 5);
        })
      );
      return results.flat();
    },
    enabled: friends.length > 0,
    refetchInterval: 5000,
  });

  // Ride notifications and updates
  const { data: rideNotifications = [] } = useQuery({
    queryKey: ["ride-notifications", user?.email],
    queryFn: () => base44.entities.RideNotification.filter({ recipient_email: user.email, read: false }, "-created_date", 20),
    enabled: !!user?.email,
    refetchInterval: 10000,
  });

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.email) return;
    const unsub1 = base44.entities.UserFriend.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests", user.email] });
    });
    const unsub2 = base44.entities.DirectMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["unread-dms"] });
    });
    const unsub3 = base44.entities.RideNotification.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["ride-notifications", user.email] });
    });
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [user?.email]);

  // Build notification list
  useEffect(() => {
    const notifs = [];

    // Friend requests
    friendRequests.forEach((fr) => {
      notifs.push({
        id: `fr-${fr.id}`,
        type: "friend-request",
        icon: Users,
        title: "Friend Request",
        message: `${fr.user_email} sent you a friend request`,
        data: fr,
        timestamp: fr.created_date,
      });
    });

    // Unread DMs
    latestDMs.forEach((dm) => {
      const sender = dm.sender_email === user.email ? dm.recipient_email : dm.sender_email;
      notifs.push({
        id: `dm-${dm.id}`,
        type: "message",
        icon: MessageSquare,
        title: "New Message",
        message: `${sender}: ${dm.text.substring(0, 50)}${dm.text.length > 50 ? "..." : ""}`,
        data: dm,
        timestamp: dm.created_date,
      });
    });

    // Ride notifications
    rideNotifications.forEach((rn) => {
      notifs.push({
        id: `rn-${rn.id}`,
        type: "ride",
        icon: Zap,
        title: "Ride Update",
        message: rn.message,
        data: rn,
        timestamp: rn.created_date,
      });
    });

    setNotifications(notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  }, [friendRequests, latestDMs, rideNotifications, user?.email]);

  const handleAcceptFriend = async (fr) => {
    await base44.entities.UserFriend.update(fr.id, { status: "accepted" });
    queryClient.invalidateQueries({ queryKey: ["friend-requests", user?.email] });
    queryClient.invalidateQueries({ queryKey: ["friends", user?.email] });
  };

  const handleDeclineFriend = async (fr) => {
    await base44.entities.UserFriend.delete(fr.id);
    queryClient.invalidateQueries({ queryKey: ["friend-requests", user?.email] });
  };

  const handleMarkRead = async (notif) => {
    if (notif.type === "ride" && notif.data.id) {
      await base44.entities.RideNotification.update(notif.data.id, { read: true });
      queryClient.invalidateQueries({ queryKey: ["ride-notifications", user?.email] });
    } else if (notif.type === "message" && notif.data.id) {
      await base44.entities.DirectMessage.update(notif.data.id, { read: true });
      queryClient.invalidateQueries({ queryKey: ["unread-dms"] });
    }
  };

  const unreadCount = notifications.length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
      >
        <Bell className="w-4.5 h-4.5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-2 top-11 w-80 max-h-[600px] bg-card border border-border rounded-2xl shadow-2xl z-[2000] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
              <h3 className="text-sm font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    notifications.forEach((n) => handleMarkRead(n));
                  }}
                  className="text-[10px] text-primary hover:underline whitespace-nowrap"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = notif.icon;
                  const isFriendRequest = notif.type === "friend-request";

                  return (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[9px] text-muted-foreground/60 mt-1">
                            {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                          </p>
                        </div>

                        {/* Actions */}
                        {isFriendRequest && (
                          <div className="flex gap-1 flex-shrink-0 mt-0.5">
                            <button
                              onClick={() => handleAcceptFriend(notif.data)}
                              className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                              title="Accept"
                            >
                              <Check className="w-3 h-3 text-primary" />
                            </button>
                            <button
                              onClick={() => handleDeclineFriend(notif.data)}
                              className="w-7 h-7 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
                              title="Decline"
                            >
                              <X className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
                        )}

                        {notif.type !== "friend-request" && (
                          <button
                            onClick={() => handleMarkRead(notif)}
                            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}