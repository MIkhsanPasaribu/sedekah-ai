# SEDEKAH.AI — Copilot Instructions

> Dokumen panduan pengembangan untuk GitHub Copilot dan AI assistants.
> Proyek: SEDEKAH.AI — Amil Digital Terpercaya berbasis Agentic AI
> Kompetisi: Mayar Vibecoding Competition — Ramadhan 2026

---

## 1. Tech Stack

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 14 (App Router, TypeScript strict)        |
| Styling         | Tailwind CSS 3.4+ dengan custom brand tokens      |
| Database        | Supabase (PostgreSQL) + Prisma ORM                |
| Auth            | Supabase Auth (Google OAuth + Email/Password)     |
| LLM             | Groq — Llama 3.3 70B Versatile                    |
| Agent Framework | LangGraph (StateGraph) via `@langchain/langgraph` |
| AI Streaming    | Vercel AI SDK (`ai` package)                      |
| Observability   | LangSmith Tracing                                 |
| Payment         | Mayar API (sandbox + production)                  |
| Package Manager | npm                                               |
| Node Version    | 18.x LTS atau lebih baru                          |

---

## 2. Project Structure

```
sedekah-ai/
├── app/                              # Next.js 14 App Router
│   ├── (auth)/                       # Auth route group
│   │   ├── login/page.tsx            # Login page
│   │   └── callback/route.ts        # OAuth callback
│   ├── chat/                         # AI Agent chat
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── dashboard/                    # Impact Dashboard
│   │   ├── page.tsx
│   │   └── impact/[donationId]/page.tsx
│   ├── campaigns/                    # Campaign listing
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── success/page.tsx              # Post-payment redirect
│   ├── api/
│   │   ├── agent/route.ts            # LangGraph streaming endpoint
│   │   └── webhooks/mayar/route.ts   # Mayar webhook handler
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Landing page
├── components/
│   ├── chat/                         # Chat UI components
│   ├── dashboard/                    # Dashboard components
│   ├── campaigns/                    # Campaign components
│   └── shared/                       # Reusable/shared components
├── lib/
│   ├── agent/                        # LangGraph agent logic
│   │   ├── graph.ts                  # StateGraph assembly
│   │   ├── state.ts                  # SedekahState schema
│   │   ├── nodes/                    # 7 node files
│   │   └── tools/                    # LangChain tool definitions
│   ├── mayar/                        # Mayar API client
│   ├── supabase/                     # Supabase clients
│   ├── islamic-quotes/               # Ayat/hadith database
│   └── utils.ts                      # Shared utilities (cn, formatRupiah, etc.)
├── prisma/
│   ├── schema.prisma                 # 5 tables
│   └── seed.ts                       # 20 sample campaigns
├── public/images/                    # Logo, assets, patterns
├── .env.example                      # Environment variable template
└── middleware.ts                      # Auth middleware
```

---

## 3. Naming Conventions

| Element            | Convention           | Example                           |
| ------------------ | -------------------- | --------------------------------- |
| Files (components) | PascalCase           | `ChatInterface.tsx`               |
| Files (lib/utils)  | kebab-case           | `islamic-context.tool.ts`         |
| Files (API routes) | `route.ts`           | `app/api/agent/route.ts`          |
| Components         | PascalCase           | `export function MessageBubble()` |
| Functions          | camelCase            | `calculateZakat()`                |
| Variables          | camelCase            | `trustScore`, `donorIntent`       |
| Constants          | UPPER_SNAKE_CASE     | `MAYAR_BASE_URL`, `NISAB_EMAS`    |
| Types/Interfaces   | PascalCase           | `SedekahState`, `Campaign`        |
| Enums              | PascalCase + members | `DonationType.ZAKAT_MAL`          |
| CSS classes        | Tailwind utility     | `bg-brand-green-deep`             |
| Database tables    | snake_case           | `giving_journey`                  |
| Database columns   | camelCase (Prisma)   | `mayarCustomerId`                 |
| Environment vars   | UPPER_SNAKE_CASE     | `GROQ_API_KEY`                    |

---

## 4. Coding Standards

### TypeScript

- **Strict mode** enabled (`strict: true` in tsconfig.json)
- Always use **explicit return types** on exported functions
- Prefer `interface` over `type` for object shapes
- Use `const` by default, `let` only when mutation is needed
- **Never** use `any` — use `unknown` and narrow types properly
- All API responses must be typed with interfaces

### React / Next.js

- Use **Server Components** by default; add `'use client'` only when needed (hooks, interactivity)
- Use **Server Actions** for form submissions and mutations
- Route handlers in `app/api/` use `NextRequest` / `NextResponse`
- Use `loading.tsx` for Suspense loading states
- Use `error.tsx` for error boundaries
- Prefer `next/image` over `<img>` for images
- Use `next/font` for font loading (Plus Jakarta Sans, Inter)
- Google Fonts for Amiri (Arabic script)

### Components

- One component per file (co-located types/helpers are fine)
- Props interface named `{ComponentName}Props`
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes
- Prefer composition over prop drilling
- Client components should be as small as possible — push logic to server components

