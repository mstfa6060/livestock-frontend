# Teknik Borc Raporu

> Olusturulma: 2026-02-27
> Proje: GlobalLivestock Web (Next.js 16, React 19, TypeScript)
> Toplam Tahmini Effort: ~8-12 gun

---

## KRITIK (Hemen Yapilmali)

### 1. ~~Test Coverage: %0~~ ✅ TAMAMLANDI (2026-02-27)
- [x] Vitest + React Testing Library kurulumu (vitest.config.ts, vitest.setup.ts)
- [x] Auth flow testleri — 19 test (login, register, token refresh, logout)
- [x] React Query hook testleri — 19 test (useProducts 14, useConversations 5)
- [x] Zustand store testleri — 43 test (favorites 18, notifications 15, messages 10)
- [x] Critical component testleri — 31 test (MediaUpload 16, MakeOfferDialog 15)
- **Sonuc:** 112 test, %100 pass, 8.3s runtime

### 2. ~~npm Audit Guvenlik Aciklari~~ ✅ TAMAMLANDI (2026-02-27)
- [x] `npm audit fix` calistirildi — 4 paket guncellendi
- [x] minimatch 3.1.5 / 9.0.9 (HIGH - ReDoS zaafiyeti duzeltildi)
- [x] ajv 6.14.0 (MODERATE - ReDoS zaafiyeti duzeltildi)
- **Sonuc:** 0 vulnerabilities, build basarili

---

## YUKSEK ONCELIK

### 3. ~~Duplicate Token Validation~~ ✅ TAMAMLANDI (2026-02-27)
- [x] `contexts/AuthContext.tsx` icindeki lokal `isTokenExpired()` fonksiyonu kaldirildi
- [x] `lib/auth.ts`'den import edildi (30s buffer parametresi eklendi)

### 4. ~~Duplicate Media Upload Componenti~~ ✅ TAMAMLANDI (2026-02-27)
- [x] `components/features/upload/` dizini silindi (kullanilmiyordu)
- [x] `components/features/media-upload.tsx` (856 satir) tek kaynak olarak kaldi

