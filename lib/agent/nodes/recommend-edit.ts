import type {
  AllocationEditTarget,
  AllocationItem,
  Recommendation,
  SedekahState,
} from "../state";
import { buildAgentMessage } from "@/lib/agent/utils";
import { parseDonationAmount } from "@/lib/agent/parsers/donation";
import { formatRupiah } from "@/lib/utils";

interface ParsedPercentageTarget {
  campaignId: string;
  campaignName: string;
  percentage: number;
}

function getLatestHumanText(state: SedekahState): string {
  const humanMessages = state.messages.filter(
    (m) => (m as { _getType?: () => string })._getType?.() === "human",
  );
  const latest = humanMessages.at(-1);
  return typeof latest?.content === "string" ? latest.content : "";
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSingleCampaignIntent(text: string): boolean {
  return /(satu\s*tempat|satu\s*saja|hanya\s*satu|satu\s*kampanye|fokus\s*ke|100%\s*ke)/i.test(
    text,
  );
}

function isAffirmative(text: string): boolean {
  return /^(ya|iya|y|setuju|lanjut|oke|ok|benar|ganti)$/i.test(
    normalizeForMatch(text),
  );
}

function isNegative(text: string): boolean {
  return /^(tidak|ga|gak|ngga|jangan|batal|tetap|no)$/i.test(
    normalizeForMatch(text),
  );
}

function parseAllocationTarget(
  text: string,
  options: AllocationItem[],
): AllocationEditTarget | null {
  const normalized = normalizeForMatch(text);

  const percentMatch = normalized.match(/(\d{1,3})\s*%/i);
  const percentage = percentMatch ? Number(percentMatch[1]) : null;

  const numericMatch = normalized.match(
    /(?:nomor|no|opsi|pilih|ke)\s*(\d{1,2})/i,
  );
  const standaloneNumber = normalized.match(/^(\d{1,2})$/);
  const parsedIndex = Number(numericMatch?.[1] ?? standaloneNumber?.[1] ?? "0");
  if (
    Number.isInteger(parsedIndex) &&
    parsedIndex > 0 &&
    parsedIndex <= options.length
  ) {
    const selected = options[parsedIndex - 1];
    return {
      campaignId: selected.campaignId,
      campaignName: selected.campaignName,
      selectionIndex: parsedIndex,
      percentage,
    };
  }

  const referenceMap: Array<{ pattern: RegExp; index: number }> = [
    { pattern: /(yang\s*)?(pertama|teratas|paling\s*atas)/i, index: 1 },
    { pattern: /(yang\s*)?(kedua)/i, index: 2 },
    { pattern: /(yang\s*)?(ketiga)/i, index: 3 },
  ];

  for (const ref of referenceMap) {
    if (ref.pattern.test(normalized) && ref.index <= options.length) {
      const selected = options[ref.index - 1];
      return {
        campaignId: selected.campaignId,
        campaignName: selected.campaignName,
        selectionIndex: ref.index,
        percentage,
      };
    }
  }

  let bestMatch: AllocationItem | null = null;
  let bestLength = 0;
  for (const option of options) {
    const normalizedName = normalizeForMatch(option.campaignName);
    if (!normalizedName) continue;
    if (
      normalized.includes(normalizedName) &&
      normalizedName.length > bestLength
    ) {
      bestMatch = option;
      bestLength = normalizedName.length;
    }
  }

  if (bestMatch) {
    const index = options.findIndex(
      (o) => o.campaignId === bestMatch.campaignId,
    );
    return {
      campaignId: bestMatch.campaignId,
      campaignName: bestMatch.campaignName,
      selectionIndex: index >= 0 ? index + 1 : null,
      percentage,
    };
  }

  if (percentage !== null) {
    return {
      campaignId: null,
      campaignName: null,
      selectionIndex: null,
      percentage,
    };
  }

  return null;
}

function parsePercentageTargets(
  text: string,
  options: AllocationItem[],
): ParsedPercentageTarget[] {
  const normalized = normalizeForMatch(text);
  const assignments = new Map<string, ParsedPercentageTarget>();

  const byNumberRegex =
    /(\d{1,3})\s*%\s*(?:ke|untuk)\s*(?:nomor|no|opsi|pilihan)?\s*(\d{1,2})/gi;
  for (const match of normalized.matchAll(byNumberRegex)) {
    const percentage = Number(match[1]);
    const index = Number(match[2]);
    if (!Number.isInteger(index) || index < 1 || index > options.length) {
      continue;
    }

    const selected = options[index - 1];
    assignments.set(selected.campaignId, {
      campaignId: selected.campaignId,
      campaignName: selected.campaignName,
      percentage,
    });
  }

  const byReferenceRules: Array<{ regex: RegExp; index: number }> = [
    {
      regex:
        /(\d{1,3})\s*%\s*(?:ke|untuk)\s*(?:yang\s*)?(pertama|teratas|paling\s*atas)/i,
      index: 1,
    },
    {
      regex: /(\d{1,3})\s*%\s*(?:ke|untuk)\s*(?:yang\s*)?kedua/i,
      index: 2,
    },
    {
      regex: /(\d{1,3})\s*%\s*(?:ke|untuk)\s*(?:yang\s*)?ketiga/i,
      index: 3,
    },
  ];

  for (const rule of byReferenceRules) {
    const match = normalized.match(rule.regex);
    if (!match || rule.index > options.length) {
      continue;
    }

    const percentage = Number(match[1]);
    const selected = options[rule.index - 1];
    assignments.set(selected.campaignId, {
      campaignId: selected.campaignId,
      campaignName: selected.campaignName,
      percentage,
    });
  }

  for (const option of options) {
    const normalizedName = normalizeForMatch(option.campaignName);
    if (!normalizedName) continue;

    const escapedName = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `(\\d{1,3})\\s*%\\s*(?:ke|untuk)\\s*${escapedName}(?:\\b|$)`,
      "i",
    );
    const match = normalized.match(regex);
    if (!match) continue;

    const percentage = Number(match[1]);
    assignments.set(option.campaignId, {
      campaignId: option.campaignId,
      campaignName: option.campaignName,
      percentage,
    });
  }

  return [...assignments.values()].filter(
    (item) => Number.isFinite(item.percentage) && item.percentage > 0,
  );
}

