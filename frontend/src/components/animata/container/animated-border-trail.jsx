import React from "react";
import { cn } from "../../../lib/utils";

import "./animated-border-trail.css";

const sizes = {
  sm: 5,
  md: 10,
  lg: 20,
};

export default function AnimatedBorderTrail({
  children,
  className,
  duration = "10s",
  trailColor = "var(--color-primary)",
  trailSize = "md",
  contentClassName,
  ...props
}) {
  return (
    <div
      {...props}
      className={cn("relative h-fit w-fit overflow-hidden rounded-[16px] bg-border p-[2px]", className)}
    >
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          animation: `border-trail ${duration ?? "10s"} linear infinite`,
          background: `conic-gradient(from var(--border-trail-angle) at 50% 50%, transparent ${100 - sizes[trailSize]}%, ${trailColor})`,
        }}
      />
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-[14px] bg-surface",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
