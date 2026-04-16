"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const fromQuery = searchParams?.get("next");
    if (!fromQuery || !fromQuery.startsWith("/")) {
      return "/profile";
    }
    return fromQuery;
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(result.error ?? "Failed to sign in.");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("A network error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-28" style={{ background: "#e8e8e8" }}>
      <section className="w-full max-w-md border border-black/10 bg-white/90 shadow-sm" style={{ padding: "2rem" }}>
        <h1 className="text-2xl font-semibold tracking-tight text-black">Welcome Back</h1>
        <p className="text-sm text-gray-500 mt-2">Sign in to continue.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="text-sm text-gray-600">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full mt-2 border border-black/20 px-3 py-2 outline-none focus:border-black"
              placeholder="you@example.com"
            />
          </label>

          <label className="text-sm text-gray-600">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full mt-2 border border-black/20 px-3 py-2 outline-none focus:border-black"
              placeholder="Enter password"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-black text-white py-3 uppercase tracking-[0.18em] text-sm disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-black underline underline-offset-4">
            Sign Up
          </Link>
        </p>
      </section>
    </main>
  );
}
