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
    
    // Ensure path is in correct tab
    const isPathInTab = (() => {
      if (tab === "home") return path === "/";
      if (tab === "grid") return path.startsWith("/grid");
      if (tab === "rides") return path.startsWith("/rides");
      if (tab === "messages") return path.startsWith("/messages");
      if (tab === "profile") return path.startsWith("/profile");
      if (tab === "rides" && path === "/create-ride") return true;
      return false;
    })();

    if (!isPathInTab) return;

    // Reconstruct stack if last item doesn't match current path
    if (stack[stack.length - 1] !== path) {
      stack.push(path);
    }
  }, []);

  const switchTab = useCallback((tabName) => {
    const stacks = stacksRef.current;
    const stack = stacks[tabName];
    if (stack && stack.length > 0) {
      const targetPath = stack[stack.length - 1];
      window.history.pushState({ tab: tabName, path: targetPath }, "", targetPath);
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
      window.history.back();
    }
  }, [getCurrentTab]);

  // Sync stack on location change
  useEffect(() => {
    const tab = getCurrentTab();
    if (!tab) return;

    if (isPopstateRef.current) {
      isPopstateRef.current = false;
      return;
    }

    syncStackWithHistory(tab, location.pathname);
  }, [location.pathname, getCurrentTab, syncStackWithHistory]);

  // Handle popstate to keep stacks synchronized
  useEffect(() => {
    const handlePopState = (e) => {
      const tab = getCurrentTab();
      if (!tab) return;

      const stacks = stacksRef.current;
      const stack = stacks[tab];
      
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