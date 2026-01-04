"use client";

import type { ReactNode, CSSProperties } from "react";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

type InViewOptions = NonNullable<Parameters<typeof useInView>[1]>;
type InViewMargin = InViewOptions extends { margin?: infer M } ? M : string;

type RevealProps = {
  children: ReactNode;
  className?: string;
  once?: boolean;
  threshold?: number;
  rootMargin?: InViewMargin;
  style?: CSSProperties;
  delay?: number;
  duration?: number;
  offsetY?: number;
};

export default function Reveal({
  children,
  className,
  once = true,
  threshold = 0.1,
  rootMargin = "0px 0px -10% 0px" as InViewMargin,
  style,
  delay = 0,
  duration = 0.5,
  offsetY = 24,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, {
    once,
    amount: threshold,
    margin: rootMargin,
  });
  const reduceMotion = useReducedMotion();

  const initial = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: offsetY };
  const animate = reduceMotion || isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: offsetY };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      data-inview={reduceMotion || isInView ? "true" : "false"}
      initial={initial}
      animate={animate}
      transition={{ duration: reduceMotion ? 0 : duration, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
