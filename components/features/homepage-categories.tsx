"use client";

import Link from "next/link";
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
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">
          {t("title")}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topCategories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.slug}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    {category.iconUrl ? (
                      <img
                        src={category.iconUrl}
                        alt={category.name}
                        className="h-10 w-10 mb-2 object-contain"
                      />
                    ) : (
                      <div className="h-10 w-10 mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                        <Tag className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <span className="font-medium text-center">
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
