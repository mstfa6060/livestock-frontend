# GlobalLivestock Web Frontend - Proje Analiz Dökümanı

> Son güncelleme: 2026-03-07

## 1. Genel Bakış

GlobalLivestock, tarımsal hayvancılık ticareti için çok dilli, çok ülkeli bir marketplace platformudur. Web frontend'i Next.js 16 üzerine inşa edilmiştir.

| Özellik | Değer |
|---------|-------|
| Framework | Next.js 16.1.6 (App Router) |
| React | 19.2.3 |
| TypeScript | 5.9.3 |
| Dil Desteği | 50 dil |
| Styling | Tailwind CSS v4 |
| UI Kit | Shadcn/ui + Radix UI |
| State Mgmt | React Query v5 + Context API |
| Gerçek Zamanlı | SignalR v10 |
| Hata Takibi | Sentry v10 |
| Test | Vitest + Testing Library |

---

## 2. Proje Yapısı

```
web/
├── app/                          # Next.js App Router (sayfa/route'lar)
│   └── [locale]/                 # Dil bazlı routing
│       ├── (main)/               # Public sayfalar
│       ├── (auth)/               # Giriş/Kayıt sayfaları
│       └── (dashboard)/          # Korumalı dashboard sayfaları
├── components/                   # Yeniden kullanılabilir bileşenler
│   ├── layout/                   # Header, footer, sidebar, switcher'lar
│   ├── ui/                       # Shadcn/ui primitive bileşenleri (18+)
│   ├── features/                 # İş mantığı bileşenleri (27+)
│   ├── auth/                     # ProtectedRoute
│   ├── providers/                # React provider'lar
│   └── error/                    # Hata gösterim bileşenleri
├── common/                       # Paylaşılan API client
│   └── livestock-api/src/
│       ├── api/                  # Oto-generate API dosyaları (arf-cli)
│       │   ├── base_modules/iam/ # IAMAPI namespace
│       │   ├── base_modules/FileProvider/ # FileProviderAPI namespace
│       │   └── business_modules/livestocktrading/ # LivestockTradingAPI namespace
│       ├── config/               # Axios setup, interceptors
│       ├── services/             # ApiService wrapper
│       └── errors/               # Hata kodu çevirileri
├── contexts/                     # React Context (AuthContext)
├── hooks/                        # Custom hook'lar
│   └── queries/                  # React Query hook'ları (20+)
├── lib/                          # Utility fonksiyonlar
│   ├── auth.ts                   # JWT decode, rol kontrolü
│   ├── query-keys.ts             # React Query key factory
│   ├── query-client.ts           # Query client config
│   ├── validations.ts            # Zod şemaları
│   ├── utils.ts                  # cn() ve yardımcılar
│   └── chat/ChatService.ts       # SignalR chat servisi
├── constants/                    # Sabitler (roller)
├── i18n/                         # next-intl konfigürasyonu
├── messages/                     # 50 dil JSON dosyası
├── scripts/                      # Build ve çeviri script'leri
├── _doc/                         # Dökümanlar
└── __tests__/                    # Test dosyaları
```

**Dosya İstatistikleri:**
- TypeScript/TSX dosyaları: ~286
- Sayfa (page.tsx): 47
- Bileşen: 50+
- Query hook: 20+
- Dil dosyası: 50

---

## 3. Sayfa ve Route Haritası

### 3.1 Public Sayfalar `(main)`

| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/` | `(main)/page.tsx` | Ana sayfa (ürün listeleri, kategoriler, banner'lar) |
| `/products` | `(main)/products/page.tsx` | Ürün arama/filtreleme |
| `/products/[slug]` | `(main)/products/[slug]/page.tsx` | Ürün detay |
| `/sellers` | `(main)/sellers/page.tsx` | Satıcı listesi |
| `/sellers/[id]` | `(main)/sellers/[id]/page.tsx` | Satıcı profili |
| `/transporters` | `(main)/transporters/page.tsx` | Nakliyeci listesi |
| `/transporters/[id]` | `(main)/transporters/[id]/page.tsx` | Nakliyeci profili |
| `/search` | `(main)/search/page.tsx` | Arama sonuçları |
| `/faq` | `(main)/faq/page.tsx` | SSS |
| `/about` | `(main)/about/page.tsx` | Hakkında |
| `/contact` | `(main)/contact/page.tsx` | İletişim |
| `/privacy` | `(main)/privacy/page.tsx` | Gizlilik politikası |
| `/terms` | `(main)/terms/page.tsx` | Kullanım şartları |

### 3.2 Auth Sayfaları `(auth)`

| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/login` | `(auth)/login/page.tsx` | Giriş (native, Google, Apple) |
| `/register` | `(auth)/register/page.tsx` | Kayıt |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | Şifre sıfırlama talebi |
| `/reset-password` | `(auth)/reset-password/page.tsx` | Şifre sıfırlama |

### 3.3 Dashboard Sayfaları `(dashboard)` — Korumalı

#### Genel
| Route | Açıklama | Rol |
|-------|----------|-----|
| `/dashboard` | Dashboard ana sayfa | Tüm |
| `/dashboard/profile` | Profil yönetimi | Tüm |
| `/dashboard/notifications` | Bildirimler | Tüm |
| `/dashboard/messages` | Mesajlaşma listesi | Tüm |
| `/dashboard/messages/[conversationId]` | Konuşma detayı | Tüm |
| `/dashboard/favorites` | Favori ürünler | Tüm |
| `/dashboard/settings` | Ayarlar | Tüm |

#### Satıcı (Seller)
| Route | Açıklama | Rol |
|-------|----------|-----|
| `/dashboard/become-seller` | Satıcı olma | Buyer |
| `/dashboard/my-listings` | İlan listesi | Seller |
| `/dashboard/listings/new` | Yeni ilan oluştur | Seller |
| `/dashboard/listings/[id]/edit` | İlan düzenle | Seller |
| `/dashboard/offers` | Teklifler (gelen/giden) | Seller, Buyer |
| `/dashboard/farms` | Çiftlik yönetimi | Seller |
| `/dashboard/locations` | Konum yönetimi | Seller |

#### Admin/Moderator
| Route | Açıklama | Rol |
|-------|----------|-----|
| `/dashboard/moderation` | Ürün moderasyonu | Admin, Moderator |
| `/dashboard/seller-moderation` | Satıcı doğrulama | Admin, Moderator |
| `/dashboard/transporter-moderation` | Nakliyeci doğrulama | Admin, Moderator |
| `/dashboard/system-settings` | Sistem ayarları | Admin |
| `/dashboard/categories` | Kategori yönetimi | Admin, Moderator |
| `/dashboard/categories/new` | Kategori oluştur | Admin, Moderator |
| `/dashboard/categories/[id]/edit` | Kategori düzenle | Admin, Moderator |
| `/dashboard/brands` | Marka yönetimi | Admin, Moderator |
| `/dashboard/deals` | Anlaşma yönetimi | Admin, Moderator |

#### Sağlık & Nakliye
| Route | Açıklama | Rol |
|-------|----------|-----|
| `/dashboard/health-records` | Sağlık kayıtları | Seller, Vet |
| `/dashboard/vaccinations` | Aşı kayıtları | Seller, Vet |
| `/dashboard/transport` | Nakliye talepleri | Transporter |
| `/dashboard/transport-offers` | Nakliye teklifleri | Transporter |
| `/dashboard/shipping-carriers` | Taşıyıcı yönetimi | Admin |
| `/dashboard/shipping-zones` | Sevkiyat bölgeleri | Admin |
| `/dashboard/shipping-rates` | Kargo ücretleri | Admin |

---

## 4. Tech Stack Detayları

### 4.1 UI Framework & Bileşenler

**Shadcn/ui Bileşenleri** (`components/ui/`):
`button`, `input`, `dialog`, `select`, `tabs`, `dropdown-menu`, `alert-dialog`, `avatar`, `badge`, `checkbox`, `label`, `textarea`, `card`, `separator`, `progress`, `skeleton`, `switch`, `sheet`, `scroll-area`

