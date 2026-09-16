"use client";

import { useState } from "react";

export default function PasswordField({
  value,
  onChange,
  placeholder = "••••••••",
  minLength
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className="w-full h-12 pl-4 pr-11 border border-line text-sm focus:outline-none focus:border-ink transition-colors bg-paper"
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        minLength={minLength}
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.3A9.9 9.9 0 0112 5c5 0 9 4 10.5 7-0.6 1.2-1.5 2.5-2.7 3.6M6.2 6.2C4 7.6 2.4 9.6 1.5 12c1.5 3 5.5 7 10.5 7 1.4 0 2.7-.3 3.9-.8" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
