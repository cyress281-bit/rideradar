import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Radar, Navigation, User, Plus } from "lucide-react";
import { motion } from "framer-motion";

const leftItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/grid", icon: Radar, label: "Live Radar" },
];

const rightItems = [
  { path: "/rides", icon: Navigation, label: "Rides" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const location = useLocation();

  const renderNavItem = (item) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        className="flex flex-col items-center justify-center flex-1 py-2 relative"
      >
        {isActive && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
          />
        )}
        <item.icon
          className={`w-5 h-5 transition-colors ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
        />
        <span
          className={`text-[10px] mt-1 font-medium transition-colors ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 relative">
        {leftItems.map(renderNavItem)}

        {/* Create Ride Button — sits halfway into the bar */}
        <div className="flex flex-col items-center justify-center flex-1 relative">
          <div className="absolute -top-5">
            <Link to="/create-ride">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex flex-col items-center"
              >
                <div className="absolute inset-0 bg-primary rounded-full blur-md opacity-40 scale-110" />
                <div className="relative bg-primary rounded-full px-4 h-10 flex items-center justify-center gap-1.5 shadow-lg shadow-primary/30 border border-primary/60">
                  <Plus className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
                  <span className="text-[11px] font-bold text-primary-foreground whitespace-nowrap">Create Ride</span>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>

        {rightItems.map(renderNavItem)}
      </div>
    </nav>
  );
}