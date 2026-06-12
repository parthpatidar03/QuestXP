import { useEffect, useRef } from "react";

export function useMousePosition(ref, callback) {
  const callbackRef = useRef(callback);
  const rectRef = useRef(null);
  const frameRef = useRef(null);
  const latestPointRef = useRef(null);

  callbackRef.current = callback;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const updateRect = () => {
      rectRef.current = node.getBoundingClientRect();
    };

    const flush = () => {
      frameRef.current = null;

      if (latestPointRef.current) {
        callbackRef.current?.(latestPointRef.current);
      }
    };

    const handlePointerMove = (event) => {
      if (!rectRef.current) {
        updateRect();
      }

      const currentRect = rectRef.current;
      if (!currentRect) return;

      latestPointRef.current = {
        x: event.clientX - currentRect.left,
        y: event.clientY - currentRect.top,
      };

      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(flush);
      }
    };

    updateRect();

    node.addEventListener("pointerenter", updateRect);
    node.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, {
      passive: true,
      capture: true,
    });

    return () => {
      node.removeEventListener("pointerenter", updateRect);
      node.removeEventListener("pointermove", handlePointerMove);

      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [ref]);
}
