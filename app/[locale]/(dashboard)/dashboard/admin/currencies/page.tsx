"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/hooks/useRoles";
import { useCurrencies, CurrencyItem } from "@/hooks/queries/useCurrencies";
import {
  DollarSign,
  ShieldAlert,
  Search,
  ArrowUpDown,
  Info,
  Clock,
} from "lucide-react";

// Map currency codes to country flag emojis
const CURRENCY_FLAGS: Record<string, string> = {
  USD: "\u{1F1FA}\u{1F1F8}",
  EUR: "\u{1F1EA}\u{1F1FA}",
  GBP: "\u{1F1EC}\u{1F1E7}",
  TRY: "\u{1F1F9}\u{1F1F7}",
  JPY: "\u{1F1EF}\u{1F1F5}",
  CNY: "\u{1F1E8}\u{1F1F3}",
  KRW: "\u{1F1F0}\u{1F1F7}",
  INR: "\u{1F1EE}\u{1F1F3}",
  BRL: "\u{1F1E7}\u{1F1F7}",
  CAD: "\u{1F1E8}\u{1F1E6}",
  AUD: "\u{1F1E6}\u{1F1FA}",
  CHF: "\u{1F1E8}\u{1F1ED}",
  SEK: "\u{1F1F8}\u{1F1EA}",
  NOK: "\u{1F1F3}\u{1F1F4}",
  DKK: "\u{1F1E9}\u{1F1F0}",
  PLN: "\u{1F1F5}\u{1F1F1}",
  CZK: "\u{1F1E8}\u{1F1FF}",
  HUF: "\u{1F1ED}\u{1F1FA}",
  RON: "\u{1F1F7}\u{1F1F4}",
  BGN: "\u{1F1E7}\u{1F1EC}",
  HRK: "\u{1F1ED}\u{1F1F7}",
  RUB: "\u{1F1F7}\u{1F1FA}",
  UAH: "\u{1F1FA}\u{1F1E6}",
  ZAR: "\u{1F1FF}\u{1F1E6}",
  MXN: "\u{1F1F2}\u{1F1FD}",
  ARS: "\u{1F1E6}\u{1F1F7}",
  CLP: "\u{1F1E8}\u{1F1F1}",
  COP: "\u{1F1E8}\u{1F1F4}",
  PEN: "\u{1F1F5}\u{1F1EA}",
  NZD: "\u{1F1F3}\u{1F1FF}",
  SGD: "\u{1F1F8}\u{1F1EC}",
  HKD: "\u{1F1ED}\u{1F1F0}",
  TWD: "\u{1F1F9}\u{1F1FC}",
  THB: "\u{1F1F9}\u{1F1ED}",
  MYR: "\u{1F1F2}\u{1F1FE}",
  IDR: "\u{1F1EE}\u{1F1E9}",
  PHP: "\u{1F1F5}\u{1F1ED}",
  VND: "\u{1F1FB}\u{1F1F3}",
  AED: "\u{1F1E6}\u{1F1EA}",
  SAR: "\u{1F1F8}\u{1F1E6}",
  QAR: "\u{1F1F6}\u{1F1E6}",
  KWD: "\u{1F1F0}\u{1F1FC}",
  BHD: "\u{1F1E7}\u{1F1ED}",
  OMR: "\u{1F1F4}\u{1F1F2}",
  EGP: "\u{1F1EA}\u{1F1EC}",
  NGN: "\u{1F1F3}\u{1F1EC}",
  KES: "\u{1F1F0}\u{1F1EA}",
  GHS: "\u{1F1EC}\u{1F1ED}",
  PKR: "\u{1F1F5}\u{1F1F0}",
  BDT: "\u{1F1E7}\u{1F1E9}",
  LKR: "\u{1F1F1}\u{1F1F0}",
  ILS: "\u{1F1EE}\u{1F1F1}",
  JOD: "\u{1F1EF}\u{1F1F4}",
  ISK: "\u{1F1EE}\u{1F1F8}",
  GEL: "\u{1F1EC}\u{1F1EA}",
  AZN: "\u{1F1E6}\u{1F1FF}",
  KZT: "\u{1F1F0}\u{1F1FF}",
  UZS: "\u{1F1FA}\u{1F1FF}",
  MAD: "\u{1F1F2}\u{1F1E6}",
  TND: "\u{1F1F9}\u{1F1F3}",
  DZD: "\u{1F1E9}\u{1F1FF}",
  ETB: "\u{1F1EA}\u{1F1F9}",
  TZS: "\u{1F1F9}\u{1F1FF}",
  UGX: "\u{1F1FA}\u{1F1EC}",
  RWF: "\u{1F1F7}\u{1F1FC}",
  XOF: "\u{1F1E8}\u{1F1EE}",
  XAF: "\u{1F1E8}\u{1F1F2}",
  MMK: "\u{1F1F2}\u{1F1F2}",
  KHR: "\u{1F1F0}\u{1F1ED}",
  LAK: "\u{1F1F1}\u{1F1E6}",
};

