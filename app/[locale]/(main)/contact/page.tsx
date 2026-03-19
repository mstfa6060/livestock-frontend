import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { generatePageMetadata } from "@/lib/seo";
import { ContactForm } from "./contact-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({ locale, pageName: "contact", path: "/contact" });
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main id="main-content" className="flex-1 py-12">
        <div className="container max-w-lg mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-2">{t("title")}</h1>
          <p className="text-muted-foreground text-center mb-8">{t("subtitle")}</p>
          <ContactForm />
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
}
