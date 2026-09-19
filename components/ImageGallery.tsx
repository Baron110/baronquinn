"use client";

import { useState } from "react";
import Image from "next/image";

function ArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/5] bg-bone flex items-center justify-center text-ink/20 text-sm">
        No photo
      </div>
    );
  }

  const hasMultiple = images.length > 1;

  function prev() {
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }

  function next() {
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div>
      <div className="relative aspect-[4/5] bg-bone overflow-hidden">
        <Image
          key={images[index]}
          src={images[index]}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={index === 0}
        />

        {hasMultiple && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-paper/90 flex items-center justify-center hover:bg-paper transition-colors"
            >
              <ArrowLeft />
            </button>
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-paper/90 flex items-center justify-center hover:bg-paper transition-colors"
            >
              <ArrowRight />
            </button>
            <span className="absolute bottom-3 right-3 bg-ink/80 text-paper text-xs px-2.5 py-1 rounded-full">
              {index + 1}/{images.length}
            </span>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setIndex(i)}
              className={`relative w-16 h-16 shrink-0 bg-bone overflow-hidden border ${
                i === index ? "border-ink" : "border-line"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
