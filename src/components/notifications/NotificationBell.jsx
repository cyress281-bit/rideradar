import React, { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const { data: myNotifs = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () =>
      base44.entities.RideNotification.filter(
        { recipient_email: user.email },
        "-created_date",
        30
      ),
    enabled: !!user?.email,
    refetchInterval: 15000,
  });

  const { data: sosNotifs = [] } = useQuery({
    queryKey: ["sos-notifications"],
    queryFn: () =>
      base44.entities.RideNotification.filter(
        { ride_id: "sos" },
        "-created_date",
        20
      ),
    enabled: !!user?.email,
    refetchInterval: 15000,
  });

  // Merge: personal notifs + SOS alerts from last 24h (not sent by self)
  const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
  const selfUsername = user?.username || user?.email?.split("@")[0];
  const filteredSOS = sosNotifs.filter(
    (n) => new Date(n.created_date).getTime() > cutoff24h && n.host_username !== selfUsername
  );
  const notifications = [...myNotifs, ...filteredSOS]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .filter((n, i, arr) => arr.findIndex(x => x.id === n.id) === i);

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.RideNotification.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["sos-notifications"] });
    });
    return unsub;
  }, [user?.email, queryClient]);

  const unread = notifications.filter((n) => !n.read);

  const markAllRead = async () => {
    const unreadItems = notifications.filter((n) => !n.read);
    await Promise.all(
      unreadItems.map((n) => base44.entities.RideNotification.update(n.id, { read: true }))
    );
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] });
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((v) => !v); if (!open && unread.length > 0) markAllRead(); }}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
      >
        <Bell className="w-4.5 h-4.5 text-foreground" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-background">
            {unread.length > 9 ? "9+" : unread.length}
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
            className="absolute right-0 top-11 w-80 bg-card border border-border rounded-2xl shadow-2xl z-[2000] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold">Notifications</h3>
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const isSOS = n.ride_id === "sos";
                  return (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${
                        isSOS ? "bg-red-950/40" : !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {isSOS ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                        ) : !n.read ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        ) : null}
                        <div className={!isSOS && !n.read ? "" : isSOS ? "" : "ml-3.5"}>
                          <p className={`text-xs leading-snug ${isSOS ? "text-red-300 font-semibold" : "text-foreground"}`}>{n.message}</p>
                          {isSOS && n.meetup_lat && n.meetup_lng && (
                            <a
                              href={`https://maps.google.com/?q=${n.meetup_lat},${n.meetup_lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-red-400 underline mt-0.5 inline-block"
                            >
                              📍 Open in Maps
                            </a>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
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