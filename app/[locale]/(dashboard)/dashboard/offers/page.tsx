"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import {
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Package,
} from "lucide-react";

// Offer status enum matching backend
const OfferStatus = {
  Pending: 0,
  Accepted: 1,
  Rejected: 2,
  Countered: 3,
  Expired: 4,
  Withdrawn: 5,
} as const;

interface Offer {
  id: string;
  productId: string;
  buyerUserId: string;
  sellerUserId: string;
  offeredPrice: number;
  currency: string;
  quantity: number;
  status: number;
  offerDate: Date;
  expiryDate?: Date;
  createdAt: Date;
  // Enriched
  productTitle?: string;
  counterpartName?: string;
}

function getStatusInfo(status: number, t: (key: string) => string) {
  switch (status) {
    case OfferStatus.Pending:
      return { label: t("status.pending"), variant: "outline" as const, icon: Clock, color: "text-yellow-600" };
    case OfferStatus.Accepted:
      return { label: t("status.accepted"), variant: "default" as const, icon: CheckCircle, color: "text-green-600" };
    case OfferStatus.Rejected:
      return { label: t("status.rejected"), variant: "destructive" as const, icon: XCircle, color: "text-red-600" };
    case OfferStatus.Countered:
      return { label: t("status.countered"), variant: "secondary" as const, icon: RotateCcw, color: "text-blue-600" };
    case OfferStatus.Expired:
      return { label: t("status.expired"), variant: "outline" as const, icon: AlertTriangle, color: "text-muted-foreground" };
    case OfferStatus.Withdrawn:
      return { label: t("status.withdrawn"), variant: "outline" as const, icon: XCircle, color: "text-muted-foreground" };
    default:
      return { label: t("status.pending"), variant: "outline" as const, icon: Clock, color: "text-muted-foreground" };
  }
}

