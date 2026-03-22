import React from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTabNavigation } from "@/context/TabNavigationContext";

export default function TopHeader() {
  const location = useLocation();
  const { goBack } = useTabNavigation();

  // Show back button for all non-root paths
  const isRootPath = location.pathname === "/";

  if (isRootPath) {
    return null;
  }

  const getPageTitle = () => {
    if (location.pathname.includes("create-ride")) return "Create Ride";
    if (location.pathname.includes("/rides/")) return "Ride Details";
    if (location.pathname === "/rides") return "Rides";
    if (location.pathname === "/messages") return "Messages";
    if (location.pathname === "/profile") return "Profile";
    return "Page";
  };

  const pageTitle = getPageTitle();

  return (
    <header className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-border">
      <button
        onClick={() => goBack()}
        className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors min-h-[44px] min-w-[44px]"
        aria-label={`Go back from ${pageTitle}`}
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      </button>
      <h1 className="text-lg font-bold truncate">{pageTitle}</h1>
    </header>
  );
}