// Onboarding tour steps using driver.js
// Import this in OnboardingTour.tsx

export const ONBOARDING_STEPS = [
  {
    element: "#nav-chat",
    popover: {
      title: "💬 Chat dengan Amil AI",
      description:
        "Ceritakan kebutuhan Anda — zakat, sedekah, atau wakaf. Amil AI akan menghitung dan merekomendasikan kampanye terbaik untuk Anda.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "#nav-campaigns",
    popover: {
      title: "🌱 Jelajahi Kampanye",
      description:
        "Temukan ratusan kampanye terverifikasi dengan Trust Score transparan. Setiap kampanye diaudit oleh sistem AI kami.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "#nav-dashboard",
    popover: {
      title: "📊 Dashboard Dampak",
      description:
        "Pantau seluruh jejak kebaikan Anda: total donasi, streak Ramadhan, sertifikat, dan estimasi penerima manfaat.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "#chat-quick-actions",
    popover: {
      title: "⚡ Aksi Cepat",
      description:
        "Mulai dengan satu klik — hitung zakat, cari kampanye darurat, atau lihat rekomendasi personal AI kami.",
      side: "top" as const,
      align: "start" as const,
    },
  },
  {
    element: "#chat-input",
    popover: {
      title: "🎙️ Bisa Bicara Langsung!",
      description:
        'Klik ikon mikrofon dan bicara dalam Bahasa Indonesia. Ketik atau bicara — Amil AI selalu siap mendengar. Coba: "Hitung zakat penghasilan saya 10 juta per bulan".',
      side: "top" as const,
      align: "center" as const,
    },
  },
] as const;