**Feature Bileşenleri** (`components/features/`):
- **Ürün**: `product-card`, `product-reviews`, `product-prices`, `product-variants`, `product-animal-info/`, `featured-products`
- **Ana Sayfa**: `homepage-categories`, `homepage-banners`, `price-display`
- **Marketplace**: `seller-card`, `seller-reviews`, `transporter-reviews`, `make-offer-dialog`, `request-transport-dialog`
- **Medya**: `media-upload/` (drag-drop, progress), `image-gallery` (lightbox), `icon-upload`
- **Diğer**: `contact-form`, `recently-viewed-products`, `push-permission`, `transport-tracking`

**Layout Bileşenleri** (`components/layout/`):
`main-header`, `footer`, `dashboard-layout`, `dashboard-sidebar`, `language-switcher`, `country-switcher`, `notification-bell`

### 4.2 State Management

**React Query v5 Konfigürasyonu** (`lib/query-client.ts`):
- Stale Time: 5 dakika
- Cache Time: 10 dakika
- Retry: 1 (sadece query, mutation yok)
- Window focus'ta refetch kapalı

**Query Key Factory** (`lib/query-keys.ts` - 237 satır):
```typescript
queryKeys = {
  products:       { all, lists, list(filters), search, details, detail(id), reviews, variants, prices, animalInfo, vetInfo },
  categories:     { all, list(locale), pick(locale), detail(id, locale) },
  sellers:        { all, lists, list(params), details, detail(id), byUserId(userId), reviews(sellerId) },
  offers:         { all, sent(params), received(params) },
  conversations:  { all, lists, list(params), detail(id) },
  messages:       { all, list(conversationId), unreadCount() },
  transporters:   { all, lists, list(params), details, detail(id), reviews },
  farms:          { all, lists, list(params) },
  locations:      { all, lists, list(params) },
  favorites:      { all, list(params), check(productId) },
  notifications:  { all, list(params), unreadCount() },
  brands:         { all, list(params), pick() },
  banners:        { all, list(params) },
  currencies:     { all, list(), detail(code) },
  countries:      { all, list(), detail(id) },
  dashboard:      { stats(params), recentActivity(params) },
  searchHistory:  { all, list(params) },
  deals:          { all, list(params), detail(id) },
  // ... 20+ entity
}
```

**Custom Query Hook'ları** (`hooks/queries/`):
| Hook | Açıklama |
|------|----------|
| `useProducts` | Ürün listesi, arama, detay |
| `useCategories` | Kategoriler (locale destekli) |
| `useSellers` | Satıcı bilgileri ve yorumları |
| `useOffers` | Teklifler (gelen/giden) |
| `useConversations` | Chat konuşmaları |
| `useFavorites` | Favori ürünler |
| `useLocations` | Konum yönetimi |
| `useFarms` | Çiftlik yönetimi |
| `useBrands` | Marka verileri |
| `useBanners` | Promosyon banner'ları |
| `useNotifications` | Kullanıcı bildirimleri |
| `useIAM` | Kullanıcı profili, ülkeler |
| `useDashboard` | Dashboard istatistikleri |
| `useMediaUpload` | Dosya yükleme (progress ile) |
| `useShipping` | Kargo bilgileri |
| `useTransporterQueries` | Nakliyeci verileri |
| `useVeterinary` | Sağlık kayıtları, aşılar |
| `useProductSubresources` | Yorumlar, fiyatlar, görseller |
| `useContactForm` | İletişim formu |
| `useChat` | SignalR mesajlaşma |
| `useRoles` | Rol bazlı erişim kontrolü |

### 4.3 Kimlik Doğrulama (Authentication)

**AuthContext** (`contexts/AuthContext.tsx`):
```typescript
interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  isPhoneVerified: boolean;
  countryId: number;
  countryCode: string;
  countryName: string;
  language: string;
  currencyCode: string;
  currencySymbol: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(params): Promise<void>;
  loginWithSocial(params): Promise<void>;
  register(params): Promise<void>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
  updateUserData(data: Partial<User>): void;
}
```

