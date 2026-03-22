import React, { useEffect, useRef, useState } from "react";

export default function ViewportLazyMount({
  children,
  className = "",
  rootMargin = "200px",
  placeholder,
}) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible
        ? children
        : placeholder || <div className="h-full w-full min-h-[16rem] animate-pulse rounded-2xl bg-secondary/40" />}
    </div>
  );
}