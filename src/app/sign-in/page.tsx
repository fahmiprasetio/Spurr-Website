"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

const AUTH_STATE_CHANGED_EVENT = "spurr:auth-changed";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldKey = "email" | "password";

const GRID_OVERLAY_STYLE = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
  backgroundSize: "38px 38px",
} as const;

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const fromQuery = searchParams?.get("next");
    if (
      !fromQuery ||
      !fromQuery.startsWith("/") ||
      fromQuery.startsWith("//") ||
      fromQuery.includes("\\")
    ) {
      return "/";
    }
    return fromQuery;
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    email: false,
    password: false,
  });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const fieldErrors: Record<FieldKey, string> = {
    email:
      email.trim().length === 0
        ? "Email is required."
        : !EMAIL_REGEX.test(email.trim())
          ? "Enter a valid email address (must include '@')."
          : "",
    password: password.length === 0 ? "Password is required." : "",
  };

  const hasErrors = Object.values(fieldErrors).some(Boolean);

  function markTouched(field: FieldKey) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function errorFor(field: FieldKey) {
    return touched[field] ? fieldErrors[field] : "";
  }

  function inputClass(field: FieldKey) {
    const base =
      "w-full mt-2 border px-3 py-2 text-black outline-none transition-colors";
    return errorFor(field)
      ? `${base} border-red-500 focus:border-red-500`
      : `${base} border-black/20 focus:border-black`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (hasErrors) {
      setTouched({ email: true, password: true });
      return;
    }

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
        setFormError(result.error ?? "Failed to sign in.");
        return;
      }

      window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
      router.push(nextPath);
      router.refresh();
    } catch {
      setFormError("A network error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#e8e8e8] px-4 py-24 sm:py-28">
      <div className="grid w-full max-w-4xl grid-cols-1 border border-black/10 bg-white shadow-[0_40px_90px_-50px_rgba(0,0,0,0.6)] md:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#161616] to-[#2b2b2b] p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={GRID_OVERLAY_STYLE}
          />

          <div className="relative">
            <p className="text-lg font-semibold tracking-[0.4em]">SPURR</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/50">
              Exotic &amp; Sport Cars
            </p>
          </div>

          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">
              Welcome back
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
              Continue the
              <br />
              pursuit.
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Sign in to pick up right where you left off - your saved cars and
              rentals are waiting.
            </p>
          </div>

          <div className="relative flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/40">
            <span className="h-px w-8 bg-white/30" />
            Members only
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-6 flex items-center justify-between md:hidden">
            <span className="text-sm font-semibold tracking-[0.35em]">SPURR</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">
              Sign in
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to continue.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="text-sm text-gray-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => markTouched("email")}
                className={inputClass("email")}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(errorFor("email"))}
              />
              {errorFor("email") ? (
                <p className="mt-1 text-xs text-red-600">{errorFor("email")}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="password" className="text-sm text-gray-600">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => markTouched("password")}
                className={inputClass("password")}
                placeholder="Enter password"
                autoComplete="current-password"
                aria-invalid={Boolean(errorFor("password"))}
              />
              {errorFor("password") ? (
                <p className="mt-1 text-xs text-red-600">{errorFor("password")}</p>
              ) : null}
            </div>

            {formError ? (
              <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-black py-3 text-sm uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#1a1a1a] disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-black underline underline-offset-4">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
