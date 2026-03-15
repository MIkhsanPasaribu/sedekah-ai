// ============================================================
// AI Campaign Summary Component — Server Component
// Generates a 3-sentence Groq summary for a campaign
// ============================================================

import { createTaskLlm } from "@/lib/models/factory";

interface CampaignAiSummaryProps {
  name: string;
  description: string;
  category: string;
  laz: string;
  collectedAmount: number;
  targetAmount: number;
}

async function generateSummary(props: CampaignAiSummaryProps): Promise<string> {
  const { name, description, category, laz, collectedAmount, targetAmount } =
    props;
  const progress = Math.round(
    (collectedAmount / Math.max(targetAmount, 1)) * 100,
  );

  const llm = createTaskLlm("campaign_summary", {
    temperature: 0.7,
  });

  const res = await llm.invoke([
    {
      role: "system",
      content:
        "Kamu adalah copywriter konten islami. Tulis ringkasan 3 kalimat dalam Bahasa Indonesia yang menyentuh hati tentang kampanye donasi ini. Sertakan dampak nyata dan ajakan donasi yang empatik. Jangan gunakan tanda bintang atau markdown.",
    },
    {
      role: "user",
      content: `Kampanye: ${name}\nKategori: ${category}\nLAZ: ${laz}\nDeskripsi: ${description}\nProgress: ${progress}% terkumpul`,
    },
  ]);

  return String(res.content).trim();
}

export async function CampaignAiSummary(props: CampaignAiSummaryProps) {
  let summary = "";
  try {
    summary = await generateSummary(props);
  } catch {
    return null;
  }

  if (!summary) return null;

  return (
    <div className="rounded-xl border border-brand-green-pale bg-gradient-to-b from-brand-green-ghost/40 to-surface-white px-5 py-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm">✨</span>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green-mid">
          Ringkasan AI
        </p>
      </div>
      <p className="text-sm leading-relaxed text-ink-dark">{summary}</p>
    </div>
  );
}
