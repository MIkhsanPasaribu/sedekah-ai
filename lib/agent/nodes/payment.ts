// ============================================================
// LangGraph Node 6: PAYMENT EXECUTOR — Create Mayar Invoice
// ============================================================
// interrupt: human approval → create Mayar invoice → return payment link
// Transplant RUANG HATI: Loading state dengan animasi dzikir singkat

import { AIMessage } from "@langchain/core/messages";
import type { SedekahState } from "../state";
import { createMayarInvoiceTool } from "../tools/mayar.tool";
import { createCustomer } from "@/lib/mayar/customer";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export async function paymentExecutorNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const { recommendation, donorName, donorEmail } = state;

  if (!recommendation || recommendation.allocations.length === 0) {
    return {
      messages: [
        new AIMessage({
          content:
            "Belum ada rekomendasi alokasi. Silakan mulai proses dari awal.",
          name: "PAYMENT_EXECUTOR",
        }),
      ],
    };
  }

  const totalAmount = recommendation.totalAmount;

  if (totalAmount <= 0) {
    return {
      messages: [
        new AIMessage({
          content:
            "Silakan tentukan nominal donasi yang ingin Anda salurkan. 🤲",
          name: "PAYMENT_EXECUTOR",
        }),
      ],
    };
  }

  // Pakai data user ter-autentikasi; fallback ke placeholder jika tidak ada sesi
  const name = donorName ?? "Donatur SEDEKAH.AI";
  const email = donorEmail ?? "donatur@sedekah.ai";

  // Pastikan donatur terdaftar di Mayar sebagai customer
  try {
    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (dbUser && !dbUser.mayarCustomerId) {
      const customerRes = await createCustomer({
        name,
        email,
        mobile: dbUser.mobile ?? undefined,
      });
      if (customerRes.statusCode === 200 && customerRes.data) {
        const customerId = (customerRes.data as { id?: string }).id;
        if (customerId) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { mayarCustomerId: customerId },
          });
        }
      }
    }
  } catch {
    // Non-fatal: invoice can be created without customer registration
  }

  // Buat deskripsi invoice
  const campaignNames = recommendation.allocations
    .map((a) => a.campaignName)
    .join(", ");
  const description = `Donasi SEDEKAH.AI — ${campaignNames}`;

  // Buat invoice di Mayar
  const invoiceResult = await createMayarInvoiceTool.invoke({
    name,
    email,
    amount: totalAmount,
    description,
  });

  const parsed = JSON.parse(invoiceResult);

  if (!parsed.success) {
    return {
      messages: [
        new AIMessage({
          content: `Mohon maaf, terjadi kendala saat memproses pembayaran. Silakan coba beberapa saat lagi. 🤲\n\n_Kami sedang memperbaiki masalah ini._`,
          name: "PAYMENT_EXECUTOR",
        }),
      ],
      paymentStatus: "failed",
    };
  }

  const paymentLink: string = parsed.paymentLink;
  const invoiceId: string = parsed.invoiceId;

  // Simpan donation record ke DB agar webhook bisa match
  try {
    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (dbUser) {
      const firstAlloc = recommendation.allocations[0];
      await prisma.donation.create({
        data: {
          userId: dbUser.id,
          amount: totalAmount,
          type: state.donorIntent?.startsWith("zakat_fitrah")
            ? "zakat_fitrah"
            : state.donorIntent?.startsWith("zakat")
              ? "zakat_mal"
              : state.donorIntent === "wakaf"
                ? "wakaf"
                : state.donorIntent === "infaq"
                  ? "infaq"
                  : state.donorIntent === "bencana"
                    ? "bencana"
                    : "sedekah",
          donorIntent: state.donorIntent,
          campaignId: firstAlloc?.campaignId ?? null,
          mayarInvoiceId: invoiceId,
          mayarPaymentLink: paymentLink,
          status: "pending",
          islamicContext: recommendation.islamicContext ?? null,
        },
      });
    }
  } catch (dbError) {
    // Non-fatal: payment can still proceed even if DB save fails
    console.error("[PAYMENT_EXECUTOR] DB save failed:", dbError);
  }

  const message = buildPaymentMessage(
    totalAmount,
    paymentLink,
    recommendation.allocations.length,
  );

  return {
    messages: [new AIMessage({ content: message, name: "PAYMENT_EXECUTOR" })],
    mayarInvoiceLink: paymentLink,
    invoiceId,
    paymentStatus: "pending",
  };
}

function buildPaymentMessage(
  amount: number,
  paymentLink: string,
  campaignCount: number,
): string {
  return [
    `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ`,
    ``,
    `✅ **Invoice Berhasil Dibuat!**`,
    ``,
    `💰 Total pembayaran: **${formatRupiah(amount)}**`,
    `📦 Dialokasikan ke **${campaignCount} kampanye** terverifikasi`,
    ``,
    `🔗 **[Klik di sini untuk membayar](${paymentLink})**`,
    ``,
    `_Subhanallah, semoga Allah menerima amal ibadah Anda._`,
    `_"Sesungguhnya sedekah itu memadamkan kemurkaan Rabb." (HR Tirmidzi)_`,
    ``,
    `⏰ Link pembayaran berlaku 24 jam. Setelah pembayaran berhasil, saya akan mengirimkan laporan dampak donasi Anda. ✨`,
  ].join("\n");
}
