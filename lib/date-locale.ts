import {
  enUS, tr, arSA, de, es, fr, ru, zhCN,
  ja, ko, it, nl, pl, pt, sv, uk,
  hi, cs, hu, ro, el, vi, id as idLocale, th,
} from "date-fns/locale";
import type { Locale } from "date-fns/locale";

const DATE_LOCALES: Record<string, Locale> = {
  en: enUS,
  tr,
  ar: arSA,
  de,
  es,
  fr,
  ru,
  zh: zhCN,
  ja,
  ko,
  it,
  nl,
  pl,
  pt,
  sv,
  uk,
  hi,
  cs,
  hu,
  ro,
  el,
  vi,
  id: idLocale,
  th,
};

export function getDateLocale(locale: string): Locale {
  return DATE_LOCALES[locale] ?? enUS;
}
