import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://sedekah-ai.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const campaignUrls: MetadataRoute.Sitemap = campaigns.map((c) => ({
    url: `${BASE_URL}/campaigns/${c.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/campaigns`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...campaignUrls,
  ];
}
