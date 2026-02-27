"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  MapPin,
  AlertTriangle,
  ArrowRight,
  Zap,
  Navigation,
} from "lucide-react";
import { TransportTracking } from "@/components/features/transport-tracking";

const TransportStatus = {
  Pending: 0,
  InPool: 1,
  Assigned: 2,
  PickedUp: 3,
  InTransit: 4,
  Delivered: 5,
  Completed: 6,
  Cancelled: 7,
} as const;

const TransportType = {
  Standard: 0,
  Refrigerated: 1,
  LiveAnimal: 2,
  Hazardous: 3,
  Oversized: 4,
} as const;

interface TransportRequest {
  id: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  pickupLocationId: string;
  deliveryLocationId: string;
  transportType: number;
  status: number;
  isUrgent: boolean;
  isInPool: boolean;
  assignedTransporterId?: string;
  createdAt: Date;
}

function getTransportStatusInfo(status: number, t: (key: string) => string) {
  switch (status) {
    case TransportStatus.Pending:
      return { label: t("transportStatus.pending"), variant: "outline" as const, icon: Clock };
    case TransportStatus.InPool:
      return { label: t("transportStatus.inPool"), variant: "secondary" as const, icon: Package };
    case TransportStatus.Assigned:
      return { label: t("transportStatus.assigned"), variant: "default" as const, icon: Truck };
    case TransportStatus.PickedUp:
      return { label: t("transportStatus.pickedUp"), variant: "default" as const, icon: Package };
    case TransportStatus.InTransit:
      return { label: t("transportStatus.inTransit"), variant: "secondary" as const, icon: Truck };
    case TransportStatus.Delivered:
      return { label: t("transportStatus.delivered"), variant: "default" as const, icon: CheckCircle };
    case TransportStatus.Completed:
      return { label: t("transportStatus.completed"), variant: "default" as const, icon: CheckCircle };
    case TransportStatus.Cancelled:
      return { label: t("transportStatus.cancelled"), variant: "destructive" as const, icon: XCircle };
    default:
      return { label: t("transportStatus.pending"), variant: "outline" as const, icon: Clock };
  }
}

function getTransportTypeLabel(type: number, t: (key: string) => string) {
  switch (type) {
    case TransportType.Standard: return t("transportType.standard");
    case TransportType.Refrigerated: return t("transportType.refrigerated");
    case TransportType.LiveAnimal: return t("transportType.liveAnimal");
    case TransportType.Hazardous: return t("transportType.hazardous");
    case TransportType.Oversized: return t("transportType.oversized");
    default: return t("transportType.standard");
  }
}

export default function TransportPage() {
  const t = useTranslations("transport");
  const locale = useLocale();
  const { user } = useAuth();

  const [expandedTracking, setExpandedTracking] = useState<Set<string>>(new Set());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRequest = (r: any): TransportRequest => ({
    id: r.id,
    productId: r.productId,
    sellerId: r.sellerId,
    buyerId: r.buyerId,
    pickupLocationId: r.pickupLocationId,
    deliveryLocationId: r.deliveryLocationId,
    transportType: r.transportType,
    status: r.status,
    isUrgent: r.isUrgent,
    isInPool: r.isInPool,
    assignedTransporterId: r.assignedTransporterId,
    createdAt: r.createdAt,
  });

  const { data: sellerRequests = [], isLoading: isSellerLoading } = useQuery({
    queryKey: [...queryKeys.transporters.requests(), "seller", user?.id],
    queryFn: () =>
      LivestockTradingAPI.TransportRequests.All.Request({
        sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
        filters: [
          { key: "sellerId", type: "guid", isUsed: true, values: [user!.id], min: {}, max: {}, conditionType: "equals" },
        ],
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      }).then((resp) => resp.map(mapRequest)),
    enabled: !!user?.id,
  });

  const { data: buyerRequests = [], isLoading: isBuyerLoading } = useQuery({
    queryKey: [...queryKeys.transporters.requests(), "buyer", user?.id],
    queryFn: () =>
      LivestockTradingAPI.TransportRequests.All.Request({
        sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
        filters: [
          { key: "buyerId", type: "guid", isUsed: true, values: [user!.id], min: {}, max: {}, conditionType: "equals" },
        ],
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      }).then((resp) => resp.map(mapRequest)),
    enabled: !!user?.id,
  });

  const isLoading = isSellerLoading || isBuyerLoading;

  const renderRequestCard = (request: TransportRequest) => {
    const statusInfo = getTransportStatusInfo(request.status, t);
    const StatusIcon = statusInfo.icon;

    return (
      <Card key={request.id}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant={statusInfo.variant}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
                <Badge variant="outline">
                  {getTransportTypeLabel(request.transportType, t)}
                </Badge>
                {request.isUrgent && (
                  <Badge variant="destructive" className="gap-1">
                    <Zap className="h-3 w-3" />
                    {t("urgent")}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <MapPin className="h-3 w-3" />
                <span>{t("pickup")}</span>
                <ArrowRight className="h-3 w-3" />
                <MapPin className="h-3 w-3" />
                <span>{t("delivery")}</span>
              </div>

              <div className="text-xs text-muted-foreground mt-2">
                {new Date(request.createdAt).toLocaleDateString(locale)}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link href={`/products/${request.productId}`}>
                <Button size="sm" variant="outline" className="w-full">
                  <Package className="h-3 w-3 mr-1" />
                  {t("viewProduct")}
                </Button>
              </Link>
              {request.status >= TransportStatus.Assigned && request.status <= TransportStatus.InTransit && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setExpandedTracking((prev) => {
                      const next = new Set(prev);
                      if (next.has(request.id)) next.delete(request.id);
                      else next.add(request.id);
                      return next;
                    });
                  }}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  {t("trackShipment")}
                </Button>
              )}
            </div>
          </div>

          {expandedTracking.has(request.id) && (
            <TransportTracking transportRequestId={request.id} />
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const allRequests = [...sellerRequests, ...buyerRequests];
  const activeCount = allRequests.filter(
    (r) => r.status !== TransportStatus.Completed && r.status !== TransportStatus.Cancelled
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          <Link href="/transporters">
            <Button variant="outline">
              <Truck className="h-4 w-4 mr-2" />
              {t("findTransporter")}
            </Button>
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{activeCount}</div>
              <div className="text-xs text-muted-foreground">{t("active")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {allRequests.filter((r) => r.status === TransportStatus.Completed).length}
              </div>
              <div className="text-xs text-muted-foreground">{t("completed")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{allRequests.length}</div>
              <div className="text-xs text-muted-foreground">{t("total")}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="selling">
          <TabsList>
            <TabsTrigger value="selling">{t("asSeller")}</TabsTrigger>
            <TabsTrigger value="buying">{t("asBuyer")}</TabsTrigger>
          </TabsList>

          <TabsContent value="selling" className="mt-4">
            {isLoading ? (
              renderSkeleton()
            ) : sellerRequests.length === 0 ? (
              <div className="text-center py-16">
                <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("noSellerRequests")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sellerRequests.map(renderRequestCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="buying" className="mt-4">
            {isLoading ? (
              renderSkeleton()
            ) : buyerRequests.length === 0 ? (
              <div className="text-center py-16">
                <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("noBuyerRequests")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {buyerRequests.map(renderRequestCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
