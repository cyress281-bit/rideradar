export function useWebViewDetection() {
  // Detect iOS WebView
  const isIOSWebView = () => {
    const ua = navigator.userAgent;
    return /AppleWebKit/.test(ua) && /Mobile/.test(ua) && !/Safari/.test(ua);
  };

  // Detect Android WebView
  const isAndroidWebView = () => {
    const ua = navigator.userAgent;
    return /Android/.test(ua) && !/Chrome/.test(ua) && !/Firefox/.test(ua);
  };

  // Check for native bridge objects
  const hasNativeBridge = () => {
    return typeof window.webkit !== "undefined" || typeof window.android !== "undefined";
  };

  const isNativeWebView = isIOSWebView() || isAndroidWebView() || hasNativeBridge();

  return { isNativeWebView, isIOSWebView, isAndroidWebView, hasNativeBridge };
}