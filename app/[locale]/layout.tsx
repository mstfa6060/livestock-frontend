import { AppConfig } from "@/config/livestock-config";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { locales, defaultLocale, type Locale } from "@/i18n/config";
import { Providers } from "@/components/providers/Providers";
import { ErrorCapture } from "@/components/debug/error-capture";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const BASE_URL = AppConfig.SiteUrl;

// RTL languages
const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const title = t("title");
  const description = t("description");
  const keywords = t("keywords");

  const alternateLanguages: Record<string, string> = {};
  for (const loc of locales) {
    const prefix = loc === defaultLocale ? "" : `/${loc}`;
    alternateLanguages[loc] = `${BASE_URL}${prefix}`;
  }

  return {
    title: {
      default: title,
      template: `%s | Livestock Trading`,
    },
    description,
    keywords,
    metadataBase: new URL(BASE_URL),
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Livestock Trading",
    },
    alternates: {
      canonical: locale === defaultLocale ? BASE_URL : `${BASE_URL}/${locale}`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: "website",
      locale: locale,
      siteName: "Livestock Trading",
      title,
      description,
      url: BASE_URL,
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function generateViewport(): Viewport {
  return {
    themeColor: "#16a34a",
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd locale={locale} />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
          <Toaster position="top-right" richColors />
          <ErrorCapture />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
