import type { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/i18n/config";

const BASE_URL = "https://livestock-trading.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/products",
    "/sellers",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    const alternates: Record<string, string> = {};
    for (const locale of locales) {
      const prefix = locale === defaultLocale ? "" : `/${locale}`;
      alternates[locale] = `${BASE_URL}${prefix}${page}`;
    }

    entries.push({
      url: `${BASE_URL}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? "daily" : "weekly",
      priority: page === "" ? 1.0 : 0.8,
      alternates: { languages: alternates },
    });
  }

  return entries;
}
