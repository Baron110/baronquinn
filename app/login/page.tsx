"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordField from "@/components/PasswordField";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });

    setLoading(false);
    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bone px-5 py-16">
      <div className="w-full max-w-md bg-paper border border-line rounded-2xl shadow-sm p-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <span className="font-display text-xl tracking-tight">Baronquinn</span>
        </Link>

        <h1 className="text-3xl leading-tight">Welcome back</h1>
        <p className="text-sm text-ink/50 mt-1">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink/60">Email</label>
            <input
              className="mt-1.5 w-full h-12 px-4 border border-line text-sm focus:outline-none focus:border-ink transition-colors bg-paper"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink/60">Password</label>
            <div className="mt-1.5">
              <PasswordField value={password} onChange={setPassword} />
            </div>
          </div>

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-ink text-paper text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-center text-ink/60 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-ink underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
