import { z } from "zod";

export const agentActionSchema = z.enum(["approve", "edit"]);

export const agentMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z
    .string()
    .trim()
    .min(1, "Pesan tidak boleh kosong")
    .max(4_000, "Pesan terlalu panjang (maksimal 4000 karakter)"),
});

export const agentRequestBodySchema = z
  .object({
    messages: z.array(agentMessageSchema).max(50).optional(),
    threadId: z
      .string()
      .trim()
      .min(1, "threadId tidak boleh kosong")
      .max(191, "threadId terlalu panjang")
      .optional(),
    action: agentActionSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action) {
      return;
    }

    if (!value.messages || value.messages.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["messages"],
        message: "Pesan tidak boleh kosong",
      });
    }
  });

export const impactNarrativeRequestBodySchema = z.object({
  donationId: z.string().uuid("donationId tidak valid"),
});

export type AgentRequestBodyInput = z.infer<typeof agentRequestBodySchema>;
export type ImpactNarrativeRequestBodyInput = z.infer<
  typeof impactNarrativeRequestBodySchema
>;
