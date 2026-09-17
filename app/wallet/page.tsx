"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatNaira } from "@/lib/format";

type WalletTx = {
  _id: string;
  type: "deposit" | "debit";
  status: "pending" | "completed" | "failed";
  amount: number;
  reference: string;
  description?: string;
  createdAt: string;
};

type WalletData = {
  balance: number;
  totalTransactions: number;
  totalSpent: number;
  transactions: WalletTx[];
};

const MIN_DEPOSIT = 100;
const MAX_DEPOSIT = 1000000;

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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line p-5">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="text-2xl mt-2">{value}</p>
    </div>
  );
}

export default function WalletPage() {
  const { data: session, status } = useSession();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [amount, setAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadWallet() {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then(setWallet)
      .catch(() => setWallet(null));
  }

  useEffect(() => {
    if (status === "authenticated") loadWallet();
  }, [status]);

  async function handleDeposit() {
    const numAmount = Number(amount);
    if (!numAmount || numAmount < MIN_DEPOSIT || numAmount > MAX_DEPOSIT) {
      setError(`Amount must be between ${formatNaira(MIN_DEPOSIT)} and ${formatNaira(MAX_DEPOSIT)}`);
      return;
    }
    setError(null);
    setPaying(true);

    try {
      const depositRes = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount })
      });
      const deposit = await depositRes.json();
      if (!depositRes.ok) throw new Error(deposit.error ?? "Could not start deposit.");

      const payRes = await fetch("/api/paygate/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount, email: session?.user?.email, reference: deposit.reference })
      });
      const pay = await payRes.json();
      if (!payRes.ok) throw new Error(pay.error ?? "Payment could not be started.");

      redirectToPaygate(pay.payRequestId, pay.checksum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPaying(false);
    }
  }

  if (status === "unauthenticated") {
    return (
      <>
        <Header />
        <main className="max-w-content mx-auto px-5 py-20 text-center">
          <p className="text-ink/60">
            <Link href="/login" className="underline underline-offset-4">
              Log in
            </Link>{" "}
            to view your wallet.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-5 py-10">
        <h1 className="text-3xl">Wallet</h1>
        <p className="text-ink/60 mt-1">Manage your gift-sending funds and track your expenses.</p>

        <div className="grid md:grid-cols-[1fr_320px] gap-8 mt-8">
          <div className="border border-line p-6">
            <h2 className="text-lg">Add funds</h2>
            <p className="text-sm text-ink/50 mt-1">Top up your wallet to send gifts instantly.</p>

            <div className="mt-5">
              <label className="text-xs uppercase tracking-wide text-ink/50">Amount to add</label>
              <input
                type="number"
                className="mt-1.5 w-full h-12 px-4 border border-line text-lg focus:outline-none focus:border-ink"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-ink/40 mt-1.5">
                Min: {formatNaira(MIN_DEPOSIT)} · Max: {formatNaira(MAX_DEPOSIT)}
              </p>
            </div>

            {error && <p className="text-xs text-red-700 mt-3">{error}</p>}

            <button
              onClick={handleDeposit}
              disabled={paying}
              className="mt-5 w-full h-12 bg-ink text-paper text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {paying ? "Redirecting to PayGate..." : "Proceed to secure payment"}
            </button>
            <p className="text-xs text-ink/40 mt-2 text-center">Paid by bank transfer via PayGate.</p>
          </div>

          <div className="flex flex-col gap-4">
            <StatCard label="Current balance" value={formatNaira(wallet?.balance ?? 0)} />
            <StatCard label="Total transactions" value={String(wallet?.totalTransactions ?? 0)} />
            <StatCard label="Total spent" value={formatNaira(wallet?.totalSpent ?? 0)} />
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-lg mb-4">Recent activity</h2>
          {!wallet || wallet.transactions.length === 0 ? (
            <p className="text-sm text-ink/40">
              No transactions yet. Your transaction history will appear here once you make a deposit or send a gift.
            </p>
          ) : (
            <div className="border border-line overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-line text-left text-ink/50 text-xs uppercase tracking-wide">
                    <th className="p-3">Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {wallet.transactions.map((t) => (
                    <tr key={t._id} className="border-b border-line last:border-b-0">
                      <td className="p-3 capitalize">{t.type}</td>
                      <td className="p-3 text-ink/60">{t.description ?? "—"}</td>
                      <td className="p-3">
                        {t.type === "debit" ? "-" : "+"}
                        {formatNaira(t.amount)}
                      </td>
                      <td
                        className={`p-3 capitalize ${
                          t.status === "completed"
                            ? "text-green-700"
                            : t.status === "failed"
                            ? "text-red-700"
                            : "text-ink/50"
                        }`}
                      >
                        {t.status}
                      </td>
                      <td className="p-3 whitespace-nowrap text-ink/50">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
