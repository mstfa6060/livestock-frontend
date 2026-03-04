"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface SellerReview {
  id: string;
  userId: string;
  overallRating: number;
  communicationRating: number;
  shippingSpeedRating: number;
  productQualityRating: number;
  title: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
}

interface SellerReviewsProps {
  sellerId: string;
  averageRating?: number;
  totalReviews: number;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) {
  const cls = size === "sm" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, rating }: { label: string; rating: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full"
          style={{ width: `${(rating / 5) * 100}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8 text-right">{rating.toFixed(1)}</span>
    </div>
  );
}

export function SellerReviews({
  sellerId,
  averageRating,
  totalReviews,
}: SellerReviewsProps) {
  const t = useTranslations("sellers.detail.reviews");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: queryKeys.sellers.reviews(sellerId),
    queryFn: async () => {
      const response = await LivestockTradingAPI.SellerReviews.All.Request({
        sorting: {
          key: "createdAt",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [
          {
            key: "sellerId",
            type: "guid",
            isUsed: true,
            values: [sellerId],
            min: {},
            max: {},
            conditionType: "equals",
          },
          {
            key: "isApproved",
            type: "boolean",
            isUsed: true,
            values: [true],
            min: {},
            max: {},
            conditionType: "equals",
          },
        ],
        pageRequest: { currentPage: 1, perPageCount: 20, listAll: false },
      });

      return response.map((r): SellerReview => ({
        id: r.id,
        userId: r.userId,
        overallRating: r.overallRating,
        communicationRating: r.communicationRating,
        shippingSpeedRating: r.shippingSpeedRating,
        productQualityRating: r.productQualityRating,
        title: r.title,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
      }));
    },
    enabled: totalReviews > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Compute average category ratings
  const avgCommunication =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.communicationRating, 0) / reviews.length
      : 0;
  const avgShipping =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.shippingSpeedRating, 0) / reviews.length
      : 0;
  const avgQuality =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.productQualityRating, 0) / reviews.length
      : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {averageRating != null && totalReviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("summary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold">
                  {Number(averageRating).toFixed(1)}
                </div>
                <StarRating rating={Math.round(Number(averageRating))} />
                <p className="text-sm text-muted-foreground mt-1">
                  {totalReviews} {t("reviewCount")}
                </p>
              </div>

              {reviews.length > 0 && (
                <div className="flex-1 space-y-2">
                  <RatingBar
                    label={t("communication")}
                    rating={avgCommunication}
                  />
                  <RatingBar
                    label={t("shippingSpeed")}
                    rating={avgShipping}
                  />
                  <RatingBar
                    label={t("productQuality")}
                    rating={avgQuality}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t("noReviews")}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={review.overallRating} />
                  <span className="text-sm font-medium">
                    {review.overallRating.toFixed(1)}
                  </span>
                  {review.isVerifiedPurchase && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      {t("verified")}
                    </Badge>
                  )}
                </div>
                {review.title && (
                  <p className="text-sm font-medium">{review.title}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {/* Sub-ratings */}
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-muted-foreground">
                    {t("communication")}: {review.communicationRating}/5
                  </span>
                  <span className="text-muted-foreground">
                    {t("shippingSpeed")}: {review.shippingSpeedRating}/5
                  </span>
                  <span className="text-muted-foreground">
                    {t("productQuality")}: {review.productQualityRating}/5
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
