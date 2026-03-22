import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TabNavigationContext = createContext();

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
  const [isHistorySynced, setIsHistorySynced] = useState(false);

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
      const targetPath = stack[stack.length - 1];
      window.history.replaceState({ tab, path: targetPath }, "", targetPath);
      navigate(targetPath, { replace: true });
    } else {
      window.history.back();
    }
  }, [getCurrentTab, navigate]);

  const updateTabStack = useCallback((path) => {
    const tab = getCurrentTab();
    if (!tab) return;

    const stacks = stacksRef.current;
    const stack = stacks[tab];

    if (stack[stack.length - 1] !== path) {
      stack.push(path);
      window.history.pushState({ tab, path }, "", path);
    }
  }, [getCurrentTab]);

  // Handle native back gestures via popstate event
  useEffect(() => {
    const handlePopState = (e) => {
      const state = e.state;
      if (state && state.tab && state.path) {
        const tab = state.tab;
        const stacks = stacksRef.current;
        const stack = stacks[tab];
        
        // Sync stack to match history state
        if (stack[stack.length - 1] !== state.path) {
          stack.pop();
        }
        navigate(state.path);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  useEffect(() => {
    updateTabStack(location.pathname);
  }, [location.pathname, updateTabStack]);

  return (
    <TabNavigationContext.Provider value={{ switchTab, goBack, getCurrentTab }}>
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