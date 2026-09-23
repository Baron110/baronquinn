"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Country, State } from "country-state-city";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressAutocomplete, { AddressParts } from "@/components/AddressAutocomplete";
import { formatNaira } from "@/lib/format";
import { useCart } from "@/lib/cart-context";

const allCountries = Country.getAllCountries();

function findCountryByName(name: string) {
  const n = name.trim().toLowerCase();
  return allCountries.find((c) => c.name.toLowerCase() === n || c.isoCode.toLowerCase() === n);
}

function findStateByName(countryIso: string, name: string) {
  const n = name.trim().toLowerCase();
  return State.getStatesOfCountry(countryIso).find(
    (s) => s.name.toLowerCase() === n || s.isoCode.toLowerCase() === n
  );
}

const inputClass =
  "w-full h-11 px-3 border border-line text-sm focus:outline-none focus:border-ink transition-colors bg-paper";

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-ink/50">
        {label} {optional && <span className="normal-case">(optional)</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items: cartItems, totalPrice, clearCart } = useCart();
  const loggedIn = status === "authenticated";
  const verified = session?.user?.emailVerified ?? false;

  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [email, setEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [loveNote, setLoveNote] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [countryCode, setCountryCode] = useState(""); // drives the State dropdown
  const [addrState, setAddrState] = useState(""); // the actual name sent to the backend

  const [paying, setPaying] = useState<"paygate" | "wallet" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  const selectedCountry = allCountries.find((c) => c.isoCode === countryCode);
  const country = selectedCountry?.name ?? "";
  const statesForCountry = countryCode ? State.getStatesOfCountry(countryCode) : [];

  const zipLookupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastZipLookupKey = useRef<string>("");

  useEffect(() => {
    if (session?.user?.email) setEmail(session.user.email);
    if (session?.user?.name) setSenderName(session.user.name);
  }, [session]);

  useEffect(() => {
    if (loggedIn) {
      fetch("/api/wallet")
        .then((r) => r.json())
        .then((data) => setWalletBalance(data.balance ?? 0))
        .catch(() => setWalletBalance(0));
    }
  }, [loggedIn]);

  const handleAddressSelect = useCallback((address: AddressParts) => {
    setStreet(address.street);
    setCity(address.city);
    if (address.zip) setZip(address.zip);

    const matchedCountry = address.country ? findCountryByName(address.country) : undefined;
    if (matchedCountry) {
      setCountryCode(matchedCountry.isoCode);
      const matchedState = address.state ? findStateByName(matchedCountry.isoCode, address.state) : undefined;
      setAddrState(matchedState ? matchedState.name : address.state);
    } else {
      // Couldn't match a dropdown option — leave country/state for the
      // person to pick manually, street/city are still filled in.
      setAddrState(address.state);
    }
  }, []);

  // When both a zip and a country are present, ask a free public lookup
  // (Zippopotam — no key, no billing) for the city/state that zip belongs
  // to. Coverage varies by country; when there's no match it just fails
  // quietly and the person fills city/state in themselves.
  useEffect(() => {
    if (zipLookupRef.current) clearTimeout(zipLookupRef.current);
    if (!zip.trim() || !countryCode) return;

    const key = `${countryCode}:${zip.trim()}`;
    if (key === lastZipLookupKey.current) return;

    zipLookupRef.current = setTimeout(async () => {
      lastZipLookupKey.current = key;
      try {
        const res = await fetch(`https://api.zippopotam.us/${countryCode}/${encodeURIComponent(zip.trim())}`);
        if (!res.ok) return;
        const data = await res.json();
        const place = data.places?.[0];
        if (!place) return;

        if (place["place name"]) setCity(place["place name"]);
        const stateName = place["state"];
        if (stateName) {
          const matched = findStateByName(countryCode, stateName);
          setAddrState(matched ? matched.name : stateName);
        }
      } catch {
        // no coverage for this country/zip combo — leave fields as they are
      }
    }, 500);

    return () => {
      if (zipLookupRef.current) clearTimeout(zipLookupRef.current);
    };
  }, [zip, countryCode]);

  function handleCountryChange(iso: string) {
    setCountryCode(iso);
    setAddrState(""); // states belong to a country — previous choice no longer valid
  }

  function handleStateChange(iso: string) {
    const matched = statesForCountry.find((s) => s.isoCode === iso);
    setAddrState(matched?.name ?? "");
  }

  async function handleResendVerification() {
    setResendStatus("sending");
    await fetch("/api/auth/resend-verification", { method: "POST" });
    setResendStatus("sent");
  }

  function validateFields() {
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return false;
    }
    if (!senderName || !senderPhone || !email || !recipientName || !street || !city || !addrState || !country) {
      setError("Fill in all required fields.");
      return false;
    }
    return true;
  }

  function orderPayload() {
    return {
      items: cartItems.map((i) => ({ slug: i.slug, quantity: i.quantity })),
      sender: { name: senderName, phone: senderPhone, email },
      recipient: { name: recipientName, phone: recipientPhone || undefined },
      loveNote: loveNote || undefined,
      address: {
        street,
        apartment: apartment || undefined,
        city,
        state: addrState,
        country,
        zip: zip || undefined
      }
    };
  }

  async function handlePurchase() {
    if (!loggedIn || !verified || !validateFields()) return;

    setError(null);
    setPaying("paygate");

    try {
      const orderRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload())
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error ?? "Could not create order.");

      const vaRes = await fetch("/api/paygate/create-virtual-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: order.reference, name: senderName, email, phone: senderPhone })
      });
      const va = await vaRes.json();
      if (!vaRes.ok) throw new Error(va.error ?? "Could not start payment.");

      // Cleared here (not after payment lands) because the order already
      // exists at this point — there's no later moment to clear it client-side
      // once the person leaves for their banking app to make the transfer.
      clearCart();
      router.push(`/pay/${order.reference}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPaying(null);
    }
  }

  async function handlePayWithWallet() {
    if (!loggedIn || !verified || !validateFields()) return;

    setError(null);
    setPaying("wallet");

    try {
      const res = await fetch("/api/orders/pay-with-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload())
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not complete payment.");

      clearCart();
      router.push(`/checkout/return?REFERENCE=${data.reference}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPaying(null);
    }
  }

  const canPayWithWallet = walletBalance !== null && cartItems.length > 0 && walletBalance >= totalPrice;

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <main className="max-w-content mx-auto px-5 py-20 text-center">
          <p className="text-ink/60">Your cart is empty.</p>
          <Link
            href="/"
            className="inline-block mt-6 border border-ink px-6 py-3 text-sm hover:bg-ink hover:text-paper transition-colors"
          >
            Browse gifts
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-5 py-8">
        <h1 className="text-2xl mb-8">Complete order</h1>

        <div className="grid md:grid-cols-[1fr_320px] gap-10">
          <div className="space-y-10">
            <section>
              <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-4">Contact information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Your name">
                  <input className={inputClass} value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                </Field>
                <Field label="Your phone">
                  <input className={inputClass} type="tel" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
                </Field>
                <Field label="Email address">
                  <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
              </div>
            </section>

            <section>
              <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-4">Recipient</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Recipient name">
                  <input className={inputClass} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                </Field>
                <Field label="Recipient phone" optional>
                  <input
                    className={inputClass}
                    type="tel"
                    placeholder="Not necessary"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                  />
                </Field>
              </div>
            </section>

            <section>
              <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-4">Love note</h2>
              <textarea
                className={`${inputClass} h-28 py-2 resize-none`}
                placeholder="Write a message for the recipient"
                value={loveNote}
                onChange={(e) => setLoveNote(e.target.value)}
              />
            </section>

            <section>
              <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-4">Delivery address</h2>
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Country">
                    <select
                      className={inputClass}
                      value={countryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                    >
                      <option value="">Select a country</option>
                      {allCountries.map((c) => (
                        <option key={c.isoCode} value={c.isoCode}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="State / province">
                    <select
                      className={inputClass}
                      value={statesForCountry.find((s) => s.name === addrState)?.isoCode ?? ""}
                      onChange={(e) => handleStateChange(e.target.value)}
                      disabled={!countryCode || statesForCountry.length === 0}
                    >
                      <option value="">
                        {!countryCode
                          ? "Select a country first"
                          : statesForCountry.length === 0
                          ? "No states listed"
                          : "Select a state"}
                      </option>
                      {statesForCountry.map((s) => (
                        <option key={s.isoCode} value={s.isoCode}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Street address">
                  <AddressAutocomplete
                    className={inputClass}
                    onSelect={handleAddressSelect}
                    countryCode={countryCode || undefined}
                    countryName={country || undefined}
                    countryLat={selectedCountry ? parseFloat(selectedCountry.latitude) : undefined}
                    countryLon={selectedCountry ? parseFloat(selectedCountry.longitude) : undefined}
                  />
                  <input
                    className={`${inputClass} mt-2`}
                    placeholder="Street address (auto-filled above, editable)"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </Field>
                <Field label="Apartment / suite" optional>
                  <input className={inputClass} value={apartment} onChange={(e) => setApartment(e.target.value)} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="City">
                    <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
                  </Field>
                  <Field label="Zip / postal code" optional>
                    <input
                      className={inputClass}
                      placeholder="Fills in city/state where available"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </section>
          </div>

          <aside className="h-fit border border-line p-5 md:sticky md:top-24">
            <div className="space-y-2 pb-4 mb-4 border-b border-line">
              {cartItems.map((item) => (
                <div key={item.slug} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2">
                    {item.name}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                  </span>
                  <span className="shrink-0">{formatNaira(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-baseline justify-between text-lg">
              <span>Total</span>
              <span>{formatNaira(totalPrice)}</span>
            </div>

            {loggedIn && walletBalance !== null && (
              <p className="text-xs text-ink/40 mt-2">Wallet balance: {formatNaira(walletBalance)}</p>
            )}

            {error && <p className="text-xs text-red-700 mt-3">{error}</p>}

            {loggedIn && !verified && (
              <div className="mt-4 border border-line p-3 text-xs text-ink/70 bg-bone">
                Verify your email before checking out.{" "}
                {resendStatus === "sent" ? (
                  <span>Email sent — check your inbox.</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendStatus === "sending"}
                    className="underline underline-offset-4"
                  >
                    {resendStatus === "sending" ? "Sending..." : "Resend verification email"}
                  </button>
                )}
              </div>
            )}

            {canPayWithWallet && (
              <button
                type="button"
                disabled={!!paying || !loggedIn || !verified}
                onClick={handlePayWithWallet}
                className="mt-5 w-full border border-ink text-ink py-4 text-sm hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
              >
                {paying === "wallet" ? "Processing..." : "Pay with wallet balance"}
              </button>
            )}

            <button
              type="button"
              disabled={!!paying || !loggedIn || !verified}
              onClick={handlePurchase}
              className="mt-3 w-full bg-ink text-paper py-4 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {paying === "paygate" ? "Preparing transfer details..." : !loggedIn ? "Log in to purchase" : "Purchase now"}
            </button>
            <p className="text-xs text-ink/40 mt-2 text-center">
              {loggedIn ? (
                "Paid by bank transfer. You'll get a dedicated account number to transfer into."
              ) : (
                <>
                  <Link href="/login" className="underline underline-offset-4">
                    Log in
                  </Link>{" "}
                  to complete this order.
                </>
              )}
            </p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
