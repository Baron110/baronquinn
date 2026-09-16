"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordField from "@/components/PasswordField";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create account.");

      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) throw new Error("Account created — please log in.");

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bone px-5 py-16">
      <div className="w-full max-w-md bg-paper border border-line rounded-2xl shadow-sm p-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <span className="text-xl">🎁</span>
          <span className="font-display text-xl tracking-tight">Baronquinn</span>
        </Link>

        <h1 className="text-3xl leading-tight">Create your account</h1>
        <p className="text-sm text-ink/50 mt-1">Send a gift in a couple of minutes</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink/60">Full name</label>
            <input
              className="mt-1.5 w-full h-12 px-4 border border-line text-sm focus:outline-none focus:border-ink transition-colors bg-paper"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink/60">Email address</label>
            <input
              className="mt-1.5 w-full h-12 px-4 border border-line text-sm focus:outline-none focus:border-ink transition-colors bg-paper"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink/60">Password</label>
            <div className="mt-1.5">
              <PasswordField value={password} onChange={setPassword} minLength={8} />
            </div>
            <p className="text-xs text-ink/40 mt-1.5">Must be at least 8 characters</p>
          </div>

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-ink text-paper text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-center text-ink/60 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