**Token Yönetimi:**
- JWT, AccessToken, RefreshToken → `localStorage`
- Auth cookie (`auth-token`) → Next.js middleware için (30 gün)
- Otomatik token yenileme (401 interceptor + kuyruk mekanizması)
- 30 sn buffer ile süre dolma kontrolü

**Giriş Sağlayıcıları:**
- `native` — E-posta/şifre
- `google` — Google OAuth
- `apple` — Apple Sign-In

**Rol Sabitleri** (`constants/roles.ts`):
```typescript
Roles.Admin          // "LivestockTrading.Admin"
Roles.Moderator      // "LivestockTrading.Moderator"
Roles.Support        // "LivestockTrading.Support"
Roles.Seller         // "LivestockTrading.Seller"
Roles.Transporter    // "LivestockTrading.Transporter"
Roles.Buyer          // "LivestockTrading.Buyer"
Roles.Veterinarian   // "LivestockTrading.Veterinarian"
```

**Rol Grupları:**
- `AdminRoles` → [Admin]
- `StaffRoles` → [Admin, Moderator, Support]
- `SellerRoles` → [Admin, Moderator, Seller]
- `TransporterRoles` → [Admin, Moderator, Transporter]

### 4.4 Middleware (Route Koruması)

**Korumalı Prefix'ler:** `/dashboard`, `/settings` → giriş yapılmamışsa `/login?callbackUrl=...`

**Auth Sayfaları:** `/login`, `/register`, `/forgot-password`, `/reset-password` → giriş yapılmışsa `/dashboard`'a yönlendir

---

## 5. API Entegrasyon Katmanı

### 5.1 API Client Yapısı

Tüm API client dosyaları `arf-cli` ile otomatik oluşturulur. **Manuel düzenleme YAPILMAZ.**

| Namespace | Dosya | Satır | Açıklama |
|-----------|-------|-------|----------|
| `IAMAPI` | `base_modules/iam/index.ts` | 610 | Auth, Users, Countries, Roles |
| `FileProviderAPI` | `base_modules/FileProvider/index.ts` | 223 | Dosya işlemleri |
| `LivestockTradingAPI` | `business_modules/livestocktrading/index.ts` | 7,693 | 38+ entity CRUD |

### 5.2 URL Konfigürasyonu

**Dosya:** `common/livestock-api/src/config/livestock-config.ts`

| Ortam | Base URL |
|-------|----------|
| Dev | `https://dev-api.livestock-trading.com` |
| Prod | `https://api.livestock-trading.com` |

| Modül | Dev URL | Prod URL |
|-------|---------|----------|
| IAM | `/iam/{endpoint}` | `/iam/{endpoint}` |
| LivestockTrading | `/livestocktrading/{endpoint}` | `/{endpoint}` (Gateway) |
| FileProvider | `/fileprovider/{endpoint}` | `/fileprovider/{endpoint}` |
| File Storage | `/file-storage/{path}` | `/file-storage/{path}` |

### 5.3 HTTP Interceptor'lar

**Request:**
1. `addAuthToken` — `Authorization: Bearer {jwt}` enjekte eder
2. `fixIamUrl` — IAM endpoint path'lerini lowercase yapar

**Response:**
1. `handle401` — Otomatik token yenileme + kuyruk mekanizması
   - Eş zamanlı refresh girişimlerini önler
   - Başarısız istekleri yenileme sonrasına kuyruklar
   - Yenileme başarısız olursa login sayfasına yönlendirir

### 5.4 ApiService

**Dosya:** `common/livestock-api/src/services/ApiService.ts` (308 satır)

| Method | Kullanım |
|--------|----------|
| `call<T>(promise)` | Tüm oto-generate endpoint'ler |
| `callMultipart<T>(url, formData, config)` | Dosya yükleme |
| `request<T>(config)` | Genel Axios isteği |

