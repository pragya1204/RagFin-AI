"use client"

import { useEffect, useState } from "react";

export default function MouseMoveEffect() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Optimization: Consider throttling or debouncing if performance issues arise
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Ensure this effect doesn't obscure clickable elements unnecessarily
  // The z-index (z-30) seems reasonable, assuming content is typically z-0, z-10, z-20
  // The pointer-events-none is crucial
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 print:hidden" // Added print:hidden
      style={{
        // Using primary color from Tailwind theme via CSS variables might be more themeable
        // Example: var(--primary / 0.15) if using shadcn/ui defaults
        background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.15), transparent 80%)`,
        // Alternative using CSS variable (adjust variable name if needed):
        // background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--primary) / 0.15), transparent 80%)`,
      }}
      aria-hidden="true" // Good for accessibility
    />
  );
}
