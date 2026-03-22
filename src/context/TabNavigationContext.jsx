import React, { createContext, useContext, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useNavigationDirection } from "./NavigationDirectionContext";

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
  const { setDirection } = useNavigationDirection();
  
  // Initialize and maintain stable tab stacks
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
  
  // Track previous location to detect actual navigation changes
  const previousPathRef = useRef(location.pathname);
  const isFromPopStateRef = useRef(false);

  const getTabFromPath = useCallback((path) => {
    if (path === "/") return "home";
    if (path.startsWith("/grid")) return "grid";
    if (path.startsWith("/rides")) return "rides";
    if (path.startsWith("/messages")) return "messages";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/create-ride")) return "rides";
    return null;
  }, []);

  const getCurrentTab = useCallback(() => {
    return getTabFromPath(location.pathname);
  }, [location.pathname, getTabFromPath]);

  const isOnRootTab = useCallback(() => {
    const tab = getCurrentTab();
    if (!tab) return false;
    return location.pathname === TAB_ROOT_PATHS[tab];
  }, [getCurrentTab, location.pathname]);

  // Update stacks when location changes naturally (not from goBack)
  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    if (!tab) return;

    // Only update if this is a genuine navigation, not a popstate
    if (isFromPopStateRef.current) {
      isFromPopStateRef.current = false;
      previousPathRef.current = location.pathname;
      return;
    }

    const stack = stacksRef.current[tab];
    if (!stack) return;

    // If returning to a previously visited path in this tab, don't re-add it
    const lastPath = stack[stack.length - 1];
    if (lastPath === location.pathname) {
      previousPathRef.current = location.pathname;
      return;
    }

    // New path: add to stack
    stack.push(location.pathname);
    previousPathRef.current = location.pathname;
  }, [location.pathname, getTabFromPath]);

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

      // Tab switch is a "push" navigation
      setDirection("push");
      
      // Use React Router's navigate with replace=false for standard history behavior
      navigate(targetPath, { replace: false });

      // Restore scroll position after navigation completes
      requestAnimationFrame(() => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.scrollTop = scrollPositionsRef.current[tabName] || 0;
        }
      });
    },
    [navigate, location.pathname, getCurrentTab, setDirection]
  );

  const goBack = useCallback(() => {
    const tab = getCurrentTab();
    if (!tab) return;

    const stack = stacksRef.current[tab];
    if (!stack || stack.length <= 1) return;

    // Pop from stack and navigate
    stack.pop();
    isFromPopStateRef.current = true;
    setDirection("pop");
    navigate(-1);
  }, [getCurrentTab, navigate, setDirection]);

  // Handle external back gestures (iOS swipe back, browser back button)
  useEffect(() => {
    const handlePopState = () => {
      isFromPopStateRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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