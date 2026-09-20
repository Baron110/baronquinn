"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full h-11 px-3 bg-transparent border border-white/20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/60 transition-colors";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });

    if (res?.error) {
      setLoading(false);
      setError("Incorrect email or password.");
      return;
    }

    // Credentials were valid, but this form is admin-only — check the role
    // before letting them into the panel. Signing out anyone who isn't an
    // admin keeps this from becoming a second, less obvious customer login.
    const check = await fetch("/api/auth/session");
    const freshSession = await check.json();

    if (freshSession?.user?.role !== "admin") {
      await signOut({ redirect: false });
      setLoading(false);
      setError("This account doesn't have admin access.");
      return;
    }

    router.push("/08088adminpanel");
    router.refresh();
  }

  if (session?.user?.role === "admin") {
    router.push("/08088adminpanel");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-5">
      <div className="w-full max-w-sm">
        <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-8">Baronquinn admin</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-white text-ink text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
