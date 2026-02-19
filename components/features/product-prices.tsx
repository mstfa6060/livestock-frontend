"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { Coins, Globe } from "lucide-react";

interface ProductPrice {
  id: string;
  currencyCode: string;
  price: number;
  discountedPrice: number | null;
  countryCodes: string;
  isActive: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  isAutomaticConversion: boolean;
}

interface ProductPricesProps {
  productId: string;
}

export function ProductPrices({ productId }: ProductPricesProps) {
  const t = useTranslations("productPrices");
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      try {
        const response = await LivestockTradingAPI.ProductPrices.All.Request({
          sorting: {
            key: "currencyCode",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending,
          },
          filters: [
            {
              key: "productId",
              type: "guid",
              isUsed: true,
              values: [productId],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
        });

        setPrices(
          response.map((p) => ({
            id: p.id,
            currencyCode: p.currencyCode,
            price: p.price as number,
            discountedPrice: p.discountedPrice as number | null,
            countryCodes: p.countryCodes,
            isActive: p.isActive,
            validFrom: p.validFrom ?? null,
            validUntil: p.validUntil ?? null,
            isAutomaticConversion: p.isAutomaticConversion,
          }))
        );
      } catch {
        // Prices are optional
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) fetchPrices();
  }, [productId]);

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
