import type { Metadata } from "next";
import { AppConfig } from "@/config/livestock-config";

const BASE_URL = "https://livestock-trading.com";

async function fetchSeller(id: string) {
  try {
    const res = await fetch(`${AppConfig.LivestockTradingUrl}/Sellers/Detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data ?? data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const seller = await fetchSeller(id);

  if (!seller) {
    return { title: "Seller Not Found" };
  }

  const title = `${seller.businessName} - Livestock Trading`;
  const description =
    seller.description?.slice(0, 160) || `${seller.businessName} seller profile on Livestock Trading.`;
  const image = seller.logoUrl || undefined;
  const url =
    locale === "en"
      ? `${BASE_URL}/sellers/${id}`
      : `${BASE_URL}/${locale}/sellers/${id}`;

  return {
    title: seller.businessName,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      ...(image && { images: [{ url: image, alt: seller.businessName }] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default function SellerDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
