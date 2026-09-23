"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatNaira } from "@/lib/format";

type Details = {
  type: "order" | "wallet";
  status: string;
  amount: number;
  payment: { accountNumber: string; accountName: string; bankName: string } | null;
};

function CopyableRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — the value is still selectable/visible
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-b-0">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
        <p className="text-lg mt-0.5">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="text-xs border border-line px-3 py-1.5 hover:border-ink transition-colors shrink-0"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function PayPage({ params }: { params: { reference: string } }) {
  const router = useRouter();
  const { reference } = params;
  const [details, setDetails] = useState<Details | null>(null);
  const [loadError, setLoadError] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/payments/details?reference=${encodeURIComponent(reference)}`);
        if (!res.ok) {
          setLoadError(true);
          return;
        }
        const data: Details = await res.json();
        setDetails(data);

        if (data.status === "paid") {
          if (pollRef.current) clearInterval(pollRef.current);
          router.push(`/checkout/return?REFERENCE=${encodeURIComponent(reference)}`);
        }
      } catch {
        // network hiccup — the interval will just try again
      }
    }

    poll();
    pollRef.current = setInterval(poll, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [reference, router]);

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-5 py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl text-center">Complete your bank transfer</h1>

          {loadError && (
            <p className="text-sm text-red-700 text-center mt-6">
              Couldn't load payment details.{" "}
              <Link href="/" className="underline underline-offset-4">
                Back to home
              </Link>
            </p>
          )}

          {!loadError && !details && <p className="text-sm text-ink/50 text-center mt-6">Loading...</p>}

          {!loadError && details && !details.payment && (
            <p className="text-sm text-ink/50 text-center mt-6">
              Payment details aren't ready yet — go back and try again from checkout.
            </p>
          )}

          {details?.payment && (
            <>
              <p className="text-sm text-ink/60 text-center mt-2">
                Transfer <span className="text-ink">{formatNaira(details.amount)}</span> to the account below from
                your banking app.
              </p>

              <div className="border border-line px-5 mt-8">
                <CopyableRow label="Bank" value={details.payment.bankName} />
                <CopyableRow label="Account number" value={details.payment.accountNumber} />
                <CopyableRow label="Account name" value={details.payment.accountName} />
              </div>

              <div className="flex items-center justify-center gap-2 mt-8 text-sm text-ink/50">
                <span className="inline-block w-2 h-2 rounded-full bg-ink/40 animate-pulse" />
                Waiting for your transfer — this page updates automatically, usually within a minute or two.
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
