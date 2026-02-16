import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { locales, defaultLocale, type Locale } from "@/i18n/config";
import { Providers } from "@/components/providers/Providers";
import { ErrorCapture } from "@/components/debug/error-capture";
import "../globals.css";

const BASE_URL = "https://livestock-trading.com";

// RTL languages
const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: "Livestock Trading - Live Animal Trading Platform",
    tr: "Livestock Trading - Canli Hayvan Ticaret Platformu",
    de: "Livestock Trading - Viehhandelsplattform",
    fr: "Livestock Trading - Plateforme de Commerce d'Animaux",
    es: "Livestock Trading - Plataforma de Comercio de Ganado",
    ar: "Livestock Trading - منصة تداول الماشية",
  };

  const descriptions: Record<string, string> = {
    en: "The most trusted live animal trading platform. Buy and sell livestock safely and transparently.",
    tr: "Turkiye'nin en guvenilir canli hayvan ticaret platformu. Guvenli ve seffaf hayvan alim satimi.",
    de: "Die vertrauenswurdigste Plattform fur den Handel mit Nutztieren.",
    fr: "La plateforme de commerce d'animaux la plus fiable.",
    es: "La plataforma de comercio de ganado mas confiable.",
    ar: "أكثر منصة موثوقة لتداول الماشية",
  };

  const title = titles[locale] || titles.en;
  const description = descriptions[locale] || descriptions.en;

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
    metadataBase: new URL(BASE_URL),
    manifest: "/manifest.json",
    themeColor: "#16a34a",
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
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
    <html lang={locale} dir={dir}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
          <Toaster position="top-right" richColors />
          <ErrorCapture />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
