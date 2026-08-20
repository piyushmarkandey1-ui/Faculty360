"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useEffect } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1200,
  format = (n) => Math.round(n).toLocaleString("en-IN"),
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, {
      duration: duration / 1000,
      ease: [0.0, 0.0, 0.2, 1],
    });
    return controls.stop;
  }, [inView, value, duration, motionValue]);

  useEffect(() => {
    return motionValue.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = format(v);
      }
    });
  }, [motionValue, format]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
