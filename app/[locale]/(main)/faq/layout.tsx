import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FaqJsonLd } from "@/components/seo/json-ld";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === "development";
const API_BASE = isDevelopment
  ? "https://dev-api.livestock-trading.com"
  : "https://api.livestock-trading.com";

async function fetchFaqs(locale: string) {
  try {
    const res = await fetch(`${API_BASE}/livestocktrading/FAQs/All`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sorting: { key: "sortOrder", direction: 0 },
        filters: [{ key: "isActive", type: "boolean", isUsed: true, values: [true], min: {}, max: {}, conditionType: "equals" }],
        pageRequest: { currentPage: 1, perPageCount: 100, listAll: false },
      }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items: Array<{ question: string; answer: string; questionTranslations?: string; answerTranslations?: string }> = data?.data ?? data;
    if (!Array.isArray(items)) return [];
    return items.map((faq) => {
      let question = faq.question;
      let answer = faq.answer;
      if (locale !== "tr") {
        try {
          const qt = JSON.parse(faq.questionTranslations || "{}");
          const at = JSON.parse(faq.answerTranslations || "{}");
          if (qt[locale]) question = qt[locale];
          if (at[locale]) answer = at[locale];
        } catch { /* use default */ }
      }
      return { question, answer };
    });
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.pages.faq" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function FaqLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const faqs = await fetchFaqs(locale);

  return (
    <>
      {faqs.length > 0 && <FaqJsonLd items={faqs} />}
      {children}
    </>
  );
}
