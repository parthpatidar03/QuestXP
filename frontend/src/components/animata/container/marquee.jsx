import { cn } from "../../../lib/utils";
import React from "react";
import "./marquee.css";

export default function Marquee({
  children,
  vertical = false,
  repeat = 5,
  pauseOnHover = false,
  reverse = false,
  className,
  applyMask = true,
  ...props
}) {
  return (
    <div
      {...props}
      className={cn(
 "group/marquee relative flex h-full w-full p-2 [--duration:10s] [--gap:12px] [gap:var(--gap)] overflow-hidden",
        {
          "flex-col": vertical,
          "flex-row": !vertical,
        },
        className,
      )}
    >
      {Array.from({ length: repeat }).map((_, index) => (
        <div
          key={`item-${index}`}
          className={cn("flex shrink-0 [gap:var(--gap)]", {
            "marquee-pause-on-hover": pauseOnHover,
            "marquee-horizontal flex-row": !vertical,
            "marquee-vertical flex-col": vertical,
          })}
          style={reverse ? { animationDirection: "reverse" } : undefined}
        >
          {children}
        </div>
      ))}
      {applyMask && (
        <div
          className={cn(
 "pointer-events-none absolute inset-0 z-10 h-full w-full from-white/50 from-5% via-transparent via-50% to-white/50 to-95% dark:from-gray-800/50 dark:via-transparent dark:to-gray-800/50",
            {
              "bg-linear-to-b": vertical,
              "bg-linear-to-r": !vertical,
            },
          )}
        />
      )}
    </div>
  );
}
