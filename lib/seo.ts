import { AppConfig } from "@/config/livestock-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { defaultLocale, locales } from "@/i18n/config";

const BASE_URL = AppConfig.SiteUrl;

/**
 * Generate consistent SEO metadata for a page.
 * Used by all public-facing pages (products, sellers, about, etc.)
 */
export async function generatePageMetadata({
  locale,
  pageName,
  path,
}: {
  locale: string;
  pageName: string;
  path: string;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `metadata.pages.${pageName}` });

  const title = t("title");
  const description = t("description");

  let keywords: string | undefined;
  try {
    keywords = t("keywords");
  } catch {
    // keywords not available for this page
  }

  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const canonicalUrl = `${BASE_URL}${prefix}${path}`;

  const alternateLanguages: Record<string, string> = {};
  for (const loc of locales) {
    const locPrefix = loc === defaultLocale ? "" : `/${loc}`;
    alternateLanguages[loc] = `${BASE_URL}${locPrefix}${path}`;
  }

  return {
    title,
    description,
    ...(keywords && { keywords }),
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Livestock Trading",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export { BASE_URL };
