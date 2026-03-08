# SEDEKAH.AI — Amil Digital Terpercaya 🕌💚

> Platform donasi cerdas berbasis **Agentic AI** untuk menghitung zakat, memverifikasi kampanye, dan menyalurkan sedekah dengan transparansi penuh.

Dibangun untuk **Mayar Vibecoding Competition — Ramadhan 2026**.

---

## ✨ Fitur Utama

### 🧮 Kalkulator Zakat AI

Hitung zakat penghasilan, emas, tabungan, saham, crypto, dan fitrah secara otomatis berdasarkan fiqih terkini (Nisab 85g emas ≈ Rp 85.000.000).

### 🛡️ Fraud Shield AI

Trust Score 0-100 untuk setiap kampanye. Analisis multi-dimensi:

- **Narasi** — Kewajaran deskripsi kampanye
- **Finansial** — Kewajaran target dan alokasi
- **Temporal** — Konsistensi timeline
- **Identitas** — Verifikasi LAZ dan legalitas

### 📊 Impact Genome

Lacak dampak nyata donasi: estimasi penerima manfaat, ROI kebaikan, dan milestone spiritual Ramadhan.

---

## 🏗️ Tech Stack

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 16 (App Router, TypeScript strict)        |
| Styling         | Tailwind CSS 4 dengan custom brand tokens         |
| Database        | Supabase (PostgreSQL) + Prisma ORM                |
| Auth            | Supabase Auth (Google OAuth + Email/Password)     |
| LLM             | Groq — Llama 3.3 70B Versatile                    |
| Agent Framework | LangGraph (StateGraph) via `@langchain/langgraph` |
| Payment         | Mayar API (sandbox + production)                  |

---

## 🤖 Agent Architecture

```
INTAKE → CALCULATE → RESEARCH → FRAUD_DETECTOR → RECOMMEND → PAYMENT_EXECUTOR → IMPACT_TRACKER
```

7-node LangGraph StateGraph dengan:

- **Human-in-the-loop** — interrupt sebelum pembayaran
- **6 AI Tools** — Zakat calculator, Mayar invoice, Campaign search, Fraud analysis, Islamic context
- **Groq LLM** — Llama 3.3 70B untuk respons empatis dalam Bahasa Indonesia

---

## 📁 Project Structure

```
sedekah-ai/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth (login, callback)
│   ├── chat/                         # AI Agent chat
│   ├── dashboard/                    # Impact Dashboard
│   │   └── impact/[donationId]/      # Donation detail
│   ├── campaigns/                    # Campaign listing
│   │   └── [id]/                     # Campaign detail
│   ├── success/                      # Post-payment
│   └── api/
│       ├── agent/                    # LangGraph endpoint
│       └── webhooks/mayar/           # Mayar webhook
├── components/
│   ├── chat/                         # ChatInterface, MessageBubble, etc.
│   ├── dashboard/                    # StatCard, Heatmap, etc.
│   ├── campaigns/                    # CampaignCard, Filter, Detail
│   └── shared/                       # Navbar, Button, Card, etc.
├── lib/
│   ├── agent/                        # LangGraph agent
│   │   ├── graph.ts                  # StateGraph assembly
│   │   ├── state.ts                  # SedekahState schema
│   │   ├── nodes/                    # 7 node files
│   │   └── tools/                    # 5 AI tools
│   ├── mayar/                        # Mayar API client (10 modules)
│   ├── supabase/                     # Supabase clients
│   └── utils.ts                      # Utilities
├── prisma/
│   ├── schema.prisma                 # 5 tables, 5 enums
│   └── seed.ts                       # 20 sample campaigns
└── public/images/                    # Logo, assets
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ LTS
- npm
- Supabase project (with PostgreSQL)
- Groq API key
- Mayar API key (sandbox)

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/sedekah-ai.git
cd sedekah-ai

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your actual API keys

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with sample campaigns
npx prisma db seed

# Run development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database
DATABASE_URL=your_postgresql_connection_string

# Groq LLM
GROQ_API_KEY=your_groq_api_key

# Mayar Payment
MAYAR_API_KEY=your_mayar_api_key
MAYAR_SANDBOX=true

# LangSmith (optional)
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_PROJECT=sedekah-ai
```

---

## 🎨 Brand Design

| Token              | Value     | Usage                   |
| ------------------ | --------- | ----------------------- |
| `brand-green-deep` | `#1B4332` | Primary navbar, buttons |
| `brand-gold-core`  | `#C9A227` | Accent icons, badges    |
| `surface-warm`     | `#FAF3E0` | Page background (cream) |
| `ink-black`        | `#0F1923` | Heading text            |

**Bahasa:** 100% Bahasa Indonesia — semua UI, AI responses, error messages.

---

## 📋 Zakat Calculation Rules (2026)

| Jenis Zakat       | Nisab                            | Tarif       |
| ----------------- | -------------------------------- | ----------- |
| Zakat Penghasilan | 85g emas (≈ Rp 85.000.000/tahun) | 2.5%        |
| Zakat Emas        | 85 gram                          | 2.5%        |
| Zakat Tabungan    | Setara 85g emas, haul 1 tahun    | 2.5%        |
| Zakat Fitrah      | 3.5 liter beras per jiwa         | ≈ Rp 45.000 |

---

## 🔒 Security

- All API keys in environment variables
- Supabase RLS enabled
- Mayar webhook signature verification
- Input sanitization on all user inputs
- Auth middleware on protected routes

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Dibuat dengan 💚 untuk umat — <strong>SEDEKAH.AI</strong> © 2026
</p>
