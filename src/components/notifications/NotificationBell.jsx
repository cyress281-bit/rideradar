import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell({ user }) {
  const [showPanel, setShowPanel] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["user-notifications", user?.email],
    queryFn: () => {
      if (!user?.email) return [];
      return base44.entities.RideNotification.filter(
        { recipient_email: user.email },
        "-created_date",
        50
      );
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Real-time subscription
  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.RideNotification.subscribe((event) => {
      if (event.data?.recipient_email === user.email) {
        // Refresh notifications
      }
    });
    return unsub;
  }, [user?.email]);

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowPanel(!showPanel)}
        className="relative w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-foreground" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {showPanel && (
          <NotificationPanel
            notifications={notifications}
            user={user}
            onClose={() => setShowPanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}