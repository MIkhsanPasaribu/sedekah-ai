// ============================================================
// Islamic Quotes — Single Source of Truth
// ============================================================
// Ayat Al-Quran, hadith, doa, dan reflection messages yang digunakan
// di seluruh aplikasi SEDEKAH.AI.
//
// Usage:
//   import { getQuoteByCategory, REFLECTIONS, DONATION_REFLECTIONS } from "@/lib/islamic-quotes";

// ── Types ─────────────────────────────────────────────────────
export interface IslamicQuote {
  category:
    | "zakat"
    | "sedekah"
    | "yatim"
    | "bencana"
    | "pendidikan"
    | "pangan"
    | "kesehatan"
    | "ramadhan"
    | "umum";
  type: "ayat" | "hadith" | "doa";
  reference: string;
  arabic: string;
  translation: string;
}

export interface MuhasabahReflection {
  ayat: string;
  translation: string;
  reference: string;
  question: string;
}

// ── Quran & Hadith Database ───────────────────────────────────
export const ISLAMIC_QUOTES: IslamicQuote[] = [
  // --- Zakat ---
  {
    category: "zakat",
    type: "ayat",
    reference: "QS At-Taubah (9:103)",
    arabic:
      "خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا",
    translation:
      "Ambillah zakat dari sebagian harta mereka, dengan zakat itu kamu membersihkan dan menyucikan mereka.",
  },
  {
    category: "zakat",
    type: "ayat",
    reference: "QS Al-Baqarah (2:267)",
    arabic:
      "يَا أَيُّهَا الَّذِينَ آمَنُوا أَنفِقُوا مِن طَيِّبَاتِ مَا كَسَبْتُمْ",
    translation:
      "Hai orang-orang yang beriman, nafkahkanlah (di jalan Allah) sebagian dari hasil usahamu yang baik-baik.",
  },
  {
    category: "zakat",
    type: "hadith",
    reference: "HR Bukhari & Muslim",
    arabic: "",
    translation:
      "Islam dibangun di atas lima perkara: syahadat, shalat, zakat, puasa Ramadhan, dan haji.",
  },

  // --- Sedekah ---
  {
    category: "sedekah",
    type: "ayat",
    reference: "QS Al-Baqarah (2:261)",
    arabic:
      "مَثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ",
    translation:
      "Perumpamaan orang yang menafkahkan hartanya di jalan Allah seperti sebutir benih yang menumbuhkan tujuh tangkai, pada tiap-tiap tangkai ada seratus biji.",
  },
  {
    category: "sedekah",
    type: "hadith",
    reference: "HR Muslim",
    arabic: "",
    translation:
      "Sedekah tidak akan mengurangi harta. Tidaklah seorang hamba memaafkan kecuali Allah menambah kemuliaannya.",
  },
  {
    category: "sedekah",
    type: "ayat",
    reference: "QS Al-Hadid (57:18)",
    arabic:
      "إِنَّ الْمُصَّدِّقِينَ وَالْمُصَّدِّقَاتِ وَأَقْرَضُوا اللَّهَ قَرْضًا حَسَنًا يُضَاعَفُ لَهُمْ",
    translation:
      "Sesungguhnya orang-orang yang bersedekah baik laki-laki maupun perempuan dan meminjamkan kepada Allah pinjaman yang baik, niscaya akan dilipatgandakan bagi mereka.",
  },

  // --- Yatim ---
  {
    category: "yatim",
    type: "ayat",
    reference: "QS Al-Baqarah (2:220)",
    arabic: "وَيَسْأَلُونَكَ عَنِ الْيَتَامَىٰ ۖ قُلْ إِصْلَاحٌ لَهُمْ خَيْرٌ",
    translation:
      "Dan mereka bertanya kepadamu tentang anak-anak yatim. Katakanlah: Mengurus urusan mereka secara patut adalah baik.",
  },
  {
    category: "yatim",
    type: "hadith",
    reference: "HR Bukhari",
    arabic: "",
    translation:
      "Aku dan orang yang menanggung anak yatim (kedudukannya) di surga seperti ini. Beliau mengisyaratkan jari telunjuk dan jari tengahnya.",
  },

  // --- Bencana ---
  {
    category: "bencana",
    type: "hadith",
    reference: "HR Muslim",
    arabic: "",
    translation:
      "Perumpamaan orang-orang mukmin dalam kasih sayang dan saling mencintai ibarat satu tubuh. Jika satu anggota tubuh sakit, maka seluruh tubuh merasakan demam dan tidak bisa tidur.",
  },
  {
    category: "bencana",
    type: "ayat",
    reference: "QS Al-Hasyr (59:9)",
    arabic: "وَيُؤْثِرُونَ عَلَىٰ أَنفُسِهِمْ وَلَوْ كَانَ بِهِمْ خَصَاصَةٌ",
    translation:
      "Dan mereka mengutamakan (orang lain) atas diri mereka sendiri, sekalipun mereka memerlukan.",
  },

  // --- Pendidikan ---
  {
    category: "pendidikan",
    type: "hadith",
    reference: "HR Ibnu Majah",
    arabic: "",
    translation: "Mencari ilmu adalah kewajiban bagi setiap Muslim.",
  },
  {
    category: "pendidikan",
    type: "ayat",
    reference: "QS Al-Mujadilah (58:11)",
    arabic:
      "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ",
    translation:
      "Allah akan meninggikan orang-orang yang beriman di antara kamu dan orang-orang yang diberi ilmu beberapa derajat.",
  },

  // --- Pangan ---
  {
    category: "pangan",
    type: "hadith",
    reference: "HR Bukhari & Muslim",
    arabic: "",
    translation:
      "Barangsiapa memberi makan orang yang berpuasa, maka baginya pahala seperti pahala orang yang berpuasa tersebut.",
  },
  {
    category: "pangan",
    type: "ayat",
    reference: "QS Al-Insan (76:8-9)",
    arabic:
      "وَيُطْعِمُونَ الطَّعَامَ عَلَىٰ حُبِّهِ مِسْكِينًا وَيَتِيمًا وَأَسِيرًا",
    translation:
      'Dan mereka memberi makan kepada orang miskin, anak yatim, dan tawanan perang, dengan senang hati. "Sesungguhnya kami memberi makan kepadamu semata-mata karena Allah."',
  },

  // --- Kesehatan ---
  {
    category: "kesehatan",
    type: "hadith",
    reference: "HR Muslim",
    arabic: "",
    translation:
      "Tidaklah seorang muslim menjenguk saudaranya yang sakit, melainkan Allah mengutus 70.000 malaikat untuk mendoakannya.",
  },
  {
    category: "kesehatan",
    type: "ayat",
    reference: "QS Asy-Syu'ara (26:80)",
    arabic: "وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ",
    translation: "Dan apabila aku sakit, Dialah yang menyembuhkan aku.",
  },

  // --- Ramadhan ---
  {
    category: "ramadhan",
    type: "hadith",
    reference: "HR Bukhari & Muslim",
    arabic: "",
    translation:
      "Rasulullah SAW adalah orang paling dermawan, dan beliau lebih dermawan lagi di bulan Ramadhan.",
  },
  {
    category: "ramadhan",
    type: "ayat",
    reference: "QS Al-Baqarah (2:185)",
    arabic: "شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ",
    translation:
      "Bulan Ramadhan, bulan yang di dalamnya diturunkan Al-Quran sebagai petunjuk bagi manusia.",
  },

  // --- Umum / Pasca-Donasi ---
  {
    category: "umum",
    type: "ayat",
    reference: "QS Ibrahim (14:7)",
    arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
    translation:
      "Sesungguhnya jika kamu bersyukur, pasti Kami akan menambah (nikmat) kepadamu.",
  },
  {
    category: "umum",
    type: "doa",
    reference: "Doa Pasca-Sedekah",
    arabic:
      "اللَّهُمَّ بَارِكْ فِيمَا أَعْطَيْتَ وَاجْعَلْهُ خَالِصًا لِوَجْهِكَ",
    translation:
      "Ya Allah, berkahilah apa yang telah aku berikan dan jadikanlah ia murni karena-Mu.",
  },
  {
    category: "umum",
    type: "hadith",
    reference: "HR At-Tirmidzi",
    arabic: "",
    translation:
      "Harta tidak akan berkurang karena sedekah. Dan tidaklah seseorang berbuat zhalim lalu bersabar atasnya, kecuali Allah pasti akan menambahkan kemuliaan baginya.",
  },
];