type SortKey = "code" | "exchangeRateToUSD" | "lastUpdated";
type SortDir = "asc" | "desc";

function getHoursAgo(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
}

function getRelativeTime(dateStr: string, t: ReturnType<typeof useTranslations>): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return t("justNow");
  if (minutes < 60) return t("minutesAgo", { count: minutes });
  if (hours < 24) return t("hoursAgo", { count: hours });
  return t("daysAgo", { count: days });
}

function getFreshnessClass(dateStr: string): string {
  const hours = getHoursAgo(dateStr);
  if (hours < 12) return "text-green-600 dark:text-green-400";
  if (hours < 24) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getFreshnessBadge(
  dateStr: string,
  t: ReturnType<typeof useTranslations>
): { label: string; variant: "default" | "secondary" | "destructive" } {
  const hours = getHoursAgo(dateStr);
  if (hours < 12) return { label: t("recentlyUpdated"), variant: "default" };
  if (hours < 24) return { label: t("stale"), variant: "secondary" };
  return { label: t("veryStale"), variant: "destructive" };
}

export default function CurrencyRatesAdminPage() {
  const t = useTranslations("admin");
  const { isAdmin, isStaff } = useRoles();

  const { data: currencies = [], isLoading } = useCurrencies();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();

    let items = currencies.filter((c: CurrencyItem) => {
      if (!lowerQuery) return true;
      return (
        c.code.toLowerCase().includes(lowerQuery) ||
        c.name.toLowerCase().includes(lowerQuery)
      );
    });

    items = [...items].sort((a: CurrencyItem, b: CurrencyItem) => {
      let cmp = 0;
      switch (sortKey) {
        case "code":
          cmp = a.code.localeCompare(b.code);
          break;
        case "exchangeRateToUSD":
          cmp = Number(a.exchangeRateToUSD) - Number(b.exchangeRateToUSD);
          break;
        case "lastUpdated":
          cmp =
            new Date(a.lastUpdated).getTime() -
            new Date(b.lastUpdated).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [currencies, searchQuery, sortKey, sortDir]);

  const activeCount = currencies.filter((c: CurrencyItem) => c.isActive).length;

  if (!isAdmin && !isStaff) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <ShieldAlert className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("unauthorized")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            {t("exchangeRates")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("exchangeRatesDescription")}
          </p>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t("exchangeRateInfo")}
          </p>
        </div>

        {/* Stats & Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {activeCount}
            </Badge>
            <span>{t("activeCurrencies")}</span>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchCurrency")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Freshness Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            {t("recentlyUpdated")} (&lt; 12h)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />
            {t("stale")} (&gt; 12h)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
            {t("veryStale")} (&gt; 24h)
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noCurrencies")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => handleSort("code")}
                    >
                      {t("currencyCode")}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    {t("currencyName")}
                  </th>
                  <th className="text-center px-4 py-3 font-medium">
                    {t("symbol")}
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    <button
                      className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                      onClick={() => handleSort("exchangeRateToUSD")}
                    >
                      {t("exchangeRate")}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    <button
                      className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                      onClick={() => handleSort("lastUpdated")}
                    >
                      {t("lastUpdated")}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 font-medium">
                    {t("status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((currency: CurrencyItem) => {
                  const flag = CURRENCY_FLAGS[currency.code] || "\u{1F4B1}";
                  const freshness = getFreshnessBadge(currency.lastUpdated, t);
                  const freshnessClass = getFreshnessClass(currency.lastUpdated);

                  return (
                    <tr
                      key={currency.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      {/* Flag/Code */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{flag}</span>
                          <span className="font-mono font-semibold">
                            {currency.code}
                          </span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">{currency.name}</td>

                      {/* Symbol */}
                      <td className="px-4 py-3 text-center font-mono">
                        {currency.symbol}
                      </td>

                      {/* Exchange Rate */}
                      <td className="px-4 py-3 text-right font-mono">
                        {Number(currency.exchangeRateToUSD).toFixed(
                          Number(currency.exchangeRateToUSD) < 1 ? 6 : 4
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock className={`h-3 w-3 ${freshnessClass}`} />
                          <span className={`text-xs ${freshnessClass}`}>
                            {getRelativeTime(currency.lastUpdated, t)}
                          </span>
                        </div>
                        <div className="mt-0.5">
                          <Badge
                            variant={freshness.variant}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {freshness.label}
                          </Badge>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            currency.isActive ? "default" : "destructive"
                          }
                        >
                          {currency.isActive ? t("active") : t("inactive")}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
