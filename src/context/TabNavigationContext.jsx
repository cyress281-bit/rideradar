import React, { createContext, useContext, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TabNavigationContext = createContext();

// Root paths for each tab - only hide back button on these
const TAB_ROOT_PATHS = {
  home: "/",
  grid: "/grid",
  rides: "/rides",
  messages: "/messages",
  profile: "/profile",
};

export function TabNavigationProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const stacksRef = useRef({
    home: ["/"],
    grid: ["/grid"],
    rides: ["/rides"],
    messages: ["/messages"],
    profile: ["/profile"],
  });
  const isPopstateRef = useRef(false);

  const getCurrentTab = useCallback(() => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path.startsWith("/grid")) return "grid";
    if (path.startsWith("/rides")) return "rides";
    if (path.startsWith("/messages")) return "messages";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/create-ride")) return "rides";
    return null;
  }, [location.pathname]);

  const isOnRootTab = useCallback(() => {
    const tab = getCurrentTab();
    if (!tab) return false;
    return location.pathname === TAB_ROOT_PATHS[tab];
  }, [getCurrentTab, location.pathname]);

  const switchTab = useCallback((tabName) => {
    const stacks = stacksRef.current;
    const stack = stacks[tabName];
    if (stack && stack.length > 0) {
      const targetPath = stack[stack.length - 1];
      navigate(targetPath);
    }
  }, [navigate]);

  const goBack = useCallback(() => {
    const tab = getCurrentTab();
    if (!tab) return;

    const stacks = stacksRef.current;
    const stack = stacks[tab];

    if (stack.length > 1) {
      stack.pop();
      isPopstateRef.current = true;
      navigate(-1);
    }
  }, [getCurrentTab, navigate]);

  // Sync stack on location change - handle nested routes
  useEffect(() => {
    const tab = getCurrentTab();
    if (!tab) return;

    const stacks = stacksRef.current;
    const stack = stacks[tab];
    const currentPath = location.pathname;

    if (isPopstateRef.current) {
      isPopstateRef.current = false;
      return;
    }

    // Verify stack integrity - stack should only contain paths within the current tab
    const isPathInTab = (() => {
      if (tab === "home") return currentPath === "/";
      if (tab === "grid") return currentPath.startsWith("/grid");
      if (tab === "rides") return currentPath.startsWith("/rides");
      if (tab === "messages") return currentPath.startsWith("/messages");
      if (tab === "profile") return currentPath.startsWith("/profile");
      if (tab === "rides" && currentPath === "/create-ride") return true;
      return false;
    })();

    if (!isPathInTab) return;

    // Add new path to stack if not already the last item
    if (stack[stack.length - 1] !== currentPath) {
      stack.push(currentPath);
    }
  }, [location.pathname, getCurrentTab]);

  // Handle native iOS back swipe and browser back button
  useEffect(() => {
    const handlePopState = () => {
      const tab = getCurrentTab();
      if (tab) {
        const stacks = stacksRef.current;
        const stack = stacks[tab];
        // Pop the current path since navigation already happened
        if (stack.length > 1) {
          stack.pop();
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [getCurrentTab]);

  return (
    <TabNavigationContext.Provider value={{ switchTab, goBack, getCurrentTab, isOnRootTab }}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error("useTabNavigation must be used within TabNavigationProvider");
  }
  return context;
}