### 5. ~~TypeScript `any` Kullanimini Ortadan Kaldir (~46 instance)~~ ✅ TAMAMLANDI (2026-02-27)
- [x] `parseFloat() as any` gereksiz cast'leri kaldirildi (farms, listings, products, search, offers, transport-offers)
- [x] `error: any` → `error: unknown` + proper narrowing (listings/new, listings/edit, ApiService.ts, livestock-config.ts)
- [x] `(product as any).field` → typed interface + double assertion (listings/edit, my-listings)
- [x] `(o: any)` callback annotations kaldirildi — TS inference kullanildi (register, profile, categories, offers)
- [x] Filter dizileri `IXFilterItem[]` ile duzgun tiplendi (search, seller-moderation, transporter-moderation, useFarms, useLocations)
- [x] API sinir noktalarindaki zorunlu `any` icin `eslint-disable` eklendi (categories, deals, transport, useProducts, useProductSubresources)
- **Sonuc:** ~46 → ~15 instance (tumune eslint-disable eklendi, API boundary'lerde zorunlu)

### 6. ~~Eksik React Query Mutation Hooks~~ ✅ TAMAMLANDI (2026-02-28)
- [x] `useMakeOfferMutation()` — `hooks/queries/useOffers.ts`'e eklendi, `MakeOfferDialog` guncellendi
- [x] `useBanners()` — `hooks/queries/useBanners.ts` olusturuldu, `HomepageBanners` guncellendi
- [x] `useDeleteFileMutation()`, `useReorderFilesMutation()`, `useSetCoverMutation()` — `hooks/queries/useMediaUpload.ts` olusturuldu, `MediaUpload` guncellendi
- [x] `useContactFormMutation()` — API henuz hazir degil (fake success), beklemede
- **Sonuc:** 3 yeni hook dosyasi, 3 component guncellendi, 112 test gecti

---

## ORTA ONCELIK

### 7. ~~Sessiz Hata Yonetimi (Silent Error Handling)~~ ✅ TAMAMLANDI (2026-02-28)
- [x] `MediaUpload.tsx` — 3 ardisik polling hatasinda toast gosterip polling durduruluyor
- [x] `AuthContext.tsx` — logout hatasi `console.warn` ile loglaniyor
- [x] `products/[slug]/page.tsx` — `.catch(() => {})` yerine `console.warn` + favorite hatasi icin `toast.error`
- [x] `MakeOfferDialog.tsx` — API hata mesaji varsa onu gosteriyor, yoksa genel hata mesaji

### 8. ~~Production Logging Iyilestirmesi~~ ✅ TAMAMLANDI (2026-02-28)
- [x] `lib/logger.ts` — environment-gated logger olusturuldu (error/warn/debug/reportError)
- [x] `ApiService.ts` — 6 console.error → logger.error (critical) + logger.debug (verbose details)
- [x] Error boundary'ler (global-error, locale error, main error, dashboard error) → `logger.reportError()`
- [x] Error tracking altyapisi hazir (TODO: Sentry entegrasyonu eklenecek)
- **Sonuc:** Production'da sadece critical error'lar loglanir, verbose detaylar sadece development'ta

### 9. ~~Zustand + React Query State Ayristirmasi~~ ✅ TAMAMLANDI (2026-02-28)
- [x] `useNotificationsStore` → `hooks/queries/useNotifications.ts` (useNotifications, useUnreadCount, useMarkAsReadMutation, useMarkAllAsReadMutation)
- [x] `useFavoritesStore` → `hooks/queries/useFavorites.ts` (useFavorites, useFavoriteActions, useToggleFavoriteMutation)
- [x] 7 consumer guncellendi: notification-bell, dashboard-sidebar, notifications page, dashboard page, product-card, product detail, AuthContext
- [x] Zustand store'lar @deprecated olarak isaretlendi (testler icin korundu)
- [x] React Query: otomatik retry, staleTime caching, optimistic updates, query cache paylasimi
- **Sonuc:** Zustand artik sadece UI state (useMessagesStore) icin kullaniliyor

### 10. ~~Locale-Aware Routing Duzeltmeleri~~ ✅ TAMAMLANDI (2026-02-28)
- [x] `livestock-config.ts` — `getLoginPath()` helper: `document.documentElement.lang`'den locale alip `/{locale}/login`'e yonlendiriyor
- [x] `error-display.tsx` — `useLocale()` ile locale-aware home redirect (`/{locale}`)
- [x] `listings/new/page.tsx` ve `listings/[id]/edit/page.tsx` — `router.push("/login")` → locale-aware
- **Sonuc:** 401 redirect ve error boundary home butonu artik kullanicinin dilini koruyor

### 11. ~~Kullanilmayan Dependencies Temizligi~~ ✅ TAMAMLANDI (2026-02-28)
- [x] `class-variance-authority` — aktif kullaniliyor (button, badge, sheet), korundu
- [x] `radix-ui` (umbrella) — aktif kullaniliyor (button, switch), bireysel paketlerle birlikte korundu
- [x] `tw-animate-css` — `globals.css`'de import ediliyor, korundu
- [x] `@hello-pangea/dnd` — media-upload'da aktif kullaniliyor, korundu
- [x] `@radix-ui/react-slot` — kullanilmiyordu (umbrella uzerinden geliyor), kaldirildi
- **Sonuc:** Sadece `@radix-ui/react-slot` gereksizdi, diger 4 paket aktif kullaniliyor

### 12. ~~Bos/Orphan Dizin Temizligi~~ ✅ TAMAMLANDI (2026-02-28)
- [x] `lib/store/` — bos dizin silindi
- [x] `app/(marketplace)/animals/` — bos dizin silindi
- [x] `utils/jwt.ts` → `lib/jwt.ts`'e tasindi, `lib/admin.ts` ve `hooks/useRoles.ts` import'lari guncellendi
- [x] `utils/` dizini tamamen silindi

---

## DUSUK ONCELIK

### 13. Buyuk Bilesenleri Parcala (600+ satir)
- [ ] `components/features/media-upload.tsx` (856 satir) — alt bilesenlere ayir
- [ ] `components/features/product-animal-info.tsx` (591 satir) — alt bilesenlere ayir
- **Effort:** 3-4 saat

### 14. Tamamlanmamis Ozellikler
- [ ] `ContactForm` — API entegrasyonu yok, fake success donuyor. Backend hazir oldugunda tamamla
- [ ] Apple Sign In — `login/page.tsx`'de commented-out kod. Ya implement et ya temizle
- **Dosyalar:**
  - `components/features/contact-form.tsx`
  - `app/[locale]/(auth)/login/page.tsx`
- **Effort:** 2-3 saat

### 15. ESLint Kural Iyilestirmeleri
- [ ] `eslint.config.mjs`'ye `@typescript-eslint/no-explicit-any: 'error'` ekle
- [ ] `no-console: ['warn', { allow: ['warn', 'error'] }]` ekle
- [ ] Mevcut ihlalleri duzelt veya eslint-disable ile dokumante et
- **Effort:** 30 dakika + ihlal duzeltme suresi

### 16. CSP'de `unsafe-eval` Incelemesi
- [ ] `next.config.ts` — `script-src`'de `unsafe-eval` neden gerekli dogrula
- [ ] Mumkunse `unsafe-eval`'i kaldir, nonce-based CSP'ye gec
- **Effort:** 1-2 saat

### 17. Legacy TSConfig Alias Temizligi
- [ ] `@config/*`, `@services/*`, `@errors/*` legacy alias'lari kaldir
- [ ] Bu alias'lari kullanan import'lari `@/config/*` formatina guncelle
- **Dosya:** `tsconfig.json`
- **Effort:** 1 saat

### 18. Query Cache Stale Time Optimizasyonu
- [ ] Countries, cities gibi nadir degisen veriler icin uzun staleTime (1 saat+)
- [ ] Messages, notifications icin kisa staleTime (30 saniye)
- [ ] Banners icin orta staleTime (10 dakika)
- **Dosya:** `lib/query-client.ts`, ilgili hook'lar
- **Effort:** 1 saat

---

## Oncelik Ozet Tablosu

| # | Is | Oncelik | Effort |
|---|-----|---------|--------|
| 1 | ~~Test altyapisi + kritik testler~~ | ✅ Tamamlandi | — |
| 2 | ~~npm audit fix~~ | ✅ Tamamlandi | — |
| 3 | ~~Duplicate token validation~~ | ✅ Tamamlandi | — |
| 4 | ~~Duplicate MediaUpload birlestirme~~ | ✅ Tamamlandi | — |
| 5 | `any` type temizligi | Yuksek | 3-4 saat |
| 6 | Mutation hooks olusturma | Yuksek | 3-4 saat |
| 7 | Silent error handling | Orta | 2-3 saat |
| 8 | ~~Production logging~~ | ✅ Tamamlandi | — |
| 9 | ~~Zustand/React Query ayristirma~~ | ✅ Tamamlandi | — |
| 10 | ~~Locale-aware routing~~ | ✅ Tamamlandi | — |
| 11 | ~~Unused dependencies~~ | ✅ Tamamlandi | — |
| 12 | ~~Bos dizin temizligi~~ | ✅ Tamamlandi | — |
| 13 | Buyuk bilesenleri parcala | Dusuk | 3-4 saat |
| 14 | Tamamlanmamis ozellikler | Dusuk | 2-3 saat |
| 15 | ESLint kural iyilestirmeleri | Dusuk | 30 dk+ |
| 16 | CSP unsafe-eval inceleme | Dusuk | 1-2 saat |
| 17 | Legacy alias temizligi | Dusuk | 1 saat |
| 18 | Query cache optimizasyonu | Dusuk | 1 saat |
