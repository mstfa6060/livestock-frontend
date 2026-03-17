import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { Mail } from "lucide-react";
import { generatePageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({ locale, pageName: "contact", path: "/contact" });
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const email = t("info.emailValue");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main id="main-content" className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">{t("title")}</h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">{t("subtitle")}</p>
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-2 text-lg font-medium text-primary hover:underline underline-offset-4"
          >
            <Mail className="h-5 w-5" />
            {email}
          </a>
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
}
