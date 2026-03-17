"use client";

import { useLocale } from "next-intl";
import { useSelectedCountry } from "@/components/layout/country-switcher";
import { useCurrencies } from "@/hooks/queries";

interface PriceDisplayProps {
  price: number;
  currency: string;
  discountedPrice?: number | null;
  showOriginal?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Backend-provided converted price (exchange-rate based or viewer price) */
  convertedPrice?: number | null;
  convertedDiscountedPrice?: number | null;
  convertedCurrencyCode?: string;
  convertedCurrencySymbol?: string;
}

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

function formatPrice(amount: number, symbol: string, locale: string = "tr"): string {
  const formatted = getFormatter(locale).format(Math.round(amount));
  return `${symbol}${formatted}`;
}

export function PriceDisplay({
  price,
  currency,
  discountedPrice,
  showOriginal = true,
  size = "md",
  className = "",
  convertedPrice: backendConvertedPrice,
  convertedDiscountedPrice: backendConvertedDiscountedPrice,
  convertedCurrencyCode: backendConvertedCurrencyCode,
  convertedCurrencySymbol: backendConvertedCurrencySymbol,
}: PriceDisplayProps) {
  const locale = useLocale();
  const selectedCountry = useSelectedCountry();
  const { data: currenciesData } = useCurrencies();
  const targetCurrency = selectedCountry?.defaultCurrencyCode || "USD";

  const currencies = currenciesData ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currencyMap = new Map(currencies.map((c: any) => [c.code, c]));

  const sourceCurrencyInfo = currencyMap.get(currency);
  const targetCurrencyInfo = currencyMap.get(targetCurrency);

  const sourceSymbol = sourceCurrencyInfo?.symbol || currency;
  const targetSymbol = targetCurrencyInfo?.symbol || targetCurrency;

  const displayPrice = discountedPrice ?? price;
  const hasDiscount = discountedPrice != null && discountedPrice < price;

  // Determine converted price: prefer backend-provided, fallback to client-side calculation
  let finalConvertedPrice: number | null = null;
  let finalConvertedSymbol: string = targetSymbol;

  if (
    backendConvertedPrice != null &&
    backendConvertedCurrencyCode &&
    backendConvertedCurrencyCode !== currency
  ) {
    // Use backend-provided converted price
    finalConvertedPrice = hasDiscount && backendConvertedDiscountedPrice != null
      ? backendConvertedDiscountedPrice
      : backendConvertedPrice;
    finalConvertedSymbol = backendConvertedCurrencySymbol || backendConvertedCurrencyCode;
  } else if (
    currency !== targetCurrency &&
    sourceCurrencyInfo &&
    targetCurrencyInfo &&
    sourceCurrencyInfo.exchangeRateToUSD > 0
  ) {
    // Fallback: client-side conversion using exchange rates
    const amountInUSD = displayPrice / sourceCurrencyInfo.exchangeRateToUSD;
    finalConvertedPrice = amountInUSD * targetCurrencyInfo.exchangeRateToUSD;
    finalConvertedSymbol = targetSymbol;
  }

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
          {formatPrice(displayPrice, sourceSymbol, locale)}
        </span>

        {/* Original price if discounted */}
        {hasDiscount && showOriginal && (
          <span
            className={`text-muted-foreground line-through ${originalSizeClasses[size]}`}
          >
            {formatPrice(price, sourceSymbol, locale)}
          </span>
        )}

        {/* Discount percentage */}
        {hasDiscount && (
          <span className="text-xs font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
            -{Math.round(((price - displayPrice) / price) * 100)}%
          </span>
        )}
      </div>

      {/* Converted price in viewer's currency */}
      {finalConvertedPrice !== null && (
        <span className="text-xs text-muted-foreground">
          {"≈ "}{formatPrice(finalConvertedPrice, finalConvertedSymbol, locale)}
        </span>
      )}
    </div>
  );
}
