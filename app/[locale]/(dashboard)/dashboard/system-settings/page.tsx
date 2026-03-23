"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";
import {
  Coins,
  Globe2,
  CreditCard,
  Truck,
  Receipt,
  MapPin,
  Settings,
  DollarSign,
  Pencil,
} from "lucide-react";

interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
  exchangeRateToUSD: number;
  isActive: boolean;
}

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isRightToLeft: boolean;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  iconUrl: string;
  requiresManualVerification: boolean;
  isActive: boolean;
  supportedCountries: string;
  supportedCurrencies: string;
}

interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  website: string;
  trackingUrlTemplate: string;
  isActive: boolean;
  supportedCountries: string;
}

interface ShippingZone {
  id: string;
  name: string;
  countryCodes: string;
  isActive: boolean;
}

interface ShippingRate {
  id: string;
  shippingZoneId: string;
  shippingCarrierId: string | null;
  shippingCost: number;
  currency: string;
  estimatedDeliveryDays: number | null;
  isFreeShipping: boolean;
  isActive: boolean;
}

interface TaxRate {
  id: string;
  countryCode: string;
  stateCode: string;
  taxName: string;
  rate: number;
  type: number;
  isActive: boolean;
}

type EditDialogType =
  | { type: "currency"; data: Currency }
  | { type: "carrier"; data: ShippingCarrier }
  | { type: "zone"; data: ShippingZone }
  | { type: "rate"; data: ShippingRate }
  | { type: "taxRate"; data: TaxRate }
  | null;

