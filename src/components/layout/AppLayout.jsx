import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import RideNowAlert from "@/components/home/RideNowAlert";
import { base44 } from "@/api/base44Client";

export default function AppLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background font-inter" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <RideNowAlert user={user} />
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}