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

### 4. Duplicate Media Upload Componenti
- [ ] `components/features/media-upload.tsx` (856 satir) ve `components/features/upload/MediaUpload.tsx` (621 satir) karsilastir
- [ ] Tek bir bilesende birlestir
- [ ] Kullanilmayan dosyayi sil
- **Effort:** 2-3 saat

### 5. TypeScript `any` Kullanimini Ortadan Kaldir (~46 instance)
- [ ] `app/[locale]/(dashboard)/dashboard/farms/page.tsx` — numeric field cast'leri
- [ ] `app/[locale]/(dashboard)/dashboard/listings/new/page.tsx` — form field cast'leri
- [ ] `app/[locale]/(dashboard)/dashboard/listings/[id]/edit/page.tsx` — product type cast
- [ ] `app/[locale]/(dashboard)/dashboard/categories/page.tsx` — response mapping
- [ ] `app/[locale]/(auth)/register/page.tsx` — country data typing
- [ ] `hooks/queries/useProducts.ts` — generic any type
- [ ] `hooks/queries/useFarms.ts`, `useLocations.ts`, `useProductSubresources.ts`
- [ ] `lib/query-keys.ts` — `Record<string, any>` yerine proper Params tipi
- [ ] `common/livestock-api/src/services/ApiService.ts` — error handling typing
- **Effort:** 3-4 saat

### 6. Eksik React Query Mutation Hooks
- [ ] `useMakeOfferMutation()` olustur — `MakeOfferDialog` icindeki dogrudan API cagrisini degistir
- [ ] `useMediaUpload()` olustur — dosya upload/reorder/cover islemlerini hook'a tasi
- [ ] `useBanners()` olustur — `HomepageBanners` icindeki API cagrisini degistir
- [ ] `useContactFormMutation()` olustur — ContactForm API entegrasyonu tamamlandiginda
- **Dosyalar:**
  - `components/features/make-offer-dialog.tsx`
  - `components/features/upload/MediaUpload.tsx`
  - `components/features/homepage-banners.tsx`
- **Effort:** 3-4 saat

---

## ORTA ONCELIK

### 7. Sessiz Hata Yonetimi (Silent Error Handling)
- [ ] `MediaUpload.tsx` — video processing polling hatalarini kullaniciya bildir
- [ ] `AuthContext.tsx` — logout hatalarini handle et
- [ ] `products/[slug]/page.tsx` — `.catch(() => {})` yerine proper error handling
- [ ] `MakeOfferDialog.tsx` — hata turune gore farkli mesajlar goster
- **Effort:** 2-3 saat

### 8. Production Logging Iyilestirmesi
- [ ] `ApiService.ts` — console.error'lari environment-gated yap
- [ ] Error tracking entegrasyonu kur (Sentry veya LogRocket)
- [ ] Error boundary'lerdeki console.error'lari error tracking'e yonlendir
- **Dosya:** `common/livestock-api/src/services/ApiService.ts`
- **Effort:** 2-3 saat

### 9. Zustand + React Query State Ayristirmasi
- [ ] `useNotificationsStore` — manuel retry/backoff'u React Query retry'a devret
- [ ] `useFavoritesStore` — toggle islemini `useMutation` ile yonet
- [ ] Zustand'i sadece UI state (sidebar acik/kapali vb.) icin kullan
- **Dosyalar:** `stores/useFavoritesStore.ts`, `stores/useNotificationsStore.ts`
- **Effort:** 3-4 saat

### 10. Locale-Aware Routing Duzeltmeleri
- [ ] `livestock-config.ts` — 401 redirect'te locale prefix ekle (`/tr/auth/login`)
- [ ] Dashboard sayfalarindaki hardcoded route'lari next-intl `useRouter` ile degistir
- [ ] `error-display.tsx` — hardcoded `/` yerine locale-aware redirect
- **Dosyalar:**
  - `common/livestock-api/src/config/livestock-config.ts`
  - `components/error/error-display.tsx`
  - `app/[locale]/(auth)/login/page.tsx`
- **Effort:** 2 saat

### 11. Kullanilmayan Dependencies Temizligi
- [ ] `class-variance-authority` — kodda kullanilmiyor, kaldir
- [ ] `radix-ui` (umbrella package) — bireysel `@radix-ui/*` zaten mevcut, kaldir
- [ ] `tw-animate-css` — kullanim dogrula, gerekmiyorsa kaldir
- [ ] `@hello-pangea/dnd` — sadece media-upload'da, alternatif degerlendir
- **Effort:** 30 dakika

### 12. Bos/Orphan Dizin Temizligi
- [ ] `lib/store/` — bos dizin, sil (store'lar `/stores/`'da)
- [ ] `app/(marketplace)/animals/` — bos marketplace dizini, sil veya dokumante et
- [ ] `utils/jwt.ts` — `lib/utils/`'a tasi, tutarlilik sagla
- **Effort:** 15 dakika

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
| 4 | Duplicate MediaUpload birlestirme | Yuksek | 2-3 saat |
| 5 | `any` type temizligi | Yuksek | 3-4 saat |
| 6 | Mutation hooks olusturma | Yuksek | 3-4 saat |
| 7 | Silent error handling | Orta | 2-3 saat |
| 8 | Production logging | Orta | 2-3 saat |
| 9 | Zustand/React Query ayristirma | Orta | 3-4 saat |
| 10 | Locale-aware routing | Orta | 2 saat |
| 11 | Unused dependencies | Orta | 30 dk |
| 12 | Bos dizin temizligi | Orta | 15 dk |
| 13 | Buyuk bilesenleri parcala | Dusuk | 3-4 saat |
| 14 | Tamamlanmamis ozellikler | Dusuk | 2-3 saat |
| 15 | ESLint kural iyilestirmeleri | Dusuk | 30 dk+ |
| 16 | CSP unsafe-eval inceleme | Dusuk | 1-2 saat |
| 17 | Legacy alias temizligi | Dusuk | 1 saat |
| 18 | Query cache optimizasyonu | Dusuk | 1 saat |
