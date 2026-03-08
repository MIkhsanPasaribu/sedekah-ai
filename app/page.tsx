import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
  Heart,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Marquee } from "@/components/magicui/marquee";
import { BentoGrid, BentoCard } from "@/components/magicui/bento-grid";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Particles } from "@/components/magicui/particles";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const FEATURES = [
  {
    iconName: "Calculator" as const,
    name: "Kalkulator Zakat AI",
    description:
      "Hitung zakat penghasilan, emas, tabungan, saham, crypto, dan fitrah secara otomatis dengan panduan AI yang ramah.",
    className: "lg:col-span-1",
    href: "/chat",
    cta: "Hitung Sekarang",
  },
  {
    iconName: "Shield" as const,
    name: "Fraud Shield AI",
    description:
      "Trust Score 0-100 untuk setiap kampanye. Analisis multi-dimensi: narasi, finansial, temporal, dan identitas.",
    className: "lg:col-span-2",
    href: "/campaigns",
    cta: "Lihat Kampanye",
  },
  {
    iconName: "BarChart3" as const,
    name: "Impact Genome",
    description:
      "Lacak dampak nyata donasi Anda: berapa orang terbantu, ROI kebaikan, dan milestone spiritual Ramadhan.",
    className: "lg:col-span-2",
    href: "/dashboard",
    cta: "Lihat Dashboard",
  },
  {
    iconName: "Bot" as const,
    name: "7 AI Agent Nodes",
    description:
      "Dari intake niat hingga impact tracking — 7 node AI bekerja berurutan untuk pengalaman bersedekah terbaik.",
    className: "lg:col-span-1",
    href: "/chat",
    cta: "Chat Sekarang",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Ceritakan Niat Anda",
    description: "Chat dengan AI tentang keinginan berzakat atau bersedekah.",
    icon: MessageSquare,
  },
  {
    step: "02",
    title: "AI Hitung & Verifikasi",
    description:
      "Kalkulator zakat presisi + Fraud Shield memverifikasi kampanye.",
    icon: Zap,
  },
  {
    step: "03",
    title: "Bayar & Lihat Dampak",
    description: "Pembayaran aman via Mayar + laporan dampak real-time.",
    icon: Heart,
  },
];

const TESTIMONIALS = [
  {
    name: "Ustadzah Fatimah",
    role: "Pengajar Al-Quran",
    quote:
      "Akhirnya ada platform yang bikin hitung zakat jadi mudah dan transparan. MasyaAllah!",
    avatar: "UF",
  },
  {
    name: "Bapak Ahmad",
    role: "Donatur Rutin",
    quote:
      "Trust Score-nya bikin saya tenang. Saya tahu donasi saya benar-benar sampai.",
    avatar: "BA",
  },
  {
    name: "Kak Sarah",
    role: "Mahasiswi",
    quote:
      "Pertama kali bersedekah pakai AI. Pengalamannya hangat, bukan seperti transaksi biasa.",
    avatar: "KS",
  },
  {
    name: "Pak Hasan",
    role: "Pengusaha",
    quote:
      "Menghitung zakat saham dan crypto jadi sangat mudah. Tinggal chat, langsung dapat hasilnya.",
    avatar: "PH",
  },
  {
    name: "Ibu Aisyah",
    role: "Ibu Rumah Tangga",
    quote:
      "Suka banget fitur streak Ramadhan-nya. Jadi semangat donasi setiap hari!",
    avatar: "IA",
  },
  {
    name: "Mas Rizki",
    role: "Software Engineer",
    quote:
      "Open source dan transparan — exactly what the ummah needs. Barakallahu fiikum!",
    avatar: "MR",
  },
];

