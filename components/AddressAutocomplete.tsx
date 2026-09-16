"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
    initGooglePlaces?: () => void;
  }
}

let scriptLoadingPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    window.initGooglePlaces = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export type AddressParts = {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
};

export default function AddressAutocomplete({
  className,
  onSelect
}: {
  className?: string;
  onSelect: (address: AddressParts) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setUnavailable(true);
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => setReady(true))
      .catch(() => setUnavailable(true));
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["address_components", "formatted_address"]
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const components = place.address_components ?? [];

      const get = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name ?? "";
      const getShort = (type: string) => components.find((c: any) => c.types.includes(type))?.short_name ?? "";

      const streetNumber = get("street_number");
      const route = get("route");

      onSelect({
        street: [streetNumber, route].filter(Boolean).join(" ") || place.formatted_address || "",
        city: get("locality") || get("postal_town") || get("sublocality") || "",
        state: get("administrative_area_level_1"),
        country: getShort("country"),
        zip: get("postal_code")
      });
    });

    return () => listener.remove();
  }, [ready, onSelect]);

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        name="street"
        placeholder={unavailable ? "Street address" : "Start typing your address..."}
        className={className}
        autoComplete="off"
      />
      {unavailable && (
        <p className="text-xs text-ink/40 mt-1">
          Live address suggestions aren&apos;t configured yet — type the full address manually.
        </p>
      )}
    </div>
  );
}
