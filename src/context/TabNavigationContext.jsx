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
  const scrollPositionsRef = useRef({
    home: 0,
    grid: 0,
    rides: 0,
    messages: 0,
    profile: 0,
  });
  const lastNavigationTimeRef = useRef(0);

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

    // Only push if it's a new path (prevents duplicates)
    if (stack[stack.length - 1] !== path) {
      stack.push(path);
    }
  }, []);

  const switchTab = useCallback(
    (tabName) => {
      const currentTab = getCurrentTab();
      
      // Save current scroll position before switching
      if (currentTab) {
        const mainElement = document.querySelector('main');
        if (mainElement) {
          scrollPositionsRef.current[currentTab] = mainElement.scrollTop;
        }
      }

      const stacks = stacksRef.current;
      const stack = stacks[tabName];
      if (!stack || stack.length === 0) return;

      const targetPath = stack[stack.length - 1];
      if (location.pathname === targetPath) return;

      // Use React Router's navigate with replace=false for standard history behavior
      navigate(targetPath, { replace: false });
      lastNavigationTimeRef.current = Date.now();

      // Restore scroll position after navigation completes
      requestAnimationFrame(() => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.scrollTop = scrollPositionsRef.current[tabName] || 0;
        }
      });
    },
    [navigate, location.pathname, getCurrentTab]
  );

  const goBack = useCallback(() => {
    const tab = getCurrentTab();
    if (!tab) return;

    const stacks = stacksRef.current;
    const stack = stacks[tab];
    if (!stack || stack.length <= 1) return;

    stack.pop();
    // Use standard browser back behavior via React Router
    navigate(-1);
    lastNavigationTimeRef.current = Date.now();
  }, [getCurrentTab, navigate]);

  // Sync stack on location change - follows React Router standard
  useEffect(() => {
    const tab = getCurrentTab();
    if (!tab) return;

    syncStackWithHistory(tab, location.pathname);
  }, [location.pathname, getCurrentTab, syncStackWithHistory]);

  // Handle iOS back gesture and browser back button
  useEffect(() => {
    const handlePopState = () => {
      const tab = getCurrentTab();
      if (!tab) return;

      const stacks = stacksRef.current;
      const stack = stacks[tab];

      if (!stack) return;

      // If stack has more than root, pop the current item
      if (stack.length > 1) {
        stack.pop();
      }
    };

    // Listen to popstate which is fired by browser back/forward
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [getCurrentTab]);

  // Save scroll position when main element scrolls
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const handleScroll = () => {
      const currentTab = getCurrentTab();
      if (currentTab) {
        scrollPositionsRef.current[currentTab] = mainElement.scrollTop;
      }
    };

    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, [getCurrentTab]);

  return (
    <TabNavigationContext.Provider value={{ switchTab, goBack, getCurrentTab, isOnRootTab, scrollPositionsRef }}>
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