import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
  Shield,
  BarChart3,
  Calculator,
  Heart,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const FEATURES = [
  {
    icon: Calculator,
    title: "Kalkulator Zakat AI",
    description:
      "Hitung zakat penghasilan, emas, tabungan, saham, crypto, dan fitrah secara otomatis dengan panduan AI yang ramah.",
    color: "bg-brand-green-ghost text-brand-green-deep",
  },
  {
    icon: Shield,
    title: "Fraud Shield AI",
    description:
      "Trust Score 0-100 untuk setiap kampanye. Analisis multi-dimensi: narasi, finansial, temporal, dan identitas.",
    color: "bg-danger-light text-danger",
  },
  {
    icon: BarChart3,
    title: "Impact Genome",
    description:
      "Lacak dampak nyata donasi Anda: berapa orang terbantu, ROI kebaikan, dan milestone spiritual Ramadhan.",
    color: "bg-brand-gold-ghost text-brand-gold-deep",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Ceritakan Niat Anda",
    description: "Chat dengan AI tentang keinginan berzakat atau bersedekah.",
  },
  {
    step: "02",
    title: "AI Hitung & Verifikasi",
    description:
      "Kalkulator zakat presisi + Fraud Shield memverifikasi kampanye.",
  },
  {
    step: "03",
    title: "Bayar & Lihat Dampak",
    description: "Pembayaran aman via Mayar + laporan dampak real-time.",
  },
];

