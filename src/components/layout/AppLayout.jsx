import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import useBackButton from "@/hooks/useBackButton";
import BottomNav from "./BottomNav";
import RideNowAlert from "@/components/home/RideNowAlert";
import { base44 } from "@/api/base44Client";

export default function AppLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const location = useLocation();
  useBackButton();

  // Determine direction: detail pages slide in from right, tab switches cross-fade
  const isTabRoot = ["/", "/grid", "/feed", "/messages", "/profile"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background font-inter" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <RideNowAlert user={user} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={isTabRoot ? { opacity: 0 } : { opacity: 0, x: 24 }}
          animate={isTabRoot ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={isTabRoot ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="pb-24"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}