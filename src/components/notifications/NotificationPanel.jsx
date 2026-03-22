import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import LiveRegion from "@/components/accessibility/LiveRegion";

export default function NotificationPanel({ notifications, user, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [liveMessage, setLiveMessage] = useState("");
  const previousUnreadCountRef = useRef(null);

  const markAsReadMutation = useMutation({
    mutationFn: (notifId) =>
      base44.entities.RideNotification.update(notifId, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    },
  });

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsReadMutation.mutate(notif.id);
    }
    navigate(`/rides/${notif.ride_id}`);
    onClose();
  };

  useEffect(() => {
    const unreadCount = notifications.filter((notif) => !notif.read).length;

    if (previousUnreadCountRef.current === null) {
      previousUnreadCountRef.current = unreadCount;
      return;
    }

    if (unreadCount > previousUnreadCountRef.current && notifications[0]) {
      setLiveMessage(`New notification. ${notifications[0].message}`);
    } else if (unreadCount < previousUnreadCountRef.current) {
      setLiveMessage(`${unreadCount} unread notifications remaining.`);
    }

    previousUnreadCountRef.current = unreadCount;
  }, [notifications]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-12 right-0 w-80 bg-card border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto"
      role="dialog"
      aria-modal="false"
      aria-label="Notifications"
    >
      <LiveRegion message={liveMessage} politeness="polite" atomic={true} />
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border/50 p-3 flex items-center justify-between">
        <h3 className="font-bold text-sm">Notifications</h3>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg hover:bg-secondary flex items-center justify-center"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border/30" role="list" aria-label="Notification list">
          {notifications.map((notif) => (
            <motion.button
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`w-full text-left p-3 hover:bg-secondary/40 transition-colors ${
                !notif.read ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-semibold leading-tight">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {notif.ride_title}
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                    {new Date(notif.created_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}