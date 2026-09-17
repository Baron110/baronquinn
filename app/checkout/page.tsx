"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressAutocomplete, { AddressParts } from "@/components/AddressAutocomplete";
import { formatNaira } from "@/lib/format";
import { ProductDTO } from "@/lib/types";

function redirectToPaygate(payRequestId: string, checksum: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://secure.paygate.co.za/payweb3/process.trans";

  const idField = document.createElement("input");
  idField.type = "hidden";
  idField.name = "PAY_REQUEST_ID";
  idField.value = payRequestId;

  const checksumField = document.createElement("input");
  checksumField.type = "hidden";
  checksumField.name = "CHECKSUM";
  checksumField.value = checksum;

  form.appendChild(idField);
  form.appendChild(checksumField);
  document.body.appendChild(form);
  form.submit();
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

export default function CheckoutPage({ searchParams }: { searchParams: { product?: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated";
  const verified = session?.user?.emailVerified ?? false;

  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
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
  const [addrState, setAddrState] = useState("");
  const [country, setCountry] = useState("");

  const [paying, setPaying] = useState<"paygate" | "wallet" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    if (session?.user?.email) setEmail(session.user.email);
    if (session?.user?.name) setSenderName(session.user.name);
  }, [session]);

  useEffect(() => {
    if (!searchParams?.product) {
      setLoadingProduct(false);
      return;
    }
    fetch(`/api/products/${searchParams.product}`)
      .then((r) => r.json())
      .then((data) => setProduct(data.product ?? null))
      .finally(() => setLoadingProduct(false));
  }, [searchParams?.product]);

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
    setAddrState(address.state);
    setCountry(address.country);
  }, []);

  async function handleResendVerification() {
    setResendStatus("sending");
    await fetch("/api/auth/resend-verification", { method: "POST" });
    setResendStatus("sent");
  }

  function validateFields() {
    if (!senderName || !senderPhone || !email || !recipientName || !street || !city || !addrState || !country) {
      setError("Fill in all required fields.");
      return false;
    }
    return true;
  }

  function orderPayload() {
    return {
      productSlug: product!.slug,
      sender: { name: senderName, phone: senderPhone, email },
      recipient: { name: recipientName, phone: recipientPhone || undefined },
      loveNote: loveNote || undefined,
      address: { street, apartment: apartment || undefined, city, state: addrState, country }
    };
  }

  async function handlePurchase() {
    if (!loggedIn || !verified || !product || !validateFields()) return;

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

      const payRes = await fetch("/api/paygate/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: order.amount, email, reference: order.reference })
      });
      const pay = await payRes.json();
      if (!payRes.ok) throw new Error(pay.error ?? "Payment could not be started.");

      redirectToPaygate(pay.payRequestId, pay.checksum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPaying(null);
    }
  }

  async function handlePayWithWallet() {
    if (!loggedIn || !verified || !product || !validateFields()) return;

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

      router.push(`/checkout/return?REFERENCE=${data.reference}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPaying(null);
    }
  }

  const canPayWithWallet = walletBalance !== null && product !== null && walletBalance >= product.price;

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-5 py-8">
        <h1 className="text-2xl mb-8">Complete order</h1>

        {!loadingProduct && !product && (
          <p className="text-sm text-red-700 mb-6">No product selected — go back and pick something to send.</p>
        )}

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
                <Field label="Street address">
                  <AddressAutocomplete className={inputClass} onSelect={handleAddressSelect} />
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
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="City">
                    <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
                  </Field>
                  <Field label="State">
                    <input className={inputClass} value={addrState} onChange={(e) => setAddrState(e.target.value)} />
                  </Field>
                  <Field label="Country">
                    <input
                      className={inputClass}
                      placeholder="e.g. NG, US"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </section>
          </div>

          <aside className="h-fit border border-line p-5 md:sticky md:top-24">
            {product && (
              <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-line">
                <span>{product.name}</span>
                <span>{formatNaira(product.price)}</span>
              </div>
            )}

            <div className="flex items-baseline justify-between text-lg pt-4 border-t border-line">
              <span>Total</span>
              <span>{formatNaira(product?.price ?? 0)}</span>
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
              disabled={!!paying || !loggedIn || !verified || !product}
              onClick={handlePurchase}
              className="mt-3 w-full bg-ink text-paper py-4 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {paying === "paygate" ? "Redirecting to PayGate..." : !loggedIn ? "Log in to purchase" : "Purchase now"}
            </button>
            <p className="text-xs text-ink/40 mt-2 text-center">
              {loggedIn ? (
                "Paid by bank transfer via PayGate. You'll be redirected to complete payment."
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