const TESTIMONIALS = [
  {
    name: "Ustadzah Fatimah",
    role: "Pengajar Al-Quran",
    quote:
      "Akhirnya ada platform yang bikin hitung zakat jadi mudah dan transparan. MasyaAllah!",
  },
  {
    name: "Bapak Ahmad",
    role: "Donatur Rutin",
    quote:
      "Trust Score-nya bikin saya tenang. Saya tahu donasi saya benar-benar sampai.",
  },
  {
    name: "Kak Sarah",
    role: "Mahasiswi",
    quote:
      "Pertama kali bersedekah pakai AI. Pengalamannya hangat, bukan seperti transaksi biasa.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 z-50 w-full border-b border-brand-green-mid/30 bg-brand-green-deep/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt="SEDEKAH.AI"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-white">
              SEDEKAH<span className="text-brand-gold-core">.AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-brand-green-ghost transition-colors hover:text-white"
            >
              Masuk
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-brand-gold-core px-4 py-2 text-sm font-bold text-brand-green-deep transition-colors hover:bg-brand-gold-bright"
            >
              Mulai Berzakat
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="gradient-hero relative overflow-hidden pt-16">
        <div className="mx-auto flex min-h-[85vh] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
          {/* Decorative elements */}
          <div className="absolute left-10 top-32 h-64 w-64 rounded-full bg-brand-green-light/10 blur-3xl" />
          <div className="absolute right-10 bottom-32 h-48 w-48 rounded-full bg-brand-gold-core/10 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-green-mid/50 px-4 py-2 text-sm text-brand-green-ghost">
              <Sparkles className="h-4 w-4 text-brand-gold-core" />
              Powered by Agentic AI
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Amil Digital{" "}
              <span className="bg-gradient-to-r from-brand-gold-core to-brand-gold-bright bg-clip-text text-transparent">
                Terpercaya
              </span>
              <br />
              untuk Umat
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-green-ghost/80 sm:text-xl">
              Hitung zakat dengan presisi AI, verifikasi kampanye dengan Fraud
              Shield, dan salurkan sedekah dengan transparansi penuh.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/chat"
                className="flex items-center gap-2 rounded-xl bg-brand-gold-core px-8 py-4 text-base font-bold text-brand-green-deep shadow-lg transition-all hover:scale-105 hover:bg-brand-gold-bright hover:shadow-xl"
              >
                <MessageSquare className="h-5 w-5" />
                Mulai Chat dengan AI
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/campaigns"
                className="flex items-center gap-2 rounded-xl border-2 border-brand-green-ghost/30 px-8 py-4 text-base font-medium text-white transition-colors hover:border-brand-green-ghost/60 hover:bg-brand-green-mid/30"
              >
                <Heart className="h-5 w-5" />
                Lihat Kampanye
              </Link>
            </div>

            {/* Quick stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 border-t border-brand-green-mid/40 pt-8">
              <div>
                <p className="text-2xl font-bold text-brand-gold-core sm:text-3xl">
                  7
                </p>
                <p className="text-sm text-brand-green-ghost/70">
                  AI Agent Nodes
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-gold-core sm:text-3xl">
                  6
                </p>
                <p className="text-sm text-brand-green-ghost/70">Jenis Zakat</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-gold-core sm:text-3xl">
                  100
                </p>
                <p className="text-sm text-brand-green-ghost/70">
                  Trust Score AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="bg-surface-warm py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-ink-black sm:text-4xl">
              Fitur Unggulan
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink-mid">
              Tiga inovasi AI yang membuat pengalaman berzakat dan bersedekah
              lebih cerdas, aman, dan berdampak.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group rounded-2xl border border-ink-ghost bg-surface-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feat.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-ink-black">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-mid leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-surface-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-ink-black sm:text-4xl">
              Cara Kerja
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink-mid">
              Tiga langkah mudah menuju sedekah yang cerdas dan berdampak.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green-ghost">
                  <span className="text-2xl font-extrabold text-brand-green-deep">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink-black">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-ink-mid">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST SECTION ===== */}
      <section className="gradient-impact py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-ink-black sm:text-4xl">
                Kenapa Pilih{" "}
                <span className="text-brand-green-deep">SEDEKAH.AI</span>?
              </h2>
              <p className="mt-4 text-ink-mid leading-relaxed">
                Kami menggabungkan kecerdasan buatan dengan nilai-nilai Islam
                untuk menciptakan pengalaman bersedekah yang transparan dan
                bermakna.
              </p>
              <ul className="mt-6 space-y-4">
                {[
                  "Kalkulasi zakat presisi berdasarkan fiqih terkini",
                  "Fraud Shield AI memverifikasi setiap kampanye",
                  "Pembayaran aman via Mayar (QRIS, VA, e-Wallet)",
                  "Impact tracking real-time per donasi",
                  "Dilengkapi ayat Al-Quran & hadith relevan",
                  "Gratis, open source, untuk umat",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green-light" />
                    <span className="text-sm text-ink-dark">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center">
              <Image
                src="/images/asset.png"
                alt="SEDEKAH.AI Illustration"
                width={480}
                height={480}
                className="rounded-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="bg-surface-warm py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-ink-black sm:text-4xl">
              Kata Mereka
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-ink-ghost bg-surface-white p-6 shadow-sm"
              >
                <p className="text-sm italic text-ink-mid leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 border-t border-ink-ghost pt-4">
                  <p className="text-sm font-bold text-ink-black">{t.name}</p>
                  <p className="text-xs text-ink-mid">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Siap Bersedekah dengan Cerdas?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-green-ghost/80">
            Mulai percakapan dengan AI Amil dan rasakan pengalaman berzakat yang
            berbeda — transparan, aman, dan penuh berkah.
          </p>
          <Link
            href="/chat"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-gold-core px-10 py-4 text-lg font-bold text-brand-green-deep shadow-lg transition-all hover:scale-105 hover:bg-brand-gold-bright"
          >
            Bismillah, Mulai Sekarang
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-ink-ghost bg-surface-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/logo.png"
                alt="SEDEKAH.AI"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-base font-bold text-ink-dark">
                SEDEKAH<span className="text-brand-gold-core">.AI</span>
              </span>
            </div>
            <p className="text-xs text-ink-mid">
              &copy; {new Date().getFullYear()} SEDEKAH.AI — Dibuat dengan 💚
              untuk umat. Mayar Vibecoding Competition 2026.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
