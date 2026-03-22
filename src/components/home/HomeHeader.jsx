import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { getAppSettings } from "@/lib/appSettings";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function HomeHeader({ username }) {
  const [settings, setSettings] = useState({ name: "RideRadar", logo_url: null });
  const [user, setUser] = useState(null);

  useEffect(() => {
    getAppSettings().then(setSettings);
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-2.5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.name}
              className="w-9 h-9 rounded-xl object-cover shadow-[0_0_14px_rgba(0,240,50,0.6)]"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_14px_rgba(0,240,50,0.6)]">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-foreground fill-current">
                <path d="M3 12c0-1.5 1.5-3 3-3s3 1.5 3 3-1.5 3-3 3-3-1.5-3-3zm14 0c0-1.5 1.5-3 3-3s3 1.5 3 3-1.5 3-3 3-3-1.5-3-3zm-7-8h2v6h-2zM7 8l-3 3 1.4 1.4L7 10.8l3.6 3.6L12 13l-5-5zm10 0l-5 5 1.4 1.4L17 10.8l3.6 3.6L22 13l-5-5z" />
              </svg>
            </div>
          )}
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background shadow-[0_0_6px_rgba(0,240,50,0.8)]" />
        </motion.div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">{settings.name}</h1>
          <p className="text-[11px] text-muted-foreground -mt-0.5">Group rides near you</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {user && <NotificationBell user={user} />}
        <Link
          to="/profile"
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <User className="w-4 h-4 text-foreground" />
        </Link>
      </div>
    </div>
  );
}