import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Cross-device geolocation hook.
 * Handles iOS Safari, Android Chrome, desktop browsers.
 * Tries high accuracy first; falls back to lower accuracy on error/timeout.
 */
export default function useGeolocation({ onPosition, enabled = true } = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);
  const fallbackRef = useRef(false);
  const onPositionRef = useRef(onPosition);

  useEffect(() => {
    onPositionRef.current = onPosition;
  }, [onPosition]);

  const startWatch = useCallback((highAccuracy) => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(coords);
        setError(null);
        onPositionRef.current?.(coords.lat, coords.lng);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location permission denied. Please enable location access in your browser settings.");
          return;
        }
        // On timeout or unavailable — try fallback (low accuracy) once
        if (!fallbackRef.current && highAccuracy) {
          fallbackRef.current = true;
          if (watchIdRef.current != null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }
          startWatch(false);
          return;
        }
        setError("Unable to determine your location.");
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 10000 : 20000,
        maximumAge: highAccuracy ? 5000 : 30000,
      }
    );
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fallbackRef.current = false;
    startWatch(true);

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, startWatch]);

  return { position, error };
}