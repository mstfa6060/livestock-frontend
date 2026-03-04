"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface ViewedProduct {
  productId: string;
  title: string;
  slug: string;
  viewedAt: Date;
}

export function RecentlyViewedProducts() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();

  const { data: products = [], isLoading } = useQuery({
    queryKey: queryKeys.recentlyViewed.list(user?.id ?? ""),
    queryFn: async () => {
      const histories =
        await LivestockTradingAPI.ProductViewHistories.All.Request({
          sorting: {
            key: "viewedAt",
            direction:
              LivestockTradingAPI.Enums.XSortingDirection.Descending,
          },
          filters: [
            {
              key: "userId",
              type: "guid",
              isUsed: true,
              values: [user!.id],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 20, listAll: false },
        });

      // Deduplicate by productId, keep latest view
      const seen = new Set<string>();
      const uniqueItems: { productId: string; viewedAt: Date }[] = [];
      for (const h of histories) {
        if (!seen.has(h.productId) && uniqueItems.length < 6) {
          seen.add(h.productId);
          uniqueItems.push({
            productId: h.productId,
            viewedAt: h.viewedAt,
          });
        }
      }

      if (uniqueItems.length === 0) return [];

      // Fetch product titles via Pick endpoint
      const pickResult =
        await LivestockTradingAPI.Products.Pick.Request({
          selectedIds: uniqueItems.map((p) => p.productId),
          keyword: "",
          limit: 6,
        });

      const productMap = new Map(pickResult.map((p) => [p.id, p]));
      const result: ViewedProduct[] = [];
      for (const item of uniqueItems) {
        const product = productMap.get(item.productId);
        if (product) {
          result.push({
            productId: item.productId,
            title: product.title,
            slug: product.slug,
            viewedAt: item.viewedAt,
          });
        }
      }

      return result;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  if (!isLoading && products.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5" />
          {t("recentlyViewed")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <Link
                key={p.productId}
                href={`/products/${p.slug}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.viewedAt).toLocaleDateString()}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
