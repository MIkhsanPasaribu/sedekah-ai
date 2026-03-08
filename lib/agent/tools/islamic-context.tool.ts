// ============================================================
// LangGraph Tool — Islamic Context (Ayat & Hadith)
// ============================================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Database ayat dan hadith relevan untuk konteks donasi
const ISLAMIC_QUOTES = [
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
];

const getIslamicContextSchema = z.object({
  category: z
    .enum([
      "zakat",
      "sedekah",
      "yatim",
      "bencana",
      "pendidikan",
      "pangan",
      "kesehatan",
      "ramadhan",
      "umum",
    ])
    .describe("Kategori konteks yang diinginkan"),
  type: z
    .enum(["ayat", "hadith", "doa", "any"])
    .optional()
    .describe("Jenis referensi (default: any)"),
});

/**
 * Tool untuk mendapatkan ayat Al-Quran, hadith, atau doa yang relevan
 * berdasarkan konteks donasi user.
 * Digunakan di Node 2 (CALCULATE), Node 5 (RECOMMEND), dan Node 7 (IMPACT).
 */
export const getIslamicContextTool = tool(
  async (input): Promise<string> => {
    let filtered = ISLAMIC_QUOTES.filter((q) => q.category === input.category);

    // Fallback ke umum jika kategori tidak ditemukan
    if (filtered.length === 0) {
      filtered = ISLAMIC_QUOTES.filter((q) => q.category === "umum");
    }

    // Filter by type jika specified
    if (input.type && input.type !== "any") {
      const typed = filtered.filter((q) => q.type === input.type);
      if (typed.length > 0) filtered = typed;
    }

    // Pilih random
    const selected = filtered[Math.floor(Math.random() * filtered.length)];

    if (!selected) {
      return JSON.stringify({
        success: false,
        error: "Tidak ditemukan referensi untuk konteks ini",
      });
    }

    return JSON.stringify({
      success: true,
      quote: {
        type: selected.type,
        reference: selected.reference,
        arabic: selected.arabic || null,
        translation: selected.translation,
        category: selected.category,
      },
    });
  },
  {
    name: "get_islamic_context",
    description:
      "Mendapatkan ayat Al-Quran, hadith, atau doa yang relevan berdasarkan kategori donasi. Digunakan untuk memberikan konteks spiritual di setiap tahap proses donasi.",
    schema: getIslamicContextSchema,
  },
);

/** Export database quotes untuk digunakan langsung */
export { ISLAMIC_QUOTES };
