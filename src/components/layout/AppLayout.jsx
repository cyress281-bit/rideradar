import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "./BottomNav";
import RideNowAlert from "@/components/home/RideNowAlert";
import { base44 } from "@/api/base44Client";

export default function AppLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const location = useLocation();

  return (
    <div className="min-h-screen bg-background font-inter" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <RideNowAlert user={user} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
          className="pb-24"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}