"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

function FAQAccordionItem({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium hover:underline"
      >
        {item.question}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-muted-foreground whitespace-pre-wrap">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const t = useTranslations("faq");
  const locale = useLocale();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await LivestockTradingAPI.FAQs.All.Request({
          sorting: {
            key: "sortOrder",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending,
          },
          filters: [
            {
              key: "isActive",
              type: "boolean",
              isUsed: true,
              values: [true],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 100, listAll: false },
        });

        setFaqs(
          response.map((faq) => {
            // Try to use localized question/answer if available
            let question = faq.question;
            let answer = faq.answer;

            if (locale !== "tr") {
              try {
                const questionTranslations = JSON.parse(faq.questionTranslations || "{}");
                const answerTranslations = JSON.parse(faq.answerTranslations || "{}");
                if (questionTranslations[locale]) question = questionTranslations[locale];
                if (answerTranslations[locale]) answer = answerTranslations[locale];
              } catch {
                // Use default question/answer
              }
            }

            return {
              id: faq.id,
              question,
              answer,
              sortOrder: faq.sortOrder,
            };
          })
        );
      } catch {
        // FAQs unavailable
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQs();
  }, [locale]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">{t("title")}</h1>
          <p className="text-muted-foreground text-center mb-8">
            {t("description")}
          </p>

          {isLoading ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2 border-b pb-4 last:border-0">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : faqs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {t("noFaqs")}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                {faqs.map((faq) => (
                  <FAQAccordionItem key={faq.id} item={faq} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
}
