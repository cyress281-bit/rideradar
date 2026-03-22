import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const NavigationDirectionContext = createContext();

export function NavigationDirectionProvider({ children }) {
  const location = useLocation();
  const historyStackRef = useRef([location.pathname]);
  const [direction, setDirection] = useState("push");

  // Sync with browser history stack on every navigation
  useEffect(() => {
    const currentPath = location.pathname;
    const historyStack = historyStackRef.current;
    const lastPath = historyStack[historyStack.length - 1];

    if (currentPath === lastPath) return;

    // Check if this path exists in history (back navigation)
    const existingIndex = historyStack.lastIndexOf(currentPath);

    if (existingIndex !== -1 && existingIndex < historyStack.length - 1) {
      // Back navigation detected
      setDirection("pop");
      historyStackRef.current = historyStack.slice(0, existingIndex + 1);
    } else {
      // Forward navigation
      setDirection("push");
      historyStackRef.current = [...historyStack, currentPath];
    }
  }, [location.pathname]);

  const getDirection = useCallback(() => direction, [direction]);

  return (
    <NavigationDirectionContext.Provider value={{ getDirection, direction }}>
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