// ── Muhasabah Reflections (used in MuhasabahModal) ───────────
export const REFLECTIONS: MuhasabahReflection[] = [
  {
    ayat: "إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ",
    translation:
      "Sesungguhnya Allah tidak menyia-nyiakan pahala orang-orang yang berbuat baik.",
    reference: "QS. At-Taubah: 120",
    question: "Siapa dalam hidup Anda yang paling ingin Anda bantu jika bisa?",
  },
  {
    ayat: "وَمَا تُقَدِّمُوا لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ اللَّهِ",
    translation:
      "Dan kebaikan apa saja yang kamu kerjakan untuk dirimu, niscaya kamu akan mendapatkannya di sisi Allah.",
    reference: "QS. Al-Baqarah: 110",
    question: "Apa yang Anda rasakan saat ini setelah berbagi dengan sesama?",
  },
  {
    ayat: "مَن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا فَيُضَاعِفَهُ لَهُ أَضْعَافًا كَثِيرَةً",
    translation:
      "Siapakah yang mau memberi pinjaman kepada Allah, pinjaman yang baik, maka Allah akan melipat gandakan.",
    reference: "QS. Al-Baqarah: 245",
    question:
      "Jika ada satu perubahan yang ingin Anda wujudkan lewat donasi, apa itu?",
  },
  {
    ayat: "لَن تَنَالُوا الْبِرَّ حَتَّىٰ تُنفِقُوا مِمَّا تُحِبُّونَ",
    translation:
      "Kamu sekali-kali tidak sampai kepada kebajikan, sebelum kamu menafkahkan sebagian harta yang kamu cintai.",
    reference: "QS. Ali Imran: 92",
    question:
      "Apa hal kecil yang bisa Anda lakukan besok untuk meneruskan kebaikan ini?",
  },
];

