"use client";

import { useEffect, useRef } from "react";

// Deliberately simple: renders children exactly once (no duplicated-content
// loop trick — that was the source of "products repeating" when a category
// had few items) and just nudges scrollLeft back and forth between the two
// ends. It's a real overflow-x-auto container, so touch/drag scrolling
// works for free from the browser — nothing custom needed for that part.
export default function Marquee({
  children,
  speed = 40,
  gapClassName = "gap-5"
}: {
  children: React.ReactNode;
  speed?: number; // pixels per second
  gapClassName?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const directionRef = useRef<1 | -1>(1);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let raf: number;
    let last = performance.now();

    function step(now: number) {
      const el = scrollerRef.current;
      const dt = (now - last) / 1000;
      last = now;

      if (el && !pausedRef.current) {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0) {
          el.scrollLeft += speed * dt * directionRef.current;
          if (el.scrollLeft >= max) {
            el.scrollLeft = max;
            directionRef.current = -1;
          } else if (el.scrollLeft <= 0) {
            el.scrollLeft = 0;
            directionRef.current = 1;
          }
        }
      }
      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  function pause() {
    pausedRef.current = true;
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
  }

  function scheduleResume() {
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => {
      pausedRef.current = false;
    }, 2500);
  }

  return (
    <div
      ref={scrollerRef}
      onPointerDown={pause}
      onPointerUp={scheduleResume}
      onPointerLeave={scheduleResume}
      onTouchStart={pause}
      onTouchEnd={scheduleResume}
      className={`flex ${gapClassName} overflow-x-auto scrollbar-hide`}
    >
      {children}
    </div>
  );
}
