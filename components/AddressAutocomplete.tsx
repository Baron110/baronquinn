"use client";

import { useEffect, useRef, useState } from "react";

export type AddressParts = {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
};

type PhotonFeature = {
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
};

function toAddressParts(f: PhotonFeature): AddressParts {
  const p = f.properties;
  const street = [p.housenumber, p.street].filter(Boolean).join(" ") || p.name || "";
  const city = p.city || p.town || p.village || p.county || "";
  return {
    street,
    city,
    state: p.state || "",
    country: p.country || "",
    zip: p.postcode || ""
  };
}

function label(f: PhotonFeature) {
  const p = f.properties;
  const line1 = [p.housenumber, p.street].filter(Boolean).join(" ") || p.name || "";
  const rest = [p.city || p.town || p.village, p.state, p.country].filter(Boolean).join(", ");
  return rest ? `${line1}, ${rest}` : line1;
}

export default function AddressAutocomplete({
  className,
  onSelect
}: {
  className?: string;
  onSelect: (address: AddressParts) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(data.features ?? []);
        setOpen(true);
      } catch {
        // aborted or network hiccup — leave the last suggestions as-is
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(f: PhotonFeature) {
    setQuery(label(f));
    setOpen(false);
    onSelect(toAddressParts(f));
  }

  return (
    <div className="relative">
      <input
        type="text"
        name="street"
        placeholder="Start typing your address..."
        className={className}
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 bg-paper border border-line max-h-64 overflow-y-auto text-sm">
          {suggestions.map((f, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => handleSelect(f)}
                className="w-full text-left px-3 py-2 hover:bg-bone transition-colors"
              >
                {label(f)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading && <p className="text-xs text-ink/40 mt-1">Searching...</p>}
    </div>
  );
}
