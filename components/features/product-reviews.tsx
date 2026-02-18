"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, CheckCircle } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

interface Review {
  id: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
}

interface ProductReviewsProps {
  productId: string;
  averageRating?: number;
  reviewCount: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export function ProductReviews({
  productId,
  averageRating,
  reviewCount,
}: ProductReviewsProps) {
  const t = useTranslations("productDetail.reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (reviewCount === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await LivestockTradingAPI.ProductReviews.All.Request({
          sorting: {
            key: "createdAt",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
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
          pageRequest: { currentPage: 1, perPageCount: 10, listAll: false },
        });

        setReviews(
          response.map((r) => ({
            id: r.id,
            userId: r.userId,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            isVerifiedPurchase: r.isVerifiedPurchase,
            helpfulCount: r.helpfulCount,
            createdAt: r.createdAt,
          }))
        );
      } catch {
        // Reviews are optional, fail silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [productId, reviewCount]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0 && reviewCount === 0) {
    return null;
  }

  // Rating distribution
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingCounts[r.rating - 1]++;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        {averageRating != null && reviewCount > 0 && (
          <div className="flex items-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
              <StarRating rating={Math.round(averageRating)} />
              <p className="text-sm text-muted-foreground mt-1">
                {reviewCount} {t("reviewCount")}
              </p>
            </div>

            {/* Rating bars */}
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star - 1];
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-right">{star}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-muted-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Review List */}
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("noReviews")}
          </p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <StarRating rating={review.rating} />
                  {review.isVerifiedPurchase && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      {t("verified")}
                    </Badge>
                  )}
                </div>
                {review.title && (
                  <h4 className="font-medium text-sm">{review.title}</h4>
                )}
                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {review.comment}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                  {review.helpfulCount > 0 && (
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {review.helpfulCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
