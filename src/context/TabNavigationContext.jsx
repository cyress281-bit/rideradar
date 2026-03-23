import React, { createContext, useContext, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useNavigationDirection } from "./NavigationDirectionContext";

const TabNavigationContext = createContext();

const TAB_ROOT_PATHS = {
  home: "/",
  grid: "/grid",
  messages: "/messages",
  profile: "/profile",
};

export function TabNavigationProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setDirection } = useNavigationDirection();
  
  // Initialize and maintain strict tab stacks
  const stacksRef = useRef({
    home: ["/"],
    grid: ["/grid"],
    messages: ["/messages"],
    profile: ["/profile"],
  });
  
  const scrollPositionsRef = useRef({
    home: 0,
    grid: 0,
    messages: 0,
    profile: 0,
  });
  
  // Keep navigation direction separate; tab stacks always sync from the real router location.
  const popStateFrameRef = useRef(null);

  const getTabFromPath = useCallback((path) => {
    if (path === "/") return "home";
    if (path.startsWith("/grid")) return "grid";
    if (path.startsWith("/rides")) return "home";
    if (path.startsWith("/messages")) return "messages";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/create-ride")) return "home";
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

  // Always derive the current tab stack from the actual router location.
  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    if (!tab) return;

    const stack = stacksRef.current[tab];
    if (!stack) return;

    const existingIndex = stack.lastIndexOf(location.pathname);

    if (existingIndex === -1) {
      stack.push(location.pathname);
      return;
    }

    if (existingIndex !== stack.length - 1) {
      stacksRef.current[tab] = stack.slice(0, existingIndex + 1);
    }
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

      const stack = stacksRef.current[tabName];
      if (!stack || stack.length === 0) return;

      const targetPath = stack[stack.length - 1];
      if (location.pathname === targetPath) return;

      setDirection("push");
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

    setDirection("pop");
    navigate(-1);
  }, [getCurrentTab, navigate, setDirection]);

  // Browser back/forward only updates animation direction; stack sync is handled by location changes.
  useEffect(() => {
    const handlePopState = () => {
      if (popStateFrameRef.current) cancelAnimationFrame(popStateFrameRef.current);
      popStateFrameRef.current = requestAnimationFrame(() => {
        setDirection("pop");
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (popStateFrameRef.current) cancelAnimationFrame(popStateFrameRef.current);
    };
  }, [setDirection]);

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