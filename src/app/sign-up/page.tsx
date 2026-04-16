"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
      setError("Konfirmasi password tidak sama.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
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
        setError(result.error ?? "Gagal membuat akun.");
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-28" style={{ background: "#e8e8e8" }}>
      <section className="w-full max-w-md border border-black/10 bg-white/90 shadow-sm" style={{ padding: "2rem" }}>
        <h1 className="text-2xl font-semibold tracking-tight text-black">Buat Akun</h1>
        <p className="text-sm text-gray-500 mt-2">Daftar untuk mengakses profil dan fitur akun.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="text-sm text-gray-600">
            Nama
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full mt-2 border border-black/20 px-3 py-2 outline-none focus:border-black"
              placeholder="Nama Anda"
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
              placeholder="Minimal 8 karakter"
            />
          </label>

          <label className="text-sm text-gray-600">
            Konfirmasi Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              className="w-full mt-2 border border-black/20 px-3 py-2 outline-none focus:border-black"
              placeholder="Ulangi password"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-black text-white py-3 uppercase tracking-[0.18em] text-sm disabled:opacity-60"
          >
            {loading ? "Membuat akun..." : "Daftar"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6">
          Sudah punya akun?{" "}
          <Link href="/sign-in" className="text-black underline underline-offset-4">
            Masuk
          </Link>
        </p>
      </section>
    </main>
  );
}
