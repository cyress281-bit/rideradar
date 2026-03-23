import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // miles
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RideNowAlert({ user }) {
  const [alerts, setAlerts] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const queryClient = useQueryClient();

  // Get user location once
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // Subscribe to new RideNotification records
  useEffect(() => {
    const unsub = base44.entities.RideNotification.subscribe(async (event) => {
      if (event.type !== "create") return;
      const notif = event.data;
      if (!notif || notif.read) return;
      // Skip if this user is the host
      if (user && notif.host_username === (user.username || user.email?.split("@")[0])) return;

      let distLabel = "nearby";
      if (userPos && notif.meetup_lat && notif.meetup_lng) {
        const miles = getDistance(userPos.lat, userPos.lng, notif.meetup_lat, notif.meetup_lng);
        distLabel = `${miles.toFixed(1)} mi away`;
      }

      const alert = { ...notif, distLabel, alertId: notif.id };
      setAlerts((prev) => [alert, ...prev].slice(0, 3));

      // Auto-dismiss after 12 seconds
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.alertId !== notif.id));
      }, 12000);
    });
    return unsub;
  }, [user, userPos]);

  const dismiss = (alertId) => {
    setAlerts((prev) => prev.filter((a) => a.alertId !== alertId));
    // Mark as read
    base44.entities.RideNotification.update(alertId, { read: true }).catch(() => {});
  };

  return (
    <div className="fixed top-4 left-3 right-3 z-[2000] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.alertId}
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="pointer-events-auto bg-card/98 backdrop-blur-2xl border border-primary/40 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="h-1 w-full bg-gradient-to-r from-primary to-green-400" />
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground leading-snug">
                  Ride starting {alert.distLabel} — Join?
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  <span className="text-primary font-semibold">@{alert.host_username}</span> · {alert.ride_title}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Link
                  to={`/rides/${alert.ride_id}`}
                  onClick={() => dismiss(alert.alertId)}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  View
                </Link>
                <button
                  onClick={() => dismiss(alert.alertId)}
                  className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}