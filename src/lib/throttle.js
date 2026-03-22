/**
 * Throttle a function to run at most once per interval (in milliseconds)
 * Ensures smooth performance on lower-end mobile devices
 */
export function throttle(func, interval) {
  let lastRun = 0;
  let timeoutId = null;

  return function throttled(...args) {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun;

    const run = () => {
      lastRun = Date.now();
      func.apply(this, args);
    };

    if (timeSinceLastRun >= interval) {
      // Enough time has passed, run immediately
      if (timeoutId) clearTimeout(timeoutId);
      run();
    } else {
      // Schedule for later if not already scheduled
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          run();
        }, interval - timeSinceLastRun);
      }
    }
  };
}

/**
 * Request animation frame throttle (syncs with browser refresh rate ~60fps)
 */
export function rafThrottle(func) {
  let animationFrameId = null;
  let hasScheduled = false;

  return function throttled(...args) {
    if (!hasScheduled) {
      hasScheduled = true;
      animationFrameId = requestAnimationFrame(() => {
        hasScheduled = false;
        func.apply(this, args);
      });
    }
  };
}