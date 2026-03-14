import { z } from "zod";
import type { Recommendation } from "@/lib/agent/state";

export const allocationItemRuntimeSchema = z.object({
  campaignId: z.string().min(1, "Campaign ID wajib diisi"),
  campaignName: z.string().min(1, "Nama kampanye wajib diisi"),
  amount: z.number().int("Nominal alokasi harus bilangan bulat").positive(),
  percentage: z.number().min(0).max(100),
  reasoning: z.string().min(1),
  trustScore: z.number().min(0).max(100).optional(),
});

export const recommendationRuntimeSchema = z
  .object({
    allocations: z.array(allocationItemRuntimeSchema).min(1),
    totalAmount: z.number().int("Total donasi harus bilangan bulat").positive(),
    reasoning: z.string().min(1),
    islamicContext: z.string(),
  })
  .refine(
    (data) => {
      const allocationsTotal = data.allocations.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      return Math.abs(allocationsTotal - data.totalAmount) <= 1;
    },
    {
      message: "Total alokasi tidak sama dengan total donasi",
      path: ["allocations"],
    },
  );

export function validateRecommendationRuntime(
  payload: unknown,
): Recommendation | null {
  const parsed = recommendationRuntimeSchema.safeParse(payload);
  return parsed.success ? (parsed.data as Recommendation) : null;
}