**Hata Kodu Çevirisi:**
1. Backend hata kodu alınır (ör: `CategoryNameRequired`)
2. Modül-spesifik çeviri dosyasından karşılığı aranır
3. Bulunamazsa Common çevirilerinden aranır
4. O da yoksa ham kod döndürülür
5. Varsayılan dil: Türkçe (locale'e göre dinamik yükleme)

### 5.5 LivestockTrading API Modülleri (38+ Entity)

**Hayvan/Tarım:**
AnimalInfos, VeterinaryInfos, FeedInfos, SeedInfos, MachineryInfos, ChemicalInfos

**Ürün:**
Products, ProductVariants, ProductPrices, ProductReviews, ProductViewHistories

**Satıcı:**
Sellers, SellerReviews, SellerDocuments

**Alışveriş:**
FavoriteProducts, Offers, Deals

**Mesajlaşma:**
Conversations, Messages (SendTypingIndicator dahil)

**Konum & Coğrafya:**
Locations, Farms

**Nakliye:**
Transporters, TransportRequests, TransportOffers, TransportTrackings, TransporterReviews

**Katalog:**
Categories, Brands, FAQs, Banners, Languages

**Sistem:**
Currencies, TaxRates, PaymentMethods, ShippingZones, ShippingCarriers, ShippingRates

**Kullanıcı:**
UserPreferences, Preferences, Notifications, SearchHistories, Dashboard, HealthRecords, Vaccinations

Her entity standart CRUD pattern'ı izler: `Pick`, `Detail`, `All`, `Create`, `Update`, `Delete` + özel endpoint'ler (`Search`, `Verify`, `Approve`, `Reject`, `Suspend`, vb.)

---

## 6. Gerçek Zamanlı Mesajlaşma (SignalR)

### 6.1 Chat Servisi

**Dosya:** `lib/chat/ChatService.ts` (175 satır)

**Hub URL:** `{baseUrl}/livestocktrading/hubs/chat`

**Bağlantı:**
```typescript
new signalR.HubConnectionBuilder()
  .withUrl(hubUrl, { accessTokenFactory: () => jwt })
  .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
  .build();
```

### 6.2 Event'ler

**Client → Server:**
| Method | Açıklama |
|--------|----------|
| `JoinConversation(conversationId)` | Konuşmaya katıl |
| `LeaveConversation(conversationId)` | Konuşmadan ayrıl |
| `SendTypingIndicator(conversationId, isTyping)` | Yazıyor göstergesi |
| `MarkMessageAsRead(messageId)` | Okundu işaretle |
| `GetOnlineUsers(userIds[])` | Online durumu sorgula |

**Server → Client:**
| Event | Açıklama |
|-------|----------|
| `ReceiveMessage(message)` | Yeni mesaj |
| `TypingIndicator(indicator)` | Yazıyor göstergesi |
| `MessageRead(data)` | Okundu bilgisi |
| `UserOnline(userId)` | Kullanıcı çevrimiçi |
| `UserOffline(userId)` | Kullanıcı çevrimdışı |

### 6.3 useChat Hook

**Dosya:** `hooks/useChat.ts` (161 satır)

- Bağlantı yaşam döngüsü yönetimi
- Mount'ta otomatik konuşmaya katılma
- 2 saniyelik debounce ile yazıyor göstergesi
- Yazan kullanıcılar haritası takibi
- UI'da mesajları okundu işaretleme

---

## 7. Dosya Yükleme

### 7.1 Upload Bileşeni

**Dosya:** `components/features/icon-upload.tsx` (139 satır)

```typescript
// FormData yapısı
formData.append("formFile", file);
formData.append("moduleName", "LivestockTrading");
formData.append("bucketType", FileProviderAPI.Enums.BucketTypes.SingleFileBucket);
formData.append("folderName", "categories");
formData.append("versionName", "v1");
formData.append("companyId", AppConfig.companyId);

// Endpoint
POST /fileprovider/Files/Upload
```

### 7.2 Media Upload (Çoklu)

**Dosya:** `components/features/media-upload/`
- `index.tsx` — Ana upload bileşeni
- `drop-zone.tsx` — Sürükle-bırak alanı
- `media-card.tsx` — Medya önizleme kartı
- `upload-progress-item.tsx` — Yükleme ilerleme göstergesi

### 7.3 Image Gallery

**Dosya:** `components/features/image-gallery.tsx` (214 satır)
- Next.js Image ile lazy loading
- Thumbnail carousel (scroll ile)
- Lightbox modal (Arrow tuşları, Escape)
- Placeholder fallback

---

## 8. Uluslararasılaştırma (i18n)

### 8.1 Konfigürasyon

- Framework: `next-intl` v4.7.0
- Varsayılan dil: İngilizce (`en`)
- Kaynak dil: Türkçe (`tr`)
- RTL desteği: Arapça, İbranice, Farsça, Urduca

### 8.2 Desteklenen Diller (50)

`en`, `tr`, `ar`, `de`, `es`, `fr`, `it`, `pt`, `ru`, `zh`, `ja`, `ko`, `hi`, `bn`, `nl`, `pl`, `sv`, `no`, `da`, `fi`, `cs`, `sk`, `hu`, `ro`, `bg`, `hr`, `sr`, `sl`, `uk`, `el`, `he`, `fa`, `ur`, `th`, `vi`, `id`, `ms`, `tl`, `sw`, `am`, `ha`, `ig`, `yo`, `zu`, `af`, `sq`, `mk`, `ka`, `az`, `uz`

### 8.3 Çeviri Dosyaları

- Konum: `/messages/{locale}.json`
- Format: İç içe JSON namespace'ler

**Namespace'ler:** `common`, `auth`, `dashboard`, `products`, `sellers`, `transporters`, `categories`, `farms`, `locations`, `offers`, `messages`, `notifications`, `settings`, `moderation`, `errors`, vb.

### 8.4 Çeviri Script'leri

```bash
npm run translate:all       # tr.json → 50 dile çevir (Google Cloud Translate)
npm run translate:missing   # Sadece yeni key'leri çevir
npm run translate -- [locale]  # Belirli dile çevir
```

---

## 9. Form Validasyon

**Dosya:** `lib/validations.ts` (294 satır)

| Şema | Kurallar |
|------|----------|
| `emailSchema` | E-posta formatı + normalizasyon |
| `phoneSchema` | Uluslararası telefon regex |
| `passwordSchema` | 8+ karakter, büyük/küçük harf, rakam, özel karakter |
| `usernameSchema` | 3-30 karakter, alfanumerik |

Hata mesajları Türkçe olarak tanımlanmış, i18n ile diğer dillere çevrilir.

---

## 10. Güvenlik

### 10.1 Security Headers (next.config.ts)

| Header | Değer |
|--------|-------|
| `Strict-Transport-Security` | max-age=63072000; includeSubDomains; preload |
| `X-Frame-Options` | SAMEORIGIN |
| `X-Content-Type-Options` | nosniff |
| `Referrer-Policy` | origin-when-cross-origin |
| `Permissions-Policy` | camera/microphone kapalı |
| `Content-Security-Policy` | Strict CSP (Google OAuth, MinIO, Sentry izinli) |
| `X-DNS-Prefetch-Control` | on |

### 10.2 Route Koruması

1. **Middleware** — Sunucu tarafında auth cookie kontrolü
2. **ProtectedRoute** — Client tarafında bileşen wrapper'ı
3. **Rol kontrolü** — `useRoles` hook ile sayfa içi erişim

---

## 11. Build & Deployment

### 11.1 Script'ler

```bash
npm run dev:start        # Port 3000'i kill et, temizle, dev başlat
npm run dev              # Dev server başlat
npm run build            # Production build
npm run start            # Production server başlat
npm run lint             # ESLint çalıştır
npm run test             # Vitest çalıştır
npm run test:run         # Tek seferlik test
npm run test:coverage    # Coverage raporu
```

### 11.2 Environment Variables

```env
NEXT_PUBLIC_ENVIRONMENT=development          # dev/prod API URL switch
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...            # Google OAuth client ID
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=...       # Google Maps API key
NEXT_PUBLIC_DEFAULT_COMPANY_ID=...          # Company UUID
GOOGLE_TRANSLATE_API_KEY=...                # i18n çeviri API
NEXT_PUBLIC_SENTRY_DSN=...                  # Hata takibi
SENTRY_AUTH_TOKEN=...                       # Sentry auth
```

### 11.3 Next.js Konfigürasyonu

- Output: `standalone` (Docker optimizasyonu)
- Sentry entegrasyonu + source map upload
- Uzak görsel pattern'ları: MinIO, harici CDN
- Import optimizasyonu: `lucide-react`, `date-fns`, `@radix-ui`

---

## 12. Hata Yönetimi

### 12.1 API Hata Formatı

```typescript
{
  payload: T,
  hasError: boolean,
  error: {
    message?: string,    // Backend hata açıklaması
    code?: string        // Lokalizasyon için hata kodu
  }
}
```

### 12.2 Hata Boundary'leri

| Dosya | Kapsam |
|-------|--------|
| `app/global-error.tsx` | Global hata yakalama |
| `app/[locale]/error.tsx` | Locale-seviye hata |
| `app/[locale]/(dashboard)/error.tsx` | Dashboard hataları |
| `app/[locale]/(main)/error.tsx` | Public sayfa hataları |
| `components/error/error-display.tsx` | Hata gösterim UI |

### 12.3 Toast Bildirimleri

Sonner kütüphanesi ile:
- `toast.success()` — Başarılı işlem
- `toast.error()` — Hata mesajı
- Otomatik süre dolma

---

## 13. Backend ile Entegrasyon Akışları

### 13.1 Ürün Oluşturma (Satıcı)

```
1. Login → JWT token al
2. Location oluştur (Locations/Create)
3. Farm oluştur (Farms/Create → LocationId zorunlu)
4. Ürün oluştur (Products/Create → SellerId, CategoryId, LocationId zorunlu)
5. Görsel yükle (FileProvider/Files/Upload → bucketId al)
6. Ürün güncelle (Products/Update → imageUrl ekle)
7. Onaya gönder (Products/SubmitForApproval → status: PendingApproval)
```

### 13.2 Ürün Moderasyonu (Admin)

```
1. Bekleyen ürünleri listele (Products/All → filter: status=PendingApproval)
2. Onayla (Products/Approve) veya Reddet (Products/Reject → reason)
```

### 13.3 Teklif Akışı

```
1. Alıcı teklif verir (Offers/Create → productId, amount)
2. Satıcı teklifleri görür (Offers/All → filter: sellerId)
3. Satıcı kabul/red eder (Offers/Update → status)
4. Kabul edilirse Deal oluşur
```

### 13.4 Mesajlaşma

```
1. SignalR Hub'a bağlan (JWT ile)
2. Konuşma başlat (Conversations/Create)
3. JoinConversation(conversationId) çağır
4. Mesaj gönder (Messages/Create) → ReceiveMessage event tetiklenir
5. Yazıyor göstergesi (SendTypingIndicator)
6. Okundu işaretle (MarkMessageAsRead)
```

---

## 14. Mevcut Dökümanlar

| Dosya | Açıklama |
|-------|----------|
| `CLAUDE.md` | Geliştirici talimatları, build komutları, mimari |
| `common/API-INTEGRATION.md` | API kullanım rehberi (auth, CRUD, dosya yükleme, SignalR) |
| `_doc/WEB-PROJECT-ANALYSIS.md` | Bu döküman |

---

## 15. Bağımlılıklar (Önemli)

| Paket | Versiyon | Kullanım |
|-------|----------|----------|
| next | 16.1.6 | Framework |
| react | 19.2.3 | UI |
| typescript | 5.9.3 | Tip güvenliği |
| @tanstack/react-query | ^5 | Server state |
| next-intl | 4.7.0 | i18n |
| @microsoft/signalr | ^10.0.0 | Real-time |
| axios | - | HTTP client |
| zod | 4.3.5 | Validasyon |
| react-hook-form | 7.71.1 | Form yönetimi |
| @sentry/nextjs | ^10.42.0 | Hata takibi |
| tailwindcss | v4 | Styling |
| @radix-ui/* | - | UI primitives |
| sonner | - | Toast |
| lucide-react | - | İkonlar |
| vitest | - | Test |
