"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useRoles } from "@/hooks/useRoles";
import {
  Coins,
  Globe2,
  CreditCard,
  Truck,
  Receipt,
  MapPin,
  Settings,
  DollarSign,
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
  isActive: boolean;
  supportedCountries: string;
  supportedCurrencies: string;
}

interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  website: string;
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

export default function SystemSettingsPage() {
  const t = useTranslations("systemSettings");
  const { isAdmin } = useRoles();

  const defaultReq = {
    sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending },
    filters: [],
    pageRequest: { currentPage: 1, perPageCount: 100, listAll: false },
  };

  const { data: allSettings, isLoading } = useQuery({
    queryKey: [...queryKeys.systemSettings.all, "all"],
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
          isActive: p.isActive, supportedCountries: p.supportedCountries, supportedCurrencies: p.supportedCurrencies,
        })) as PaymentMethod[] : [],
        carriers: carrRes.status === "fulfilled" ? carrRes.value.map((c) => ({
          id: c.id, name: c.name, code: c.code, website: c.website,
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
                        <Badge variant={cur.isActive ? "default" : "outline"}>
                          {cur.isActive ? t("active") : t("inactive")}
                        </Badge>
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
                          <Badge variant={pm.isActive ? "default" : "outline"}>
                            {pm.isActive ? t("active") : t("inactive")}
                          </Badge>
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
                        <div className="flex gap-2">
                          <Badge variant="outline">{c.code}</Badge>
                          <Badge variant={c.isActive ? "default" : "outline"}>
                            {c.isActive ? t("active") : t("inactive")}
                          </Badge>
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
                        <Badge variant={z.isActive ? "default" : "outline"}>
                          {z.isActive ? t("active") : t("inactive")}
                        </Badge>
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
                        <Badge variant={r.isActive ? "default" : "outline"}>
                          {r.isActive ? t("active") : t("inactive")}
                        </Badge>
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
                          <Badge variant={tax.isActive ? "default" : "outline"}>
                            {tax.isActive ? t("active") : t("inactive")}
                          </Badge>
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
    </DashboardLayout>
  );
}
