import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Zap, Code2, BadgeCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tim Pengembang — SEDEKAH.AI",
  description:
    "Kenali para pengembang di balik SEDEKAH.AI — Amil Digital Terpercaya berbasis Agentic AI.",
};

interface TeamMember {
  name: string;
  nim: string;
  prodi: string;
  title: string;
  photo: string;
  github: string;
  instagram: string;
  linkedin: string;
  portfolio: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "M. Ikhsan Pasaribu",
    nim: "23076039",
    prodi: "Pendidikan Teknik Informatika",
    title: "Full-Stack & Generative AI Engineer",
    photo: "/images/ikhsan.jpg",
    github: "https://github.com/MIkhsanPasaribu",
    instagram: "https://www.instagram.com/m.ikhsanp1/",
    linkedin: "https://www.linkedin.com/in/mikhsanpasaribu/",
    portfolio: "https://mikhsanpasaribu.vercel.app/",
  },
];

/* ── Inline SVG Social Icons ──────────────────────────────────── */

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ── Page Component ───────────────────────────────────────────── */

export default function TimPengembangPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-brand-green-deep via-[#163326] to-brand-green-deep">
      {/* ===== Animated Tech Background ===== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Circuit Pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="circuit"
                x="0"
                y="0"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 50h40M60 50h40M50 0v40M50 60v40"
                  stroke="#74C69D"
                  strokeWidth="0.5"
                  fill="none"
                />
                <circle cx="50" cy="50" r="3" fill="#74C69D" />
                <circle cx="0" cy="50" r="2" fill="#C9A227" />
                <circle cx="100" cy="50" r="2" fill="#C9A227" />
                <circle cx="50" cy="0" r="2" fill="#74C69D" />
                <circle cx="50" cy="100" r="2" fill="#74C69D" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" />
          </svg>
        </div>

        {/* Floating Orbs */}
        <div className="absolute left-10 top-20 h-72 w-72 animate-pulse rounded-full bg-brand-gold-core/15 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 animate-pulse rounded-full bg-brand-green-light/15 blur-3xl [animation-delay:2s]" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-gold-core/5 to-brand-green-light/5 blur-3xl" />
      </div>

      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-brand-green-deep/80 backdrop-blur-xl">
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
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </div>
      </nav>

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header Badge */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-brand-gold-core/20 to-brand-green-light/20 px-4 py-2 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-sm font-medium text-white/80">
                Tim Pengembang SEDEKAH.AI
              </span>
            </div>
          </div>

          {/* ===== Developer Cards ===== */}
          {TEAM_MEMBERS.map((dev) => (
            <div key={dev.nim} className="group relative mx-auto max-w-4xl">
              {/* Glow Effect */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-gold-core via-brand-green-light to-brand-gold-core opacity-25 blur-xl transition duration-500 group-hover:opacity-50" />

              {/* Main Card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/95 backdrop-blur-2xl">
                <div className="flex flex-col md:flex-row">
                  {/* Photo Section — Left 2/5 */}
                  <div className="relative min-h-[400px] md:w-2/5 md:min-h-[520px]">
                    <div className="absolute inset-0 overflow-hidden">
                      <Image
                        src={dev.photo}
                        alt={dev.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 40vw"
                        priority
                      />
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a2a]/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#1a3a2a]/80" />

                    {/* Available Badge */}
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                      </span>
                      <span className="text-xs text-white/80">Available</span>
                    </div>
                  </div>

                  {/* Content Section — Right 3/5 */}
                  <div className="flex flex-col justify-center p-8 md:w-3/5">
                    {/* The Engineer Title */}
                    <h1 className="mb-4 text-4xl font-heading font-black tracking-tight text-[#0F1923] md:text-5xl">
                      The{" "}
                      <span className="bg-gradient-to-r from-brand-gold-core to-brand-gold-bright bg-clip-text text-transparent">
                        Engineer
                      </span>
                    </h1>

                    {/* Description */}
                    <p className="mb-6 leading-relaxed text-slate-700">
                      Di balik platform SEDEKAH.AI yang menggabungkan AI dengan
                      nilai-nilai Islam, terdapat seorang engineer yang{" "}
                      <span className="font-medium text-brand-gold-core">
                        merancang
                      </span>
                      ,{" "}
                      <span className="font-medium text-brand-green-pale">
                        membangun
                      </span>
                      , dan{" "}
                      <span className="font-medium text-brand-green-light">
                        mengoptimasi
                      </span>{" "}
                      seluruh infrastruktur AI agentic dan integrasi pembayaran.
                    </p>

                    {/* Divider */}
                    <div className="mb-6 h-px bg-gradient-to-r from-brand-gold-core/40 via-slate-300 to-brand-green-light/40" />

                    {/* Developer Info */}
                    <div className="mb-6">
                      <h2 className="mb-2 text-2xl font-bold text-[#0F1923]">
                        {dev.name}
                      </h2>

                      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-gold-core to-brand-gold-bright px-4 py-2">
                        <Code2 className="h-4 w-4 text-brand-green-deep" />
                        <span className="text-sm font-bold uppercase tracking-wide text-brand-green-deep">
                          {dev.title}
                        </span>
                      </div>

                      <p className="text-slate-600">{dev.prodi}</p>

                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1">
                        <BadgeCheck className="h-4 w-4 text-slate-500" />
                        <span className="font-mono text-xs text-slate-600">
                          {dev.nim}
                        </span>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="mb-6 flex gap-3">
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="GitHub"
                        className="group/social rounded-xl border border-slate-200 bg-slate-100 p-3 transition-all duration-300 hover:border-slate-300 hover:bg-slate-200"
                      >
                        <GitHubIcon className="h-5 w-5 text-slate-600 transition-colors group-hover/social:text-slate-900" />
                      </a>
                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="LinkedIn"
                        className="group/social rounded-xl border border-slate-200 bg-slate-100 p-3 transition-all duration-300 hover:border-[#0077b5]/50 hover:bg-[#0077b5]/10"
                      >
                        <LinkedInIcon className="h-5 w-5 text-slate-600 transition-colors group-hover/social:text-[#0077b5]" />
                      </a>
                      <a
                        href={dev.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Instagram"
                        className="group/social rounded-xl border border-slate-200 bg-slate-100 p-3 transition-all duration-300 hover:border-pink-500/50 hover:bg-pink-500/10"
                      >
                        <InstagramIcon className="h-5 w-5 text-slate-600 transition-colors group-hover/social:text-pink-500" />
                      </a>
                    </div>

                    {/* CTA — Portofolio */}
                    <a
                      href={dev.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn relative inline-flex w-fit items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-gold-core via-brand-gold-bright to-brand-gold-core px-8 py-4 font-bold text-brand-green-deep shadow-2xl shadow-brand-gold-core/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-brand-gold-core/50 active:scale-[0.98]"
                    >
                      <span>Lihat Portofolio</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                      {/* Shine animation */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* ===== Mission Statement ===== */}
          <div className="mx-auto mt-20 max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-brand-gold-core" />
              <span className="text-sm text-white/50">The Mission</span>
            </div>
            <blockquote className="mb-6 text-xl italic leading-relaxed text-white/70 md:text-2xl">
              &ldquo;Membangun platform yang menggabungkan kecerdasan buatan
              dengan nilai-nilai Islam — agar setiap sedekah lebih cerdas, aman,
              dan berdampak nyata bagi umat.&rdquo;
            </blockquote>
            <p className="text-sm text-white/30">
              — Developer, SEDEKAH.AI — Mayar Vibecoding Competition 2026
            </p>
          </div>

          {/* ===== Footer ===== */}
          <div className="mt-20 border-t border-white/10 pt-10 text-center">
            <p className="text-sm text-white/30">
              Dibuat dengan 💚 untuk{" "}
              <span className="font-semibold text-brand-gold-core">
                SEDEKAH.AI
              </span>
            </p>
            <div className="mt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-white/40 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
