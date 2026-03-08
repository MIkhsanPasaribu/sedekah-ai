# SEDEKAH.AI — Diagram Arsitektur & Alur Kerja

> Dokumentasi visual proyek SEDEKAH.AI menggunakan Mermaid diagram.
> Gunakan preview Mermaid di VS Code atau GitHub untuk melihat diagram.

---

## Daftar Isi

1. [Use Case Diagram](#1-use-case-diagram)
2. [Activity Diagram — Alur Donasi End-to-End](#2-activity-diagram--alur-donasi-end-to-end)
3. [Sequence Diagram — Chat SSE Streaming](#3-sequence-diagram--chat-sse-streaming)
4. [Sequence Diagram — Payment Webhook](#4-sequence-diagram--payment-webhook)
5. [Entity Relationship Diagram (ERD)](#5-entity-relationship-diagram-erd)
6. [State Diagram — Status Pembayaran](#6-state-diagram--status-pembayaran)
7. [State Diagram — Status Penyaluran Dana](#7-state-diagram--status-penyaluran-dana)
8. [Flowchart — LangGraph Agent Pipeline](#8-flowchart--langgraph-agent-pipeline)
9. [Flowchart — Admin Fund Disbursement](#9-flowchart--admin-fund-disbursement)
10. [Architecture Diagram — System Overview](#10-architecture-diagram--system-overview)

---

## 1. Use Case Diagram

Aktor utama dan interaksi mereka dengan sistem.

```mermaid
flowchart LR
    subgraph Actors
        DONOR["🧑 Donor"]
        ADMIN["🛡️ Admin"]
        AI["🤖 AI Agent"]
        MAYAR["💳 Mayar API"]
    end

    subgraph "SEDEKAH.AI"
        UC1["Login / Register"]
        UC2["Chat dengan AI Agent"]
        UC3["Hitung Zakat"]
        UC4["Lihat Kampanye"]
        UC5["Pilih & Bayar Donasi"]
        UC6["Lihat Dashboard Dampak"]
        UC7["Lihat Riwayat Donasi"]
        UC8["Hapus Riwayat Chat"]
        UC9["Kelola Penyaluran Dana"]
        UC10["Rekonsiliasi Transaksi"]
        UC11["Buat Promo/Diskon"]
        UC12["Analisis Fraud"]
        UC13["Rekomendasi Kampanye"]
        UC14["Buat Invoice Pembayaran"]
        UC15["Lacak Dampak Donasi"]
    end

    DONOR --- UC1
    DONOR --- UC2
    DONOR --- UC3
    DONOR --- UC4
    DONOR --- UC5
    DONOR --- UC6
    DONOR --- UC7
    DONOR --- UC8

    ADMIN --- UC1
    ADMIN --- UC9
    ADMIN --- UC10
    ADMIN --- UC11

    AI --- UC3
    AI --- UC12
    AI --- UC13
    AI --- UC14
    AI --- UC15

    MAYAR --- UC5
    MAYAR --- UC10
```

---

## 2. Activity Diagram — Alur Donasi End-to-End

Alur lengkap dari niat donatur hingga dampak terlapor.

```mermaid
flowchart TD
    START([Mulai]) --> LOGIN{Sudah Login?}
    LOGIN -- Belum --> AUTH[Login / Register]
    AUTH --> CHAT
    LOGIN -- Sudah --> CHAT

    CHAT[Buka Chat AI] --> INTENT[Sampaikan Niat Donasi]
    INTENT --> INTAKE["🤖 INTAKE Node: Deteksi Intent & Data Keuangan"]

    INTAKE --> HAS_DATA{Data Keuangan Lengkap?}
    HAS_DATA -- Belum --> ASK[AI Minta Info Tambahan]
    ASK --> INTENT
    HAS_DATA -- Ya --> CALCULATE

    CALCULATE["🧮 CALCULATE Node: Hitung Zakat/Donasi"] --> RESEARCH
    RESEARCH["🔍 RESEARCH Node: Cari Kampanye Aktif"] --> FRAUD
    FRAUD["🛡️ FRAUD_DETECTOR Node: Analisis Trust Score"] --> RECOMMEND
    RECOMMEND["⭐ RECOMMEND Node: Rekomendasikan Alokasi"]

    RECOMMEND --> HAS_RECO{Ada Rekomendasi?}
    HAS_RECO -- Tidak --> END_NO_MATCH([Tidak Ada Kampanye Cocok])
    HAS_RECO -- Ya --> APPROVAL

    APPROVAL["⏸️ PAYMENT_APPROVAL: Human-in-the-Loop"]
    APPROVAL --> USER_CHOICE{Keputusan Donor?}
    USER_CHOICE -- Ubah Alokasi --> CHAT
    USER_CHOICE -- Bayar Sekarang --> PAYMENT

    PAYMENT["💳 PAYMENT_EXECUTOR Node: Buat Invoice Mayar"]
    PAYMENT --> PAY_STATUS{Status Pembayaran?}
    PAY_STATUS -- Gagal --> END_FAIL([Pembayaran Gagal])
    PAY_STATUS -- Sukses / Pending --> IMPACT

    IMPACT["📊 IMPACT_TRACKER Node: Hitung Dampak"]
    IMPACT --> SHOW[Tampilkan Laporan Dampak + Ayat]
    SHOW --> END_OK([Selesai ✅])

    style INTAKE fill:#2D6A4F,color:#fff
    style CALCULATE fill:#2D6A4F,color:#fff
    style RESEARCH fill:#2D6A4F,color:#fff
    style FRAUD fill:#2D6A4F,color:#fff
    style RECOMMEND fill:#2D6A4F,color:#fff
    style APPROVAL fill:#C9A227,color:#fff
    style PAYMENT fill:#2D6A4F,color:#fff
    style IMPACT fill:#2D6A4F,color:#fff
```

---

## 3. Sequence Diagram — Chat SSE Streaming

Alur request/response saat pengguna mengirim pesan di chat.

```mermaid
sequenceDiagram
    actor Donor
    participant Browser as ChatInterface (Browser)
    participant API as /api/agent (SSE)
    participant LG as LangGraph Engine
    participant Groq as Groq LLM
    participant DB as PostgreSQL (Prisma)
    participant Mayar as Mayar API

    Donor->>Browser: Ketik pesan & klik Kirim
    Browser->>API: POST /api/agent {messages, threadId}

    API->>DB: Cari/buat User & Conversation
    API->>LG: graph.stream(state, {threadId})

    loop Setiap Node yang Aktif
        LG->>Groq: Prompt + Context
        Groq-->>LG: LLM Response
        LG-->>API: State update (partial)
        API-->>Browser: SSE event: node_start / state_update
        Browser-->>Donor: Update UI real-time
    end

    alt Payment Node Aktif
        LG->>Mayar: POST /invoice/create
        Mayar-->>LG: Payment link
        LG-->>API: mayarInvoiceLink in state
        API-->>Browser: SSE: payment_link
        Browser-->>Donor: Tampilkan PaymentApprovalCard
    end

    API->>DB: Simpan messages ke DB
    API-->>Browser: SSE: done
    Browser-->>Donor: Chat lengkap ditampilkan
```

---

## 4. Sequence Diagram — Payment Webhook

Alur ketika Mayar mengirim notifikasi pembayaran berhasil.

```mermaid
sequenceDiagram
    participant Mayar as Mayar API
    participant WH as /api/webhooks/mayar
    participant DB as PostgreSQL (Prisma)
    participant Poll as Browser (Polling)
    participant Donor

    Donor->>Mayar: Bayar via Payment Link
    Mayar->>WH: POST webhook {event: payment.completed}

    WH->>WH: Validasi X-Callback-Token
    WH->>DB: Cari Donation by mayarInvoiceId
    WH->>WH: Idempotency check (skip jika sudah paid)
    WH->>DB: Update Donation status → paid
    WH->>DB: Update Campaign collectedAmount (+amount)
    WH-->>Mayar: 200 OK

    loop Setiap 5 detik (max 60x)
        Poll->>DB: GET /api/donations/status?invoiceId=xxx
        DB-->>Poll: status: "paid"
    end

    Poll-->>Donor: 🎉 Pembayaran Berhasil!
    Donor->>Donor: Redirect ke /success?donationId=xxx
```

---

## 5. Entity Relationship Diagram (ERD)

Model database lengkap dengan relasi.

```mermaid
erDiagram
    User {
        uuid id PK
        string authId UK
        string email UK
        string name
        string mobile
        string mayarCustomerId
        enum role "donor | admin"
        int ramadhanStreak
        datetime createdAt
        datetime updatedAt
    }

    Campaign {
        uuid id PK
        string name
        string description
        string laz
        boolean lazVerified
        int targetAmount
        int collectedAmount
        int trustScore
        json trustBreakdown
        enum category "yatim | bencana | kesehatan | pendidikan | pangan"
        string region
        boolean isActive
        int fraudFlags
        datetime endsAt
        datetime createdAt
    }

    Donation {
        uuid id PK
        uuid userId FK
        int amount
        enum type "zakat_mal | zakat_fitrah | sedekah | infaq | wakaf | bencana"
        string donorIntent
        uuid campaignId FK
        string mayarInvoiceId
        string mayarPaymentLink
        enum status "pending | paid | failed | expired"
        datetime paidAt
        int impactScore
        string islamicContext
        boolean reflectionSent
        datetime createdAt
    }

    FraudFlag {
        uuid id PK
        uuid campaignId FK
        enum flagType "narrative_manipulation | financial_anomaly | seasonal_pattern | identity_unverified"
        string description
        enum severity "low | medium | high | critical"
        datetime detectedAt
    }

    GivingJourney {
        uuid id PK
        uuid userId FK
        int ramadhanDay
        boolean donated
        int amount
        string nudgeMessage
        string milestone
        datetime createdAt
    }

    Conversation {
        uuid id PK
        uuid userId FK
        string threadId UK
        string title
        datetime createdAt
        datetime updatedAt
    }

    Message {
        uuid id PK
        uuid conversationId FK
        enum role "user | assistant | system"
        string content
        json metadata
        datetime createdAt
    }

    Disbursement {
        uuid id PK
        uuid campaignId FK
        int amount
        string recipientLaz
        string recipientAccount
        enum status "pending | processing | completed | verified"
        string transferProof
        string notes
        datetime disbursedAt
        datetime verifiedAt
        uuid disbursedById FK
        datetime createdAt
    }

    User ||--o{ Donation : "donates"
    User ||--o{ GivingJourney : "tracks"
    User ||--o{ Conversation : "chats"
    User ||--o{ Disbursement : "disburses"
    Campaign ||--o{ Donation : "receives"
    Campaign ||--o{ FraudFlag : "flagged"
    Campaign ||--o{ Disbursement : "disbursed"
    Conversation ||--o{ Message : "contains"
```

---

## 6. State Diagram — Status Pembayaran

Siklus hidup status donasi/pembayaran.

```mermaid
stateDiagram-v2
    [*] --> pending : Invoice dibuat

    pending --> paid : Webhook payment.completed
    pending --> failed : Webhook payment.failed
    pending --> expired : Webhook payment.expired

    paid --> [*] : ✅ Selesai
    failed --> [*] : ❌ Gagal
    expired --> [*] : ⏰ Kedaluwarsa

    note right of pending
        Browser melakukan polling
        setiap 5 detik untuk
        cek status terbaru
    end note

    note right of paid
        Campaign.collectedAmount
        otomatis bertambah
    end note
```

---

## 7. State Diagram — Status Penyaluran Dana

Siklus hidup penyaluran dana oleh admin.

```mermaid
stateDiagram-v2
    [*] --> pending : Admin buat penyaluran

    pending --> processing : Admin mulai proses
    processing --> completed : Dana terkirim
    completed --> verified : Admin verifikasi bukti

    verified --> [*] : ✅ Terverifikasi

    note right of pending
        Dana sudah dialokasikan
        dari campaign
    end note

    note right of processing
        Transfer sedang diproses
        ke rekening LAZ
    end note

    note right of completed
        Bukti transfer diupload
    end note

    note right of verified
        Tampil di halaman
        transparansi kampanye
    end note
```

---

## 8. Flowchart — LangGraph Agent Pipeline

Alur detail 7 node AI agent dengan routing kondisional.

```mermaid
flowchart TD
    START([START]) --> INTAKE

    INTAKE["INTAKE\n─────────\nDeteksi intent donasi\nEkstrak data keuangan\nBerikan konteks Islami"]

    INTAKE --> R1{Data keuangan\nlengkap?}
    R1 -- "Ya (atau intent\nsedekah/infaq/wakaf)" --> CALCULATE
    R1 -- Tidak --> END1([END — Tunggu input])

    CALCULATE["CALCULATE\n─────────\nHitung zakat mal/fitrah\nHitung nisab & tarif\nBreakdown per kategori"]

    CALCULATE --> RESEARCH

    RESEARCH["RESEARCH\n─────────\nQuery kampanye aktif\ndari database\nFilter by kategori & region"]

    RESEARCH --> FRAUD

    FRAUD["FRAUD_DETECTOR\n─────────\nAnalisis trust score\nCek fraud flags\nSkor per kampanye"]

    FRAUD --> RECOMMEND

    RECOMMEND["RECOMMEND\n─────────\nAlokasikan donasi\nke kampanye terbaik\nSertakan reasoning"]

    RECOMMEND --> R2{Ada\nrekomendasi?}
    R2 -- Tidak --> END2([END — Tidak ada kampanye])
    R2 -- Ya --> APPROVAL

    APPROVAL["PAYMENT_APPROVAL\n─────────\n⏸️ interrupt()\nTunggu keputusan donor"]

    APPROVAL --> R3{Keputusan?}
    R3 -- Ubah Alokasi --> END3([END — Restart])
    R3 -- Bayar Sekarang --> PAYMENT

    PAYMENT["PAYMENT_EXECUTOR\n─────────\nBuat invoice Mayar\nSimpan donation records\nKirim payment link"]

    PAYMENT --> R4{Pembayaran\nberhasil?}
    R4 -- Gagal --> END4([END — Gagal])
    R4 -- "Sukses/Pending" --> IMPACT

    IMPACT["IMPACT_TRACKER\n─────────\nHitung impact score\nGenerate ayat/hadits\nBuat laporan dampak"]

    IMPACT --> END5([END ✅])

    style INTAKE fill:#1B4332,color:#fff
    style CALCULATE fill:#2D6A4F,color:#fff
    style RESEARCH fill:#2D6A4F,color:#fff
    style FRAUD fill:#2D6A4F,color:#fff
    style RECOMMEND fill:#2D6A4F,color:#fff
    style APPROVAL fill:#C9A227,color:#0F1923
    style PAYMENT fill:#40916C,color:#fff
    style IMPACT fill:#40916C,color:#fff
```

---

## 9. Flowchart — Admin Fund Disbursement

Alur admin mengelola penyaluran dana kampanye.

```mermaid
flowchart TD
    START([Admin Login]) --> PANEL[Buka Admin Panel]
    PANEL --> OVERVIEW[Lihat Overview Dana]

    OVERVIEW --> CHECK{Dana terkumpul\n> 0?}
    CHECK -- Tidak --> WAIT([Tunggu Donasi Masuk])
    CHECK -- Ya --> CREATE[Buat Penyaluran Baru]

    CREATE --> FORM["Isi Form:\n• Pilih Kampanye\n• Jumlah Dana\n• Rekening LAZ\n• Catatan"]
    FORM --> VALIDATE{Jumlah ≤\nSisa Dana?}
    VALIDATE -- Tidak --> ERROR[Tampilkan Error]
    ERROR --> FORM
    VALIDATE -- Ya --> SAVE[Simpan — Status: Pending]

    SAVE --> PROCESS[Proses Transfer Dana]
    PROCESS --> UPLOAD["Upload Bukti Transfer\nStatus → Completed"]
    UPLOAD --> VERIFY["Verifikasi\nStatus → Verified"]

    VERIFY --> TRANSPARENT[Tampil di Halaman\nTransparansi Kampanye]
    TRANSPARENT --> DONE([Selesai ✅])

    PANEL --> RECON[Buka Rekonsiliasi]
    RECON --> SYNC["Sinkronisasi dengan\nMayar API\n/transaction/paid"]
    SYNC --> COMPARE[Bandingkan DB vs Mayar]
    COMPARE --> MATCH{Semua\ncocok?}
    MATCH -- Ya --> OK([✅ Rekonsiliasi OK])
    MATCH -- Tidak --> FLAG[Tandai Selisih]
    FLAG --> INVESTIGATE([Investigasi Manual])

    style CREATE fill:#2D6A4F,color:#fff
    style PROCESS fill:#C9A227,color:#0F1923
    style VERIFY fill:#16A34A,color:#fff
```

---

## 10. Architecture Diagram — System Overview

Arsitektur tingkat tinggi seluruh sistem.

```mermaid
flowchart TB
    subgraph Client ["🌐 Browser (Next.js Client)"]
        CHAT[Chat Interface]
        DASH[Dashboard]
        CAMP[Kampanye]
        ADMIN_UI[Admin Panel]
        SIDEBAR[App Sidebar]
    end

    subgraph Server ["⚙️ Next.js Server (App Router)"]
        API_AGENT["/api/agent\n(SSE Streaming)"]
        API_CONV["/api/conversations\n(CRUD)"]
        API_WH["/api/webhooks/mayar\n(Webhook Handler)"]
        API_ADMIN["/api/admin/*\n(Disbursement, Recon)"]
        API_DON["/api/donations/status\n(Polling)"]
        MW["middleware.ts\n(Auth Guard)"]
    end

    subgraph AI ["🤖 AI Agent Layer"]
        GRAPH["LangGraph\nStateGraph"]
        NODES["7 Nodes:\nINTAKE → CALCULATE →\nRESEARCH → FRAUD →\nRECOMMEND → PAYMENT →\nIMPACT"]
        TOOLS["Tools:\ncampaigns, fraud,\nislamic-context, mayar"]
    end

    subgraph External ["🌍 External Services"]
        GROQ["Groq API\n(Llama 3.3 70B)"]
        MAYAR["Mayar API\n(Payment Gateway)"]
        SUPA_AUTH["Supabase Auth\n(Google OAuth)"]
        LANGSMITH["LangSmith\n(Tracing)"]
    end

    subgraph Data ["💾 Database"]
        PG["PostgreSQL\n(Supabase)"]
        PRISMA["Prisma ORM"]
    end

    CHAT --> |SSE POST| API_AGENT
    SIDEBAR --> |GET/DELETE| API_CONV
    DASH --> |GET| API_DON
    ADMIN_UI --> |CRUD| API_ADMIN

    MW --> API_AGENT
    MW --> API_CONV
    MW --> API_ADMIN

    API_AGENT --> GRAPH
    GRAPH --> NODES
    NODES --> TOOLS

    TOOLS --> GROQ
    TOOLS --> MAYAR
    GRAPH --> LANGSMITH

    API_AGENT --> PRISMA
    API_CONV --> PRISMA
    API_WH --> PRISMA
    API_ADMIN --> PRISMA
    API_DON --> PRISMA
    PRISMA --> PG

    MAYAR --> |Webhook| API_WH
    Client --> |Auth| SUPA_AUTH

    style GRAPH fill:#1B4332,color:#fff
    style NODES fill:#2D6A4F,color:#fff
    style GROQ fill:#C9A227,color:#0F1923
    style MAYAR fill:#C9A227,color:#0F1923
    style PG fill:#40916C,color:#fff
```

---

## Catatan

- Semua diagram menggunakan format **Mermaid** — didukung langsung oleh GitHub, GitLab, dan VS Code (dengan extension Mermaid).
- Warna mengikuti brand tokens SEDEKAH.AI (green: `#1B4332` → `#D8F3DC`, gold: `#C9A227`).
- Untuk melihat diagram, gunakan:
  - **VS Code:** Install extension "Markdown Preview Mermaid Support"
  - **GitHub:** Preview otomatis di file `.md`
  - **Online:** [Mermaid Live Editor](https://mermaid.live)
