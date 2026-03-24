"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle, PenLine } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

function InteractiveStarRating({
  rating,
  onRatingChange,
  label,
}: {
  rating: number;
  onRatingChange: (rating: number) => void;
  label?: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>}
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
                className={`h-5 w-5 cursor-pointer transition-colors ${
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          );
        })}
      </div>
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

function WriteSellerReviewForm({
  sellerId,
  onSuccess,
}: {
  sellerId: string;
  onSuccess: () => void;
}) {
  const t = useTranslations("sellers.detail.reviews");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [overallRating, setOverallRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [shippingSpeedRating, setShippingSpeedRating] = useState(0);
  const [productQualityRating, setProductQualityRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const createReview = useMutation({
    mutationFn: () =>
      LivestockTradingAPI.SellerReviews.Create.Request({
        sellerId,
        userId: user!.id,
        overallRating,
        communicationRating,
        shippingSpeedRating,
        productQualityRating,
        title,
        comment,
        isVerifiedPurchase: false,
      }),
    onSuccess: () => {
      toast.success(t("reviewSubmitted"));
      queryClient.invalidateQueries({
        queryKey: queryKeys.sellers.reviews(sellerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sellers.detail(sellerId),
      });
      setOverallRating(0);
      setCommunicationRating(0);
      setShippingSpeedRating(0);
      setProductQualityRating(0);
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
    if (overallRating === 0) return;
    createReview.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="space-y-3">
        <InteractiveStarRating
          rating={overallRating}
          onRatingChange={setOverallRating}
          label={t("overallRating")}
        />
        <InteractiveStarRating
          rating={communicationRating}
          onRatingChange={setCommunicationRating}
          label={t("communicationRating")}
        />
        <InteractiveStarRating
          rating={shippingSpeedRating}
          onRatingChange={setShippingSpeedRating}
          label={t("shippingSpeedRating")}
        />
        <InteractiveStarRating
          rating={productQualityRating}
          onRatingChange={setProductQualityRating}
          label={t("productQualityRating")}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="seller-review-title" className="text-sm font-medium">
          {t("reviewTitle")}
        </label>
        <Input
          id="seller-review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("reviewTitlePlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="seller-review-comment" className="text-sm font-medium">
          {t("reviewComment")}
        </label>
        <Textarea
          id="seller-review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reviewCommentPlaceholder")}
          rows={4}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={overallRating === 0 || createReview.isPending}
        className="w-full sm:w-auto"
      >
        {createReview.isPending ? t("submitting") : t("submitReview")}
      </Button>
    </form>
  );
}

export function SellerReviews({
  sellerId,
  averageRating,
  totalReviews,
}: SellerReviewsProps) {
  const t = useTranslations("sellers.detail.reviews");
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);

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
      {/* Write Review Button */}
      <div className="flex justify-end">
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

      {/* Write Review Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6">
            <WriteSellerReviewForm
              sellerId={sellerId}
              onSuccess={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

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
