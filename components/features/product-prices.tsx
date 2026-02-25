"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Globe } from "lucide-react";
import { useProductPrices } from "@/hooks/queries/useProductSubresources";

interface ProductPricesProps {
  productId: string;
}

export function ProductPrices({ productId }: ProductPricesProps) {
  const t = useTranslations("productPrices");

  const { data: prices = [], isLoading } = useProductPrices(productId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (prices.length === 0) return null;

  const activePrices = prices.filter((p) => p.isActive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activePrices.map((price) => (
          <div
            key={price.id}
            className="flex items-center justify-between border rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-sm">
                {price.currencyCode}
              </Badge>
              <div>
                <div className="flex items-center gap-2">
                  {price.discountedPrice != null && price.discountedPrice > 0 ? (
                    <>
                      <span className="line-through text-muted-foreground text-sm">
                        {Number(price.price).toLocaleString()}
                      </span>
                      <span className="font-bold">
                        {Number(price.discountedPrice).toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold">
                      {Number(price.price).toLocaleString()}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">{price.currencyCode}</span>
                </div>
                {price.countryCodes && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Globe className="h-3 w-3" />
                    {price.countryCodes}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {price.isAutomaticConversion && (
                <Badge variant="secondary" className="text-xs">
                  {t("autoConversion")}
                </Badge>
              )}
              {price.validUntil && (
                <span className="text-xs text-muted-foreground">
                  {t("validUntil")}: {new Date(price.validUntil).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
