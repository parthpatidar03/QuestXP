import { useInView, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";

import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Formatter = {
  number: (value) => Intl.NumberFormat("en-US").format(+value.toFixed(0)),
  currency: (value) =>
    Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(+value.toFixed(0)),
};

export default function Counter({
  format = Formatter.number,
  targetValue = 1000,
  direction = "up",
  delay = 0,
  className,
}) {
  const ref = useRef(null);
  const isGoingUp = direction === "up";
  const numTarget = Number(targetValue) || 0;
  const motionValue = useMotionValue(isGoingUp ? 0 : numTarget);

  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });
  const isInView = useInView(ref, { margin: "0px", once: true });

  useEffect(() => {
    if (!isInView) {
      return;
    }

    const timer = setTimeout(() => {
      motionValue.set(isGoingUp ? numTarget : 0);
    }, delay);

    return () => clearTimeout(timer);
  }, [isInView, delay, isGoingUp, numTarget, motionValue]);

  useEffect(() => {
    springValue.on("change", (value) => {
      if (ref.current) {
        ref.current.textContent = format ? format(value) : String(value);
      }
    });
  }, [springValue, format]);

  const initialDisplay = format
    ? format(isGoingUp ? 0 : numTarget)
    : String(isGoingUp ? 0 : numTarget);

  return (
    <span ref={ref} className={cn("text-4xl font-bold text-text-primary", className)}>
      {initialDisplay}
    </span>
  );
}
