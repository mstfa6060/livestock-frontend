"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, CheckCircle, PenLine } from "lucide-react";
import { useProductReviews } from "@/hooks/queries/useProductSubresources";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

function InteractiveStarRating({
  rating,
  onRatingChange,
}: {
  rating: number;
  onRatingChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= (hovered || rating);
        return (
          <button
            key={i}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onRatingChange(starValue)}
            aria-label={`${starValue} star`}
          >
            <Star
              className={`h-6 w-6 cursor-pointer transition-colors ${
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function WriteReviewForm({
  productId,
  onSuccess,
}: {
  productId: string;
  onSuccess: () => void;
}) {
  const t = useTranslations("productDetail.reviews");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const createReview = useMutation({
    mutationFn: () =>
      LivestockTradingAPI.ProductReviews.Create.Request({
        productId,
        userId: user!.id,
        rating,
        title,
        comment,
        isVerifiedPurchase: false,
        imageUrls: "",
        videoUrls: "",
      }),
    onSuccess: () => {
      toast.success(t("reviewSubmitted"));
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.reviews(productId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(productId),
      });
      setRating(0);
      setTitle("");
      setComment("");
      onSuccess();
    },
    onError: () => {
      toast.error(t("reviewFailed"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    createReview.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("rating")}</label>
        <InteractiveStarRating rating={rating} onRatingChange={setRating} />
      </div>

      <div className="space-y-2">
        <label htmlFor="review-title" className="text-sm font-medium">
          {t("reviewTitle")}
        </label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("reviewTitlePlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="review-comment" className="text-sm font-medium">
          {t("reviewComment")}
        </label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reviewCommentPlaceholder")}
          rows={4}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={rating === 0 || createReview.isPending}
        className="w-full sm:w-auto"
      >
        {createReview.isPending ? t("submitting") : t("submitReview")}
      </Button>
    </form>
  );
}

export function ProductReviews({
  productId,
  averageRating,
  reviewCount,
}: ProductReviewsProps) {
  const t = useTranslations("productDetail.reviews");
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [], isLoading } = useProductReviews(productId, {
    enabled: reviewCount > 0,
  });

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
        <div className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          {isAuthenticated ? (
            <Button
              variant={showForm ? "outline" : "default"}
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
            >
              <PenLine className="h-4 w-4" />
              {t("writeReview")}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">{t("loginToReview")}</p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Write Review Form */}
        {showForm && (
          <div className="mb-6">
            <WriteReviewForm
              productId={productId}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        )}

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