function TestimonialCard({
  name,
  role,
  quote,
  avatar,
}: (typeof TESTIMONIALS)[number]) {
  return (
    <figure className="relative w-72 shrink-0 rounded-2xl border border-ink-ghost/60 bg-surface-white p-5 shadow-sm">
      <blockquote className="text-sm leading-relaxed text-ink-mid italic">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3 border-t border-ink-ghost/40 pt-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green-ghost text-xs font-bold text-brand-green-deep">
          {avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-black">{name}</p>
          <p className="text-xs text-ink-mid">{role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 z-50 w-full border-b border-brand-green-mid/20 bg-brand-green-deep/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt="SEDEKAH.AI"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-heading font-bold text-white">
              SEDEKAH<span className="text-brand-gold-core">.AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-brand-green-ghost/80 transition-colors hover:text-white"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-gold-core px-4 py-2 text-sm font-bold text-brand-green-deep transition-all hover:bg-brand-gold-bright hover:shadow-lg"
            >
              Mulai Berzakat
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="gradient-hero relative overflow-hidden pt-16">
        <Particles
          className="absolute inset-0 z-0"
          quantity={40}
          color="#c9a227"
          size={0.5}
          staticity={30}
        />

        <ContainerScroll
          titleComponent={
            <div className="relative z-10">
              <BlurFade delay={0.1} inView>
                <AnimatedGradientText className="mb-6">
                  <Sparkles className="mr-2 h-4 w-4 text-brand-gold-core" />
                  <span className="text-sm font-medium text-ink-dark">
                    Powered by Agentic AI &mdash; Ramadhan 2026
                  </span>
                </AnimatedGradientText>
              </BlurFade>

              <BlurFade delay={0.2} inView>
                <h1 className="mx-auto max-w-4xl text-4xl font-heading font-extrabold leading-tight text-white sm:text-5xl lg:text-7xl">
                  Amil Digital{" "}
                  <span className="bg-linear-to-r from-brand-gold-core via-brand-gold-bright to-brand-gold-core bg-clip-text text-transparent">
                    Terpercaya
                  </span>
                  <br />
                  untuk Umat
                </h1>
              </BlurFade>

              <BlurFade delay={0.35} inView>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-green-ghost/80 sm:text-xl">
                  Hitung zakat dengan presisi AI, verifikasi kampanye dengan
                  Fraud Shield, dan salurkan sedekah dengan transparansi penuh.
                </p>
              </BlurFade>

              <BlurFade delay={0.5} inView>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link href="/chat">
                    <ShimmerButton className="px-8 py-4 text-base">
                      <MessageSquare className="h-5 w-5" />
                      Mulai Chat dengan AI
                      <ArrowRight className="h-4 w-4" />
                    </ShimmerButton>
                  </Link>
                  <Link
                    href="/campaigns"
                    className="flex items-center gap-2 rounded-full border-2 border-brand-green-ghost/30 px-8 py-4 text-base font-medium text-white transition-all hover:border-brand-green-ghost/60 hover:bg-brand-green-mid/20"
                  >
                    <Heart className="h-5 w-5" />
                    Lihat Kampanye
                  </Link>
                </div>
              </BlurFade>

              {/* Animated stats */}
              <BlurFade delay={0.65} inView>
                <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-8 border-t border-brand-green-mid/30 pt-8">
                  <div>
                    <p className="text-3xl font-heading font-bold text-brand-gold-core sm:text-4xl">
                      <NumberTicker value={7} />
                    </p>
                    <p className="mt-1 text-sm text-brand-green-ghost/60">
                      AI Agent Nodes
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-heading font-bold text-brand-gold-core sm:text-4xl">
                      <NumberTicker value={6} />
                    </p>
                    <p className="mt-1 text-sm text-brand-green-ghost/60">
                      Jenis Zakat
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-heading font-bold text-brand-gold-core sm:text-4xl">
                      <NumberTicker value={100} />
                    </p>
                    <p className="mt-1 text-sm text-brand-green-ghost/60">
                      Trust Score AI
                    </p>
                  </div>
                </div>
              </BlurFade>
            </div>
          }
        >
          {/* Container scroll card — elegant dashboard preview */}
          <div className="flex h-full flex-col items-center justify-center p-4 sm:p-8">
            <div className="relative w-full max-w-4xl">
              {/* Main content card */}
              <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-green-deep to-brand-green-mid shadow-2xl">
                {/* Header section */}
                <div className="border-b border-brand-green-light/20 bg-brand-green-deep/50 px-6 py-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/images/logo.png"
                      alt="SEDEKAH.AI"
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                    <div>
                      <h3 className="text-lg font-heading font-bold text-white">
                        SEDEKAH.AI Dashboard
                      </h3>
                      <p className="text-xs text-brand-green-ghost/70">
                        Amil Digital Terpercaya berbasis AI
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content grid */}
                <div className="grid gap-4 p-6 sm:grid-cols-3">
                  {/* Stat cards */}
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs text-brand-green-ghost/70">
                      Total Donasi
                    </p>
                    <p className="mt-1 text-2xl font-heading font-bold text-white">
                      Rp 24.5 Jt
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs text-brand-green-ghost/70">
                      Trust Score
                    </p>
                    <p className="mt-1 text-2xl font-heading font-bold text-brand-gold-core">
                      98/100
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs text-brand-green-ghost/70">
                      Terbantu
                    </p>
                    <p className="mt-1 text-2xl font-heading font-bold text-white">
                      1,245
                    </p>
                  </div>
                </div>

                {/* Chat preview */}
                <div className="mx-6 mb-6 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gold-pale">
                      <span className="text-xs font-bold">AI</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-brand-green-ghost/70">
                        Amil AI
                      </p>
                      <p className="mt-1 text-sm text-white/90">
                        Assalamu'alaikum! Saya akan membantu menghitung zakat
                        dan merekomendasikan kampanye terpercaya untuk Anda 💚
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand-gold-core/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-brand-green-light/20 blur-3xl" />
            </div>
          </div>
        </ContainerScroll>
      </section>

      {/* ===== FEATURES — BENTO GRID ===== */}
      <section className="bg-surface-warm py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BlurFade delay={0.1} inView>
            <div className="text-center">
              <h2 className="text-3xl font-heading font-bold text-ink-black sm:text-4xl">
                Fitur Unggulan
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-ink-mid">
                Empat inovasi AI yang membuat pengalaman berzakat dan bersedekah
                lebih cerdas, aman, dan berdampak.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.25} inView>
            <BentoGrid className="mt-14 auto-rows-[18rem] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feat) => (
                <BentoCard key={feat.name} {...feat} />
              ))}
            </BentoGrid>
          </BlurFade>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-surface-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BlurFade delay={0.1} inView>
            <div className="text-center">
              <h2 className="text-3xl font-heading font-bold text-ink-black sm:text-4xl">
                Cara Kerja
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-ink-mid">
                Tiga langkah mudah menuju sedekah yang cerdas dan berdampak.
              </p>
            </div>
          </BlurFade>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <BlurFade key={step.step} delay={0.15 + i * 0.15} inView>
                  <div className="group relative text-center">
                    <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-green-ghost transition-all group-hover:scale-105 group-hover:shadow-md">
                      <Icon className="h-8 w-8 text-brand-green-deep" />
                      <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-gold-core text-xs font-bold text-brand-green-deep shadow">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-heading font-bold text-ink-black">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-ink-mid leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== TRUST SECTION ===== */}
      <section className="gradient-impact py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <BlurFade delay={0.1} inView>
              <div>
                <h2 className="text-3xl font-heading font-bold text-ink-black sm:text-4xl">
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
                  ].map((item, i) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green-light" />
                      <span className="text-sm text-ink-dark">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </BlurFade>

            <BlurFade delay={0.3} inView>
              <div className="relative flex justify-center">
                {/* Trust illustration with logo */}
                <div className="relative rounded-3xl bg-linear-to-br from-brand-green-ghost to-white p-8 shadow-lg">
                  <div className="flex flex-col items-center gap-6">
                    <div className="rounded-2xl bg-brand-green-deep p-6">
                      <Image
                        src="/images/logo.png"
                        alt="SEDEKAH.AI"
                        width={180}
                        height={180}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-success-light px-4 py-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="text-sm font-medium text-success">
                          Terverifikasi & Terpercaya
                        </span>
                      </div>
                    </div>
                  </div>
                  <BorderBeam size={300} duration={12} />
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS — MARQUEE ===== */}
      <section className="bg-surface-warm py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BlurFade delay={0.1} inView>
            <div className="text-center">
              <h2 className="text-3xl font-heading font-bold text-ink-black sm:text-4xl">
                Kata Mereka
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-ink-mid">
                Pengalaman nyata dari pengguna SEDEKAH.AI di bulan Ramadhan.
              </p>
            </div>
          </BlurFade>

          <div className="relative mt-14">
            <Marquee pauseOnHover className="[--duration:35s]">
              {TESTIMONIALS.map((t) => (
                <TestimonialCard key={t.name} {...t} />
              ))}
            </Marquee>
            <Marquee reverse pauseOnHover className="mt-4 [--duration:35s]">
              {[...TESTIMONIALS].reverse().map((t) => (
                <TestimonialCard key={t.name} {...t} />
              ))}
            </Marquee>
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-surface-warm to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-surface-warm to-transparent" />
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="gradient-hero relative overflow-hidden py-24 sm:py-32">
        <Particles
          className="absolute inset-0 z-0"
          quantity={25}
          color="#c9a227"
          size={0.4}
          staticity={40}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
          <BlurFade delay={0.1} inView>
            <h2 className="text-3xl font-heading font-bold text-white sm:text-5xl">
              Siap Bersedekah dengan Cerdas?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-brand-green-ghost/80">
              Mulai percakapan dengan AI Amil dan rasakan pengalaman berzakat
              yang berbeda — transparan, aman, dan penuh berkah.
            </p>
            <div className="mt-10">
              <Link href="/chat">
                <ShimmerButton
                  className="mx-auto px-10 py-4 text-lg"
                  shimmerColor="#e8c55a"
                >
                  Bismillah, Mulai Sekarang
                  <ArrowRight className="h-5 w-5" />
                </ShimmerButton>
              </Link>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-ink-ghost/50 bg-surface-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/logo.png"
                alt="SEDEKAH.AI"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-base font-heading font-bold text-ink-dark">
                SEDEKAH<span className="text-brand-gold-core">.AI</span>
              </span>
            </div>
            <p className="text-xs text-ink-mid">
              &copy; 2026 SEDEKAH.AI — Dibuat dengan 💚 untuk umat. Mayar
              Vibecoding Competition 2026.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
