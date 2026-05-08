import React from 'react';
import { cn } from '../../lib/utils';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useAnimationFrame,
} from 'framer-motion';

export function InfiniteGridBackground({ className }) {
  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const speedX = 0.35;
  const speedY = 0.35;

  React.useEffect(() => {
    const onMouseMove = (event) => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    };

    const onMouseLeaveWindow = () => {
      mouseX.set(-9999);
      mouseY.set(-9999);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseout', onMouseLeaveWindow);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', onMouseLeaveWindow);
    };
  }, [mouseX, mouseY]);

  useAnimationFrame(() => {
    gridOffsetX.set((gridOffsetX.get() + speedX) % 40);
    gridOffsetY.set((gridOffsetY.get() + speedY) % 40);
  });

  const maskImage = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div
      aria-hidden="true"
      className={cn('fixed inset-0 pointer-events-none z-0 overflow-hidden', className)}
    >
      <motion.div
        className="absolute inset-0 z-0 opacity-90 text-text-muted"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </motion.div>

      <div className="absolute inset-0 z-0">
        <div className="absolute right-[-20%] top-[-20%] h-[40%] w-[40%] rounded-full bg-orange-500/16 blur-[120px]" />
        <div className="absolute right-[8%] top-[-8%] h-[22%] w-[22%] rounded-full bg-primary/18 blur-[110px]" />
        <div className="absolute left-[-10%] bottom-[-20%] h-[42%] w-[42%] rounded-full bg-blue-500/16 blur-[120px]" />
      </div>
    </div>
  );
}

function GridPattern({ offsetX, offsetY }) {
  return (
    <svg className="h-full w-full">
      <defs>
        <motion.pattern
          id="questxp-infinite-grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#questxp-infinite-grid-pattern)" />
    </svg>
  );
}