### Imports

- Use `@/` path alias for all imports from project root
- Order: React/Next → external packages → `@/lib` → `@/components` → relative
- One blank line between import groups

---

## 5. Brand Design Tokens

### Colors (Tailwind)

```
brand-green-deep:   #1B4332   // Primary — navbar, buttons, headers
brand-green-mid:    #2D6A4F   // Hover states, card headers
brand-green-light:  #40916C   // Border accents, icons
brand-green-pale:   #74C69D   // Badge fills, progress bars
brand-green-ghost:  #D8F3DC   // Card backgrounds, success bg

brand-gold-deep:    #92620A   // Gold text on light backgrounds
brand-gold-core:    #C9A227   // Primary accent — icons, badges, logo dot
brand-gold-bright:  #E8C55A   // Hover states
brand-gold-pale:    #FDF3C4   // Badge backgrounds, highlight rows
brand-gold-ghost:   #FFFBEB   // Section backgrounds

surface-warm:       #FAF3E0   // Main page background (warm cream)
surface-cool:       #F8FAFC   // Alternate page background
surface-white:      #FFFFFF   // Cards, dialogs

ink-black:          #0F1923   // Heading text (h1, h2)
ink-dark:           #1E293B   // Body text
ink-mid:            #475569   // Secondary text, captions
ink-light:          #94A3B8   // Placeholders, disabled
ink-ghost:          #CBD5E1   // Borders, dividers
```

### Semantic Colors

```
success:       #16A34A    // Payment success, paid status
success-light: #DCFCE7
warning:       #D97706    // Trust Score medium (40-70)
warning-light: #FEF9C3
danger:        #DC2626    // Trust Score low (<40), fraud alert
danger-light:  #FEE2E2
info:          #0284C7    // Info tooltips
info-light:    #E0F2FE
```

### Trust Score Colors

```
85-100: #16A34A (Sangat Terpercaya)
70-84:  #4ADE80 (Terpercaya)
55-69:  #EAB308 (Cukup Baik)
40-54:  #F97316 (Perlu Perhatian)
0-39:   #DC2626 (Berisiko Tinggi)
```

### Typography

- **Headings (H1-H2):** Plus Jakarta Sans, 700-800 weight
- **Headings (H3-H4):** Plus Jakarta Sans, 600 weight
- **Body text:** Inter, 400-500 weight
- **Nominal angka donasi:** Plus Jakarta Sans, 700 weight (tabular figures)
- **Ayat Al-Quran:** Amiri, 400 weight
- **Hadith/terjemahan:** Inter Italic, 400 weight

### Gradients

```css
Hero:       linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)
Gold:       linear-gradient(90deg, #92620A, #C9A227, #E8C55A, #C9A227, #92620A)
Impact:     linear-gradient(180deg, #D8F3DC 0%, #FFFFFF 100%)
Warm Fade:  linear-gradient(180deg, #FAF3E0 0%, #FFFFFF 100%)
```

---

## 6. Bahasa & Tone of Voice AI

- **Bahasa:** 100% Bahasa Indonesia — semua UI labels, AI responses, error messages
- **Pembukaan:** Selalu dimulai dengan "Assalamu'alaikum" atau "Bismillahirrahmanirrahim"
- **Konfirmasi niat:** "Alhamdulillah, niat Anda untuk..." — validasi emosional
- **Kalkulasi:** Jelas, tepat, format Rupiah: `Rp 6.250.000`
- **Rekomendasi:** Selalu sertakan reasoning (mengapa kampanye ini dipilih)
- **Post-payment:** Hangat, spiritual, penuh syukur
- **Error handling:** Sabar, tidak judgmental — "Sepertinya ada yang kurang lengkap..."
- **Closing sesi:** Doa/harapan baik — "Semoga Allah melipatgandakan kebaikan Anda"
- **DILARANG:** Bahasa teknikal ke user ("JSON", "API", "error 400")

---

## 7. Mayar API Integration

### Configuration

```
Production: https://api.mayar.id/hl/v1
Sandbox:    https://api.mayar.club/hl/v1
Auth:       Authorization: Bearer {MAYAR_API_KEY}
Content-Type: application/json
```

### Endpoints Used (10 total)

1. `POST /invoice/create` — Buat invoice zakat/sedekah
2. `GET /invoice/{id}` — Cek status invoice
3. `POST /payment/create` — Quick donation link
4. `POST /customer/create` — Register donatur baru
5. `GET /customer/{id}` — Profil donatur
6. `POST /discount/create` — Kupon promo Ramadhan
7. `GET /transaction/paid` — Aggregate transaksi sukses
8. `POST /webhook/register` — Register webhook URL
9. `POST /creditbasedproduct/addcustomercredit` — Top-up kredit (Post-MVP)
10. `POST /creditbasedproduct/spendcustomercredit` — Spend kredit (Post-MVP)

### Client Pattern

- Base client di `lib/mayar/client.ts` — singleton fetch wrapper
- Per-resource modules: `invoice.ts`, `payment.ts`, `customer.ts`, dll.
- Semua fungsi return typed responses
- Handle 429 (Rate Limit) dengan retry-after logic
- Log errors tanpa expose ke end-user

