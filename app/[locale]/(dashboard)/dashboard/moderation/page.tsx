"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Package,
  AlertTriangle,
} from "lucide-react";

interface PendingProduct {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  basePrice: number;
  currency: string;
  stockQuantity: number;
  sellerId: string;
  status: number;
  condition: number;
  createdAt: Date;
}

export default function ModerationPage() {
  const t = useTranslations("moderation");
  const tp = useTranslations("products");
  const locale = useLocale();
  const { user } = useAuth();
  const { isAdmin, isStaff, isLoaded: rolesLoaded } = useRoles();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const queryClient = useQueryClient();

  const moderationQueryKey = [...queryKeys.products.lists(), "moderation"];

  const { data: pendingProducts = [], isLoading } = useQuery({
    queryKey: moderationQueryKey,
    queryFn: async () => {
      const response = await LivestockTradingAPI.Products.All.Request({
        countryCode: "",
        sorting: {
          key: "createdAt",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [
          {
            key: "status",
            type: "number",
            isUsed: true,
            values: [1],
            min: {},
            max: {},
            conditionType: "equals",
          },
        ],
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      });

      return response.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        shortDescription: p.shortDescription,
        categoryId: p.categoryId,
        basePrice: p.basePrice as number,
        currency: p.currency,
        stockQuantity: p.stockQuantity,
        sellerId: p.sellerId,
        status: p.status,
        condition: p.condition,
        createdAt: p.createdAt,
      })) as PendingProduct[];
    },
    enabled: rolesLoaded && (isAdmin || isStaff),
  });

  const handleApprove = async (productId: string) => {
    setActionLoading(productId);
    try {
      await LivestockTradingAPI.Products.Approve.Request({ id: productId });
      queryClient.invalidateQueries({ queryKey: moderationQueryKey });
      toast.success(t("approveSuccess"));
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (productId: string) => {
    if (!rejectReason.trim()) {
      toast.error(t("rejectReasonRequired"));
      return;
    }

    setActionLoading(productId);
    try {
      await LivestockTradingAPI.Products.Reject.Request({
        id: productId,
        reason: rejectReason,
      });
      queryClient.invalidateQueries({ queryKey: moderationQueryKey });
      setRejectingId(null);
      setRejectReason("");
      toast.success(t("rejectSuccess"));
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActionLoading(null);
    }
  };

  // Access control - wait for roles to load
  if (!rolesLoaded) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin && !isStaff) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <ShieldCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("unauthorized")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("description")}
            {!isLoading && (
              <Badge variant="secondary" className="ml-2">
                {pendingProducts.length} {t("pending")}
              </Badge>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-48" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : pendingProducts.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("allClear")}</h2>
            <p className="text-muted-foreground">{t("noPending")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-semibold text-lg hover:underline"
                        >
                          {product.title}
                        </Link>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {t("awaitingReview")}
                        </Badge>
                      </div>

                      {product.shortDescription && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {product.shortDescription}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-medium">
                          {Number(product.basePrice).toLocaleString(locale)} {product.currency}
                        </span>
                        <span className="text-muted-foreground">
                          {t("by")} {product.sellerId.slice(0, 8)}...
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(product.createdAt).toLocaleDateString(locale)}
                        </span>
                        <span className="text-muted-foreground">
                          {t("stock")}: {product.stockQuantity}
                        </span>
                      </div>

                      {/* Reject reason input */}
                      {rejectingId === product.id && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={t("rejectReasonPlaceholder")}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(product.id)}
                              disabled={actionLoading === product.id}
                            >
                              {t("confirmReject")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason("");
                              }}
                            >
                              {t("cancelReject")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {rejectingId !== product.id && (
                      <div className="flex gap-2 shrink-0">
                        <Link href={`/products/${product.slug}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            {t("preview")}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(product.id)}
                          disabled={actionLoading === product.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectingId(product.id)}
                          disabled={actionLoading === product.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {t("reject")}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
