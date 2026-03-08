import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// Admin client — butuh SUPABASE_SERVICE_ROLE_KEY (bukan anon key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ===== SEED USER ACCOUNTS =====
// Semua akun ini akan dibuat di Supabase Auth DAN Prisma DB
// Password: Sedekah2026 (memenuhi validasi: 8+ karakter, huruf & angka)
const SEED_USERS = [
  {
    email: "ahmad.fauzi@sedekah.ai",
    password: "Sedekah2026",
    name: "Ahmad Fauzi",
    mobile: "081234567890",
    mayarCustomerId: "cust_ahmad_fauzi_001",
    ramadhanStreak: 25,
  },
  {
    email: "siti.rahmah@sedekah.ai",
    password: "Sedekah2026",
    name: "Siti Rahmah",
    mobile: "082345678901",
    mayarCustomerId: "cust_siti_rahmah_002",
    ramadhanStreak: 15,
  },
  {
    email: "budi.santoso@sedekah.ai",
    password: "Sedekah2026",
    name: "Budi Santoso",
    mobile: "083456789012",
    mayarCustomerId: null,
    ramadhanStreak: 5,
  },
  {
    email: "rizky.pratama@sedekah.ai",
    password: "Sedekah2026",
    name: "Rizky Pratama",
    mobile: "084567890123",
    mayarCustomerId: "cust_rizky_pratama_004",
    ramadhanStreak: 12,
  },
  {
    email: "fatimah.azzahra@sedekah.ai",
    password: "Sedekah2026",
    name: "Fatimah Az-Zahra",
    mobile: "085678901234",
    mayarCustomerId: "cust_fatimah_azzahra_005",
    ramadhanStreak: 28,
  },
];

// ===== ADMIN ACCOUNTS =====
// Role: admin — akses dashboard admin, disbursement, dll.
// Password: Admin@Sedekah2026
const SEED_ADMINS = [
  {
    email: "admin@sedekah.ai",
    password: "Admin@Sedekah2026",
    name: "Admin SEDEKAH.AI",
    mobile: "081111111111",
  },
];

