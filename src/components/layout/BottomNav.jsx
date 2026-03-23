import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Home, Map, Navigation, User, MessageCircle, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useTabNavigation } from "@/context/TabNavigationContext";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "home", path: "/", icon: Home, label: "Home" },
  { id: "grid", path: "/grid", icon: Map, label: "Live Radar" },
  { id: "messages", path: "/messages", icon: MessageCircle, label: "Messages", badge: "unreadCount" },
  { id: "profile", path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const { switchTab, getCurrentTab } = useTabNavigation();
  const { trigger: haptic } = useHapticFeedback();
  const [user, setUser] = useState(null);
  const currentTab = getCurrentTab();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: directMessages = [] } = useQuery({
    queryKey: ["dm-unread", user?.email],
    queryFn: () => {
      if (!user?.email) return [];
      return base44.entities.DirectMessage.filter({ recipient_email: user.email, read: false });
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border select-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="Main navigation">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2" role="tablist">
        {navItems.slice(0, 2).map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { haptic("selection"); switchTab(item.id); }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 relative min-h-[44px] rounded-lg transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              )}
              role="tab"
              aria-label={`${item.label} tab`}
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              tabIndex={isActive ? 0 : -1}
            >
              {isActive && (
                <motion.div layoutId="nav-indicator" className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {item.badge === "unreadCount" && directMessages.length > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {directMessages.length > 9 ? "9+" : directMessages.length}
                  </div>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Create Ride Button — centered, raised above nav */}
        <div className="flex-1 flex items-center justify-center">
          <Link to="/create-ride" className="!min-h-0 !min-w-0" style={{ marginBottom: '20px' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label="Create a new ride"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary rounded-full blur-sm opacity-40" />
                <div className="relative w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                  <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} aria-hidden="true" />
                </div>
              </div>
              <span className="text-xs mt-1 font-medium text-primary">Create</span>
            </motion.button>
          </Link>
        </div>

        {navItems.slice(2).map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { haptic("selection"); switchTab(item.id); }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 relative min-h-[44px] rounded-lg transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              )}
              role="tab"
              aria-label={`${item.label} tab`}
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              tabIndex={isActive ? 0 : -1}
            >
              {isActive && (
                <motion.div layoutId="nav-indicator" className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {item.badge === "unreadCount" && directMessages.length > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {directMessages.length > 9 ? "9+" : directMessages.length}
                  </div>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}