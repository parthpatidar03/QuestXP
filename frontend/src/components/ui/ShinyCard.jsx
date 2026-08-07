import React, { useRef } from "react";
import { useMousePosition } from "../../hooks/useMousePosition";

export function ShinyCard({ children, className = "", gradientColor = "rgba(227, 58, 46, 0.10)", ...props }) {
  const ref = useRef(null);

  useMousePosition(ref, ({ x, y }) => {
    if (ref.current) {
      ref.current.style.setProperty("--x", `${x}px`);
      ref.current.style.setProperty("--y", `${y}px`);
    }
  });

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden group/shiny ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover/shiny:opacity-100"
        style={{
          background: `radial-gradient(circle 250px at var(--x, 50%) var(--y, 50%), ${gradientColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}
