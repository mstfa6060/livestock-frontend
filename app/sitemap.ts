import type { MetadataRoute } from "next";
import { defaultLocale } from "@/i18n/config";

const BASE_URL = "https://livestock-trading.com";
const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === "development";
const API_BASE = isDevelopment
  ? "https://dev-api.livestock-trading.com"
  : "https://api.livestock-trading.com";

// Only include major languages in sitemap to conserve crawl budget.
// Full 106-language support still works in the app — sitemap just hints priority locales.
const SITEMAP_LOCALES = [
  "en", "tr", "ar", "de", "es", "fr", "pt", "ru", "zh", "ja",
  "ko", "hi", "it", "nl", "pl", "uk", "vi", "id", "fa", "ms",
] as const;

function buildAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of SITEMAP_LOCALES) {
    const prefix = locale === defaultLocale ? "" : `/${locale}`;
    alternates[locale] = `${BASE_URL}${prefix}${path}`;
  }
  return alternates;
}

async function fetchProducts(): Promise<{ slug: string; updatedAt?: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/livestocktrading/Products/All`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: 2, perPageCount: 500 }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data ?? data;
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function fetchSellers(): Promise<{ id: string; updatedAt?: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/livestocktrading/Sellers/All`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perPageCount: 500 }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data ?? data;
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/products",
    "/sellers",
    "/transporters",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/faq",
    "/pricing",
    "/search",
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? "daily" : "weekly",
      priority: page === "" ? 1.0 : 0.8,
      alternates: { languages: buildAlternates(page) },
    });
  }

  // Dynamic product pages
  const [products, sellers] = await Promise.all([fetchProducts(), fetchSellers()]);

  for (const product of products) {
    if (!product.slug) continue;
    const path = `/products/${product.slug}`;
    entries.push({
      url: `${BASE_URL}${path}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: { languages: buildAlternates(path) },
    });
  }

  // Dynamic seller pages
  for (const seller of sellers) {
    if (!seller.id) continue;
    const path = `/sellers/${seller.id}`;
    entries.push({
      url: `${BASE_URL}${path}`,
      lastModified: seller.updatedAt ? new Date(seller.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: buildAlternates(path) },
    });
  }

  return entries;
}
