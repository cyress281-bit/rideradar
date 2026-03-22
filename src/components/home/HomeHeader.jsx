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
          <img
            src="https://media.base44.com/images/public/69c00371996a3698d9301734/ae383836a_image.png"
            alt={settings.name}
            className="w-9 h-9 rounded-xl object-cover shadow-[0_0_14px_rgba(0,240,50,0.6)]"
          />
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
          aria-label="Go to profile"
        >
          <User className="w-4 h-4 text-foreground" />
        </Link>
      </div>
    </div>
  );
}