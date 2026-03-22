/**
 * Hook to lock viewport scrolling and prevent bounce behavior on mobile WebViews.
 * Works with overscroll-behavior CSS and adds additional safeguards.
 */
export function useViewportLock() {
  if (typeof window === 'undefined') return;

  // Prevent vertical overscroll bounce on iOS
  const preventOverscroll = (e) => {
    // Allow scrolling within scrollable elements
    const target = e.target;
    const isScrollable =
      target.scrollHeight > target.clientHeight ||
      target.parentElement?.scrollHeight > target.parentElement?.clientHeight;

    if (!isScrollable && (e.touches.length > 1 || e.scale !== 1)) {
      e.preventDefault();
    }
  };

  // Lock viewport on mount
  if (typeof window !== 'undefined') {
    document.addEventListener('touchmove', preventOverscroll, { passive: false });
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.removeEventListener('touchmove', preventOverscroll);
      document.body.style.overscrollBehavior = '';
    };
  }
}