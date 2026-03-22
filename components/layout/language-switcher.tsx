"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Search, Check } from "lucide-react";
import { locales, type Locale, languageNames } from "@/i18n/config";

const popularLocales: Locale[] = ["en", "tr", "ar", "de", "es", "fr", "ru", "zh"];

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("header");
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    setOpen(false);
    setSearch("");
  };

  const lowerSearch = search.toLowerCase();
  const filteredPopular = popularLocales.filter(
    (loc) => languageNames[loc].toLowerCase().includes(lowerSearch) || loc.includes(lowerSearch)
  );
  const filteredOther = locales
    .filter((loc) => !popularLocales.includes(loc))
    .filter((loc) => languageNames[loc].toLowerCase().includes(lowerSearch) || loc.includes(lowerSearch));

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-7 text-xs gap-1.5" aria-label={t("language")}>
          <Globe className="h-3.5 w-3.5" />
          <span>{languageNames[locale as Locale] || locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("searchLanguage")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-7 text-xs"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filteredPopular.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={locale === loc ? "bg-accent" : ""}
            >
              <span className="flex-1">{languageNames[loc]}</span>
              {locale === loc && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
          {filteredPopular.length > 0 && filteredOther.length > 0 && (
            <div className="my-1 border-t" />
          )}
          {filteredOther.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={locale === loc ? "bg-accent" : ""}
            >
              <span className="flex-1">{languageNames[loc]}</span>
              {locale === loc && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
          {filteredPopular.length === 0 && filteredOther.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              {t("noResults")}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