function buildPercentageRecommendation(
  targets: ParsedPercentageTarget[],
  options: AllocationItem[],
  totalAmount: number,
  islamicContext: string,
): Recommendation {
  const selectedItems = targets
    .map((target) => {
      const base = options.find(
        (option) => option.campaignId === target.campaignId,
      );
      if (!base) return null;

      return {
        ...base,
        percentage: target.percentage,
      };
    })
    .filter((item): item is AllocationItem => item !== null);

  const allocations = selectedItems.map((item) => ({
    ...item,
    amount: Math.round((totalAmount * item.percentage) / 100),
  }));

  const allocatedTotal = allocations.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  if (allocations.length > 0 && allocatedTotal !== totalAmount) {
    allocations[0].amount += totalAmount - allocatedTotal;
  }

  return {
    allocations,
    totalAmount,
    reasoning:
      "Alokasi diperbarui berdasarkan persentase kampanye yang Anda tentukan.",
    islamicContext,
  };
}

function buildSingleSelectionPrompt(
  options: AllocationItem[],
  currentTotal: number,
): string {
  const lines = [
    "Baik, untuk alokasi ke satu kampanye saya butuh Anda pilih targetnya terlebih dahulu. ✨",
    "",
    `Total donasi saat ini: ${formatRupiah(currentTotal)}`,
    "",
    "Pilihan kampanye rekomendasi:",
  ];

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    lines.push(`${index + 1}. ${option.campaignName} (${option.reasoning})`);
  }

  lines.push("");
  lines.push(
    "Balas dengan format: `pilih nomor 2`, `ke Rumah Singgah`, atau `100% ke nomor 1`.",
  );

  return lines.join("\n");
}

