"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/queries/useCategories";
import { Tag } from "lucide-react";

export function HomepageCategories() {
  const t = useTranslations("home.categories");
  const locale = useLocale();

  const { data: categories = [], isLoading } = useCategories(locale);

  // Only show top-level (parent) categories, limit to 8
  const topCategories = categories
    .filter((c) => !c.parentCategoryId && c.isActive)
    .slice(0, 8);

  if (!isLoading && topCategories.length === 0) return null;

  return (
    <section className="bg-muted/40 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          {t("title")}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {topCategories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.slug}`}>
                <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full border-0 shadow-sm bg-card">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    {category.iconUrl ? (
                      <img
                        src={category.iconUrl}
                        alt={category.name}
                        className="h-12 w-12 mb-3 object-contain"
                      />
                    ) : (
                      <div className="h-12 w-12 mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Tag className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <span className="font-medium text-center text-sm">
                      {category.name}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
