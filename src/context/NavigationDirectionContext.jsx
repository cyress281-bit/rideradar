import React, { createContext, useContext, useRef, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";

const NavigationDirectionContext = createContext();

export function NavigationDirectionProvider({ children }) {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const directionRef = useRef("push"); // "push" or "pop"
  const isNavigatingRef = useRef(false);

  // Track history depth to determine direction
  const historyDepthRef = useRef(0);

  useEffect(() => {
    // Detect if this is a back navigation
    const handlePopState = () => {
      directionRef.current = "pop";
      isNavigatingRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update direction when path changes
  useEffect(() => {
    if (location.pathname !== previousPathRef.current) {
      // If not from popstate, it's a push
      if (!isNavigatingRef.current) {
        directionRef.current = "push";
      }
      isNavigatingRef.current = false;
      previousPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const getDirection = useCallback(() => directionRef.current, []);
  const setDirection = useCallback((dir) => {
    directionRef.current = dir;
  }, []);

  return (
    <NavigationDirectionContext.Provider value={{ getDirection, setDirection }}>
      {children}
    </NavigationDirectionContext.Provider>
  );
}

export function useNavigationDirection() {
  const context = useContext(NavigationDirectionContext);
  if (!context) {
    throw new Error("useNavigationDirection must be used within NavigationDirectionProvider");
  }
  return context;
}