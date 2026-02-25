"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import {
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Send,
  Eye,
  X,
  Shield,
  Calendar,
} from "lucide-react";

const OfferStatus = {
  Pending: 0,
  Accepted: 1,
  Rejected: 2,
  Expired: 3,
  Cancelled: 4,
} as const;

interface TransportOffer {
  id: string;
  transportRequestId: string;
  transporterId: string;
  offeredPrice: number;
  currency: string;
  status: number;
  estimatedDurationDays: number | null;
  insuranceIncluded: boolean;
  offerDate: Date;
  createdAt: Date;
}

interface OfferFormData {
  offeredPrice: string;
  currency: string;
  estimatedDurationDays: string;
  vehicleType: string;
  insuranceIncluded: boolean;
  insuranceAmount: string;
  additionalServices: string;
  message: string;
}

export default function TransportOffersPage() {
  const t = useTranslations("transportOffers");
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const transportOffersQueryKey = [...queryKeys.transporters.transportOffers(), "mine", user?.id];

  const { data: offersRaw = [], isLoading } = useQuery({
    queryKey: transportOffersQueryKey,
    queryFn: () =>
      LivestockTradingAPI.TransportOffers.All.Request({
        sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
        filters: [
          { key: "transporterId", type: "guid", isUsed: true, values: [user!.id], min: {}, max: {}, conditionType: "equals" },
        ],
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      }).then((response) =>
        response.map((o) => ({
          id: o.id,
          transportRequestId: o.transportRequestId,
          transporterId: o.transporterId,
          offeredPrice: o.offeredPrice as number,
          currency: o.currency,
          status: o.status,
          estimatedDurationDays: o.estimatedDurationDays as number | null,
          insuranceIncluded: o.insuranceIncluded,
          offerDate: o.offerDate,
          createdAt: o.createdAt,
        }))
      ),
    enabled: !!user?.id,
  });

  const offers: TransportOffer[] = offersRaw;

  const [showForm, setShowForm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OfferFormData>({
    offeredPrice: "",
    currency: "TRY",
    estimatedDurationDays: "",
    vehicleType: "",
    insuranceIncluded: false,
    insuranceAmount: "",
    additionalServices: "",
    message: "",
  });

  const resetForm = () => {
    setFormData({
      offeredPrice: "",
      currency: "TRY",
      estimatedDurationDays: "",
      vehicleType: "",
      insuranceIncluded: false,
      insuranceAmount: "",
      additionalServices: "",
      message: "",
    });
    setSelectedRequestId("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedRequestId) return;

    setIsSubmitting(true);
    try {
      await LivestockTradingAPI.TransportOffers.Create.Request({
        transportRequestId: selectedRequestId,
        transporterId: user.id,
        offeredPrice: parseFloat(formData.offeredPrice) as any,
        currency: formData.currency,
        estimatedDurationDays: formData.estimatedDurationDays
          ? parseInt(formData.estimatedDurationDays)
          : undefined,
        vehicleType: formData.vehicleType,
        insuranceIncluded: formData.insuranceIncluded,
        insuranceAmount: formData.insuranceAmount
          ? (parseFloat(formData.insuranceAmount) as any)
          : undefined,
        additionalServices: formData.additionalServices,
        message: formData.message,
        status: OfferStatus.Pending,
      });

      toast.success(t("createSuccess"));
      resetForm();

      queryClient.invalidateQueries({ queryKey: transportOffersQueryKey });
    } catch {
      toast.error(t("createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOffer = async (offerId: string) => {
    try {
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) return;

      await LivestockTradingAPI.TransportOffers.Update.Request({
        id: offerId,
        transportRequestId: offer.transportRequestId,
        transporterId: offer.transporterId,
        offeredPrice: offer.offeredPrice as any,
        currency: offer.currency,
        vehicleType: "",
        insuranceIncluded: offer.insuranceIncluded,
        additionalServices: "",
        message: "",
        status: OfferStatus.Cancelled,
      });

      queryClient.invalidateQueries({ queryKey: transportOffersQueryKey });
      toast.success(t("cancelSuccess"));
    } catch {
      toast.error(t("cancelError"));
    }
  };

  const getStatusBadge = (status: number) => {
    const config: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      [OfferStatus.Pending]: { label: t("status.pending"), variant: "secondary" },
      [OfferStatus.Accepted]: { label: t("status.accepted"), variant: "default" },
      [OfferStatus.Rejected]: { label: t("status.rejected"), variant: "destructive" },
      [OfferStatus.Expired]: { label: t("status.expired"), variant: "outline" },
      [OfferStatus.Cancelled]: { label: t("status.cancelled"), variant: "outline" },
    };
    const c = config[status] || { label: t("status.pending"), variant: "secondary" as const };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case OfferStatus.Pending: return <Clock className="h-4 w-4 text-yellow-500" />;
      case OfferStatus.Accepted: return <CheckCircle className="h-4 w-4 text-green-500" />;
      case OfferStatus.Rejected: return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const pendingOffers = offers.filter((o) => o.status === OfferStatus.Pending);
  const completedOffers = offers.filter((o) => o.status !== OfferStatus.Pending);

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
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Send className="h-4 w-4 mr-2" />
              {t("newOffer")}
            </Button>
          )}
        </div>

        {/* New Offer Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t("newOffer")}
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="request-id">{t("transportRequestId")}</Label>
                  <Input
                    id="request-id"
                    value={selectedRequestId}
                    onChange={(e) => setSelectedRequestId(e.target.value)}
                    placeholder={t("requestIdPlaceholder")}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">{t("offeredPrice")}</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.offeredPrice}
                      onChange={(e) => setFormData({ ...formData, offeredPrice: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">{t("estimatedDays")}</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.estimatedDurationDays}
                      onChange={(e) => setFormData({ ...formData, estimatedDurationDays: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle">{t("vehicleType")}</Label>
                    <Input
                      id="vehicle"
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="insurance"
                      checked={formData.insuranceIncluded}
                      onChange={(e) => setFormData({ ...formData, insuranceIncluded: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="insurance" className="cursor-pointer">
                      <Shield className="h-4 w-4 inline mr-1" />
                      {t("insuranceIncluded")}
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">{t("message")}</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? t("sending") : t("sendOffer")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Offers List */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              {t("pendingTab")} ({pendingOffers.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              {t("historyTab")} ({completedOffers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pendingOffers.length === 0 ? (
              <div className="text-center py-16">
                <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("noPendingOffers")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOffers.map((offer) => (
                  <Card key={offer.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(offer.status)}
                            <span className="font-medium">
                              <DollarSign className="h-4 w-4 inline" />
                              {offer.offeredPrice} {offer.currency}
                            </span>
                            {getStatusBadge(offer.status)}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(offer.createdAt).toLocaleDateString()}
                            </div>
                            {offer.estimatedDurationDays && (
                              <div>{t("estimatedDays")}: {offer.estimatedDurationDays} {t("days")}</div>
                            )}
                            {offer.insuranceIncluded && (
                              <div className="flex items-center gap-1">
                                <Shield className="h-3.5 w-3.5" />
                                {t("insuranceIncluded")}
                              </div>
                            )}
                          </div>
                        </div>
                        {offer.status === OfferStatus.Pending && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelOffer(offer.id)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            {t("cancelOffer")}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedOffers.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("noHistory")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedOffers.map((offer) => (
                  <Card key={offer.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(offer.status)}
                          <div>
                            <span className="font-medium">
                              {offer.offeredPrice} {offer.currency}
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {new Date(offer.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(offer.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
