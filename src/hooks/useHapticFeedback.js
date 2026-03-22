import { useCallback, useEffect, useRef } from "react";
import { useWebViewDetection } from "./useWebViewDetection";

/**
 * Light haptic feedback hook for mobile devices.
 * Provides native-feeling tactile feedback without heavy dependencies.
 */
export function useHapticFeedback() {
  const { isWebView } = useWebViewDetection();
  const supportsRef = useRef(null);

  // Detect haptic support on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      supportsRef.current = false;
      return;
    }

    // Check if device supports vibration API
    const hasVibration = !!(
      navigator.vibrate ||
      navigator.webkitVibrate ||
      navigator.mozVibrate ||
      navigator.msVibrate
    );

    // Also check for iOS haptic feedback (UIWebView/WKWebView)
    const hasIOSHaptics =
      typeof window !== "undefined" &&
      window.webkit &&
      window.webkit.messageHandlers &&
      window.webkit.messageHandlers.haptic;

    supportsRef.current = hasVibration || hasIOSHaptics;
  }, []);

  const trigger = useCallback(
    (type = "light") => {
      // Only trigger on mobile
      if (!isWebView) return;

      // iOS haptic feedback via webkit bridge
      if (
        typeof window !== "undefined" &&
        window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.haptic
      ) {
        try {
          window.webkit.messageHandlers.haptic.postMessage({
            type,
          });
        } catch (e) {
          // Silently fail if bridge not available
        }
        return;
      }

      // Fallback to Vibration API
      if (!supportsRef.current) return;

      const patterns = {
        light: 10,
        medium: 20,
        heavy: 40,
        selection: [10, 20, 10],
        success: [10, 30, 10, 30],
        error: [50, 30, 50],
        double: [10, 10, 10],
      };

      const pattern = patterns[type] || patterns.light;

      try {
        const vibrate =
          navigator.vibrate ||
          navigator.webkitVibrate ||
          navigator.mozVibrate ||
          navigator.msVibrate;

        if (vibrate) {
          vibrate.call(navigator, pattern);
        }
      } catch (e) {
        // Silently fail if vibration not available
      }
    },
    [isWebView]
  );

  return { trigger, isSupported: supportsRef.current };
}