import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function ProgressAnimata({ progress }) {
  const [width, setWidth] = useState(0);

  const barWidth = 2;
  const gap = 2;

  const bars = Math.floor(width / (barWidth + gap)) || 1;
  const containerRef = useRef(null);

  useEffect(() => {
    setWidth(containerRef.current?.offsetWidth ?? 0);
    
    const handleResize = () => {
      setWidth(containerRef.current?.offsetWidth ?? 0);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [shouldUseValue, setShouldUseValue] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShouldUseValue(true);
    }, 250);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[12px] w-full min-w-4 flex-wrap gap-[2px] overflow-hidden group/progress"
    >
      {Array.from(Array(bars)).map((_, index) => {
        const highlight = shouldUseValue ? index / bars < progress / 100 : 0;
        return (
          <div
            className={cn("h-full w-[2px] rounded-full transition-all", {
              "bg-primary duration-75 group-hover/progress:bg-primary-hover group-active/progress:bg-primary-hover":
                highlight,
              "bg-surface-3 duration-300 group-hover/progress:scale-75 group-active/progress:scale-75":
                !highlight,
            })}
            style={{
              transitionDelay: highlight ? `${index * 6}ms` : "0ms",
            }}
            key={`bar_${index}`}
          />
        );
      })}
    </div>
  );
}