// Helper: tanggal relative ke Ramadhan 2026 (mulai 17 Feb)
function ramadhanDate(day: number, hour = 18, minute = 30): Date {
  const d = new Date("2026-02-17T00:00:00Z");
  d.setDate(d.getDate() + day - 1);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main(): Promise<void> {
  console.log("🌱 Mulai seeding database SEDEKAH.AI...");

  // ===== HAPUS DATA LAMA =====
  await prisma.fraudFlag.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.givingJourney.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.lazPartner.deleteMany();
  await prisma.user.deleteMany();

  // Hapus akun Supabase Auth seed lama (jika ada)
  console.log("🔑 Membersihkan akun Supabase Auth lama...");
  const allSeedEmails = [
    ...SEED_USERS.map((u) => u.email),
    ...SEED_ADMINS.map((u) => u.email),
  ];
  for (const email of allSeedEmails) {
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const found = existing?.users?.find((au) => au.email === email);
    if (found) {
      await supabaseAdmin.auth.admin.deleteUser(found.id);
    }
  }

  // ===== LAZ PARTNERS REGISTRY =====
  await prisma.lazPartner.createMany({
    data: [
      {
        name: "BAZNAS",
        bankName: "BNI Syariah",
        accountNumber: "1234567890",
        accountHolder: "Badan Amil Zakat Nasional",
      },
      {
        name: "Dompet Dhuafa",
        bankName: "Bank Mandiri Syariah",
        accountNumber: "2345678901",
        accountHolder: "Dompet Dhuafa Republika",
      },
      {
        name: "Rumah Zakat",
        bankName: "BCA Syariah",
        accountNumber: "3456789012",
        accountHolder: "Yayasan Rumah Zakat Indonesia",
      },
      {
        name: "Rumah Yatim",
        bankName: "BRI Syariah",
        accountNumber: "4567890123",
        accountHolder: "Yayasan Rumah Yatim Arrohman",
      },
      {
        name: "LAZ Al-Azhar",
        bankName: "Bank Muamalat",
        accountNumber: "5678901234",
        accountHolder: "LAZ Al-Azhar Peduli Ummat",
      },
      {
        name: "Lazismu",
        bankName: "BNI Syariah",
        accountNumber: "6789012345",
        accountHolder: "Lembaga Amil Zakat Infaq Shadaqah Muhammadiyah",
      },
      {
        name: "Yayasan Nurul Hayat",
        bankName: "Bank Jatim Syariah",
        accountNumber: "7890123456",
        accountHolder: "Yayasan Nurul Hayat",
      },
      {
        name: "PKPU (Pos Keadilan Peduli Umat)",
        bankName: "BRI Syariah",
        accountNumber: "8901234567",
        accountHolder: "PKPU Human Initiative",
      },
    ],
  });
  console.log("✅ LAZ Partners registry berhasil dibuat");

  // ===== 20 KAMPANYE SAMPLE =====
  const campaigns = await Promise.all([
    // === KATEGORI: YATIM (4 kampanye) ===
    prisma.campaign.create({
      data: {
        name: "Beasiswa Yatim Dhuafa Nusantara",
        description:
          "Program beasiswa pendidikan untuk 500 anak yatim di seluruh Indonesia. Mencakup biaya sekolah, seragam, buku, dan pendampingan belajar selama 1 tahun ajaran.",
        laz: "Rumah Yatim",
        lazVerified: true,
        targetAmount: 750_000_000,
        collectedAmount: 423_500_000,
        trustScore: 92,
        trustBreakdown: {
          narrative: 23,
          financial: 24,
          organizational: 25,
          temporal: 20,
        },
        category: "yatim",
        region: "Nasional",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-04-15"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Rumah Singgah Anak Yatim Surabaya",
        description:
          "Pembangunan rumah singgah untuk 30 anak yatim di Surabaya Barat. Fasilitas meliputi asrama, ruang belajar, dan dapur umum.",
        laz: "Yayasan Nurul Hayat",
        lazVerified: true,
        targetAmount: 500_000_000,
        collectedAmount: 187_000_000,
        trustScore: 85,
        trustBreakdown: {
          narrative: 22,
          financial: 22,
          organizational: 23,
          temporal: 18,
        },
        category: "yatim",
        region: "Jawa Timur",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-05-01"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Santunan Hari Raya Yatim Piatu",
        description:
          "Paket lebaran lengkap untuk 1.000 anak yatim piatu: baju baru, uang saku, parsel makanan, dan kado mainan edukatif.",
        laz: "LAZ Al-Azhar",
        lazVerified: true,
        targetAmount: 200_000_000,
        collectedAmount: 156_000_000,
        trustScore: 88,
        trustBreakdown: {
          narrative: 22,
          financial: 23,
          organizational: 24,
          temporal: 19,
        },
        category: "yatim",
        region: "DKI Jakarta",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-03-28"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Bantuan Anak Yatim Gaza",
        description:
          "Dana darurat untuk anak-anak yatim korban konflik di Gaza. Disalurkan melalui partner internasional terverifikasi.",
        laz: "Yayasan Kemanusiaan Global",
        lazVerified: false,
        targetAmount: 1_000_000_000,
        collectedAmount: 45_000_000,
        trustScore: 38,
        trustBreakdown: {
          narrative: 8,
          financial: 10,
          organizational: 8,
          temporal: 12,
        },
        category: "yatim",
        region: "Internasional",
        isActive: true,
        fraudFlags: 3,
        endsAt: new Date("2026-04-30"),
      },
    }),

    // === KATEGORI: BENCANA (4 kampanye) ===
    prisma.campaign.create({
      data: {
        name: "Tanggap Bencana Banjir Kalimantan",
        description:
          "Bantuan darurat untuk korban banjir bandang di Kalimantan Selatan: evakuasi, makanan siap saji, selimut, dan obat-obatan untuk 2.000 keluarga.",
        laz: "BAZNAS",
        lazVerified: true,
        targetAmount: 800_000_000,
        collectedAmount: 612_000_000,
        trustScore: 95,
        trustBreakdown: {
          narrative: 24,
          financial: 25,
          organizational: 25,
          temporal: 21,
        },
        category: "bencana",
        region: "Kalimantan Selatan",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-03-30"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Rehabilitasi Gempa Cianjur Tahap 3",
        description:
          "Pembangunan kembali 150 rumah warga dan 3 masjid yang rusak akibat gempa. Program ini memasuki tahap akhir konstruksi.",
        laz: "Dompet Dhuafa",
        lazVerified: true,
        targetAmount: 2_000_000_000,
        collectedAmount: 1_780_000_000,
        trustScore: 91,
        trustBreakdown: {
          narrative: 23,
          financial: 24,
          organizational: 24,
          temporal: 20,
        },
        category: "bencana",
        region: "Jawa Barat",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-06-30"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Bantuan Korban Longsor Sumedang",
        description:
          "Dana darurat untuk 75 keluarga korban longsor. Kebutuhan mendesak: tenda darurat, makanan, pakaian, dan trauma healing anak.",
        laz: "ACT (Aksi Cepat Tanggap)",
        lazVerified: true,
        targetAmount: 300_000_000,
        collectedAmount: 89_000_000,
        trustScore: 78,
        trustBreakdown: {
          narrative: 20,
          financial: 19,
          organizational: 22,
          temporal: 17,
        },
        category: "bencana",
        region: "Jawa Barat",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-04-15"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Bantuan Bencana Urgent - Transfer Sekarang",
        description:
          "URGENT!! Butuh bantuan darurat segera!! Bencana besar melanda!! Transfer sekarang!! Setiap detik sangat berharga!!",
        laz: "Peduli Bencana Indonesia",
        lazVerified: false,
        targetAmount: 2_000_000_000,
        collectedAmount: 12_000_000,
        trustScore: 22,
        trustBreakdown: {
          narrative: 3,
          financial: 5,
          organizational: 6,
          temporal: 8,
        },
        category: "bencana",
        region: "Tidak Jelas",
        isActive: true,
        fraudFlags: 4,
        endsAt: new Date("2026-03-20"),
      },
    }),

    // === KATEGORI: KESEHATAN (4 kampanye) ===
    prisma.campaign.create({
      data: {
        name: "Operasi Katarak Gratis Lansia Dhuafa",
        description:
          "Program operasi katarak gratis untuk 200 lansia dhuafa di 5 kota. Bekerjasama dengan RS Mata terpercaya.",
        laz: "Daarut Tauhiid",
        lazVerified: true,
        targetAmount: 400_000_000,
        collectedAmount: 245_000_000,
        trustScore: 86,
        trustBreakdown: {
          narrative: 22,
          financial: 22,
          organizational: 23,
          temporal: 19,
        },
        category: "kesehatan",
        region: "Jawa Barat",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-05-15"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Klinik Kesehatan Ibu & Anak Pedesaan",
        description:
          "Pembangunan 3 klinik kesehatan ibu dan anak di daerah terpencil NTT. Dilengkapi bidan, peralatan medis dasar, dan obat-obatan.",
        laz: "PKPU (Pos Keadilan Peduli Umat)",
        lazVerified: true,
        targetAmount: 600_000_000,
        collectedAmount: 312_000_000,
        trustScore: 82,
        trustBreakdown: {
          narrative: 21,
          financial: 21,
          organizational: 22,
          temporal: 18,
        },
        category: "kesehatan",
        region: "NTT",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-07-01"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Obat Gratis Ramadhan untuk Dhuafa",
        description:
          "Distribusi paket obat-obatan esensial untuk 5.000 keluarga dhuafa selama Ramadhan. Termasuk vitamin, obat maag, dan P3K.",
        laz: "Lazismu",
        lazVerified: true,
        targetAmount: 150_000_000,
        collectedAmount: 98_000_000,
        trustScore: 76,
        trustBreakdown: {
          narrative: 19,
          financial: 20,
          organizational: 21,
          temporal: 16,
        },
        category: "kesehatan",
        region: "Nasional",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-03-28"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Pengobatan Alternatif Ruqyah Syariah",
        description:
          "Program pengobatan alternatif untuk berbagai penyakit. Metode ruqyah syariah dikombinasikan herbal pilihan ustadz.",
        laz: "Klinik Ruqyah Nusantara",
        lazVerified: false,
        targetAmount: 200_000_000,
        collectedAmount: 23_000_000,
        trustScore: 31,
        trustBreakdown: {
          narrative: 6,
          financial: 8,
          organizational: 7,
          temporal: 10,
        },
        category: "kesehatan",
        region: "DKI Jakarta",
        isActive: true,
        fraudFlags: 2,
        endsAt: new Date("2026-04-30"),
      },
    }),

    // === KATEGORI: PENDIDIKAN (4 kampanye) ===
    prisma.campaign.create({
      data: {
        name: "Bangun Sekolah di Pedalaman Papua",
        description:
          "Pembangunan 2 sekolah dasar di pedalaman Papua untuk 300 anak yang saat ini belajar di bawah tenda darurat.",
        laz: "Rumah Zakat",
        lazVerified: true,
        targetAmount: 1_200_000_000,
        collectedAmount: 867_000_000,
        trustScore: 93,
        trustBreakdown: {
          narrative: 24,
          financial: 24,
          organizational: 25,
          temporal: 20,
        },
        category: "pendidikan",
        region: "Papua",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-08-01"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Beasiswa Hafidz Quran Nasional",
        description:
          "Program beasiswa penuh untuk 100 santri penghafal Al-Quran berprestasi dari keluarga kurang mampu di 10 pondok pesantren.",
        laz: "BAZNAS",
        lazVerified: true,
        targetAmount: 500_000_000,
        collectedAmount: 389_000_000,
        trustScore: 90,
        trustBreakdown: {
          narrative: 23,
          financial: 23,
          organizational: 25,
          temporal: 19,
        },
        category: "pendidikan",
        region: "Nasional",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-06-01"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Perpustakaan Digital Pesantren",
        description:
          "Pengadaan 50 tablet + konten digital edukatif untuk 10 pesantren di Jawa Tengah. Modernisasi pembelajaran tanpa kehilangan nilai tradisional.",
        laz: "YBM BRI",
        lazVerified: true,
        targetAmount: 250_000_000,
        collectedAmount: 78_000_000,
        trustScore: 74,
        trustBreakdown: {
          narrative: 19,
          financial: 18,
          organizational: 22,
          temporal: 15,
        },
        category: "pendidikan",
        region: "Jawa Tengah",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-05-15"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Kursus Online Gratis Pemuda Muslim",
        description:
          "Akses kursus online premium gratis untuk 10.000 pemuda Muslim. Topik: coding, desain, digital marketing. Kerjasama dengan platform edtech lokal.",
        laz: "Pemuda Hijrah Foundation",
        lazVerified: false,
        targetAmount: 100_000_000,
        collectedAmount: 15_000_000,
        trustScore: 52,
        trustBreakdown: {
          narrative: 14,
          financial: 12,
          organizational: 13,
          temporal: 13,
        },
        category: "pendidikan",
        region: "Nasional",
        isActive: true,
        fraudFlags: 1,
        endsAt: new Date("2026-04-30"),
      },
    }),

    // === KATEGORI: PANGAN (4 kampanye) ===
    prisma.campaign.create({
      data: {
        name: "Paket Sembako Ramadhan 10.000 Keluarga",
        description:
          "Distribusi paket sembako lengkap (beras, minyak, gula, tepung, kecap, teh) untuk 10.000 keluarga dhuafa selama Ramadhan.",
        laz: "BAZNAS",
        lazVerified: true,
        targetAmount: 1_500_000_000,
        collectedAmount: 1_120_000_000,
        trustScore: 96,
        trustBreakdown: {
          narrative: 25,
          financial: 25,
          organizational: 25,
          temporal: 21,
        },
        category: "pangan",
        region: "Nasional",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-03-28"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Dapur Umum Buka Puasa Jalanan",
        description:
          "Program buka puasa gratis untuk 500 musafir, ojek online, dan pekerja jalanan di 5 titik strategis Jakarta setiap hari selama Ramadhan.",
        laz: "Dompet Dhuafa",
        lazVerified: true,
        targetAmount: 300_000_000,
        collectedAmount: 201_000_000,
        trustScore: 89,
        trustBreakdown: {
          narrative: 23,
          financial: 23,
          organizational: 24,
          temporal: 19,
        },
        category: "pangan",
        region: "DKI Jakarta",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-03-28"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Kurban Sapi Premium Daging Segar",
        description:
          "Pre-order hewan kurban sapi premium untuk Idul Adha 2026. Harga terjangkau, penyembelihan sesuai syariat, daging segar siap antar.",
        laz: "Global Qurban",
        lazVerified: true,
        targetAmount: 800_000_000,
        collectedAmount: 156_000_000,
        trustScore: 68,
        trustBreakdown: {
          narrative: 17,
          financial: 18,
          organizational: 19,
          temporal: 14,
        },
        category: "pangan",
        region: "Nasional",
        isActive: true,
        fraudFlags: 0,
        endsAt: new Date("2026-06-15"),
      },
    }),
    prisma.campaign.create({
      data: {
        name: "Sahur Gratis Selamanya - Donasi Sekarang!",
        description:
          "SAHUR GRATIS UNTUK SEMUA!! Program ini menyediakan sahur gratis selamanya untuk seluruh warga!! Donasi berapapun sangat berarti!!",
        laz: "Yayasan Sahur Berkah",
        lazVerified: false,
        targetAmount: 2_100_000_000,
        collectedAmount: 5_000_000,
        trustScore: 15,
        trustBreakdown: {
          narrative: 2,
          financial: 3,
          organizational: 4,
          temporal: 6,
        },
        category: "pangan",
        region: "Tidak Jelas",
        isActive: true,
        fraudFlags: 5,
        endsAt: new Date("2026-12-31"),
      },
    }),
  ]);

  console.log(`✅ ${campaigns.length} kampanye berhasil dibuat`);

  // ===== FRAUD FLAGS UNTUK KAMPANYE BERISIKO =====
  const lowTrustCampaigns = campaigns.filter((c) => c.trustScore < 40);
  for (const campaign of lowTrustCampaigns) {
    await prisma.fraudFlag.createMany({
      data: [
        {
          campaignId: campaign.id,
          flagType: "narrative_manipulation",
          description:
            "Penggunaan bahasa manipulatif berlebihan: kata-kata paksaan (URGENT, SEKARANG), emotionally exploitative tone.",
          severity: "high",
        },
        {
          campaignId: campaign.id,
          flagType: "financial_anomaly",
          description:
            "Target dana tidak realistis atau tidak sebanding dengan deskripsi program. Rasio pengumpulan sangat rendah.",
          severity: "medium",
        },
        {
          campaignId: campaign.id,
          flagType: "identity_unverified",
          description:
            "LAZ pengelola tidak terdaftar di BAZNAS dan tidak memiliki izin resmi yang dapat diverifikasi.",
          severity: "critical",
        },
      ],
    });
  }

  // Fraud flag untuk kampanye medium trust
  const mediumTrustCampaigns = campaigns.filter(
    (c) => c.trustScore >= 40 && c.trustScore < 60,
  );
  for (const campaign of mediumTrustCampaigns) {
    await prisma.fraudFlag.create({
      data: {
        campaignId: campaign.id,
        flagType: "seasonal_pattern",
        description:
          "Kampanye baru muncul menjelang Ramadhan tanpa track record sebelumnya. Perlu verifikasi lebih lanjut.",
        severity: "low",
      },
    });
  }

  console.log("✅ Fraud flags berhasil dibuat");

  // ===== SEED USERS =====
  // Buat akun di Supabase Auth terlebih dahulu, lalu Prisma DB
  console.log("👤 Membuat akun Supabase Auth + Prisma users...");
  const users = await Promise.all(
    SEED_USERS.map(async (u) => {
      // Buat user di Supabase Auth dengan email_confirm: true (bypass konfirmasi)
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.name, phone: u.mobile },
        });

      if (authError || !authData.user) {
        throw new Error(
          `Gagal buat Supabase Auth user ${u.email}: ${authError?.message}`,
        );
      }

      // Buat record Prisma user dengan authId dari Supabase
      return prisma.user.create({
        data: {
          authId: authData.user.id,
          email: u.email,
          name: u.name,
          mobile: u.mobile,
          mayarCustomerId: u.mayarCustomerId,
          ramadhanStreak: u.ramadhanStreak,
        },
      });
    }),
  );
  const [ahmad, siti, budi, rizky, fatimah] = users;
  console.log(`✅ ${users.length} akun pengguna berhasil dibuat`);

  // ===== SEED ADMINS =====
  console.log("🔐 Membuat akun admin...");
  await Promise.all(
    SEED_ADMINS.map(async (u) => {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.name, phone: u.mobile },
        });

      if (authError || !authData.user) {
        throw new Error(
          `Gagal buat Supabase Auth admin ${u.email}: ${authError?.message}`,
        );
      }

      return prisma.user.create({
        data: {
          authId: authData.user.id,
          email: u.email,
          name: u.name,
          mobile: u.mobile,
          role: "admin",
          ramadhanStreak: 0,
        },
      });
    }),
  );
  console.log(`✅ ${SEED_ADMINS.length} akun admin berhasil dibuat`);

  // Alias kampanye berdasarkan nama untuk mudah referensi
  const cBeasiswaYatim = campaigns.find((c) =>
    c.name.includes("Beasiswa Yatim Dhuafa"),
  )!;
  const cBanjir = campaigns.find((c) => c.name.includes("Banjir Kalimantan"))!;
  const cCianjur = campaigns.find((c) => c.name.includes("Cianjur"))!;
  const cKatarak = campaigns.find((c) => c.name.includes("Katarak"))!;
  const cSekolahPapua = campaigns.find((c) => c.name.includes("Papua"))!;
  const cHafidz = campaigns.find((c) => c.name.includes("Hafidz"))!;
  const cSembako = campaigns.find((c) => c.name.includes("Sembako"))!;
  const cDapurUmum = campaigns.find((c) => c.name.includes("Dapur Umum"))!;
  const cKlinikNTT = campaigns.find((c) =>
    c.name.includes("Klinik Kesehatan"),
  )!;
  const cObat = campaigns.find((c) => c.name.includes("Obat Gratis"))!;

  // ===== DONATIONS =====

  // --- Ahmad Fauzi: power donor, rutin setiap hari hampir semua zakat ---
  const ahmadDonations = await prisma.donation.createManyAndReturn({
    data: [
      // Zakat mal — dibayar lunas
      {
        userId: ahmad.id,
        amount: 6_250_000,
        type: "zakat_mal",
        donorIntent: "Bayar zakat penghasilan tahunan sesuai nisab",
        campaignId: cBanjir.id,
        mayarInvoiceId: "inv_ahmad_001",
        mayarPaymentLink: "https://mayar.club/pay/inv_ahmad_001",
        status: "paid",
        paidAt: ramadhanDate(3, 10, 15),
        impactScore: 85,
        islamicContext:
          "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ — Zakat Anda telah menyentuh 125 jiwa terdampak banjir.",
        reflectionSent: true,
        createdAt: ramadhanDate(3, 9, 0),
      },
      // Sedekah rutin hari 5
      {
        userId: ahmad.id,
        amount: 500_000,
        type: "sedekah",
        donorIntent: "Sedekah harian Ramadhan",
        campaignId: cSembako.id,
        mayarInvoiceId: "inv_ahmad_002",
        mayarPaymentLink: "https://mayar.club/pay/inv_ahmad_002",
        status: "paid",
        paidAt: ramadhanDate(5, 19, 2),
        impactScore: 72,
        islamicContext:
          "Sedekah Anda senilai Rp500.000 setara 3 paket sembako untuk keluarga dhuafa.",
        reflectionSent: true,
        createdAt: ramadhanDate(5, 18, 30),
      },
      // Infaq hari 8
      {
        userId: ahmad.id,
        amount: 1_000_000,
        type: "infaq",
        donorIntent: "Infaq untuk pembangunan sekolah anak-anak Papua",
        campaignId: cSekolahPapua.id,
        mayarInvoiceId: "inv_ahmad_003",
        mayarPaymentLink: "https://mayar.club/pay/inv_ahmad_003",
        status: "paid",
        paidAt: ramadhanDate(8, 20, 45),
        impactScore: 78,
        islamicContext:
          "مَنْ بَنَى مَسْجِدًا — Setiap bata sekolah itu, ada jejak kebaikan Anda.",
        reflectionSent: true,
        createdAt: ramadhanDate(8, 20, 0),
      },
      // Sedekah hari 12
      {
        userId: ahmad.id,
        amount: 250_000,
        type: "sedekah",
        donorIntent: "Bantu dapur umum buka puasa",
        campaignId: cDapurUmum.id,
        mayarInvoiceId: "inv_ahmad_004",
        mayarPaymentLink: "https://mayar.club/pay/inv_ahmad_004",
        status: "paid",
        paidAt: ramadhanDate(12, 17, 58),
        impactScore: 65,
        islamicContext:
          "Sedekah makanan ketika berbuka adalah amalan yang dicintai Allah.",
        reflectionSent: true,
        createdAt: ramadhanDate(12, 17, 30),
      },
      // Zakat fitrah hari 25
      {
        userId: ahmad.id,
        amount: 225_000,
        type: "zakat_fitrah",
        donorIntent: "Zakat fitrah untuk keluarga 5 orang",
        campaignId: cSembako.id,
        mayarInvoiceId: "inv_ahmad_005",
        mayarPaymentLink: "https://mayar.club/pay/inv_ahmad_005",
        status: "paid",
        paidAt: ramadhanDate(25, 14, 20),
        impactScore: 90,
        islamicContext:
          "Zakat fitrah Anda menyucikan puasa dan memberi kebahagiaan 5 jiwa di hari raya.",
        reflectionSent: true,
        createdAt: ramadhanDate(25, 14, 0),
      },
      // Wakaf hari 28 — pending
      {
        userId: ahmad.id,
        amount: 5_000_000,
        type: "wakaf",
        donorIntent: "Wakaf produktif untuk pesantren hafidz",
        campaignId: cHafidz.id,
        mayarInvoiceId: "inv_ahmad_006",
        mayarPaymentLink: "https://mayar.club/pay/inv_ahmad_006",
        status: "pending",
        paidAt: null,
        impactScore: null,
        islamicContext: null,
        reflectionSent: false,
        createdAt: ramadhanDate(28, 9, 0),
      },
    ],
  });
  console.log(`  • Ahmad: ${ahmadDonations.length} donasi dibuat`);

  // --- Siti Rahmah: donor rutin, fokus yatim dan kesehatan ---
  const sitiDonations = await prisma.donation.createManyAndReturn({
    data: [
      {
        userId: siti.id,
        amount: 300_000,
        type: "sedekah",
        donorIntent: "Bantu anak yatim dapat beasiswa",
        campaignId: cBeasiswaYatim.id,
        mayarInvoiceId: "inv_siti_001",
        mayarPaymentLink: "https://mayar.club/pay/inv_siti_001",
        status: "paid",
        paidAt: ramadhanDate(2, 21, 10),
        impactScore: 68,
        islamicContext:
          "كَافِلُ الْيَتِيمِ — Anda adalah bagian dari kasih sayang untuk anak yatim.",
        reflectionSent: true,
        createdAt: ramadhanDate(2, 20, 45),
      },
      {
        userId: siti.id,
        amount: 200_000,
        type: "infaq",
        donorIntent: "Infaq operasi katarak untuk lansia",
        campaignId: cKatarak.id,
        mayarInvoiceId: "inv_siti_002",
        mayarPaymentLink: "https://mayar.club/pay/inv_siti_002",
        status: "paid",
        paidAt: ramadhanDate(6, 15, 30),
        impactScore: 71,
        islamicContext:
          "Setiap Rp300.000 membantu satu lansia melihat dunia kembali dengan terang.",
        reflectionSent: true,
        createdAt: ramadhanDate(6, 15, 0),
      },
      {
        userId: siti.id,
        amount: 1_750_000,
        type: "zakat_mal",
        donorIntent: "Zakat penghasilan Ramadhan ini",
        campaignId: cBeasiswaYatim.id,
        mayarInvoiceId: "inv_siti_003",
        mayarPaymentLink: "https://mayar.club/pay/inv_siti_003",
        status: "paid",
        paidAt: ramadhanDate(10, 11, 0),
        impactScore: 88,
        islamicContext:
          "Zakat Anda setara dengan beasiswa penuh 2 anak yatim selama 6 bulan.",
        reflectionSent: true,
        createdAt: ramadhanDate(10, 10, 30),
      },
      {
        userId: siti.id,
        amount: 100_000,
        type: "sedekah",
        donorIntent: "Sedekah harian kecil tapi rutin",
        campaignId: cDapurUmum.id,
        mayarInvoiceId: "inv_siti_004",
        mayarPaymentLink: "https://mayar.club/pay/inv_siti_004",
        status: "paid",
        paidAt: ramadhanDate(14, 18, 5),
        impactScore: 55,
        islamicContext:
          "Sedekah sekecil apapun di bulan Ramadhan bernilai berlipat ganda.",
        reflectionSent: false,
        createdAt: ramadhanDate(14, 17, 50),
      },
      {
        userId: siti.id,
        amount: 100_000,
        type: "zakat_fitrah",
        donorIntent: "Zakat fitrah pribadi",
        campaignId: cSembako.id,
        mayarInvoiceId: "inv_siti_005",
        mayarPaymentLink: "https://mayar.club/pay/inv_siti_005",
        status: "paid",
        paidAt: ramadhanDate(27, 8, 45),
        impactScore: 90,
        islamicContext:
          "Zakat fitrah Anda sudah diterима. Semoga puasa Anda sempurna dan diterima Allah.",
        reflectionSent: true,
        createdAt: ramadhanDate(27, 8, 30),
      },
    ],
  });
  console.log(`  • Siti: ${sitiDonations.length} donasi dibuat`);

  // --- Budi Santoso: donor baru, 1 paid 1 pending ---
  const budiDonations = await prisma.donation.createManyAndReturn({
    data: [
      {
        userId: budi.id,
        amount: 500_000,
        type: "sedekah",
        donorIntent: "Mau coba donasi pertama kali via AI",
        campaignId: cBanjir.id,
        mayarInvoiceId: "inv_budi_001",
        mayarPaymentLink: "https://mayar.club/pay/inv_budi_001",
        status: "paid",
        paidAt: ramadhanDate(15, 20, 0),
        impactScore: 60,
        islamicContext:
          "Alhamdulillah! Donasi pertama Anda telah menyentuh keluarga korban banjir.",
        reflectionSent: true,
        createdAt: ramadhanDate(15, 19, 30),
      },
      {
        userId: budi.id,
        amount: 250_000,
        type: "sedekah",
        donorIntent: "Mau donasi lagi untuk anak yatim",
        campaignId: cBeasiswaYatim.id,
        mayarInvoiceId: "inv_budi_002",
        mayarPaymentLink: "https://mayar.club/pay/inv_budi_002",
        status: "pending",
        paidAt: null,
        impactScore: null,
        islamicContext: null,
        reflectionSent: false,
        createdAt: ramadhanDate(20, 10, 0),
      },
      {
        userId: budi.id,
        amount: 150_000,
        type: "infaq",
        donorIntent: "Infaq untuk klinik NTT",
        campaignId: cKlinikNTT.id,
        mayarInvoiceId: "inv_budi_003",
        mayarPaymentLink: "https://mayar.club/pay/inv_budi_003",
        status: "failed",
        paidAt: null,
        impactScore: null,
        islamicContext: null,
        reflectionSent: false,
        createdAt: ramadhanDate(22, 14, 0),
      },
    ],
  });
  console.log(`  • Budi: ${budiDonations.length} donasi dibuat`);

  // --- Rizky Pratama: fokus pendidikan dan tech ---
  const rizkyDonations = await prisma.donation.createManyAndReturn({
    data: [
      {
        userId: rizky.id,
        amount: 2_000_000,
        type: "infaq",
        donorIntent: "Bantu bangun sekolah di Papua, sesama anak bangsa",
        campaignId: cSekolahPapua.id,
        mayarInvoiceId: "inv_rizky_001",
        mayarPaymentLink: "https://mayar.club/pay/inv_rizky_001",
        status: "paid",
        paidAt: ramadhanDate(4, 22, 15),
        impactScore: 82,
        islamicContext:
          "Infaq untuk pendidikan adalah investasi pahala yang mengalir terus — ilmu yang bermanfaat.",
        reflectionSent: true,
        createdAt: ramadhanDate(4, 22, 0),
      },
      {
        userId: rizky.id,
        amount: 500_000,
        type: "sedekah",
        donorIntent: "Beasiswa hafidz untuk generasi qurani",
        campaignId: cHafidz.id,
        mayarInvoiceId: "inv_rizky_002",
        mayarPaymentLink: "https://mayar.club/pay/inv_rizky_002",
        status: "paid",
        paidAt: ramadhanDate(9, 16, 40),
        impactScore: 74,
        islamicContext:
          "Mendukung penghafal Quran adalah bagian dari menjaga kelestarian wahyu Allah.",
        reflectionSent: true,
        createdAt: ramadhanDate(9, 16, 20),
      },
      {
        userId: rizky.id,
        amount: 3_125_000,
        type: "zakat_mal",
        donorIntent: "Zakat gaji programmer, semoga berkah",
        campaignId: cCianjur.id,
        mayarInvoiceId: "inv_rizky_003",
        mayarPaymentLink: "https://mayar.club/pay/inv_rizky_003",
        status: "paid",
        paidAt: ramadhanDate(16, 13, 0),
        impactScore: 91,
        islamicContext:
          "Zakat Anda membantu menutup 1.5% kebutuhan dana rehabilitasi 150 rumah warga Cianjur.",
        reflectionSent: true,
        createdAt: ramadhanDate(16, 12, 30),
      },
      {
        userId: rizky.id,
        amount: 45_000,
        type: "zakat_fitrah",
        donorIntent: "Zakat fitrah untuk diri sendiri",
        campaignId: cSembako.id,
        mayarInvoiceId: "inv_rizky_004",
        mayarPaymentLink: "https://mayar.club/pay/inv_rizky_004",
        status: "paid",
        paidAt: ramadhanDate(26, 7, 30),
        impactScore: 90,
        islamicContext:
          "Zakat fitrah Anda telah disalurkan. Selamat menyambut Idul Fitri!",
        reflectionSent: true,
        createdAt: ramadhanDate(26, 7, 0),
      },
    ],
  });
  console.log(`  • Rizky: ${rizkyDonations.length} donasi dibuat`);

  // --- Fatimah Az-Zahra: dermawan, streak 28 hari, wakaf dan sedekah —
  const fatimahDonations = await prisma.donation.createManyAndReturn({
    data: [
      {
        userId: fatimah.id,
        amount: 1_000_000,
        type: "wakaf",
        donorIntent: "Wakaf quran untuk pesantren yatim",
        campaignId: cHafidz.id,
        mayarInvoiceId: "inv_fatimah_001",
        mayarPaymentLink: "https://mayar.club/pay/inv_fatimah_001",
        status: "paid",
        paidAt: ramadhanDate(1, 20, 5),
        impactScore: 95,
        islamicContext:
          "إِذَا مَاتَ الْإِنسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلَّا مِنْ ثَلَاثٍ — Wakaf ini adalah amal jariyah yang tak akan putus.",
        reflectionSent: true,
        createdAt: ramadhanDate(1, 20, 0),
      },
      {
        userId: fatimah.id,
        amount: 500_000,
        type: "sedekah",
        donorIntent: "Sembako untuk mualaf dhuafa Ramadhan ini",
        campaignId: cSembako.id,
        mayarInvoiceId: "inv_fatimah_002",
        mayarPaymentLink: "https://mayar.club/pay/inv_fatimah_002",
        status: "paid",
        paidAt: ramadhanDate(5, 18, 45),
        impactScore: 77,
        islamicContext:
          "Memberi makan orang yang berpuasa pahalanya seperti puasa itu sendiri.",
        reflectionSent: true,
        createdAt: ramadhanDate(5, 18, 30),
      },
      {
        userId: fatimah.id,
        amount: 750_000,
        type: "infaq",
        donorIntent: "Bantu operasi katarak nenek tetangga yg dhuafa",
        campaignId: cKatarak.id,
        mayarInvoiceId: "inv_fatimah_003",
        mayarPaymentLink: "https://mayar.club/pay/inv_fatimah_003",
        status: "paid",
        paidAt: ramadhanDate(11, 11, 20),
        impactScore: 80,
        islamicContext:
          "Membantu orang sakit adalah syafaat di dunia dan akhirat.",
        reflectionSent: true,
        createdAt: ramadhanDate(11, 11, 0),
      },
      {
        userId: fatimah.id,
        amount: 8_750_000,
        type: "zakat_mal",
        donorIntent: "Zakat mal dari tabungan setahun, sudah cukup nisab",
        campaignId: cBanjir.id,
        mayarInvoiceId: "inv_fatimah_004",
        mayarPaymentLink: "https://mayar.club/pay/inv_fatimah_004",
        status: "paid",
        paidAt: ramadhanDate(17, 9, 0),
        impactScore: 97,
        islamicContext:
          "Zakat Anda Rp8.750.000 setara membantu 175 keluarga korban banjir selama seminggu.",
        reflectionSent: true,
        createdAt: ramadhanDate(17, 8, 30),
      },
      {
        userId: fatimah.id,
        amount: 500_000,
        type: "sedekah",
        donorIntent: "Sedekah untuk rehab rumah Cianjur",
        campaignId: cCianjur.id,
        mayarInvoiceId: "inv_fatimah_005",
        mayarPaymentLink: "https://mayar.club/pay/inv_fatimah_005",
        status: "paid",
        paidAt: ramadhanDate(20, 16, 10),
        impactScore: 73,
        islamicContext:
          "Membangun kembali rumah yang roboh adalah bagian dari memakmurkan bumi.",
        reflectionSent: true,
        createdAt: ramadhanDate(20, 16, 0),
      },
      {
        userId: fatimah.id,
        amount: 450_000,
        type: "zakat_fitrah",
        donorIntent: "Zakat fitrah 10 jiwa: saya, suami, dan 8 anak-anak",
        campaignId: cSembako.id,
        mayarInvoiceId: "inv_fatimah_006",
        mayarPaymentLink: "https://mayar.club/pay/inv_fatimah_006",
        status: "paid",
        paidAt: ramadhanDate(28, 6, 15),
        impactScore: 90,
        islamicContext:
          "MasyaAllah — zakat fitrah untuk 10 jiwa. Semoga seluruh keluarga dirahmati Allah.",
        reflectionSent: true,
        createdAt: ramadhanDate(28, 6, 0),
      },
    ],
  });
  console.log(`  • Fatimah: ${fatimahDonations.length} donasi dibuat`);

  // ===== GIVING JOURNEY (Ramadhan Heatmap) =====
  // Ahmad — streak 25 hari, hari 4-28 aktif dengan gap 3 hari
  const ahmadJourneyDays = Array.from({ length: 30 }, (_, i) => i + 1);
  await prisma.givingJourney.createMany({
    data: ahmadJourneyDays.map((day) => {
      const donated = day >= 3 && day <= 28 && ![11, 18, 24].includes(day);
      return {
        userId: ahmad.id,
        ramadhanDay: day,
        donated,
        amount: donated ? [500000, 250000, 1000000, 300000][day % 4] : 0,
        nudgeMessage:
          !donated && day > 1
            ? "Semangat! Hari ini bisa dimulai kembali dengan sedekah kecil 🌙"
            : null,
        milestone: day === 10 ? "streak-10" : day === 20 ? "streak-20" : null,
        createdAt: ramadhanDate(day),
      };
    }),
  });

  // Siti — streak 15 hari (hari 5-19)
  await prisma.givingJourney.createMany({
    data: Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
      const donated = day >= 5 && day <= 19;
      return {
        userId: siti.id,
        ramadhanDay: day,
        donated,
        amount: donated ? 150000 : 0,
        nudgeMessage:
          day === 20
            ? "Subhanallah, 15 hari streak! Jangan berhenti di sini 💚"
            : null,
        milestone: day === 15 ? "streak-15" : null,
        createdAt: ramadhanDate(day),
      };
    }),
  });

  // Budi — streak 5 hari (hari 14-18)
  await prisma.givingJourney.createMany({
    data: Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
      const donated = day >= 14 && day <= 18;
      return {
        userId: budi.id,
        ramadhanDay: day,
        donated,
        amount: donated ? 100000 : 0,
        nudgeMessage:
          day === 1
            ? "Assalamu'alaikum! Ramadhan telah tiba, mulai perjalanan kebaikan Anda 🌙"
            : null,
        milestone: null,
        createdAt: ramadhanDate(day),
      };
    }),
  });

  // Rizky — streak 12 hari (hari 4-15)
  await prisma.givingJourney.createMany({
    data: Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
      const donated = day >= 4 && day <= 15;
      return {
        userId: rizky.id,
        ramadhanDay: day,
        donated,
        amount: donated ? [500000, 250000, 300000][day % 3] : 0,
        nudgeMessage:
          day === 16
            ? "Streak 12 hari putus. Bismillah mulai lagi! Allah Maha Penerima Taubat 🤲"
            : null,
        milestone: day === 10 ? "streak-10" : null,
        createdAt: ramadhanDate(day),
      };
    }),
  });

  // Fatimah — streak 28 hari (hampir sempurna, hanya 2 hari bolong)
  await prisma.givingJourney.createMany({
    data: Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
      const donated = day <= 28 && ![13, 22].includes(day);
      return {
        userId: fatimah.id,
        ramadhanDay: day,
        donated,
        amount: donated
          ? [300000, 500000, 750000, 1000000, 250000][day % 5]
          : 0,
        nudgeMessage: null,
        milestone:
          day === 7
            ? "streak-7"
            : day === 10
              ? "streak-10"
              : day === 20
                ? "streak-20"
                : day === 28
                  ? "ramadhan-master"
                  : null,
        createdAt: ramadhanDate(day),
      };
    }),
  });

  console.log("✅ Giving journey (Ramadhan heatmap) berhasil dibuat");
  console.log("🕌 Seeding selesai! Barakallah fiik.");
  console.log("");
  console.log("📋 Akun seed siap dipakai login:");
  console.log("   Password donor: Sedekah2026");
  console.log("   Password admin: Admin@Sedekah2026");
  console.log("");
  SEED_USERS.forEach((u) => {
    console.log(`   [donor] ${u.name.padEnd(22)} | ${u.email}`);
  });
  console.log("");
  SEED_ADMINS.forEach((u) => {
    console.log(`   [admin] ${u.name.padEnd(22)} | ${u.email}`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding gagal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
