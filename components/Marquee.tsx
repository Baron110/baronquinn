"use client";

import { useEffect, useRef } from "react";

// Renders `items` twice back-to-back and auto-scrolls through them,
// looping seamlessly. The loop point is measured directly (the second
// copy's actual on-screen position) rather than computed from
// scrollWidth/2 — dividing by 2 doesn't account for flex gaps correctly
// and was causing a small jump every cycle that looked like products
// were disappearing/duplicating rather than a smooth loop.
export default function Marquee<T>({
  items,
  renderItem,
  keyFn,
  speed = 35,
  gapClassName = "gap-5"
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyFn: (item: T, index: number) => string;
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

  // Gives the user a couple seconds after they let go before the automatic
  // motion picks back up, so it doesn't fight their finger mid-swipe.
  function scheduleResume() {
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => {
      pausedRef.current = false;
    }, 2500);
  }

  if (items.length === 0) return null;

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
      <div className={`flex ${gapClassName} shrink-0`}>
        {items.map((item, i) => (
          <div key={keyFn(item, i)} className="shrink-0">
            {renderItem(item, i)}
          </div>
        ))}
      </div>
      <div ref={secondCopyRef} className={`flex ${gapClassName} shrink-0`} aria-hidden="true">
        {items.map((item, i) => (
          <div key={`${keyFn(item, i)}-dup`} className="shrink-0">
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    </div>
  );
}
