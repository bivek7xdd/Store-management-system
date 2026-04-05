import { useEffect, useState } from "react";
import { useInView, animate } from "framer-motion";
import { useRef } from "react";

interface CountUpProps {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({
  to,
  duration = 0.8,
  prefix = "",
  suffix = "",
  decimals = 0,
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, to, {
      duration,
      ease: [0.21, 0.47, 0.32, 0.98], // Custom ease-out
      onUpdate: (value) => {
        setCount(value);
      },
    });

    return () => controls.stop();
  }, [isInView, to, duration]);

  return (
    <span ref={nodeRef}>
      {prefix}
      {count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
