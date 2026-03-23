"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, PenLine } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
          const v = i + 1;
          const filled = v <= (hovered || rating);
          return (
            <button
              key={i}
              type="button"
              className="focus:outline-none"
              onMouseEnter={() => setHovered(v)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onRatingChange(v)}
              aria-label={`${v} star`}
            >
              <Star className={`h-5 w-5 cursor-pointer transition-colors ${filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WriteTransporterReviewForm({ transporterId, onSuccess }: { transporterId: string; onSuccess: () => void }) {
  const t = useTranslations("transporterReviews");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [overallRating, setOverallRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [carefulHandlingRating, setCarefulHandlingRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [comment, setComment] = useState("");

  const createReview = useMutation({
    mutationFn: () =>
      LivestockTradingAPI.TransporterReviews.Create.Request({
        transporterId,
        userId: user!.id,
        transportRequestId: "00000000-0000-0000-0000-000000000000",
        overallRating,
        timelinessRating,
        communicationRating,
        carefulHandlingRating,
        professionalismRating,
        comment,
      }),
    onSuccess: () => {
      toast.success(t("reviewSubmitted"));
      queryClient.invalidateQueries({ queryKey: queryKeys.transporters.reviews(transporterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transporters.detail(transporterId) });
      setOverallRating(0);
      setTimelinessRating(0);
      setCommunicationRating(0);
      setCarefulHandlingRating(0);
      setProfessionalismRating(0);
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
        <InteractiveStarRating rating={overallRating} onRatingChange={setOverallRating} label={t("overallRating")} />
        <InteractiveStarRating rating={timelinessRating} onRatingChange={setTimelinessRating} label={t("timeliness")} />
        <InteractiveStarRating rating={communicationRating} onRatingChange={setCommunicationRating} label={t("communication")} />
        <InteractiveStarRating rating={carefulHandlingRating} onRatingChange={setCarefulHandlingRating} label={t("carefulHandling")} />
        <InteractiveStarRating rating={professionalismRating} onRatingChange={setProfessionalismRating} label={t("professionalism")} />
      </div>

      <div className="space-y-2">
        <label htmlFor="transporter-review-comment" className="text-sm font-medium">{t("reviewComment")}</label>
        <Textarea
          id="transporter-review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reviewCommentPlaceholder")}
          rows={4}
        />
      </div>

      <Button type="submit" disabled={overallRating === 0 || createReview.isPending} className="w-full sm:w-auto">
        {createReview.isPending ? t("submitting") : t("submitReview")}
      </Button>
    </form>
  );
}

export function TransporterReviews({ transporterId, averageRating }: TransporterReviewsProps) {
  const t = useTranslations("transporterReviews");
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);

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
          <div className="flex items-center justify-between">
            <CardTitle>{t("title")}</CardTitle>
            {isAuthenticated && (
              <Button variant={showForm ? "outline" : "default"} size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
                <PenLine className="h-4 w-4" />
                {t("writeReview")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showForm ? (
            <WriteTransporterReviewForm transporterId={transporterId} onSuccess={() => setShowForm(false)} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("noReviews")}</p>
          )}
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
          <span>{t("title")} <span className="text-sm font-normal text-muted-foreground ml-2">{reviews.length} {t("reviewCount")}</span></span>
          {isAuthenticated ? (
            <Button variant={showForm ? "outline" : "default"} size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
              <PenLine className="h-4 w-4" />
              {t("writeReview")}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">{t("loginToReview")}</p>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Write Review Form */}
        {showForm && (
          <div className="mb-4">
            <WriteTransporterReviewForm transporterId={transporterId} onSuccess={() => setShowForm(false)} />
          </div>
        )}

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
