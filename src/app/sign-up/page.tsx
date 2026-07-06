"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const AUTH_STATE_CHANGED_EVENT = "spurr:auth-changed";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldKey = "name" | "email" | "password" | "confirmPassword";

const GRID_OVERLAY_STYLE = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
  backgroundSize: "38px 38px",
} as const;

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const fieldErrors: Record<FieldKey, string> = {
    name:
      name.trim().length === 0
        ? "Name is required."
        : name.trim().length < 2
          ? "Name must be at least 2 characters."
          : "",
    email:
      email.trim().length === 0
        ? "Email is required."
        : !EMAIL_REGEX.test(email.trim())
          ? "Enter a valid email address (must include '@')."
          : "",
    password:
      password.length === 0
        ? "Password is required."
        : password.length < 8
          ? "Password must be at least 8 characters."
          : "",
    confirmPassword:
      confirmPassword.length === 0
        ? "Please confirm your password."
        : confirmPassword !== password
          ? "Passwords do not match."
          : "",
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
      setTouched({
        name: true,
        email: true,
        password: true,
        confirmPassword: true,
      });
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
        setFormError(result.error ?? "Failed to create account.");
        return;
      }

      window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
      router.push("/");
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
              Membership
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
              Reserve the
              <br />
              extraordinary.
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Create your account to unlock the full SPURR collection, save your
              favorites, and manage every rental in one place.
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
              Membership
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign up to access your profile and account features.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="text-sm text-gray-600">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => markTouched("name")}
                maxLength={40}
                className={inputClass("name")}
                placeholder="Your name"
                autoComplete="name"
                aria-invalid={Boolean(errorFor("name"))}
              />
              {errorFor("name") ? (
                <p className="mt-1 text-xs text-red-600">{errorFor("name")}</p>
              ) : null}
            </div>

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
                placeholder="At least 8 characters"
                autoComplete="new-password"
                aria-invalid={Boolean(errorFor("password"))}
              />
              {errorFor("password") ? (
                <p className="mt-1 text-xs text-red-600">{errorFor("password")}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm text-gray-600">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onBlur={() => markTouched("confirmPassword")}
                className={inputClass("confirmPassword")}
                placeholder="Repeat your password"
                autoComplete="new-password"
                aria-invalid={Boolean(errorFor("confirmPassword"))}
              />
              {errorFor("confirmPassword") ? (
                <p className="mt-1 text-xs text-red-600">
                  {errorFor("confirmPassword")}
                </p>
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
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-black underline underline-offset-4">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
