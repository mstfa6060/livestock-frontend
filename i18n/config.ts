// All supported locales (matching backend error locales)
export const locales = [
  'en', 'tr', 'ar', 'de', 'es', 'fr', 'pt', 'ru', 'zh', 'ja',
  'ko', 'hi', 'it', 'nl', 'sv', 'no', 'da', 'fi', 'pl', 'cs',
  'el', 'he', 'hu', 'ro', 'sk', 'uk', 'vi', 'id', 'ms', 'th',
  'bn', 'ta', 'te', 'mr', 'fa', 'ur', 'bg', 'hr', 'sr', 'sl',
  'lt', 'lv', 'et', 'sw', 'af', 'is', 'ga', 'mt', 'am', 'hy'
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Language names in their native form
export const languageNames: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
  ar: 'العربية',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  hi: 'हिन्दी',
  it: 'Italiano',
  nl: 'Nederlands',
  sv: 'Svenska',
  no: 'Norsk',
  da: 'Dansk',
  fi: 'Suomi',
  pl: 'Polski',
  cs: 'Čeština',
  el: 'Ελληνικά',
  he: 'עברית',
  hu: 'Magyar',
  ro: 'Română',
  sk: 'Slovenčina',
  uk: 'Українська',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  th: 'ไทย',
  bn: 'বাংলা',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  mr: 'मराठी',
  fa: 'فارسی',
  ur: 'اردو',
  bg: 'Български',
  hr: 'Hrvatski',
  sr: 'Српски',
  sl: 'Slovenščina',
  lt: 'Lietuvių',
  lv: 'Latviešu',
  et: 'Eesti',
  sw: 'Kiswahili',
  af: 'Afrikaans',
  is: 'Íslenska',
  ga: 'Gaeilge',
  mt: 'Malti',
  am: 'አማርኛ',
  hy: 'Հայերdelays'
};

// RTL languages
export const rtlLocales: Locale[] = ['ar', 'he', 'fa', 'ur'];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
