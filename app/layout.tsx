import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SEDEKAH.AI — Amil Digital Terpercaya",
  description:
    "Platform donasi cerdas berbasis Agentic AI. Hitung zakat, verifikasi kampanye, dan salurkan sedekah dengan Trust Score AI.",
  keywords: [
    "zakat",
    "sedekah",
    "donasi",
    "AI",
    "amil digital",
    "fraud detection",
    "ramadhan",
    "infaq",
  ],
  openGraph: {
    title: "SEDEKAH.AI — Amil Digital Terpercaya",
    description:
      "Platform donasi cerdas berbasis Agentic AI. Hitung zakat, verifikasi kampanye, dan salurkan sedekah dengan Trust Score.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={cn(plusJakarta.variable, inter.variable, "font-sans", geist.variable)}>
      <head>
        {/* Amiri font for Arabic text (loaded via Google Fonts CDN) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
