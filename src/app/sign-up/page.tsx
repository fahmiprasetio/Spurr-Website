"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const AUTH_STATE_CHANGED_EVENT = "spurr:auth-changed";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(result.error ?? "Failed to create account.");
        return;
      }

      window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
      router.push("/");
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
        <h1 className="text-2xl font-semibold tracking-tight text-black">Create Account</h1>
        <p className="text-sm text-gray-500 mt-2">Sign up to access your profile and account features.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="text-sm text-gray-600">
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={40}
              className="w-full mt-2 border border-black/20 px-3 py-2 outline-none focus:border-black"
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

          <label className="text-sm text-gray-600">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full mt-2 border border-black/20 px-3 py-2 outline-none focus:border-black"
              placeholder="you@example.com"
              autoComplete="email"
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
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </label>

          <label className="text-sm text-gray-600">
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              className="w-full mt-2 border border-black/20 px-3 py-2 outline-none focus:border-black"
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-black text-white py-3 uppercase tracking-[0.18em] text-sm disabled:opacity-60"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-black underline underline-offset-4">
            Sign In
          </Link>
        </p>
      </section>
    </main>
  );
}
