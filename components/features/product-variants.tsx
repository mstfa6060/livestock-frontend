"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Package, Tag } from "lucide-react";
import { useProductVariants } from "@/hooks/queries/useProductSubresources";

interface ProductVariantsProps {
  productId: string;
  currency?: string;
}

export function ProductVariants({ productId, currency = "TRY" }: ProductVariantsProps) {
  const t = useTranslations("productVariants");

  const { data: variants = [], isLoading } = useProductVariants(productId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (variants.length === 0) return null;

  const parseAttributes = (attr: string): Record<string, string> => {
    if (!attr) return {};
    try {
      return JSON.parse(attr);
    } catch {
      return {};
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          {t("title")}
          <Badge variant="secondary" className="ml-auto">
            {variants.length} {t("variantCount")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {variants.map((variant) => {
          const attrs = parseAttributes(variant.attributes);
          return (
            <div
              key={variant.id}
              className="flex items-center gap-4 border rounded-lg p-3"
            >
              {variant.imageUrl ? (
                <img
                  src={variant.imageUrl}
                  alt={variant.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{variant.name}</p>
                  {variant.sKU && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Tag className="h-2.5 w-2.5 mr-1" />
                      {variant.sKU}
                    </Badge>
                  )}
                </div>

                {Object.keys(attrs).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(attrs).map(([key, value]) => (
                      <span key={key} className="text-xs text-muted-foreground">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center gap-2">
                  {variant.discountedPrice != null && variant.discountedPrice > 0 ? (
                    <>
                      <span className="text-sm line-through text-muted-foreground">
                        {Number(variant.price).toLocaleString()} {currency}
                      </span>
                      <span className="font-bold text-sm">
                        {Number(variant.discountedPrice).toLocaleString()} {currency}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-sm">
                      {Number(variant.price).toLocaleString()} {currency}
                    </span>
                  )}
                </div>
                <Badge
                  variant={variant.isInStock ? "default" : "destructive"}
                  className="text-xs mt-1"
                >
                  {variant.isInStock
                    ? `${t("inStock")} (${variant.stockQuantity})`
                    : t("outOfStock")}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
