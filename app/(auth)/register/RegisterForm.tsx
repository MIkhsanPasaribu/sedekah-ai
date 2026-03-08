"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { registerWithEmail } from "./actions";
import type { RegisterResult } from "./actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Particles } from "@/components/magicui/particles";

export function RegisterForm() {
  const [result, setResult] = useState<RegisterResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await registerWithEmail(formData);
      if (res) setResult(res);
    });
  }

  const fe = result?.fieldErrors;

  return (
    <div className="relative min-h-screen bg-surface-warm flex items-center justify-center p-4">
      <Particles
        className="pointer-events-none absolute inset-0"
        quantity={40}
        color="#2D6A4F"
        size={0.4}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <BlurFade delay={0.1}>
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
        </BlurFade>

        {/* Card */}
        <BlurFade delay={0.25}>
          <Card className="border border-ink-ghost bg-surface-white shadow-lg">
            <CardHeader className="px-8 pt-8 pb-0">
              <h2 className="text-xl font-bold text-ink-black font-heading text-center mb-1">
                Daftar Akun Baru
              </h2>
              <p className="text-ink-mid text-center text-sm">
                Bergabunglah untuk menunaikan zakat dengan AI
              </p>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form action={handleSubmit} className="space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-ink-dark mb-1"
                  >
                    Nama Lengkap <span className="text-danger">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Masukkan nama lengkap"
                    className="w-full rounded-xl border border-ink-ghost bg-surface-warm/50 px-4 py-3 text-ink-dark placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent transition-colors"
                    aria-describedby={fe?.name ? "name-error" : undefined}
                  />
                  {fe?.name && (
                    <p id="name-error" className="text-danger text-xs mt-1">
                      {fe.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-ink-dark mb-1"
                  >
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="nama@email.com"
                    className="w-full rounded-xl border border-ink-ghost bg-surface-warm/50 px-4 py-3 text-ink-dark placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent transition-colors"
                    aria-describedby={fe?.email ? "email-error" : undefined}
                  />
                  {fe?.email && (
                    <p id="email-error" className="text-danger text-xs mt-1">
                      {fe.email}
                    </p>
                  )}
                </div>

                {/* Nomor HP */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-ink-dark mb-1"
                  >
                    Nomor HP{" "}
                    <span className="text-ink-light font-normal">
                      (opsional)
                    </span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="081234567890"
                    className="w-full rounded-xl border border-ink-ghost bg-surface-warm/50 px-4 py-3 text-ink-dark placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent transition-colors"
                    aria-describedby={fe?.phone ? "phone-error" : undefined}
                  />
                  {fe?.phone && (
                    <p id="phone-error" className="text-danger text-xs mt-1">
                      {fe.phone}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-ink-dark mb-1"
                  >
                    Password <span className="text-danger">*</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Min. 8 karakter (huruf & angka)"
                    className="w-full rounded-xl border border-ink-ghost bg-surface-warm/50 px-4 py-3 text-ink-dark placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent transition-colors"
                    aria-describedby={
                      fe?.password ? "password-error" : undefined
                    }
                  />
                  {fe?.password ? (
                    <p id="password-error" className="text-danger text-xs mt-1">
                      {fe.password}
                    </p>
                  ) : (
                    <p className="text-ink-light text-xs mt-1">
                      Minimal 8 karakter, mengandung huruf dan angka
                    </p>
                  )}
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-ink-dark mb-1"
                  >
                    Konfirmasi Password <span className="text-danger">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Ulangi password"
                    className="w-full rounded-xl border border-ink-ghost bg-surface-warm/50 px-4 py-3 text-ink-dark placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent transition-colors"
                    aria-describedby={
                      fe?.confirmPassword ? "confirm-error" : undefined
                    }
                  />
                  {fe?.confirmPassword && (
                    <p id="confirm-error" className="text-danger text-xs mt-1">
                      {fe.confirmPassword}
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
                  {isPending ? "Mendaftarkan..." : "Daftar Sekarang"}
                </button>
              </form>

              <p className="text-center text-sm text-ink-mid mt-6">
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="text-brand-green-deep font-semibold hover:underline"
                >
                  Masuk di sini
                </Link>
              </p>
            </CardContent>
          </Card>
        </BlurFade>

        <BlurFade delay={0.4}>
          <p className="text-center text-xs text-ink-light mt-6">
            Dengan mendaftar, Anda memulai perjalanan kebaikan.
            <br />
            Bismillahirrahmanirrahim.
          </p>
        </BlurFade>
      </div>
    </div>
  );
}
