import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import TopHeader from "@/components/TopHeader";
import RideNowAlert from "@/components/home/RideNowAlert";
import { base44 } from "@/api/base44Client";
import { useViewportLock } from "@/hooks/useViewportLock";
import { useTabNavigation } from "@/context/TabNavigationContext";

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const { scrollPositionsRef, getCurrentTab } = useTabNavigation();

  useViewportLock();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Restore scroll position when tab becomes active
  useEffect(() => {
    const currentTab = getCurrentTab();
    if (!currentTab || !scrollPositionsRef) return;

    const mainElement = document.querySelector('main');
    if (mainElement) {
      // Use nextFrame to ensure DOM has settled
      requestAnimationFrame(() => {
        mainElement.scrollTop = scrollPositionsRef.current[currentTab] || 0;
      });
    }
  }, [getCurrentTab, scrollPositionsRef]);

  return (
    <div className="min-h-screen bg-background font-inter" style={{ overscrollBehavior: 'none' }}>
      <RideNowAlert user={user} />
      <TopHeader />
      <main className="pb-20" style={{ overscrollBehavior: 'none' }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}