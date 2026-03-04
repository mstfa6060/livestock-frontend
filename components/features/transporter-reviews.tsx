"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface TransporterReview {
  id: string;
  userId: string;
  overallRating: number;
  timelinessRating: number;
  communicationRating: number;
  carefulHandlingRating: number;
  professionalismRating: number;
  isApproved: boolean;
  createdAt: Date;
}

interface TransporterReviewsProps {
  transporterId: string;
  averageRating?: number | null;
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
      <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>
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

export function TransporterReviews({ transporterId, averageRating }: TransporterReviewsProps) {
  const t = useTranslations("transporterReviews");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: queryKeys.transporters.reviews(transporterId),
    queryFn: async () => {
      const response = await LivestockTradingAPI.TransporterReviews.All.Request({
        sorting: {
          key: "createdAt",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [
          {
            key: "transporterId",
            type: "guid",
            isUsed: true,
            values: [transporterId],
            min: {},
            max: {},
            conditionType: "equals",
          },
        ],
        pageRequest: { currentPage: 1, perPageCount: 20, listAll: false },
      });

      return response.map((r): TransporterReview => ({
        id: r.id,
        userId: r.userId,
        overallRating: r.overallRating,
        timelinessRating: r.timelinessRating,
        communicationRating: r.communicationRating,
        carefulHandlingRating: r.carefulHandlingRating,
        professionalismRating: r.professionalismRating,
        isApproved: r.isApproved,
        createdAt: r.createdAt,
      }));
    },
    enabled: !!transporterId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("noReviews")}</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate averages
  const avgTimeliness = reviews.reduce((sum, r) => sum + r.timelinessRating, 0) / reviews.length;
  const avgCommunication = reviews.reduce((sum, r) => sum + r.communicationRating, 0) / reviews.length;
  const avgHandling = reviews.reduce((sum, r) => sum + r.carefulHandlingRating, 0) / reviews.length;
  const avgProfessionalism = reviews.reduce((sum, r) => sum + r.professionalismRating, 0) / reviews.length;
  const displayRating = averageRating ?? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {t("title")}
          <span className="text-sm font-normal text-muted-foreground">
            {reviews.length} {t("reviewCount")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall rating */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{Number(displayRating).toFixed(1)}</div>
            <StarRating rating={Math.round(Number(displayRating))} />
          </div>
          <div className="flex-1 space-y-2">
            <RatingBar label={t("timeliness")} rating={avgTimeliness} />
            <RatingBar label={t("communication")} rating={avgCommunication} />
            <RatingBar label={t("carefulHandling")} rating={avgHandling} />
            <RatingBar label={t("professionalism")} rating={avgProfessionalism} />
          </div>
        </div>

        {/* Individual reviews */}
        <div className="space-y-4 pt-4 border-t">
          {reviews.map((review) => (
            <div key={review.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <StarRating rating={review.overallRating} size="xs" />
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{t("timeliness")}: {review.timelinessRating}/5</span>
                <span>{t("communication")}: {review.communicationRating}/5</span>
                <span>{t("carefulHandling")}: {review.carefulHandlingRating}/5</span>
                <span>{t("professionalism")}: {review.professionalismRating}/5</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
