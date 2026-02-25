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
import { locales, type Locale } from "@/i18n/config";

const languageNames: Record<Locale, string> = {
  en: "English",
  tr: "Turkce",
  ar: "Arabic",
  de: "Deutsch",
  es: "Espanol",
  fr: "Francais",
  pt: "Portugues",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  it: "Italiano",
  nl: "Nederlands",
  sv: "Svenska",
  no: "Norsk",
  da: "Dansk",
  fi: "Suomi",
  pl: "Polski",
  cs: "Cestina",
  el: "Greek",
  he: "Hebrew",
  hu: "Magyar",
  ro: "Romana",
  sk: "Slovencina",
  uk: "Ukrainian",
  vi: "Tieng Viet",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  th: "Thai",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  mr: "Marathi",
  fa: "Persian",
  ur: "Urdu",
  bg: "Bulgarian",
  hr: "Hrvatski",
  sr: "Serbian",
  sl: "Slovenscina",
  lt: "Lietuviu",
  lv: "Latviesu",
  et: "Eesti",
  sw: "Kiswahili",
  af: "Afrikaans",
  is: "Islenska",
  ga: "Gaeilge",
  mt: "Malti",
  am: "Amharic",
  hy: "Armenian",
};

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
        <Button variant="outline" size="icon" aria-label={t("language")}>
          <Globe className="h-4 w-4" />
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
