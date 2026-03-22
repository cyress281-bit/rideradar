import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import TopHeader from "@/components/TopHeader";
import RideNowAlert from "@/components/home/RideNowAlert";
import GlobalPullToRefresh from "./GlobalPullToRefresh";
import { base44 } from "@/api/base44Client";
import { useViewportLock } from "@/hooks/useViewportLock";
import { useTabNavigation } from "@/context/TabNavigationContext";
import { useNavigationDirection } from "@/context/NavigationDirectionContext";

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const { scrollPositionsRef, getCurrentTab } = useTabNavigation();
  const { direction } = useNavigationDirection();

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
  }, [getCurrentTab, scrollPositionsRef, location.pathname]);

  return (
    <div className="min-h-screen bg-background font-inter" style={{ overscrollBehavior: 'none' }}>
      <RideNowAlert user={user} />
      <TopHeader />
      <main className="pb-20 overflow-hidden" style={{ overscrollBehavior: 'none' }}>
        <GlobalPullToRefresh>
          <Outlet key={`${location.pathname}-${direction}`} />
        </GlobalPullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}