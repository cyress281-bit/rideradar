import React from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTabNavigation } from "@/context/TabNavigationContext";

export default function TopHeader() {
  const location = useLocation();
  
  let goBack = null;
  try {
    const nav = useTabNavigation();
    goBack = nav.goBack;
  } catch {
    // Context not available, use browser back
    goBack = () => window.history.back();
  }

  // Show back button for all non-root paths
  const isRootPath = location.pathname === "/";

  if (isRootPath) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-border">
      <button
        onClick={goBack}
        className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors min-h-[44px] min-w-[44px]"
        aria-label="Navigate back to previous screen"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <h1 className="text-lg font-bold truncate">
        {location.pathname.includes("create-ride") && "Create Ride"}
        {location.pathname.includes("/rides/") && "Ride Details"}
        {location.pathname === "/rides" && "Rides"}
        {location.pathname === "/messages" && "Messages"}
        {location.pathname === "/profile" && "Profile"}
      </h1>
    </div>
  );
}