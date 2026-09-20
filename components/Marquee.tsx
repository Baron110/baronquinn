"use client";

import { useEffect, useRef } from "react";

// The caller (usually a Server Component) renders the two copies of content
// itself and hands over the resulting JSX — not a function — because Next.js
// doesn't allow passing functions from a Server Component into a Client
// Component as props.
export default function Marquee({
  firstCopy,
  secondCopy,
  speed = 35,
  gapClassName = "gap-5"
}: {
  firstCopy: React.ReactNode;
  secondCopy: React.ReactNode;
  speed?: number; // pixels per second
  gapClassName?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const secondCopyRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let raf: number;
    let last = performance.now();

    function step(now: number) {
      const el = scrollerRef.current;
      const second = secondCopyRef.current;
      const dt = (now - last) / 1000;
      last = now;

      if (el && second && !pausedRef.current) {
        el.scrollLeft += speed * dt;
        const loopPoint = second.offsetLeft;
        if (loopPoint > 0 && el.scrollLeft >= loopPoint) {
          el.scrollLeft -= loopPoint;
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
      <div className={`flex ${gapClassName} shrink-0`}>{firstCopy}</div>
      <div ref={secondCopyRef} className={`flex ${gapClassName} shrink-0`} aria-hidden="true">
        {secondCopy}
      </div>
    </div>
  );
}