function buildRecommendationMessage(rec: Recommendation): string {
  const isSingleCampaign = rec.allocations.length === 1;
  const lines = [
    "Alhamdulillah, alokasi sudah saya ubah sesuai permintaan Anda. 🤲",
    "",
    isSingleCampaign
      ? "💡 Rekomendasi Alokasi Donasi (Mode 1 Kampanye)"
      : "💡 Rekomendasi Alokasi Donasi (Mode Persentase)",
  ];

  for (let index = 0; index < rec.allocations.length; index += 1) {
    const alloc = rec.allocations[index];
    lines.push(`${index + 1}. ${alloc.campaignName}`);
    lines.push(`   💰 ${formatRupiah(alloc.amount)} (${alloc.percentage}%)`);
    lines.push(`   📊 ${alloc.reasoning}`);
  }

  lines.push("");
  lines.push(`✅ Total pembayaran: ${formatRupiah(rec.totalAmount)}`);
  lines.push("");
  lines.push(
    "Silakan pilih Bayar Sekarang jika sudah sesuai, atau Ubah Alokasi jika ingin menyesuaikan lagi.",
  );

  return lines.join("\n");
}

export async function recommendEditNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const previous = state.previousRecommendation;
  if (!state.editMode || !previous || previous.allocations.length === 0) {
    return {
      messages: [
        buildAgentMessage(
          "Mohon maaf, mode ubah alokasi belum memiliki konteks rekomendasi. Silakan mulai ulang rekomendasi donasi Anda.",
          "RECOMMEND_EDIT",
        ),
      ],
      editMode: false,
      previousRecommendation: null,
      awaitingAmountOverwriteConfirmation: false,
      proposedTotalAmount: null,
      awaitingSingleCampaignSelection: false,
      allocationEditTarget: null,
      recommendation: null,
    };
  }

  const latestText = getLatestHumanText(state);
  const parsedTarget = parseAllocationTarget(latestText, previous.allocations);
  const parsedPercentageTargets = parsePercentageTargets(
    latestText,
    previous.allocations,
  );
  let requestedSingle =
    state.awaitingSingleCampaignSelection ||
    detectSingleCampaignIntent(latestText);

  if (parsedPercentageTargets.length > 1) {
    requestedSingle = false;
  }

  const currentTotal = previous.totalAmount;
  let effectiveTotal = currentTotal;
  let awaitingAmountOverwriteConfirmation =
    state.awaitingAmountOverwriteConfirmation;
  let proposedTotalAmount = state.proposedTotalAmount;

  if (awaitingAmountOverwriteConfirmation) {
    if (!isAffirmative(latestText) && !isNegative(latestText)) {
      return {
        messages: [
          buildAgentMessage(
            `Saya mendeteksi nominal baru ${formatRupiah(
              proposedTotalAmount ?? currentTotal,
            )}. Apakah total donasi ingin diganti ke nominal tersebut? Balas \"ya\" atau \"tidak\".`,
            "RECOMMEND_EDIT",
          ),
        ],
      };
    }

    if (isNegative(latestText)) {
      awaitingAmountOverwriteConfirmation = false;
      proposedTotalAmount = null;
      requestedSingle = true;
    } else {
      effectiveTotal = proposedTotalAmount ?? currentTotal;
      awaitingAmountOverwriteConfirmation = false;
      proposedTotalAmount = null;
    }
  }

  const amountFromText = parseDonationAmount(latestText);
  if (
    amountFromText &&
    amountFromText > 0 &&
    amountFromText !== currentTotal &&
    !awaitingAmountOverwriteConfirmation
  ) {
    return {
      messages: [
        buildAgentMessage(
          `Saya menangkap nominal baru ${formatRupiah(amountFromText)}. Apakah total donasi ingin diganti dari ${formatRupiah(currentTotal)} menjadi ${formatRupiah(amountFromText)}? Balas \"ya\" atau \"tidak\".`,
          "RECOMMEND_EDIT",
        ),
      ],
      proposedTotalAmount: amountFromText,
      awaitingAmountOverwriteConfirmation: true,
      awaitingSingleCampaignSelection: requestedSingle,
      allocationEditTarget: parsedTarget ?? state.allocationEditTarget,
      recommendation: null,
    };
  }

  const resolvedTarget = parsedTarget ?? state.allocationEditTarget;

  if (parsedPercentageTargets.length > 0) {
    const hasInvalidPercentage = parsedPercentageTargets.some(
      (target) => target.percentage <= 0 || target.percentage > 100,
    );
    if (hasInvalidPercentage) {
      return {
        messages: [
          buildAgentMessage(
            "Persentase alokasi harus berada di rentang 1% sampai 100%. Silakan perbaiki format persentase Anda.",
            "RECOMMEND_EDIT",
          ),
        ],
        recommendation: null,
      };
    }

    if (parsedPercentageTargets.length === 1) {
      const onlyTarget = parsedPercentageTargets[0];
      if (onlyTarget.percentage !== 100) {
        return {
          messages: [
            buildAgentMessage(
              `Saya membaca ${onlyTarget.percentage}% ke ${onlyTarget.campaignName}. Mohon lengkapi sisa persentase untuk kampanye lain sampai total 100%, atau gunakan 100% untuk satu kampanye saja.`,
              "RECOMMEND_EDIT",
            ),
          ],
          recommendation: null,
        };
      }
    }

    const totalPercentage = parsedPercentageTargets.reduce(
      (sum, target) => sum + target.percentage,
      0,
    );
    if (totalPercentage !== 100) {
      return {
        messages: [
          buildAgentMessage(
            `Total persentase saat ini ${totalPercentage}%. Mohon sesuaikan hingga tepat 100%.`,
            "RECOMMEND_EDIT",
          ),
        ],
        recommendation: null,
      };
    }

    const recommendation = buildPercentageRecommendation(
      parsedPercentageTargets,
      previous.allocations,
      effectiveTotal,
      previous.islamicContext,
    );

    return {
      messages: [
        buildAgentMessage(
          buildRecommendationMessage(recommendation),
          "RECOMMEND_EDIT",
        ),
      ],
      recommendation,
      editMode: false,
      previousRecommendation: null,
      awaitingAmountOverwriteConfirmation: false,
      proposedTotalAmount: null,
      awaitingSingleCampaignSelection: false,
      allocationEditTarget: null,
    };
  }

  if (!requestedSingle && !resolvedTarget) {
    return {
      messages: [
        buildAgentMessage(
          "Silakan jelaskan perubahan alokasi yang Anda inginkan. Contoh: `100% ke nomor 2` atau `ke satu tempat saja`.",
          "RECOMMEND_EDIT",
        ),
      ],
      recommendation: null,
    };
  }

  if (requestedSingle && !resolvedTarget?.campaignId) {
    return {
      messages: [
        buildAgentMessage(
          buildSingleSelectionPrompt(previous.allocations, effectiveTotal),
          "RECOMMEND_EDIT",
        ),
      ],
      awaitingSingleCampaignSelection: true,
      awaitingAmountOverwriteConfirmation,
      proposedTotalAmount,
      allocationEditTarget: resolvedTarget,
      recommendation: null,
    };
  }

  const selectedCampaign = previous.allocations.find(
    (alloc) => alloc.campaignId === resolvedTarget?.campaignId,
  );
  if (!selectedCampaign) {
    return {
      messages: [
        buildAgentMessage(
          buildSingleSelectionPrompt(previous.allocations, effectiveTotal),
          "RECOMMEND_EDIT",
        ),
      ],
      awaitingSingleCampaignSelection: true,
      recommendation: null,
    };
  }

  const selectionPercentage = resolvedTarget?.percentage ?? 100;
  if (selectionPercentage !== 100) {
    return {
      messages: [
        buildAgentMessage(
          "Untuk mode satu kampanye, persentase harus 100%. Silakan gunakan format `100% ke nomor 2` atau pilih nama kampanye langsung.",
          "RECOMMEND_EDIT",
        ),
      ],
      awaitingSingleCampaignSelection: true,
      recommendation: null,
    };
  }

  const recommendation: Recommendation = {
    allocations: [
      {
        ...selectedCampaign,
        amount: effectiveTotal,
        percentage: 100,
        reasoning: `${selectedCampaign.reasoning} — Dialokasikan penuh sesuai instruksi Anda`,
      },
    ],
    totalAmount: effectiveTotal,
    reasoning:
      "Alokasi diperbarui berdasarkan pilihan kampanye tunggal dari donatur.",
    islamicContext: previous.islamicContext,
  };

  return {
    messages: [
      buildAgentMessage(
        buildRecommendationMessage(recommendation),
        "RECOMMEND_EDIT",
      ),
    ],
    recommendation,
    editMode: false,
    previousRecommendation: null,
    awaitingAmountOverwriteConfirmation: false,
    proposedTotalAmount: null,
    awaitingSingleCampaignSelection: false,
    allocationEditTarget: null,
  };
}
