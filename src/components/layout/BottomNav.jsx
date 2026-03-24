import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Map, User, MessageSquare, Rss } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/",        icon: Home,           label: "Home" },
  { path: "/grid",    icon: Map,            label: "Radar" },
  { path: "/feed",    icon: Rss,            label: "Feed" },
  { path: "/messages",icon: MessageSquare,  label: "Messages" },
  { path: "/profile", icon: User,           label: "Profile" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[999] bg-card/90 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto" style={{ height: "49px" }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 gap-0.5"
              style={{ minHeight: "44px" }}
            >
              <item.icon
                className={`w-[22px] h-[22px] transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground/60"
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
                fill={isActive ? "currentColor" : "none"}
                fillOpacity={isActive ? 0.15 : 0}
              />
              <span
                className={`text-[10px] font-medium transition-colors leading-none ${
                  isActive ? "text-primary" : "text-muted-foreground/60"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}