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
    countrycode?: string;
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
  onSelect,
  countryCode,
  countryName,
  countryLat,
  countryLon
}: {
  className?: string;
  onSelect: (address: AddressParts) => void;
  /** ISO2 code of the country already chosen in the form — results are restricted to it. */
  countryCode?: string;
  countryName?: string;
  countryLat?: number;
  countryLon?: number;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // A different country was picked — the previous search text/suggestions
  // no longer make sense, so drop them rather than leave stale results sitting.
  useEffect(() => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }, [countryCode]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3 || !countryCode) {
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
        // Bias toward the chosen country's center, and pull more raw results
        // than we'll show so there's a decent pool left after filtering
        // down to that country — Photon's global ranking otherwise happily
        // returns results from anywhere that textually matches.
        const biasParams =
          countryLat != null && countryLon != null ? `&lat=${countryLat}&lon=${countryLon}&zoom=6` : "";
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=20${biasParams}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        const features: PhotonFeature[] = data.features ?? [];

        const inCountry = features.filter((f) => {
          const cc = f.properties.countrycode?.toUpperCase();
          if (cc) return cc === countryCode.toUpperCase();
          // some results omit countrycode — fall back to matching the name
          return countryName ? f.properties.country?.toLowerCase() === countryName.toLowerCase() : false;
        });

        setSuggestions(inCountry.slice(0, 5));
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
  }, [query, countryCode, countryName, countryLat, countryLon]);

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
        placeholder={countryCode ? "Start typing your address..." : "Select a country above first"}
        className={`${className ?? ""} disabled:opacity-50 disabled:cursor-not-allowed`}
        autoComplete="off"
        disabled={!countryCode}
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
      {!loading && countryCode && query.trim().length >= 3 && suggestions.length === 0 && (
        <p className="text-xs text-ink/40 mt-1">No matches in {countryName || "that country"} — type it in manually below.</p>
      )}
    </div>
  );
}
