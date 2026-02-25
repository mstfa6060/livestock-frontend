"use client";

import { useLocale } from "next-intl";
import { useSelectedCountry } from "@/components/layout/country-switcher";

interface PriceDisplayProps {
  price: number;
  currency: string;
  discountedPrice?: number | null;
  showOriginal?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Currency conversion rates (simplified - in production, fetch from API)
const EXCHANGE_RATES: Record<string, number> = {
  TRY: 1,
  USD: 0.029,
  EUR: 0.027,
  GBP: 0.023,
  AED: 0.11,
  SAR: 0.11,
};

// Locale mapping for Intl.NumberFormat
const LOCALE_MAP: Record<string, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  ar: "ar-SA",
  ja: "ja-JP",
  zh: "zh-CN",
  ko: "ko-KR",
  pt: "pt-BR",
  ru: "ru-RU",
  it: "it-IT",
  nl: "nl-NL",
};

// Cache Intl.NumberFormat instances to avoid recreation on every render
const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string): Intl.NumberFormat {
  const intlLocale = LOCALE_MAP[locale] || locale;
  let formatter = formatterCache.get(intlLocale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    formatterCache.set(intlLocale, formatter);
  }
  return formatter;
}

function formatPrice(amount: number, currency: string, locale: string = "tr"): string {
  const symbols: Record<string, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
    SAR: "﷼",
  };

  const symbol = symbols[currency] || currency;
  const formatted = getFormatter(locale).format(amount);

  return `${symbol}${formatted}`;
}

function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;

  // Convert to TRY first, then to target currency
  const inTRY = amount / fromRate;
  return inTRY * toRate;
}

export function PriceDisplay({
  price,
  currency,
  discountedPrice,
  showOriginal = true,
  size = "md",
  className = "",
}: PriceDisplayProps) {
  const locale = useLocale();
  const selectedCountry = useSelectedCountry();
  const targetCurrency = selectedCountry?.defaultCurrencyCode || "TRY";

  const displayPrice = discountedPrice ?? price;
  const hasDiscount = discountedPrice != null && discountedPrice < price;

  // Convert to user's preferred currency if different
  const convertedPrice =
    currency !== targetCurrency
      ? convertPrice(displayPrice, currency, targetCurrency)
      : null;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  const originalSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline gap-2">
        {/* Main price */}
        <span className={`font-bold ${sizeClasses[size]}`}>
          {formatPrice(displayPrice, currency, locale)}
        </span>

        {/* Original price if discounted */}
        {hasDiscount && showOriginal && (
          <span
            className={`text-muted-foreground line-through ${originalSizeClasses[size]}`}
          >
            {formatPrice(price, currency, locale)}
          </span>
        )}

        {/* Discount percentage */}
        {hasDiscount && (
          <span className="text-xs font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
            -{Math.round(((price - displayPrice) / price) * 100)}%
          </span>
        )}
      </div>

      {/* Converted price */}
      {convertedPrice !== null && (
        <span className="text-xs text-muted-foreground">
          ≈ {formatPrice(convertedPrice, targetCurrency, locale)}
        </span>
      )}
    </div>
  );
}
