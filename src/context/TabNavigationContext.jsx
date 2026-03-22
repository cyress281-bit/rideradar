import React, { createContext, useContext, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TabNavigationContext = createContext();

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
  const isNavigatingRef = useRef(false);

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

  // Verify stack integrity and sync with history
  const syncStackWithHistory = useCallback((tab, path) => {
    const stacks = stacksRef.current;
    const stack = stacks[tab];
    
    if (!stack) return;

    // Ensure path belongs to current tab
    const isPathInTab = (() => {
      if (tab === "home") return path === "/";
      if (tab === "grid") return path.startsWith("/grid");
      if (tab === "rides") return path === "/create-ride" || path.startsWith("/rides");
      if (tab === "messages") return path.startsWith("/messages");
      if (tab === "profile") return path.startsWith("/profile");
      return false;
    })();

    if (!isPathInTab) return;

    // Only push if it's a new path (prevents duplicates from programmatic navigation)
    if (stack[stack.length - 1] !== path) {
      stack.push(path);
    }
  }, []);

  const switchTab = useCallback((tabName) => {
    const stacks = stacksRef.current;
    const stack = stacks[tabName];
    if (!stack || stack.length === 0) return;

    const targetPath = stack[stack.length - 1];
    if (location.pathname === targetPath) return;

    isNavigatingRef.current = true;
    window.history.pushState({ tab: tabName, path: targetPath }, "", targetPath);
    navigate(targetPath, { replace: false });
  }, [navigate, location.pathname]);

  const goBack = useCallback(() => {
    const tab = getCurrentTab();
    if (!tab) return;

    const stacks = stacksRef.current;
    const stack = stacks[tab];
    if (!stack || stack.length <= 1) return;

    stack.pop();
    isPopstateRef.current = true;
    window.history.back();
  }, [getCurrentTab]);

  // Sync stack on location change
  useEffect(() => {
    const tab = getCurrentTab();
    if (!tab) return;

    if (isPopstateRef.current) {
      isPopstateRef.current = false;
      return;
    }

    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    syncStackWithHistory(tab, location.pathname);
  }, [location.pathname, getCurrentTab, syncStackWithHistory]);

  // Handle iOS back gesture and browser back button
  useEffect(() => {
    const handlePopState = (e) => {
      const tab = getCurrentTab();
      if (!tab) return;

      const stacks = stacksRef.current;
      const stack = stacks[tab];

      if (!stack) return;

      // State indicates programmatic navigation, don't pop again
      if (e.state?.tab === tab) {
        return;
      }

      // If stack has more than root, pop the current item
      if (stack.length > 1) {
        stack.pop();
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