// ── Post-Donation Reflection Messages ────────────────────────
// Used by PostPaymentReflection and impactTrackerNode
export const DONATION_REFLECTIONS: Record<string, string> = {
  zakat_mal:
    "Alhamdulillah, zakat Anda telah membersihkan harta dan menyucikan jiwa. Semoga menjadi perisai dari api neraka.",
  zakat_fitrah:
    "Alhamdulillah, zakat fitrah Anda melengkapi ibadah puasa Ramadhan. Semoga menjadi pembersih jiwa menjelang Idul Fitri.",
  sedekah:
    "Alhamdulillah, sedekah Anda tidak akan mengurangi harta, melainkan menambahnya. Semoga Allah melipatgandakan kebaikan Anda.",
  infaq:
    "Alhamdulillah, infaq Anda menjadi cahaya di dunia dan di akhirat. Semoga Allah membalas dengan yang lebih baik.",
  wakaf:
    "Alhamdulillah, wakaf Anda menjadi amal jariyah yang pahalanya tidak terputus. Semoga mengalir terus meski Anda telah tiada.",
  bencana:
    "Alhamdulillah, bantuan Anda menjadi secercah harapan bagi saudara kita yang terdampak. Semoga Allah meringankan beban mereka.",
};

export const DEFAULT_DONATION_REFLECTION =
  "Alhamdulillah, donasi Anda telah tersalurkan. Semoga Allah melipatgandakan kebaikan Anda. 🤲";

// ── Helpers ──────────────────────────────────────────────────

/**
 * Get a quote by category and optional type.
 * Falls back to "umum" if the category has no matching entries.
 * Returns a random quote if multiple match.
 */
export function getQuoteByCategory(
  category: IslamicQuote["category"],
  type?: IslamicQuote["type"],
): IslamicQuote | null {
  let filtered = ISLAMIC_QUOTES.filter((q) => q.category === category);
  if (filtered.length === 0) {
    filtered = ISLAMIC_QUOTES.filter((q) => q.category === "umum");
  }
  if (type) {
    const typed = filtered.filter((q) => q.type === type);
    if (typed.length > 0) filtered = typed;
  }
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Get the reflection message for a given donor intent.
 * Falls back to DEFAULT_DONATION_REFLECTION.
 */
export function getDonationReflection(intent: string | null): string {
  return DONATION_REFLECTIONS[intent ?? ""] ?? DEFAULT_DONATION_REFLECTION;
}