export default function OffersPage() {
  const t = useTranslations("offers");
  const locale = useLocale();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [sentOffers, setSentOffers] = useState<Offer[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch sent and received offers in parallel
        const [sentResponse, receivedResponse] = await Promise.all([
          LivestockTradingAPI.Offers.All.Request({
            sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
            filters: [
              {
                key: "buyerUserId",
                type: "guid",
                isUsed: true,
                values: [user.id],
                min: {},
                max: {},
                conditionType: "equals",
              },
            ],
            pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
          }),
          LivestockTradingAPI.Offers.All.Request({
            sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
            filters: [
              {
                key: "sellerUserId",
                type: "guid",
                isUsed: true,
                values: [user.id],
                min: {},
                max: {},
                conditionType: "equals",
              },
            ],
            pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
          }),
        ]);

        setSentOffers(
          sentResponse.map((o) => ({
            id: o.id,
            productId: o.productId,
            buyerUserId: o.buyerUserId,
            sellerUserId: o.sellerUserId,
            offeredPrice: o.offeredPrice as number,
            currency: o.currency,
            quantity: o.quantity,
            status: o.status,
            offerDate: o.offerDate,
            expiryDate: o.expiryDate,
            createdAt: o.createdAt,
          }))
        );

        setReceivedOffers(
          receivedResponse.map((o) => ({
            id: o.id,
            productId: o.productId,
            buyerUserId: o.buyerUserId,
            sellerUserId: o.sellerUserId,
            offeredPrice: o.offeredPrice as number,
            currency: o.currency,
            quantity: o.quantity,
            status: o.status,
            offerDate: o.offerDate,
            expiryDate: o.expiryDate,
            createdAt: o.createdAt,
          }))
        );
      } catch {
        toast.error(t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, [user?.id, t]);

  const handleAcceptOffer = async (offerId: string) => {
    const offer = receivedOffers.find((o) => o.id === offerId);
    if (!offer) return;

    setActionLoading(offerId);
    try {
      await LivestockTradingAPI.Offers.Update.Request({
        id: offerId,
        productId: offer.productId,
        buyerUserId: offer.buyerUserId,
        sellerUserId: offer.sellerUserId,
        offeredPrice: offer.offeredPrice as any,
        currency: offer.currency,
        quantity: offer.quantity,
        message: "",
        status: OfferStatus.Accepted,
        respondedAt: new Date(),
        responseMessage: "",
      });
      setReceivedOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status: OfferStatus.Accepted } : o))
      );
      toast.success(t("acceptSuccess"));
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    const offer = receivedOffers.find((o) => o.id === offerId);
    if (!offer) return;

    setActionLoading(offerId);
    try {
      await LivestockTradingAPI.Offers.Update.Request({
        id: offerId,
        productId: offer.productId,
        buyerUserId: offer.buyerUserId,
        sellerUserId: offer.sellerUserId,
        offeredPrice: offer.offeredPrice as any,
        currency: offer.currency,
        quantity: offer.quantity,
        message: "",
        status: OfferStatus.Rejected,
        respondedAt: new Date(),
        responseMessage: "",
      });
      setReceivedOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status: OfferStatus.Rejected } : o))
      );
      toast.success(t("rejectSuccess"));
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawOffer = async (offerId: string) => {
    const offer = sentOffers.find((o) => o.id === offerId);
    if (!offer) return;

    setActionLoading(offerId);
    try {
      await LivestockTradingAPI.Offers.Update.Request({
        id: offerId,
        productId: offer.productId,
        buyerUserId: offer.buyerUserId,
        sellerUserId: offer.sellerUserId,
        offeredPrice: offer.offeredPrice as any,
        currency: offer.currency,
        quantity: offer.quantity,
        message: "",
        status: OfferStatus.Withdrawn,
        responseMessage: "",
      });
      setSentOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status: OfferStatus.Withdrawn } : o))
      );
      toast.success(t("withdrawSuccess"));
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActionLoading(null);
    }
  };

  const renderOfferCard = (offer: Offer, type: "sent" | "received") => {
    const statusInfo = getStatusInfo(offer.status, t);
    const StatusIcon = statusInfo.icon;
    const isPending = offer.status === OfferStatus.Pending;

    return (
      <Card key={offer.id}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href={`/products/${offer.productId}`}
                  className="font-medium hover:underline truncate"
                >
                  {t("viewProduct")}
                </Link>
                <Badge variant={statusInfo.variant}>
                  <StatusIcon className={`h-3 w-3 mr-1 ${statusInfo.color}`} />
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold">
                  {Number(offer.offeredPrice).toLocaleString(locale)} {offer.currency}
                </span>
                {offer.quantity > 1 && (
                  <span className="text-sm text-muted-foreground">
                    x{offer.quantity}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <span>{new Date(offer.createdAt).toLocaleDateString(locale)}</span>
                {offer.expiryDate && (
                  <span>
                    {t("expiresAt")}: {new Date(offer.expiryDate).toLocaleDateString(locale)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {isPending && (
              <div className="flex gap-2 shrink-0">
                {type === "received" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptOffer(offer.id)}
                      disabled={actionLoading === offer.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {t("accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectOffer(offer.id)}
                      disabled={actionLoading === offer.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {t("reject")}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleWithdrawOffer(offer.id)}
                    disabled={actionLoading === offer.id}
                  >
                    {t("withdraw")}
                  </Button>
                )}
              </div>
            )}
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
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const pendingReceivedCount = receivedOffers.filter((o) => o.status === OfferStatus.Pending).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HandCoins className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>

        <Tabs defaultValue="received">
          <TabsList>
            <TabsTrigger value="received" className="gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              {t("received")}
              {pendingReceivedCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                  {pendingReceivedCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              {t("sent")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4">
            {isLoading ? (
              renderSkeleton()
            ) : receivedOffers.length === 0 ? (
              <div className="text-center py-16">
                <ArrowDownLeft className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("noReceivedOffers")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedOffers.map((offer) => renderOfferCard(offer, "received"))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            {isLoading ? (
              renderSkeleton()
            ) : sentOffers.length === 0 ? (
              <div className="text-center py-16">
                <ArrowUpRight className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("noSentOffers")}</p>
                <Button className="mt-4" asChild>
                  <Link href="/products">
                    <Package className="h-4 w-4 mr-2" />
                    {t("browseProducts")}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sentOffers.map((offer) => renderOfferCard(offer, "sent"))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
