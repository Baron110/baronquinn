"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const FAQ = [
  {
    q: "How does delivery work?",
    a: "We ship internationally. Delivery times vary by destination and by item — ready items are generally quicker than customized or made-to-order pieces. Once your order ships, tracking (where available) shows on your order's receipt page."
  },
  {
    q: "How do I pay?",
    a: "By bank transfer. At checkout you get a one-time account number to transfer into — your order confirms automatically once the transfer lands, usually within a minute or two."
  },
  {
    q: "Where do I see my order status?",
    a: 'Log in and go to "Orders" in the menu. Each order has its own page with the full item list, delivery address, and tracking if it\'s been added.'
  },
  {
    q: "What's the wallet, and how is it different from paying at checkout?",
    a: "Your wallet is a balance you can top up by bank transfer ahead of time. At checkout, if your balance covers the order, you can pay instantly from it instead of doing a fresh transfer. It's also what Studio tools charge from."
  },
  {
    q: "How much do Studio tools cost?",
    a: "Each Studio generation costs a flat amount, shown on the tool's page before you run it, taken from your wallet balance. If a generation fails on our end, you're refunded automatically — you're never charged for a result you didn't get."
  },
  {
    q: "A Studio result isn't what I expected — can I get a refund?",
    a: "AI results vary generation to generation, so we can't refund based on not liking a result that was produced successfully. If the tool genuinely failed to produce anything, that's refunded automatically with no need to contact us."
  }
];

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="text-2xl mb-10">Support</h1>

        <section className="mb-14">
          <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-5">Common questions</h2>
          <div className="border border-line divide-y divide-line">
            {FAQ.map((item) => (
              <div key={item.q} className="p-4">
                <p className="text-sm mb-1.5">{item.q}</p>
                <p className="text-sm text-ink/60 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-5">Still need help?</h2>

          {sent ? (
            <div className="border border-line p-5 bg-bone">
              <p className="text-sm">Sent — we'll get back to you by email.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="h-11 px-3 border border-line text-sm focus:outline-none focus:border-ink"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="h-11 px-3 border border-line text-sm focus:outline-none focus:border-ink"
                />
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's going on? Include an order reference if this is about an order."
                rows={5}
                required
                className="w-full p-3 border border-line text-sm focus:outline-none focus:border-ink resize-none"
              />
              {error && <p className="text-xs text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="h-11 px-6 bg-ink text-paper text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send message"}
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
