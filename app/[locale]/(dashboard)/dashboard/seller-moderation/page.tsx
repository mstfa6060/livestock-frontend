"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import {
  Store,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

type StatusFilter = "all" | "pending" | "active" | "suspended";

const STATUS_MAP: Record<number, string> = {
  0: "pendingVerification",
  1: "active",
  2: "suspended",
  3: "banned",
};

const STATUS_VARIANT: Record<number, "default" | "secondary" | "destructive" | "outline"> = {
  0: "outline",
  1: "default",
  2: "destructive",
  3: "destructive",
};

export default function SellerModerationPage() {
  const t = useTranslations("sellerModeration");
  const locale = useLocale();
  const { isAdmin, isStaff } = useRoles();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const queryClient = useQueryClient();

  const sellerModerationKey = [...queryKeys.sellers.lists(), "moderation", statusFilter];

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: sellerModerationKey,
    queryFn: async () => {
      const filters: LivestockTradingAPI.Sellers.All.IXFilterItem[] = [];

      if (statusFilter !== "all") {
        const statusValue = statusFilter === "pending" ? 0 : statusFilter === "active" ? 1 : 2;
        filters.push({
          key: "status",
          type: "number",
          isUsed: true,
          values: [statusValue],
          min: {},
          max: {},
          conditionType: "equals",
        });
      }

      const response = await LivestockTradingAPI.Sellers.All.Request({
        sorting: {
          key: "createdAt",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters,
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      });

      return response;
    },
    enabled: isAdmin || isStaff,
  });

  const handleVerify = async (sellerId: string) => {
    setActionLoading(sellerId);
    try {
      await LivestockTradingAPI.Sellers.Verify.Request({ id: sellerId });
      queryClient.invalidateQueries({ queryKey: queryKeys.sellers.lists() });
      toast.success(t("verifySuccess"));
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (sellerId: string) => {
    if (!suspendReason.trim()) {
      toast.error(t("suspendReasonRequired"));
      return;
    }

    setActionLoading(sellerId);
    try {
      await LivestockTradingAPI.Sellers.Suspend.Request({
        id: sellerId,
        reason: suspendReason,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.sellers.lists() });
      setSuspendingId(null);
      setSuspendReason("");
      toast.success(t("suspendSuccess"));
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActionLoading(null);
    }
  };

  // Access control
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
            <Store className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("description")}
            {!isLoading && (
              <Badge variant="secondary" className="ml-2">
                {sellers.length} {t("pending")}
              </Badge>
            )}
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "active", "suspended"] as StatusFilter[]).map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter)}
            >
              {t(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`)}
            </Button>
          ))}
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
        ) : sellers.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("allClear")}</h2>
            <p className="text-muted-foreground">{t("noPending")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sellers.map((seller) => (
              <Card key={seller.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">
                          {seller.businessName}
                        </span>
                        <Badge variant={STATUS_VARIANT[seller.status] ?? "outline"}>
                          {seller.status === 0 && <Clock className="h-3 w-3 mr-1" />}
                          {t(`statusLabels.${STATUS_MAP[seller.status] ?? "pendingVerification"}`)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
                        {seller.businessType && (
                          <span className="text-muted-foreground">
                            {t("businessType")}: {seller.businessType}
                          </span>
                        )}
                        {seller.email && (
                          <span className="text-muted-foreground">
                            {seller.email}
                          </span>
                        )}
                        {seller.phone && (
                          <span className="text-muted-foreground">
                            {seller.phone}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(seller.createdAt).toLocaleDateString(locale)}
                        </span>
                      </div>

                      {/* Suspend reason input */}
                      {suspendingId === seller.id && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            placeholder={t("suspendReasonPlaceholder")}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleSuspend(seller.id)}
                              disabled={actionLoading === seller.id}
                            >
                              {t("confirmSuspend")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSuspendingId(null);
                                setSuspendReason("");
                              }}
                            >
                              {t("cancelSuspend")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {suspendingId !== seller.id && (
                      <div className="flex gap-2 shrink-0">
                        {seller.status !== 1 && (
                          <Button
                            size="sm"
                            onClick={() => handleVerify(seller.id)}
                            disabled={actionLoading === seller.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t("verify")}
                          </Button>
                        )}
                        {seller.status !== 2 && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSuspendingId(seller.id)}
                            disabled={actionLoading === seller.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t("suspend")}
                          </Button>
                        )}
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
