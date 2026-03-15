"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { locales, type Locale, languageNames } from "@/i18n/config";

const popularLocales: Locale[] = ["en", "tr", "ar", "de", "es", "fr", "ru", "zh"];

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("header");
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    const segments = pathname.split("/");
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join("/") || "/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-7 text-xs gap-1.5" aria-label={t("language")}>
          <Globe className="h-3.5 w-3.5" />
          <span>{languageNames[locale as Locale] || locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {popularLocales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={locale === loc ? "bg-accent" : ""}
          >
            {languageNames[loc]}
          </DropdownMenuItem>
        ))}
        <div className="my-1 border-t" />
        {locales
          .filter((loc) => !popularLocales.includes(loc))
          .map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={locale === loc ? "bg-accent" : ""}
            >
              {languageNames[loc]}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
