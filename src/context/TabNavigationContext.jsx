import React, { createContext, useContext, useCallback, useRef, useEffect } from "react";
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

  const getCurrentTab = useCallback(() => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path.startsWith("/grid")) return "grid";
    if (path.startsWith("/rides")) return "rides";
    if (path.startsWith("/messages")) return "messages";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/create-ride")) return "rides"; // Treat as part of rides flow
    return null;
  }, [location.pathname]);

  const switchTab = useCallback((tabName) => {
    const stacks = stacksRef.current;
    const stack = stacks[tabName];
    if (stack && stack.length > 0) {
      navigate(stack[stack.length - 1]);
    }
  }, [navigate]);

  const updateTabStack = useCallback((path) => {
    const tab = getCurrentTab();
    if (!tab) return;

    const stacks = stacksRef.current;
    const stack = stacks[tab];

    if (stack[stack.length - 1] !== path) {
      stack.push(path);
    }
  }, [getCurrentTab]);

  const goBack = useCallback(() => {
    const tab = getCurrentTab();
    if (!tab) return;

    const stacks = stacksRef.current;
    const stack = stacks[tab];

    if (stack.length > 1) {
      stack.pop();
      navigate(stack[stack.length - 1]);
    }
  }, [getCurrentTab, navigate]);

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