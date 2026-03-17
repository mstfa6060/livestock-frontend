import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MainHeader } from "@/components/layout/main-header";
import { Footer } from "@/components/layout/footer";
import { ShieldCheck, Layers, Headphones, ArrowRight, Search } from "lucide-react";
import { HomepageBanners } from "@/components/features/homepage-banners";
import { FeaturedProducts } from "@/components/features/featured-products";
import { HomepageCategories } from "@/components/features/homepage-categories";
import { defaultLocale, locales } from "@/i18n/config";

const BASE_URL = "https://livestock-trading.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const title = t("pages.home.title");
  const description = t("pages.home.description");
  const keywords = t("pages.home.keywords");
  const canonicalUrl = locale === defaultLocale ? BASE_URL : `${BASE_URL}/${locale}`;

  const alternateLanguages: Record<string, string> = {};
  for (const loc of locales) {
    const prefix = loc === defaultLocale ? "" : `/${loc}`;
    alternateLanguages[loc] = `${BASE_URL}${prefix}`;
  }

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      type: "website",
      locale,
      siteName: "Livestock Trading",
      title,
      description,
      url: canonicalUrl,
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
  };
}

export default async function Home() {
  const t = await getTranslations("home");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section - Large with gradient background */}
        <section className="relative bg-gradient-to-br from-[oklch(0.35_0.10_152)] via-primary to-[oklch(0.42_0.09_170)] text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.06]" />
          <div className="container mx-auto px-4 py-20 md:py-32 relative">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
                {t("hero.title")}
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-primary-foreground/85">
                {t("hero.subtitle")}
              </p>

              {/* Search-style CTA */}
              <div className="mt-10 w-full max-w-xl">
                <Link href="/search" className="block">
                  <div className="flex items-center bg-white/95 backdrop-blur rounded-xl shadow-xl p-2 hover:bg-white transition-colors">
                    <div className="flex items-center flex-1 px-4 py-2 text-foreground/50">
                      <Search className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="text-base">{t("hero.searchPlaceholder")}</span>
                    </div>
                    <Button size="lg" className="shrink-0 rounded-lg">
                      {t("hero.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/products">{t("hero.viewListings")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Banners */}
        <HomepageBanners />

        {/* Featured Products */}
        <FeaturedProducts />

        {/* Categories */}
        <HomepageCategories />

        {/* Features */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold">{t("features.secure.title").split(" ")[0]}</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-2xl bg-primary/10 p-4 mb-5">
                      <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("features.secure.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("features.secure.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-2xl bg-primary/10 p-4 mb-5">
                      <Layers className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("features.variety.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("features.variety.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-2xl bg-primary/10 p-4 mb-5">
                      <Headphones className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("features.support.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("features.support.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-[oklch(0.35_0.10_152)] via-primary to-[oklch(0.42_0.09_170)] text-primary-foreground py-16 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto text-lg">
              {t("cta.subtitle")}
            </p>
            <Button size="lg" variant="secondary" className="shadow-lg" asChild>
              <Link href="/register">
                {t("cta.button")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
