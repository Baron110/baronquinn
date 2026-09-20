"use client";

import { useEffect, useRef } from "react";

export default function Marquee({
  children,
  speed = 40
}: {
  children: React.ReactNode;
  speed?: number; // pixels per second
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let raf: number;
    let last = performance.now();

    function step(now: number) {
      const el = scrollerRef.current;
      const dt = (now - last) / 1000;
      last = now;

      if (el && !pausedRef.current) {
        el.scrollLeft += speed * dt;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) {
          el.scrollLeft -= half;
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

  // Gives the user a couple seconds after they let go before the automatic
  // scroll picks back up, so it doesn't fight their finger mid-swipe.
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
      className="overflow-x-auto scrollbar-hide"
    >
      {children}
    </div>
  );
}
