import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TAB_ROOTS = ["/", "/grid", "/feed", "/messages", "/profile"];

/**
 * Intercepts the Android hardware back button (popstate).
 * - If the current path is NOT a tab root, navigates back in the stack.
 * - If already at a tab root, lets the default happen (app minimize/close on Android).
 */
export default function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e) => {
      const isTabRoot = TAB_ROOTS.includes(location.pathname);
      if (!isTabRoot) {
        e.preventDefault();
        navigate(-1);
      }
      // At a tab root → allow default (OS handles back / app minimize)
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [location.pathname, navigate]);
}