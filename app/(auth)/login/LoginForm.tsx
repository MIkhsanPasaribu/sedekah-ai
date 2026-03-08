"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { signInWithEmail } from "./actions";
import type { LoginResult } from "./actions";

interface LoginFormProps {
  message?: string;
}

export function LoginForm({ message }: LoginFormProps) {
  const [result, setResult] = useState<LoginResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await signInWithEmail(formData);
      if (res) setResult(res);
    });
  }

  return (
    <div className="min-h-screen bg-surface-warm flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logo.png"
              alt="SEDEKAH.AI Logo"
              width={104}
              height={104}
              className="rounded-2xl"
              priority
            />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-black font-heading">
            SEDEKAH<span className="text-brand-gold-core">.AI</span>
          </h1>
          <p className="text-ink-mid mt-2">
            Amil Digital Terpercaya berbasis AI
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-white rounded-2xl shadow-lg border border-ink-ghost p-8">
          <h2 className="text-xl font-bold text-ink-black font-heading text-center mb-1">
            Assalamu&apos;alaikum
          </h2>
          <p className="text-ink-mid text-center text-sm mb-6">
            Masuk untuk melanjutkan ibadah Anda
          </p>

          {/* Pesan dari redirect (misal: setelah daftar sukses) */}
          {message && (
            <div className="bg-success-light border border-success rounded-xl px-4 py-3 text-success text-sm mb-4">
              {message}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink-dark mb-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-ink-ghost px-4 py-3 text-ink-dark placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
                aria-describedby={
                  result?.fieldErrors?.email ? "email-error" : undefined
                }
              />
              {result?.fieldErrors?.email && (
                <p id="email-error" className="text-danger text-xs mt-1">
                  {result.fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink-dark mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Masukkan password"
                className="w-full rounded-xl border border-ink-ghost px-4 py-3 text-ink-dark placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
                aria-describedby={
                  result?.fieldErrors?.password ? "password-error" : undefined
                }
              />
              {result?.fieldErrors?.password && (
                <p id="password-error" className="text-danger text-xs mt-1">
                  {result.fieldErrors.password}
                </p>
              )}
            </div>

            {/* General error */}
            {result?.error && (
              <div className="bg-danger-light border border-danger rounded-xl px-4 py-3 text-danger text-sm">
                {result.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-brand-green-deep text-white font-semibold py-3 rounded-xl hover:bg-brand-green-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="text-center text-sm text-ink-mid mt-6">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-brand-green-deep font-semibold hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-ink-light mt-6">
          Dengan masuk, Anda menyetujui bahwa setiap niat baik
          <br />
          dimulai dari langkah pertama. Bismillah.
        </p>
      </div>
    </div>
  );
}
