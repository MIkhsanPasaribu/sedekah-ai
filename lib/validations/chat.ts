import { z } from "zod";

export const chatMessageSchema = z
  .string()
  .trim()
  .min(1, "Pesan tidak boleh kosong")
  .max(2000, "Pesan terlalu panjang (maksimal 2000 karakter)");

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
