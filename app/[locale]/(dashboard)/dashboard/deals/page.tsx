"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import {
  Handshake,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  FileText,
  AlertTriangle,
  ShoppingBag,
  Store,
} from "lucide-react";
import dynamic from "next/dynamic";
const RequestTransportDialog = dynamic(() => import("@/components/features/request-transport-dialog").then(mod => ({ default: mod.RequestTransportDialog })), { ssr: false });

const DealStatus = {
  Pending: 0,
  Confirmed: 1,
  Processing: 2,
  Shipped: 3,
  Delivered: 4,
  Completed: 5,
  Cancelled: 6,
  Disputed: 7,
} as const;

const DeliveryMethod = {
  Pickup: 0,
  Shipping: 1,
  Transport: 2,
} as const;

interface Deal {
  id: string;
  dealNumber: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  agreedPrice: number;
  currency: string;
  quantity: number;
  status: number;
  dealDate: Date;
  deliveryMethod: number;
  isCompleted: boolean;
  isCancelled: boolean;
  createdAt: Date;
}

function getDealStatusInfo(status: number, t: (key: string) => string) {
  switch (status) {
    case DealStatus.Pending:
      return { label: t("dealStatus.pending"), variant: "outline" as const, icon: Clock, color: "text-yellow-600" };
    case DealStatus.Confirmed:
      return { label: t("dealStatus.confirmed"), variant: "default" as const, icon: CheckCircle, color: "text-blue-600" };
    case DealStatus.Processing:
      return { label: t("dealStatus.processing"), variant: "secondary" as const, icon: Package, color: "text-purple-600" };
    case DealStatus.Shipped:
      return { label: t("dealStatus.shipped"), variant: "secondary" as const, icon: Truck, color: "text-indigo-600" };
    case DealStatus.Delivered:
      return { label: t("dealStatus.delivered"), variant: "default" as const, icon: CheckCircle, color: "text-green-600" };
    case DealStatus.Completed:
      return { label: t("dealStatus.completed"), variant: "default" as const, icon: CheckCircle, color: "text-green-700" };
    case DealStatus.Cancelled:
      return { label: t("dealStatus.cancelled"), variant: "destructive" as const, icon: XCircle, color: "text-red-600" };
    case DealStatus.Disputed:
      return { label: t("dealStatus.disputed"), variant: "destructive" as const, icon: AlertTriangle, color: "text-orange-600" };
    default:
      return { label: t("dealStatus.pending"), variant: "outline" as const, icon: Clock, color: "text-muted-foreground" };
  }
}

function getDeliveryLabel(method: number, t: (key: string) => string) {
  switch (method) {
    case DeliveryMethod.Pickup:
      return t("delivery.pickup");
    case DeliveryMethod.Shipping:
      return t("delivery.shipping");
    case DeliveryMethod.Transport:
      return t("delivery.transport");
    default:
      return t("delivery.pickup");
  }
}

export default function DealsPage() {
  const t = useTranslations("deals");
  const locale = useLocale();
  const { user } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapDeal = (d: any): Deal => ({
    id: d.id,
    dealNumber: d.dealNumber,
    productId: d.productId,
    sellerId: d.sellerId,
    buyerId: d.buyerId,
    agreedPrice: d.agreedPrice as number,
    currency: d.currency,
    quantity: d.quantity,
    status: d.status,
    dealDate: d.dealDate,
    deliveryMethod: d.deliveryMethod,
    isCompleted: d.isCompleted,
    isCancelled: d.isCancelled,
    createdAt: d.createdAt,
  });

  const { data: buyingDeals = [], isLoading: isBuyingLoading } = useQuery({
    queryKey: [...queryKeys.deals.list(), "buyer", user?.id],
    queryFn: () =>
      LivestockTradingAPI.Deals.All.Request({
        sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
        filters: [
          { key: "buyerId", type: "guid", isUsed: true, values: [user!.id], min: {}, max: {}, conditionType: "equals" },
        ],
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      }).then((resp) => resp.map(mapDeal)),
    enabled: !!user?.id,
  });

  const { data: sellingDeals = [], isLoading: isSellingLoading } = useQuery({
    queryKey: [...queryKeys.deals.list(), "seller", user?.id],
    queryFn: () =>
      LivestockTradingAPI.Deals.All.Request({
        sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
        filters: [
          { key: "sellerId", type: "guid", isUsed: true, values: [user!.id], min: {}, max: {}, conditionType: "equals" },
        ],
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      }).then((resp) => resp.map(mapDeal)),
    enabled: !!user?.id,
  });

  const isLoading = isBuyingLoading || isSellingLoading;

  const renderDealCard = (deal: Deal) => {
    const statusInfo = getDealStatusInfo(deal.status, t);
    const StatusIcon = statusInfo.icon;

    return (
      <Card key={deal.id}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm text-muted-foreground">
                  #{deal.dealNumber}
                </span>
                <Badge variant={statusInfo.variant}>
                  <StatusIcon className={`h-3 w-3 mr-1 ${statusInfo.color}`} />
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xl font-bold">
                  {Number(deal.agreedPrice).toLocaleString(locale)} {deal.currency}
                </span>
                {deal.quantity > 1 && (
                  <span className="text-sm text-muted-foreground">
                    x{deal.quantity}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {new Date(deal.dealDate).toLocaleDateString(locale)}
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {getDeliveryLabel(deal.deliveryMethod, t)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Link href={`/products/${deal.productId}`}>
                <Button size="sm" variant="outline" className="w-full">
                  {t("viewProduct")}
                </Button>
              </Link>
              {deal.deliveryMethod === DeliveryMethod.Transport &&
                deal.status >= DealStatus.Confirmed &&
                deal.status <= DealStatus.Processing && (
                <RequestTransportDialog deal={deal}>
                  <Button size="sm" variant="secondary" className="w-full">
                    <Truck className="h-3 w-3 mr-1" />
                    {t("requestTransport")}
                  </Button>
                </RequestTransportDialog>
              )}
            </div>
          </div>
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
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const activeDealsCount =
    buyingDeals.filter((d) => !d.isCompleted && !d.isCancelled).length +
    sellingDeals.filter((d) => !d.isCompleted && !d.isCancelled).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Handshake className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{activeDealsCount}</div>
              <div className="text-xs text-muted-foreground">{t("activeDeals")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {buyingDeals.filter((d) => d.isCompleted).length + sellingDeals.filter((d) => d.isCompleted).length}
              </div>
              <div className="text-xs text-muted-foreground">{t("completedDeals")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{buyingDeals.length}</div>
              <div className="text-xs text-muted-foreground">{t("purchases")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{sellingDeals.length}</div>
              <div className="text-xs text-muted-foreground">{t("sales")}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="buying">
          <TabsList>
            <TabsTrigger value="buying" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              {t("buying")}
            </TabsTrigger>
            <TabsTrigger value="selling" className="gap-2">
              <Store className="h-4 w-4" />
              {t("selling")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buying" className="mt-4">
            {isLoading ? (
              renderSkeleton()
            ) : buyingDeals.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("noBuyingDeals")}</p>
                <Button className="mt-4" asChild>
                  <Link href="/products">
                    <Package className="h-4 w-4 mr-2" />
                    {t("browseProducts")}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {buyingDeals.map(renderDealCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="selling" className="mt-4">
            {isLoading ? (
              renderSkeleton()
            ) : sellingDeals.length === 0 ? (
              <div className="text-center py-16">
                <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("noSellingDeals")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sellingDeals.map(renderDealCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
