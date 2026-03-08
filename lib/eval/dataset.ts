// ============================================================
// LangSmith Evaluation Dataset — SEDEKAH.AI
// ============================================================
// 5 Zakat Calculation Test Cases + 3 Emotional Tone Test Cases
// Upload ke LangSmith via: npx ts-node lib/eval/upload-dataset.ts
//
// Dataset ini digunakan untuk evaluasi akurasi kalkulasi zakat
// dan kualitas tone emosional respons Amil AI.

export interface EvalTestCase {
  id: string;
  category: "zakat_calculation" | "emotional_tone";
  input: string;
  expectedOutput: {
    donorIntent?: string;
    zakatAmount?: number;
    memenuhiNisab?: boolean;
    toneKeywords?: string[];
    mustContain?: string[];
    mustNotContain?: string[];
  };
  description: string;
}

export const EVAL_DATASET: EvalTestCase[] = [
  // -------------------------------------------------------
  // ZAKAT CALCULATION TEST CASES (5)
  // -------------------------------------------------------
  {
    id: "zakat-calc-01",
    category: "zakat_calculation",
    input:
      "Saya ingin bayar zakat mal. Penghasilan saya Rp 120.000.000 per tahun. Tabungan Rp 50.000.000. Tidak ada hutang.",
    expectedOutput: {
      donorIntent: "zakat_mal",
      // Penghasilan: 120jt × 2.5% = 3jt; Tabungan: 50jt < 85jt nisab = 0
      // Total: 3.000.000
      zakatAmount: 3_000_000,
      memenuhiNisab: true,
    },
    description:
      "Zakat mal dengan penghasilan di atas nisab + tabungan di bawah nisab. Hanya penghasilan yang kena zakat.",
  },
  {
    id: "zakat-calc-02",
    category: "zakat_calculation",
    input:
      "Saya punya emas 100 gram, tabungan Rp 200.000.000, dan hutang Rp 30.000.000.",
    expectedOutput: {
      donorIntent: "zakat_mal",
      // Emas: 100g > 85g nisab → 100 × 1.000.000 × 2.5% = 2.500.000
      // Tabungan: 200jt - 30jt hutang = 170jt > 85jt nisab → 170.000.000 × 2.5% = 4.250.000
      // Total: 6.750.000
      zakatAmount: 6_750_000,
      memenuhiNisab: true,
    },
    description:
      "Zakat emas + tabungan dengan pengurangan hutang. Kedua aset di atas nisab.",
  },
  {
    id: "zakat-calc-03",
    category: "zakat_calculation",
    input:
      "Saya mau bayar zakat fitrah untuk keluarga 5 orang.",
    expectedOutput: {
      donorIntent: "zakat_fitrah",
      // 5 × Rp 45.000 = 225.000
      zakatAmount: 225_000,
      memenuhiNisab: true, // zakat fitrah tidak ada nisab, selalu wajib
    },
    description:
      "Zakat fitrah standar untuk 5 jiwa. Tidak memerlukan kalkulasi nisab.",
  },
  {
    id: "zakat-calc-04",
    category: "zakat_calculation",
    input:
      "Penghasilan saya Rp 3.000.000 per bulan. Tabungan Rp 10.000.000. Tidak punya emas.",
    expectedOutput: {
      donorIntent: "zakat_mal",
      // Penghasilan: 36jt/tahun < 85jt nisab → 0
      // Tabungan: 10jt < 85jt nisab → 0
      zakatAmount: 0,
      memenuhiNisab: false,
    },
    description:
      "Penghasilan dan tabungan di bawah nisab. Agent harus menginformasikan bahwa belum wajib zakat, tetapi tetap boleh bersedekah.",
  },
  {
    id: "zakat-calc-05",
    category: "zakat_calculation",
    input:
      "Saya punya saham senilai Rp 150.000.000, crypto Rp 50.000.000, dan penghasilan Rp 180.000.000 per tahun.",
    expectedOutput: {
      donorIntent: "zakat_mal",
      // Penghasilan: 180jt > 85jt nisab → 4.500.000
      // Saham: 150jt > 85jt → 3.750.000
      // Crypto: 50jt < 85jt → 0
      // Total: 8.250.000
      zakatAmount: 8_250_000,
      memenuhiNisab: true,
    },
    description:
      "Multi-aset: saham + crypto + penghasilan. Crypto di bawah nisab (0), sisanya kena zakat.",
  },

  // -------------------------------------------------------
  // EMOTIONAL TONE TEST CASES (3)
  // -------------------------------------------------------
  {
    id: "tone-01",
    category: "emotional_tone",
    input: "Assalamu'alaikum, saya ingin bersedekah tapi penghasilan saya kecil.",
    expectedOutput: {
      toneKeywords: [
        "Alhamdulillah",
        "niat",
        "berkah",
        "Allah",
      ],
      mustContain: ["sedekah"],
      mustNotContain: ["JSON", "API", "error", "exception", "null"],
    },
    description:
      "User dengan penghasilan rendah. AI harus empatis, memvalidasi niat baik, tidak judgmental, dan menawarkan opsi sedekah sesuai kemampuan.",
  },
  {
    id: "tone-02",
    category: "emotional_tone",
    input:
      "Saya baru kehilangan pekerjaan tapi masih ingin membantu korban bencana.",
    expectedOutput: {
      toneKeywords: [
        "sabar",
        "Insya Allah",
        "pahala",
        "niat",
      ],
      mustContain: ["bencana"],
      mustNotContain: ["JSON", "API", "error", "endpoint", "server"],
    },
    description:
      "User dalam situasi sulit tapi ingin berdonasi. AI harus sangat empatis, mendoakan, dan membantu tanpa memaksa.",
  },
  {
    id: "tone-03",
    category: "emotional_tone",
    input:
      "Alhamdulillah saya baru dapat bonus besar! Saya mau salurkan sebagian untuk anak yatim dan dhuafa.",
    expectedOutput: {
      toneKeywords: [
        "Masya Allah",
        "Alhamdulillah",
        "barakallah",
        "rezeki",
      ],
      mustContain: ["yatim"],
      mustNotContain: ["JSON", "API", "error", "null", "undefined"],
    },
    description:
      "User bersyukur atas rezeki dan antusias berdonasi. AI harus ikut gembira, mengapresiasi, dan langsung membantu alokasi.",
  },
];
