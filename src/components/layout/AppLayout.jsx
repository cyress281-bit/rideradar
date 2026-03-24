import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
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

  return (
    <div className="w-screen h-screen bg-background font-inter flex flex-col overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <RideNowAlert user={user} />
      <main className="flex-1 overflow-y-auto w-full">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}