export default function SystemSettingsPage() {
  const t = useTranslations("systemSettings");
  const { isAdmin } = useRoles();
  const queryClient = useQueryClient();

  const [editDialog, setEditDialog] = useState<EditDialogType>(null);
  const [editForm, setEditForm] = useState<Record<string, string | number | boolean>>({});

  const settingsQueryKey = [...queryKeys.systemSettings.all, "all"];

  const defaultReq = {
    sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending },
    filters: [],
    pageRequest: { currentPage: 1, perPageCount: 100, listAll: false },
  };

  const { data: allSettings, isLoading } = useQuery({
    queryKey: settingsQueryKey,
    queryFn: async () => {
      const [curRes, langRes, payRes, carrRes, zoneRes, rateRes, taxRes] = await Promise.allSettled([
        LivestockTradingAPI.Currencies.All.Request(defaultReq),
        LivestockTradingAPI.Languages.All.Request(defaultReq),
        LivestockTradingAPI.PaymentMethods.All.Request(defaultReq),
        LivestockTradingAPI.ShippingCarriers.All.Request(defaultReq),
        LivestockTradingAPI.ShippingZones.All.Request(defaultReq),
        LivestockTradingAPI.ShippingRates.All.Request(defaultReq),
        LivestockTradingAPI.TaxRates.All.Request(defaultReq),
      ]);

      return {
        currencies: curRes.status === "fulfilled" ? curRes.value.map((c) => ({
          id: c.id, code: c.code, symbol: c.symbol, name: c.name,
          exchangeRateToUSD: c.exchangeRateToUSD as number, isActive: c.isActive,
        })) as Currency[] : [],
        languages: langRes.status === "fulfilled" ? langRes.value.map((l) => ({
          id: l.id, code: l.code, name: l.name, nativeName: l.nativeName,
          isRightToLeft: l.isRightToLeft, isActive: l.isActive, isDefault: l.isDefault, sortOrder: l.sortOrder,
        })) as Language[] : [],
        paymentMethods: payRes.status === "fulfilled" ? payRes.value.map((p) => ({
          id: p.id, name: p.name, code: p.code, description: p.description,
          iconUrl: p.iconUrl ?? "", requiresManualVerification: p.requiresManualVerification ?? false,
          isActive: p.isActive, supportedCountries: p.supportedCountries, supportedCurrencies: p.supportedCurrencies,
        })) as PaymentMethod[] : [],
        carriers: carrRes.status === "fulfilled" ? carrRes.value.map((c) => ({
          id: c.id, name: c.name, code: c.code, website: c.website,
          trackingUrlTemplate: c.trackingUrlTemplate ?? "",
          isActive: c.isActive, supportedCountries: c.supportedCountries,
        })) as ShippingCarrier[] : [],
        zones: zoneRes.status === "fulfilled" ? zoneRes.value.map((z) => ({
          id: z.id, name: z.name, countryCodes: z.countryCodes, isActive: z.isActive,
        })) as ShippingZone[] : [],
        rates: rateRes.status === "fulfilled" ? rateRes.value.map((r) => ({
          id: r.id, shippingZoneId: r.shippingZoneId,
          shippingCarrierId: (r.shippingCarrierId as string) ?? null,
          shippingCost: r.shippingCost as number, currency: r.currency,
          estimatedDeliveryDays: (r.estimatedDeliveryDays as number) ?? null,
          isFreeShipping: r.isFreeShipping, isActive: r.isActive,
        })) as ShippingRate[] : [],
        taxRates: taxRes.status === "fulfilled" ? taxRes.value.map((t) => ({
          id: t.id, countryCode: t.countryCode, stateCode: t.stateCode,
          taxName: t.taxName, rate: t.rate as number, type: t.type, isActive: t.isActive,
        })) as TaxRate[] : [],
      };
    },
    enabled: isAdmin,
  });

  const currencies = allSettings?.currencies ?? [];
  const languages = allSettings?.languages ?? [];
  const paymentMethods = allSettings?.paymentMethods ?? [];
  const carriers = allSettings?.carriers ?? [];
  const zones = allSettings?.zones ?? [];
  const rates = allSettings?.rates ?? [];
  const taxRates = allSettings?.taxRates ?? [];

  // --- Mutations ---

  const invalidateSettings = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.systemSettings.all });
  };

  const currencyMutation = useMutation({
    mutationFn: (data: Currency) =>
      LivestockTradingAPI.Currencies.Update.Request({
        id: data.id, code: data.code, symbol: data.symbol, name: data.name,
        exchangeRateToUSD: data.exchangeRateToUSD as never, isActive: data.isActive,
      }),
    onSuccess: () => { invalidateSettings(); toast.success(t("updateSuccess")); },
    onError: () => { toast.error(t("updateFailed")); },
  });

  const carrierMutation = useMutation({
    mutationFn: (data: ShippingCarrier) =>
      LivestockTradingAPI.ShippingCarriers.Update.Request({
        id: data.id, name: data.name, code: data.code, website: data.website,
        trackingUrlTemplate: data.trackingUrlTemplate, isActive: data.isActive,
        supportedCountries: data.supportedCountries,
      }),
    onSuccess: () => { invalidateSettings(); toast.success(t("updateSuccess")); },
    onError: () => { toast.error(t("updateFailed")); },
  });

  const zoneMutation = useMutation({
    mutationFn: (data: ShippingZone) =>
      LivestockTradingAPI.ShippingZones.Update.Request({
        id: data.id, name: data.name, countryCodes: data.countryCodes, isActive: data.isActive,
      }),
    onSuccess: () => { invalidateSettings(); toast.success(t("updateSuccess")); },
    onError: () => { toast.error(t("updateFailed")); },
  });

  const rateMutation = useMutation({
    mutationFn: (data: ShippingRate) =>
      LivestockTradingAPI.ShippingRates.Update.Request({
        id: data.id, shippingZoneId: data.shippingZoneId,
        shippingCarrierId: data.shippingCarrierId ?? undefined,
        shippingCost: data.shippingCost as never, currency: data.currency,
        estimatedDeliveryDays: data.estimatedDeliveryDays ?? undefined,
        isFreeShipping: data.isFreeShipping, isActive: data.isActive,
      }),
    onSuccess: () => { invalidateSettings(); toast.success(t("updateSuccess")); },
    onError: () => { toast.error(t("updateFailed")); },
  });

  const taxRateMutation = useMutation({
    mutationFn: (data: TaxRate) =>
      LivestockTradingAPI.TaxRates.Update.Request({
        id: data.id, countryCode: data.countryCode, stateCode: data.stateCode,
        taxName: data.taxName, rate: data.rate as never, type: data.type, isActive: data.isActive,
      }),
    onSuccess: () => { invalidateSettings(); toast.success(t("updateSuccess")); },
    onError: () => { toast.error(t("updateFailed")); },
  });

  const paymentMethodMutation = useMutation({
    mutationFn: (data: PaymentMethod) =>
      LivestockTradingAPI.PaymentMethods.Update.Request({
        id: data.id, name: data.name, code: data.code, description: data.description,
        iconUrl: data.iconUrl, requiresManualVerification: data.requiresManualVerification,
        isActive: data.isActive, supportedCountries: data.supportedCountries,
        supportedCurrencies: data.supportedCurrencies,
      }),
    onSuccess: () => { invalidateSettings(); toast.success(t("toggleSuccess")); },
    onError: () => { toast.error(t("updateFailed")); },
  });

  // --- Toggle handlers ---

  const toggleCurrency = (cur: Currency) => {
    currencyMutation.mutate({ ...cur, isActive: !cur.isActive });
  };

  const toggleCarrier = (c: ShippingCarrier) => {
    carrierMutation.mutate({ ...c, isActive: !c.isActive });
  };

  const toggleZone = (z: ShippingZone) => {
    zoneMutation.mutate({ ...z, isActive: !z.isActive });
  };

  const toggleRate = (r: ShippingRate) => {
    rateMutation.mutate({ ...r, isActive: !r.isActive });
  };

  const toggleTaxRate = (tax: TaxRate) => {
    taxRateMutation.mutate({ ...tax, isActive: !tax.isActive });
  };

  const togglePaymentMethod = (pm: PaymentMethod) => {
    paymentMethodMutation.mutate({ ...pm, isActive: !pm.isActive });
  };

  // --- Edit dialog handlers ---

  const openEditDialog = (dialog: EditDialogType) => {
    if (!dialog) return;
    setEditDialog(dialog);
    switch (dialog.type) {
      case "currency":
        setEditForm({ exchangeRateToUSD: dialog.data.exchangeRateToUSD });
        break;
      case "carrier":
        setEditForm({
          name: dialog.data.name, code: dialog.data.code,
          website: dialog.data.website, supportedCountries: dialog.data.supportedCountries,
        });
        break;
      case "zone":
        setEditForm({ name: dialog.data.name, countryCodes: dialog.data.countryCodes });
        break;
      case "rate":
        setEditForm({
          shippingCost: dialog.data.shippingCost, currency: dialog.data.currency,
          estimatedDeliveryDays: dialog.data.estimatedDeliveryDays ?? 0,
          isFreeShipping: dialog.data.isFreeShipping,
        });
        break;
      case "taxRate":
        setEditForm({
          taxName: dialog.data.taxName, rate: dialog.data.rate,
          countryCode: dialog.data.countryCode, stateCode: dialog.data.stateCode,
        });
        break;
    }
  };

  const closeEditDialog = () => {
    setEditDialog(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (!editDialog) return;
    switch (editDialog.type) {
      case "currency":
        currencyMutation.mutate(
          { ...editDialog.data, exchangeRateToUSD: Number(editForm.exchangeRateToUSD) },
          { onSuccess: closeEditDialog },
        );
        break;
      case "carrier":
        carrierMutation.mutate(
          {
            ...editDialog.data,
            name: String(editForm.name), code: String(editForm.code),
            website: String(editForm.website), supportedCountries: String(editForm.supportedCountries),
          },
          { onSuccess: closeEditDialog },
        );
        break;
      case "zone":
        zoneMutation.mutate(
          { ...editDialog.data, name: String(editForm.name), countryCodes: String(editForm.countryCodes) },
          { onSuccess: closeEditDialog },
        );
        break;
      case "rate":
        rateMutation.mutate(
          {
            ...editDialog.data,
            shippingCost: Number(editForm.shippingCost), currency: String(editForm.currency),
            estimatedDeliveryDays: Number(editForm.estimatedDeliveryDays) || null,
            isFreeShipping: Boolean(editForm.isFreeShipping),
          },
          { onSuccess: closeEditDialog },
        );
        break;
      case "taxRate":
        taxRateMutation.mutate(
          {
            ...editDialog.data,
            taxName: String(editForm.taxName), rate: Number(editForm.rate),
            countryCode: String(editForm.countryCode), stateCode: String(editForm.stateCode),
          },
          { onSuccess: closeEditDialog },
        );
        break;
    }
  };

  const isMutating = currencyMutation.isPending || carrierMutation.isPending || zoneMutation.isPending || rateMutation.isPending || taxRateMutation.isPending || paymentMethodMutation.isPending;

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
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
            <Settings className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>

        <Tabs defaultValue="currencies">
          <TabsList className="flex-wrap">
            <TabsTrigger value="currencies" className="gap-1">
              <Coins className="h-3.5 w-3.5" />
              {t("currenciesTab")}
            </TabsTrigger>
            <TabsTrigger value="languages" className="gap-1">
              <Globe2 className="h-3.5 w-3.5" />
              {t("languagesTab")}
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-1">
              <CreditCard className="h-3.5 w-3.5" />
              {t("paymentTab")}
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-1">
              <Truck className="h-3.5 w-3.5" />
              {t("shippingTab")}
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-1">
              <Receipt className="h-3.5 w-3.5" />
              {t("taxTab")}
            </TabsTrigger>
          </TabsList>

          {/* Currencies */}
          <TabsContent value="currencies" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : currencies.length === 0 ? (
              <div className="text-center py-12">
                <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t("noCurrencies")}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currencies.map((cur) => (
                  <Card key={cur.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{cur.symbol}</span>
                          <div>
                            <p className="font-medium">{cur.code}</p>
                            <p className="text-xs text-muted-foreground">{cur.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t("edit")}
                            onClick={() => openEditDialog({ type: "currency", data: cur })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={cur.isActive}
                            onCheckedChange={() => toggleCurrency(cur)}
                            aria-label={cur.isActive ? t("active") : t("inactive")}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        1 USD = {Number(cur.exchangeRateToUSD).toFixed(4)} {cur.code}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Languages */}
          <TabsContent value="languages" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : languages.length === 0 ? (
              <div className="text-center py-12">
                <Globe2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t("noLanguages")}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {languages.map((lang) => (
                  <Card key={lang.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="font-medium">{lang.name}</p>
                          <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                        </div>
                        <div className="flex gap-1">
                          {lang.isDefault && <Badge variant="default">{t("default")}</Badge>}
                          <Badge variant={lang.isActive ? "secondary" : "outline"}>
                            {lang.code.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {lang.isRightToLeft && (
                        <p className="text-xs text-muted-foreground">RTL</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="payment" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t("noPaymentMethods")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((pm) => (
                  <Card key={pm.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{pm.name}</p>
                          <p className="text-sm text-muted-foreground">{pm.description}</p>
                          {pm.supportedCountries && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("countries")}: {pm.supportedCountries}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{pm.code}</Badge>
                          <Switch
                            checked={pm.isActive}
                            onCheckedChange={() => togglePaymentMethod(pm)}
                            aria-label={pm.isActive ? t("active") : t("inactive")}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Shipping */}
          <TabsContent value="shipping" className="mt-4 space-y-6">
            {/* Carriers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {t("carriers")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : carriers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("noCarriers")}</p>
                ) : (
                  <div className="space-y-3">
                    {carriers.map((c) => (
                      <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          {c.website && (
                            <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                              {c.website}
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{c.code}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t("edit")}
                            onClick={() => openEditDialog({ type: "carrier", data: c })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={c.isActive}
                            onCheckedChange={() => toggleCarrier(c)}
                            aria-label={c.isActive ? t("active") : t("inactive")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Zones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t("zones")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : zones.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("noZones")}</p>
                ) : (
                  <div className="space-y-3">
                    {zones.map((z) => (
                      <div key={z.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div>
                          <p className="font-medium text-sm">{z.name}</p>
                          <p className="text-xs text-muted-foreground">{z.countryCodes}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t("edit")}
                            onClick={() => openEditDialog({ type: "zone", data: z })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={z.isActive}
                            onCheckedChange={() => toggleZone(z)}
                            aria-label={z.isActive ? t("active") : t("inactive")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t("rates")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : rates.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("noRates")}</p>
                ) : (
                  <div className="space-y-3">
                    {rates.map((r) => (
                      <div key={r.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div>
                          <p className="font-medium text-sm">
                            {r.isFreeShipping ? t("freeShipping") : `${Number(r.shippingCost).toFixed(2)} ${r.currency}`}
                          </p>
                          {r.estimatedDeliveryDays != null && (
                            <p className="text-xs text-muted-foreground">
                              {r.estimatedDeliveryDays} {t("deliveryDays")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t("edit")}
                            onClick={() => openEditDialog({ type: "rate", data: r })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={r.isActive}
                            onCheckedChange={() => toggleRate(r)}
                            aria-label={r.isActive ? t("active") : t("inactive")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Rates */}
          <TabsContent value="tax" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : taxRates.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t("noTaxRates")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {taxRates.map((tax) => (
                  <Card key={tax.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tax.taxName}</p>
                          <p className="text-sm text-muted-foreground">
                            {tax.countryCode}{tax.stateCode ? ` / ${tax.stateCode}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{Number(tax.rate).toFixed(2)}%</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t("edit")}
                            onClick={() => openEditDialog({ type: "taxRate", data: tax })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={tax.isActive}
                            onCheckedChange={() => toggleTaxRate(tax)}
                            aria-label={tax.isActive ? t("active") : t("inactive")}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog !== null} onOpenChange={(open) => { if (!open) closeEditDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("edit")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {editDialog?.type === "currency" && (
              <div className="space-y-2">
                <Label htmlFor="exchangeRateToUSD">{t("exchangeRate")}</Label>
                <Input
                  id="exchangeRateToUSD"
                  type="number"
                  step="0.0001"
                  value={String(editForm.exchangeRateToUSD ?? "")}
                  onChange={(e) => setEditForm({ ...editForm, exchangeRateToUSD: e.target.value })}
                />
              </div>
            )}

            {editDialog?.type === "carrier" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="carrierName">{t("carrierName")}</Label>
                  <Input
                    id="carrierName"
                    value={String(editForm.name ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrierCode">{t("carrierCode")}</Label>
                  <Input
                    id="carrierCode"
                    value={String(editForm.code ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">{t("website")}</Label>
                  <Input
                    id="website"
                    value={String(editForm.website ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportedCountries">{t("supportedCountries")}</Label>
                  <Input
                    id="supportedCountries"
                    value={String(editForm.supportedCountries ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, supportedCountries: e.target.value })}
                  />
                </div>
              </>
            )}

            {editDialog?.type === "zone" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="zoneName">{t("zoneName")}</Label>
                  <Input
                    id="zoneName"
                    value={String(editForm.name ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryCodes">{t("countryCodes")}</Label>
                  <Input
                    id="countryCodes"
                    value={String(editForm.countryCodes ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, countryCodes: e.target.value })}
                  />
                </div>
              </>
            )}

            {editDialog?.type === "rate" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="shippingCost">{t("shippingCost")}</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.01"
                    value={String(editForm.shippingCost ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, shippingCost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("currenciesTab")}</Label>
                  <Input
                    id="currency"
                    value={String(editForm.currency ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedDeliveryDays">{t("estimatedDeliveryDays")}</Label>
                  <Input
                    id="estimatedDeliveryDays"
                    type="number"
                    value={String(editForm.estimatedDeliveryDays ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, estimatedDeliveryDays: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isFreeShipping"
                    checked={Boolean(editForm.isFreeShipping)}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, isFreeShipping: checked })}
                  />
                  <Label htmlFor="isFreeShipping">{t("freeShipping")}</Label>
                </div>
              </>
            )}

            {editDialog?.type === "taxRate" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="taxName">{t("taxName")}</Label>
                  <Input
                    id="taxName"
                    value={String(editForm.taxName ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, taxName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">{t("taxRate")}</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={String(editForm.rate ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryCode">{t("countryCode")}</Label>
                  <Input
                    id="countryCode"
                    value={String(editForm.countryCode ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, countryCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateCode">{t("stateCode")}</Label>
                  <Input
                    id="stateCode"
                    value={String(editForm.stateCode ?? "")}
                    onChange={(e) => setEditForm({ ...editForm, stateCode: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isMutating}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
