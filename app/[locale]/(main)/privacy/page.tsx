import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.pages.privacy" });
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const locale = await getLocale();

  const lastUpdatedDate = new Date("2025-01-01").toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = [
    "collection",
    "usage",
    "sharing",
    "security",
    "cookies",
    "rights",
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("lastUpdated", { date: lastUpdatedDate })}
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card>
              <CardContent className="p-8 space-y-8">
                {sections.map((section) => (
                  <div key={section}>
                    <h2 className="text-xl font-semibold mb-3">
                      {t(`sections.${section}.title`)}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {t(`sections.${section}.content`)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <SimpleFooter />
    </div>
  );
}
