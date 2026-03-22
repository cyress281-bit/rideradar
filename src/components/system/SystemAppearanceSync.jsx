import { useEffect } from "react";

export default function SystemAppearanceSync() {
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyAppearance = (prefersDark) => {
      root.classList.toggle("dark", prefersDark);
      root.style.colorScheme = prefersDark ? "dark" : "light";
    };

    const handleChange = (event) => applyAppearance(event.matches);

    applyAppearance(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return null;
}