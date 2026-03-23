"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flag, AlertTriangle, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";

const STATUS_MAP = {
  0: { key: "pending", variant: "default" as const, icon: AlertTriangle },
  1: { key: "reviewed", variant: "secondary" as const, icon: Eye },
  2: { key: "resolved", variant: "default" as const, icon: CheckCircle },
  3: { key: "dismissed", variant: "outline" as const, icon: XCircle },
};

const REASON_KEYS = ["fake", "wrongPrice", "illegalContent", "spam", "fraud", "other"];

interface Report {
  id: string;
  productId: string;
  reporterUserId: string;
  reason: number;
  description: string;
  status: number;
  adminNote: string;
  reviewedByUserId: string;
  reviewedAt: string | null;
  createdAt: string;
}

export default function ReportsPage() {
  const t = useTranslations("reports");
  const tr = useTranslations("report");
  const { isAdmin, isStaff } = useRoles();
  const queryClient = useQueryClient();

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [activeTab, setActiveTab] = useState("0");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["productReports", "all"],
    queryFn: async () => {
      const response = await LivestockTradingAPI.ProductReports.All.Request({
        sorting: {
          key: "createdAt",
          direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
        },
        filters: [],
        pageRequest: { currentPage: 1, perPageCount: 100, listAll: false },
      });
      return response.map((r: any): Report => ({
        id: r.id,
        productId: r.productId,
        reporterUserId: r.reporterUserId,
        reason: r.reason,
        description: r.description,
        status: r.status,
        adminNote: r.adminNote || "",
        reviewedByUserId: r.reviewedByUserId || "",
        reviewedAt: r.reviewedAt?.toString() || null,
        createdAt: r.createdAt.toString(),
      }));
    },
    enabled: isAdmin || isStaff,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; status: number; adminNote: string }) =>
      LivestockTradingAPI.ProductReports.Update.Request({
        id: data.id,
        status: data.status,
        adminNote: data.adminNote,
      }),
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      queryClient.invalidateQueries({ queryKey: ["productReports"] });
      setSelectedReport(null);
      setAdminNote("");
      setNewStatus("");
    },
    onError: () => {
      toast.error(t("updateError"));
    },
  });

  const handleUpdate = () => {
    if (!selectedReport || !newStatus) return;
    updateMutation.mutate({
      id: selectedReport.id,
      status: parseInt(newStatus),
      adminNote: adminNote.trim(),
    });
  };

  const filteredReports = activeTab === "all"
    ? reports
    : reports.filter((r) => r.status === parseInt(activeTab));

  if (!isAdmin && !isStaff) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <Flag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
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
            <Flag className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="0" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t("pending")} ({reports.filter((r) => r.status === 0).length})
            </TabsTrigger>
            <TabsTrigger value="1">{t("reviewed")}</TabsTrigger>
            <TabsTrigger value="2">{t("resolved")}</TabsTrigger>
            <TabsTrigger value="3">{t("dismissed")}</TabsTrigger>
            <TabsTrigger value="all">{t("all")} ({reports.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t("noReports")}</p>
              </div>
            ) : (
              <ul role="list" className="space-y-3">
                {filteredReports.map((report) => {
                  const statusInfo = STATUS_MAP[report.status as keyof typeof STATUS_MAP] || STATUS_MAP[0];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <li key={report.id}>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">
                                  {tr(`reasons.${REASON_KEYS[report.reason] || "other"}`)}
                                </Badge>
                                <Badge variant={statusInfo.variant} className="gap-1">
                                  <StatusIcon className="h-3 w-3" />
                                  {t(statusInfo.key)}
                                </Badge>
                              </div>
                              <p className="text-sm">{report.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                <Link
                                  href={`/products/${report.productId}`}
                                  className="text-primary hover:underline"
                                >
                                  {t("viewProduct")}
                                </Link>
                              </div>
                              {report.adminNote && (
                                <p className="text-xs text-muted-foreground mt-2 border-l-2 pl-2">
                                  {t("adminNote")}: {report.adminNote}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setAdminNote(report.adminNote);
                                setNewStatus(report.status.toString());
                              }}
                            >
                              {t("review")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reviewReport")}</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{t("reasonLabel")}</p>
                <p className="text-sm text-muted-foreground">
                  {tr(`reasons.${REASON_KEYS[selectedReport.reason] || "other"}`)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">{t("descriptionLabel")}</p>
                <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("status")}</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t("pending")}</SelectItem>
                    <SelectItem value="1">{t("reviewed")}</SelectItem>
                    <SelectItem value="2">{t("resolved")}</SelectItem>
                    <SelectItem value="3">{t("dismissed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("adminNote")}</p>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={t("adminNotePlaceholder")}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