---

## 8. LangGraph Agent Architecture

### 7 Nodes (Sequential Flow)

```
INTAKE → CALCULATE → RESEARCH → FRAUD_DETECTOR → RECOMMEND → PAYMENT_EXECUTOR → IMPACT_TRACKER
```

### State Schema (`SedekahState`)

```typescript
interface SedekahState {
  messages: BaseMessage[];
  userFinancialData: UserFinancialData | null;
  zakatBreakdown: ZakatBreakdown | null;
  campaigns: Campaign[];
  fraudScores: Record<string, FraudScore>;
  recommendation: Recommendation | null;
  mayarInvoiceLink: string | null;
  paymentStatus: "pending" | "paid" | "failed" | "cancelled" | null;
  impactReport: ImpactReport | null;
  donorIntent: string | null;
  islamicContext: string | null;
}
```

### Node Conventions

- Each node is a separate file in `lib/agent/nodes/`
- Each node receives `SedekahState`, returns partial state update
- Use `@tool` decorator from `@langchain/core/tools` for tool definitions
- All node names use UPPER_SNAKE_CASE in trace: `INTAKE`, `CALCULATE`, etc.
- RUANG HATI transplants are integrated INTO existing nodes (not separate nodes)

### Human-in-the-Loop

- Single `interrupt()` point before PAYMENT_EXECUTOR node
- User must click "Bayar Sekarang" or "Ubah Alokasi" to proceed

### LLM Configuration

```typescript
import { ChatGroq } from "@langchain/groq";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7, // Empathetic responses
  apiKey: process.env.GROQ_API_KEY,
});

const calculatorLlm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0, // Precise calculations
  apiKey: process.env.GROQ_API_KEY,
});
```

---

## 9. Database Conventions (Prisma)

- **Provider:** `postgresql` (Supabase)
- **ID strategy:** UUID with `@default(uuid())`
- **Timestamps:** `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- **Enums:** Defined in Prisma schema, mapped to snake_case in DB
- **Relations:** Explicit `@relation` with `onDelete: Cascade` where appropriate
- **Indexes:** On foreign keys and frequently queried columns

---

## 10. Zakat Calculation Rules (2026)

| Jenis Zakat       | Nisab                            | Tarif       |
| ----------------- | -------------------------------- | ----------- |
| Zakat Penghasilan | 85g emas (≈ Rp 85.000.000/tahun) | 2.5%        |
| Zakat Emas        | 85 gram                          | 2.5%        |
| Zakat Tabungan    | Setara 85g emas, haul 1 tahun    | 2.5%        |
| Zakat Saham       | Setara 85g emas                  | 2.5%        |
| Zakat Crypto      | Setara 85g emas                  | 2.5%        |
| Zakat Fitrah      | 3.5 liter beras per jiwa         | ≈ Rp 45.000 |

**Harga emas referensi 2026:** ≈ Rp 1.000.000/gram
**Nisab 2026:** 85 × Rp 1.000.000 = **Rp 85.000.000**

---

## 11. Utility Functions

### `cn()` — Conditional class names

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### `formatRupiah()` — Format angka ke Rupiah

```typescript
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
```

---

## 12. Component Patterns

### Server Component (default)

```tsx
import { prisma } from "@/lib/prisma";

export default async function CampaignList() {
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
  });
  return <div>{/* render */}</div>;
}
```

### Client Component (interactive)

```tsx
"use client";

import { useState } from "react";

interface Props {
  /* ... */
}

export function PaymentApprovalModal({ onApprove, onEdit }: Props) {
  const [loading, setLoading] = useState(false);
  return <div>{/* interactive UI */}</div>;
}
```

### API Route

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    // process
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

---

## 13. Error Handling

- API routes: always try/catch, return typed error responses
- Client components: use error boundaries (`error.tsx`)
- Mayar API: retry on 429, log on 5xx, show user-friendly message on failure
- LangGraph: each node catches errors and adds error context to state
- Forms: validate on both client (UX) and server (security)
- Never expose stack traces or internal error details to users

---

## 14. Security

- All API keys in environment variables (never hardcoded)
- Supabase RLS (Row Level Security) enabled on all tables
- Mayar webhook verification (check signature/origin)
- CSRF protection via Next.js built-in mechanisms
- Input sanitization on all user inputs
- Rate limiting on agent endpoint

---

## 15. Assets

| Asset       | Path                       | Usage                       |
| ----------- | -------------------------- | --------------------------- |
| Logo utama  | `/public/images/logo.png`  | Navbar, landing page, login |
| Asset brand | `/public/images/asset.png` | Hero section, presentasi    |

---

## 16. Git Conventions

- **Commit messages:** Conventional Commits format
  - `feat:` fitur baru
  - `fix:` perbaikan bug
  - `style:` perubahan styling/UI
  - `refactor:` refactoring tanpa perubahan fungsionalitas
  - `chore:` konfigurasi, dependencies
  - `docs:` dokumentasi
- **Branch:** `main` (production), `dev` (development)
