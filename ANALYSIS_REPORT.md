# GlobalLivestock Web Projesi - Kapsamlı Analiz Raporu

## 1. PROJE YAPISI VE TEKNOLOJİ YIĞINI

### 1.1 Framework ve Teknolojiler
- **Framework**: Next.js 16.1.6 (React 19.2.3)
- **Routing**: Next.js App Router (modern routing)
- **State Management**:
  - Zustand (lightweight store) - `lib/store/`, `stores/`
  - React Query v5 (TanStack) - data fetching ve caching
  - React Context API - AuthContext
- **UI Framework**: Radix UI + Tailwind CSS 4
- **Form Validation**: React Hook Form + Zod
- **Real-Time**: Microsoft SignalR (@microsoft/signalr ^10.0.0)
- **API Client**: Auto-generated TypeScript (`common/livestock-api/`)
- **i18n**: next-intl (40 dil desteği)
- **Dosya Yönetimi**: Axios + FormData
- **Notifikasyonlar**: Sonner (toast)
- **Animation**: lucide-react, tw-animate-css
- **Build**: TypeScript 5.9.3, ESLint 9

### 1.2 Proje Dizin Yapısı
```
D:/Projects/GlobalLivestock/web/
├── app/                           # Next.js 16 App Router
│   ├── [locale]/                  # Locale dynamic segment
│   │   ├── (auth)/                # Auth route group (public)
│   │   ├── (main)/                # Main marketplace (public)
│   │   ├── (dashboard)/           # Protected dashboard
│   │   └── layout.tsx             # Root layout
│   └── layout.tsx                 # Global layout
├── common/
│   └── livestock-api/             # Auto-generated API client
│       ├── src/
│       │   ├── api/               # API endpoint definitions
│       │   │   ├── base_modules/
│       │   │   │   ├── iam/       # Auth API
│       │   │   │   └── FileProvider/  # File upload API
│       │   │   └── business_modules/
│       │   │       └── livestocktrading/  # Business API
│       │   ├── config/
│       │   │   └── livestock-config.ts   # Axios config + interceptors
│       │   ├── services/
│       │   │   └── ApiService.ts  # Error handling + multipart upload
│       │   └── errors/            # 40 lang error locales
│       └── tsconfig.json          # Separate TS config
├── components/
│   ├── auth/                      # Login/Register components
│   ├── features/                  # Feature components
│   │   └── upload/                # File upload components
│   ├── layout/                    # Layout components (dashboard-layout, etc.)
│   ├── providers/                 # Context/Query providers
│   ├── ui/                        # Radix UI wrappers (button, input, etc.)
│   ├── error/                     # Error boundaries
│   └── debug/                     # Debug components
├── contexts/
│   └── AuthContext.tsx            # User auth state + login/register
├── hooks/
│   ├── queries/                   # React Query hooks (data fetching)
│   │   ├── useBrands.ts
│   │   ├── useCategories.ts
│   │   ├── useConversations.ts
│   │   ├── useDashboard.ts        # Stats queries
│   │   ├── useFarms.ts
│   │   ├── useIAM.ts
│   │   ├── useLocations.ts
│   │   ├── useOffers.ts
│   │   ├── useProducts.ts
│   │   ├── useProductSubresources.ts  # Images, prices, reviews, etc.
│   │   ├── useSellers.ts
│   │   └── useTransporterQueries.ts
│   ├── useChat.ts                 # SignalR chat hook
│   └── useRoles.ts                # Role-based access control
├── stores/
│   ├── useFavoritesStore.ts       # Favorite products (Zustand)
│   ├── useMessagesStore.ts        # Message state
│   └── useNotificationsStore.ts   # Notifications
├── lib/
│   ├── chat/
│   │   └── ChatService.ts         # SignalR connection management
│   ├── store/                     # Zustand store utilities
│   ├── utils/
│   │   └── imageCompression.ts    # Image optimization
│   ├── admin.ts                   # Admin/staff role detection
│   ├── auth.ts                    # Auth utilities
│   ├── date-locale.ts             # Locale-aware date formatting
│   ├── product-images.ts          # Product image handling
│   ├── query-client.ts            # TanStack Query config
│   ├── query-keys.ts              # Standardized query key factories
│   ├── validations.ts             # Zod schemas for forms
│   └── utils.ts                   # General utilities
├── utils/                         # Legacy utilities folder
├── i18n/
│   └── config.ts                  # 40 language configs + RTL detection
├── messages/                      # Translation files (40 JSON files)
│   ├── tr.json                    # Turkish (1443 lines)
│   ├── en.json                    # English
│   ├── ar.json                    # Arabic (RTL)
│   └── ... (37 more)
├── constants/                     # App constants
├── _doc/                          # Documentation
├── public/                        # Static assets
├── scripts/
│   ├── dev-start.js               # Development startup script
│   └── translate-all.js           # i18n translation script
├── package.json                   # Dependencies
├── next.config.mjs                # Next.js config
├── tsconfig.json                  # TypeScript config
└── .env.example                   # Environment template
```

---

## 2. SAYFA YAPISI VE ROUTE'LAR

### 2.1 Kimlik Doğrulama Sayfaları (Public)
**Route Grubu**: `app/[locale]/(auth)/`

| Sayfa | Path | Durum | Açıklama |
|-------|------|-------|----------|
| Login | `/login` | ✅ Hazır | Email/password, sosyal login (Google), "remember me", şifre recovery |
| Register | `/register` | ✅ Hazır | Email, password, firstName, surname, phoneNumber, country, language, currency selection |
| Forgot Password | `/forgot-password` | ✅ Hazır | Email girerek reset link talebinde bulunma |
| Reset Password | `/reset-password` | ✅ Hazır | Token ile yeni şifre belirleme |
| Loading | `/loading` | ✅ | Skeleton loading state |

**API Endpoints Kullanılan**:
- `IAMAPI.Auth.Login` - Email/password login
- `IAMAPI.Auth.VerifyOtp` - OTP doğrulaması
- `IAMAPI.Auth.SendOtp` - OTP gönderme
- `IAMAPI.Auth.LoginWithSocial` - Google/Apple oauth
- `IAMAPI.Users.Create` - Registration
- `IAMAPI.Auth.ForgotPassword` - Reset link gönderme
- `IAMAPI.Auth.ResetPassword` - Reset password
- `IAMAPI.Auth.RefreshToken` - Token refresh (interceptor'da otomatik)

**Kimlik Doğrulama Mekanizması**:
- JWT token storage: `localStorage` (accessToken, jwt, refreshToken)
- Token refresh: Axios interceptor otomatik 401 handling
- AuthContext ile global user state
- ProtectedRoute pattern var mı? **KONTROL GEREKLI** ⚠️

### 2.2 Ana Sayfa ve Genel Sayfalar (Public)
**Route Grubu**: `app/[locale]/(main)/`

| Sayfa | Path | Durum | Açıklama |
|-------|------|-------|----------|
| Ana Sayfa | `/` | ✅ Hazır | Ürünler listesi, featured products |
| Ürünler | `/products` | ✅ Hazır | Ürün marketplace, filtreleme, search |
| Ürün Detayı | `/products/[slug]` | ✅ Hazır | Tek ürün detayı, reviews, images |
| Satıcılar | `/sellers` | ✅ Hazır | Satıcı listesi |
| Satıcı Profili | `/sellers/[id]` | ✅ Hazır | Satıcı detayı, ürünleri |
| Nakliyeciler | `/transporters` | ✅ Hazır | Transporter listesi |
| Nakliyeci Profili | `/transporters/[id]` | ✅ Hazır | Transporter detayı |
| Arama | `/search` | ✅ Hazır | Global search |
| Hakkımızda | `/about` | ✅ Hazır | Static content |
| İletişim | `/contact` | ✅ Hazır | Contact form |
| SSS | `/faq` | ✅ Hazır | FAQ listesi |
| Gizlilik Politikası | `/privacy` | ✅ Hazır | Static content |
| Kullanım Şartları | `/terms` | ✅ Hazır | Static content |
| Loading | `/loading` | ✅ | Skeleton loading |
| Error | `/error` | ✅ | Error boundary |

**API Endpoints Kullanılan**:
- `LivestockTradingAPI.Products.All` - Ürün listesi (pagination, sorting, filtering)
- `LivestockTradingAPI.Products.Detail` - Tek ürün
- `LivestockTradingAPI.Products.DetailBySlug` - Slug ile ürün
- `LivestockTradingAPI.Products.Search` - Arama
- `LivestockTradingAPI.Sellers.All` - Satıcı listesi
- `LivestockTradingAPI.Sellers.Detail` - Satıcı detayı
- `LivestockTradingAPI.Sellers.GetByUserId` - Kullanıcı satıcı
- `LivestockTradingAPI.Transporters.All` - Transporter listesi
- `LivestockTradingAPI.Transporters.Detail` - Transporter detayı
- `LivestockTradingAPI.ProductReviews.All` - Ürün reviews
- `LivestockTradingAPI.FAQs.All` - FAQ listesi

### 2.3 Dashboard Sayfaları (Protected)
**Route Grubu**: `app/[locale]/(dashboard)/dashboard/` | Requires: Authentication + Role check

#### 2.3.1 Temel Dashboard Sayfaları

| Sayfa | Path | Rol | Durum | Açıklama |
|-------|------|-----|-------|----------|
| Dashboard Home | `/dashboard` | Any | ✅ Hazır | Stats, quick actions |
| Profil | `/profile` | Any | ✅ Hazır | User profile edit |
| Ayarlar | `/settings` | Any | ✅ Hazır | Account settings |
| Sistem Ayarları | `/system-settings` | Any | 🟡 TODO | Theme, language, etc. |
| Bildirimler | `/notifications` | Any | ✅ Hazır | Notification history |

**API Endpoints**:
- `IAMAPI.Users.Detail` - User info
- `IAMAPI.Users.Update` - Update user
- `LivestockTradingAPI.Notifications.All` - Notification listesi
- `LivestockTradingAPI.Dashboard.MyStats` - User stats

#### 2.3.2 Favoriler ve Mesajlaşma

| Sayfa | Path | Rol | Durum | Açıklama |
|-------|------|-----|-------|----------|
| Favoriler | `/favorites` | Any | ✅ Hazır | Favorite products list |
| Mesajlar | `/messages` | Any | ✅ Hazır | Conversation listesi |
| Mesaj Detayı | `/messages/[conversationId]` | Any | ✅ Hazır | Real-time chat (SignalR) |

**API Endpoints & SignalR**:
- `LivestockTradingAPI.FavoriteProducts.All` - Favorites
- `LivestockTradingAPI.FavoriteProducts.Create` - Add favorite
- `LivestockTradingAPI.FavoriteProducts.Delete` - Remove favorite
- `LivestockTradingAPI.Conversations.All` - Conversation listesi
- `LivestockTradingAPI.Conversations.Detail` - Conversation detayı
- `LivestockTradingAPI.Messages.All` - Mesaj listesi
- `LivestockTradingAPI.Messages.Create` - Mesaj gönder
- `LivestockTradingAPI.Messages.Update` - Mark as read
- `LivestockTradingAPI.Messages.SendTypingIndicator` - Typing indicator
- **SignalR Hub**: `/livestocktrading/hubs/chat`
  - Methods: JoinConversation, LeaveConversation, SendTypingIndicator, MarkMessageAsRead
  - Events: ReceiveMessage, TypingIndicator, MessageRead, UserOnline, UserOffline

#### 2.3.3 Satıcı İşlemleri (Seller Role Required)

| Sayfa | Path | Rol | Durum | Açıklama |
|-------|------|-----|-------|----------|
| Satıcı Olma | `/become-seller` | Buyer→Seller | 🟡 TODO | Seller registration form |
| Kendi İlanlarım | `/my-listings` | Seller | ✅ Hazır | Seller's own products |
| Yeni İlan | `/listings/new` | Seller | 🟡 TODO | Create new product listing |
| İlan Düzenle | `/listings/[id]/edit` | Seller | 🟡 TODO | Edit existing product |
| Çiftlikler | `/farms` | Seller | 🟡 TODO | Farm management |
| Konumlar | `/locations` | Seller | 🟡 TODO | Location management |
| Fiyatlandırma | (implicitly used) | Seller | ✅ Hazır | Product prices (subresource) |

**API Endpoints**:
- `LivestockTradingAPI.Sellers.Create` - Become seller
- `LivestockTradingAPI.Sellers.Detail` - Seller detayı
- `LivestockTradingAPI.Sellers.All` - Sellers list
- `LivestockTradingAPI.Sellers.Verify` - Verify seller (Admin/Moderator)
- `LivestockTradingAPI.Sellers.Suspend` - Suspend seller (Admin/Moderator)
- `LivestockTradingAPI.Sellers.Update` - Update seller
- `LivestockTradingAPI.Products.All` - Seller's products
- `LivestockTradingAPI.Products.Create` - Create product
- `LivestockTradingAPI.Products.Update` - Update product
- `LivestockTradingAPI.Products.Delete` - Delete product
- `LivestockTradingAPI.ProductImages.All/Create/Update/Delete` - Image management
- `LivestockTradingAPI.ProductPrices.All/Create/Update/Delete` - Price management
- `LivestockTradingAPI.Farms.All/Create/Update/Delete` - Farm CRUD
- `LivestockTradingAPI.Locations.All/Create/Update/Delete` - Location CRUD

#### 2.3.4 Moderasyon Paneli (Admin/Moderator Role Required)

| Sayfa | Path | Rol | Durum | Açıklama |
|-------|------|-----|-------|----------|
| Moderasyon | `/moderation` | Admin, Moderator | ✅ Hazır | Pending products review |
| Kategoriler | `/categories` | Admin, Moderator | ✅ Hazır | Category management |
| Yeni Kategori | `/categories/new` | Admin, Moderator | ✅ Hazır | Create category |
| Kategori Düzenle | `/categories/[id]/edit` | Admin, Moderator | ✅ Hazır | Edit category |
| Markalar | `/brands` | Admin, Moderator | ✅ Hazır | Brand management |

**API Endpoints**:
- `LivestockTradingAPI.Products.All` - All products (filter by status=pending)
- `LivestockTradingAPI.Products.Approve` - Approve product
- `LivestockTradingAPI.Products.Reject` - Reject product
- `LivestockTradingAPI.Categories.All/Create/Update/Delete` - Category CRUD
- `LivestockTradingAPI.Brands.All/Create/Update/Delete` - Brand CRUD

#### 2.3.5 Nakliye ve Teklifleri (Transporter + Buyer)

| Sayfa | Path | Rol | Durum | Açıklama |
|-------|------|-----|-------|----------|
| Nakliye Talepleri | `/transport` | Buyer | ✅ Hazır | Transport requests |
| Nakliye Teklifleri | `/transport-offers` | Transporter, Buyer | ✅ Hazır | Transport offers |
| Teklifler | `/offers` | Any | ✅ Hazır | General offers (products) |
| İşlemler | `/deals` | Buyer | ✅ Hazır | Purchase deals |

**API Endpoints**:
- `LivestockTradingAPI.TransportRequests.All/Create/Update/Delete` - Transport request CRUD
- `LivestockTradingAPI.TransportOffers.All/Create/Update/Delete` - Transport offer CRUD
- `LivestockTradingAPI.Offers.All/Create/Update/Delete` - Product offers
- `LivestockTradingAPI.Deals.All/Create/Update/Delete` - Deals

### 2.4 i18n Routing
- Tüm sayfalarda URL başında `[locale]` parametresi: `/tr/products`, `/en/sellers`, etc.
- 40 dil destekleniyor: tr, en, ar, de, es, fr, pt, ru, zh, ja, ko, hi, it, nl, sv, no, da, fi, pl, cs, el, he, hu, ro, sk, uk, vi, id, ms, th, bn, ta, te, mr, fa, ur, bg, hr, sr, sl, lt, lv, et, sw, af, is, ga, mt, am, hy
- RTL Diller: ar, he, fa, ur
- Locale auto-detection + manual switching

---

## 3. API ENTEGRASYONU

### 3.1 API Client Yapısı (Auto-Generated)
**Konum**: `common/livestock-api/src/api/`

```
business_modules/
  └── livestocktrading/
      ├── AnimalInfos (Pick, Detail, All, Create, Update, Delete)
      ├── Banners (Pick, Detail, All, Create, Update, Delete)
      ├── Brands (Pick, Detail, All, Create, Update, Delete)
      ├── Categories (Pick, Detail, All, Create, Update, Delete)
      ├── ChemicalInfos (Pick, Detail, All, Create, Update, Delete)
      ├── Conversations (Pick, Detail, All, Create, Update, Delete, StartWithProduct)
      ├── Currencies (Pick, Detail, All, Create, Update, Delete)
      ├── Dashboard (Stats, MyStats)
      ├── Deals (Pick, Detail, All, Create, Update, Delete)
      ├── FavoriteProducts (Pick, Detail, All, Create, Update, Delete)
      ├── FAQs (Pick, Detail, All, Create, Update, Delete)
      ├── FeedInfos (Pick, Detail, All, Create, Update, Delete)
      ├── Farms (Pick, Detail, All, Create, Update, Delete)
      ├── HealthRecords (Pick, Detail, All, Create, Update, Delete)
      ├── Languages (Pick, Detail, All, Create, Update, Delete)
      ├── Locations (Pick, Detail, All, Create, Update, Delete)
      ├── MachineryInfos (Pick, Detail, All, Create, Update, Delete)
      ├── Messages (Pick, Detail, All, Create, Update, Delete, UnreadCount, SendTypingIndicator)
      ├── Notifications (Pick, Detail, All, Create, Update, Delete)
      ├── Offers (Pick, Detail, All, Create, Update, Delete)
      ├── PaymentMethods (Pick, Detail, All, Create, Update, Delete)
      ├── Preferences (My, Update)
      ├── ProductImages (Pick, Detail, All, Create, Update, Delete, Duplicate, Copy)
      ├── ProductPrices (Pick, Detail, All, Create, Update, Delete)
      ├── ProductReviews (Pick, Detail, All, Create, Update, Delete)
      ├── ProductVariants (Pick, Detail, All, Create, Update, Delete)
      ├── ProductViewHistories (Pick, Detail, All, Create, Update, Delete)
      ├── Products (Search, Pick, Detail, DetailBySlug, MediaDetail, All, Create, Update, Delete, Approve, Reject)
      ├── SeedInfos (Pick, Detail, All, Create, Update, Delete)
      ├── SearchHistories (Pick, Detail, All, Create, Update, Delete)
      ├── SellerReviews (Pick, Detail, All, Create, Update, Delete)
      ├── Sellers (Pick, Detail, All, Create, Update, Delete, Verify, Suspend, GetByUserId, DetailByUserId)
      ├── ShippingCarriers (Pick, Detail, All, Create, Update, Delete)
      ├── ShippingRates (Pick, Detail, All, Create, Update, Delete)
      ├── ShippingZones (Pick, Detail, All, Create, Update, Delete)
      ├── TaxRates (Pick, Detail, All, Create, Update, Delete)
      ├── TransporterReviews (Pick, Detail, All, Create, Update, Delete)
      ├── Transporters (Pick, Detail, All, Create, Update, Delete, Verify, Suspend)
      ├── TransportOffers (Pick, Detail, All, Create, Update, Delete)
      ├── TransportRequests (Pick, Detail, All, Create, Update, Delete)
      └── TransportTrackings (Pick, Detail, All, Create, Update, Delete)

base_modules/
  ├── iam/
  │   ├── Auth (Login, VerifyOtp, SendOtp, Update, UpdatePassword, Delete, Create, ResetPassword, ForgotPassword, RevokeRefreshToken, RefreshToken, Logout)
  │   ├── Countries (GetByCode, All)
  │   ├── Districts (ByProvince, Detail, All, Create)
  │   ├── Geo (Detect)
  │   ├── MobilApplicationVersiyon (GetVersion)
  │   ├── Neighborhoods (ByDistrict, Detail, All, Create)
  │   ├── Provinces (All)
  │   ├── Roles (All, Update)
  │   ├── UserPermissions (My, All)
  │   ├── UserPreferences (Pick, Detail, All, Create)2
  │   ├── Users (Detail, DetailByUserId, All, Create, Update, Delete)
  │   ├── Vaccinations (Pick, Detail, All, Create, Update, Delete)
  │   └── Push (RegisterToken)
  │
  └── FileProvider/
      ├── Files (Pick, Detail, All, Create, Update, Delete)
      ├── Buckets (Detail)
      └── Upload endpoints (UploadEyp, UploadToApprovedBucket)
```

### 3.2 HTTP Endpoints Kullanım Özeti

**Total Active Endpoints**: ~80+ (Pick, Detail, All, Create, Update, Delete patterns)

**CRUD Pattern**:
- **All**: `POST /Entity/All` - Liste (pagination, sorting, filtering)
- **Pick**: `POST /Entity/Pick` - Dropdown/Select listesi (limited fields)
- **Detail**: `POST /Entity/Detail` - Tek kayıt
- **Create**: `POST /Entity/Create` - Yeni kayıt
- **Update**: `POST /Entity/Update` - Güncelleme
- **Delete**: `POST /Entity/Delete` - Soft delete

**Special Endpoints**:
- **Search**: `POST /Products/Search` - Full-text search
- **Approve/Reject**: `POST /Products/Approve`, `POST /Products/Reject` (Moderator)
- **Verify/Suspend**: `POST /Sellers/Verify`, `POST /Sellers/Suspend` (Moderator)
- **DetailBySlug**: `POST /Products/DetailBySlug` - URL-friendly product lookup
- **GetOnlineUsers**: SignalR Hub method (real-time)

### 3.3 Veri Filtreleme (Multi-Country)
Listeleme endpoint'lerinde `countryCode` parametresi:
```typescript
{
  countryCode: "TR",  // ISO 3166-1 alpha-2
  sorting: { key: "createdAt", direction: "Descending" },
  filters: [...],
  pageRequest: { currentPage: 1, perPageCount: 20, listAll: false }
}
```

### 3.4 Dil Desteği (i18n)
Kategoriler ve global entity'ler `NameTranslations`, `DescriptionTranslations` JSON formatında:
```json
{
  "name": "Livestock",
  "nameTranslations": "{\"en\":\"Livestock\",\"tr\":\"Hayvancılık\",\"ar\":\"الثروة الحيوانية\"}"
}
```

---

## 4. KİMLİK DOĞRULAMA VE YETKİLENDİRME

### 4.1 Authentication Akışı
1. **Login**:
   ```typescript
   IAMAPI.Auth.Login({ email, password, platform: 0 })
   → { jwt, refreshToken }
   ```
   - Token'lar `localStorage`'a kaydedilir
   - AuthContext ile global state yönetimi

2. **Token Refresh**:
   - Axios interceptor otomatik 401 handling
   - RefreshToken ile yeni JWT alınır
   - Başarısızsa user login sayfasına yönlendirilir

3. **Social Login**:
   - Google OAuth: `@react-oauth/google`
   - Apple Sign-In: (API hazır, frontend UI tamamlanması gerekiyor)
   - `IAMAPI.Auth.LoginWithSocial({ provider, token, externalUserId })`

4. **OTP Flow**:
   - `IAMAPI.Auth.SendOtp({ email })`
   - `IAMAPI.Auth.VerifyOtp({ email, otp })`

### 4.2 Role-Based Access Control (RBAC)

**7 Temel Rol** (backend'de tanımlı):
| Rol | ID | Yetkileri |
|-----|--|----|
| Admin | a1000000-0000-0000-0000-000000000001 | Tam yetki |
| Moderator | a1000000-0000-0000-0000-000000000002 | Content review, approval |
| Support | a1000000-0000-0000-0000-000000000003 | Customer support |
| Seller | a1000000-0000-0000-0000-000000000004 | Ürün satışı, farm yönetimi |
| Transporter | a1000000-0000-0000-0000-000000000005 | Nakliye hizmetleri |
| Buyer | a1000000-0000-0000-0000-000000000006 | Ürün satın alma (default) |
| Veterinarian | a1000000-0000-0000-0000-000000000007 | Veteriner hizmetleri |

**Frontend Rol Kontrolü**:
- `lib/admin.ts`: `isAdmin()`, `isStaff()` helper'ları
- `hooks/useRoles.ts`: `isAdmin`, `isStaff`, `isSeller`, vb.
- Dashboard pages'de: `if (!isAdmin && !isStaff) return <UnauthorizedUI>`

**Örnek - Moderation Page**:
```typescript
const { isAdmin, isStaff } = useRoles();
if (!isAdmin && !isStaff) {
  return <div>{t("unauthorized")}</div>;
}
```

### 4.3 Protected Routes Mekanizması
**ÖNEMLİ**: Protected route wrapper aranması gerekiyor! 🔍

Şu anda `(dashboard)` grup altındaki sayfaları tanımlı:
- `/dashboard` - Kimlik doğrulama gerekli
- Fakat **explicit ProtectedRoute component yoktur**

**KONU**: `AuthContext`'ten `isLoading` kontrolü yapılıyor mu? ⚠️

---

## 5. REAL-TIME MESAJLAŞMA (SignalR)

### 5.1 ChatService Implementasyonu
**Konum**: `lib/chat/ChatService.ts`

```typescript
class ChatService {
  // Singleton pattern
  connect()  // Hub'a bağlan
  disconnect()  // Hub'dan ayrıl

  // Hub Methods (Client → Server)
  joinConversation(conversationId)
  leaveConversation(conversationId)
  sendTypingIndicator(conversationId, isTyping)
  markMessageAsRead(messageId)
  getOnlineUsers(userIds[])

  // Hub Events (Server → Client)
  onReceiveMessage(callback)  // Yeni mesaj
  onTypingIndicator(callback)  // Yazıyor göstergesi
  onMessageRead(callback)  // Mesaj okundu
  onUserOnline(callback)  // Kullanıcı çevrimiçi
  onUserOffline(callback)  // Kullanıcı çevrimdışı
}
```

**Hub URL**: `/livestocktrading/hubs/chat`

**Autentikasyon**: JWT token AccessToken olarak gönderilir

### 5.2 Messaging Pages
- **Messages List**: `/messages` - Conversation listesi
- **Chat UI**: `/messages/[conversationId]` - Real-time chat
- **API**: `LivestockTradingAPI.Messages.*`, `Conversations.*`

### 5.3 Online Status Tracking
`PresenceService` backend'de implemente edilmiş (Redis ile)

Frontend'de: `useChat` hook ile dinleme yapılıyor

---

## 6. DOSYA YÜKLEME (FileProvider + MinIO)

### 6.1 Upload Mekanizması
- **API**: `FileProviderAPI.Files.Upload`, `UploadToApprovedBucket`
- **MinIO**:
  - Dev: `9010` (API), `9011` (Console)
  - Prod: `9020` (API), `9021` (Console)
  - Buckets: `livestocktrading-dev`, `livestocktrading-production`
  - Policy: `public-read` (download)

### 6.2 Product Images
**Konum**: `lib/product-images.ts`

```typescript
// Image compression before upload
await compressImage(file)  // imageCompression util
// Upload via multipart
FileProviderAPI.Files.Upload(formData)
```

**Subresource**: `ProductImages` (All, Pick, Detail, Create, Update, Delete, Duplicate, Copy)

### 6.3 File Serving
**Nginx Proxy** (Server'da):
```nginx
location /file-storage/ {
  proxy_pass http://minio:9000/;
}
```
→ Nginx doğrudan MinIO'ya proxy yapar (API Gateway'i bypass eder)

---

## 7. STATE MANAGEMENT

### 7.1 React Query (TanStack Query)
**Query Hooks**: `hooks/queries/`
- `useProducts()` - Products listing
- `useCategories()` - Categories
- `useBrands()` - Brands
- `useFarms()` - Farms
- `useConversations()` - Messaging
- `useOffers()` - Offers
- `useProductSubresources()` - Images, Prices, Reviews (nested queries)
- `useDashboard()` - Stats

**Query Key Factory**: `lib/query-keys.ts`
```typescript
queryKeys.products.lists()
queryKeys.products.detail(id)
queryKeys.categories.all()
// etc.
```

### 7.2 Zustand Stores
**Konum**: `stores/`

| Store | Amaç |
|-------|------|
| `useFavoritesStore` | Favorite products (optimistic UI) |
| `useMessagesStore` | Message state, unread count |
| `useNotificationsStore` | Push notifications, notifications count |

### 7.3 React Context
- **AuthContext** (`contexts/AuthContext.tsx`): User state, login/logout, token management
- Provides: `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `refreshUser()`

---

## 8. SAYFA DURUM TABLOSU (Güncellenme: 2026-03-03)

### 8.1 Tamamlanan Sayfalar (✅)

| Sayfa | Path | Rol | Durum |
|-------|------|-----|-------|
| Satıcı Olma | `/become-seller` | Buyer | ✅ Tam implement, çeviriler eklendi |
| Yeni İlan | `/listings/new` | Seller | ✅ Tam implement, seller lookup bug düzeltildi |
| İlan Düzenle | `/listings/[id]/edit` | Seller | ✅ Tam implement |
| Çiftlikler | `/farms` | Seller | ✅ Tam implement, 6 farm tipi destekli |
| Konumlar | `/locations` | Seller | ✅ Tam implement, CRUD + konum tipleri |
| Sistem Ayarları | `/system-settings` | Admin | ✅ 5 tab (currencies, languages, payment, shipping, tax) |
| Kategoriler | `/categories` | Admin | ✅ Tam CRUD |
| Markalar | `/brands` | Admin | ✅ Tam CRUD |
| Ürün Moderasyonu | `/moderation` | Admin/Mod | ✅ Approve/Reject |
| Satıcı Moderasyonu | `/seller-moderation` | Admin/Mod | ✅ Verify/Suspend, status badge düzeltildi |
| Nakliyeci Moderasyonu | `/transporter-moderation` | Admin/Mod | ✅ Verify/Suspend |
| Kargo Firmaları | `/shipping-carriers` | Admin | ✅ Tam CRUD |
| Kargo Bölgeleri | `/shipping-zones` | Admin | ✅ Tam CRUD |
| Kargo Ücretleri | `/shipping-rates` | Admin | ✅ Tam CRUD, zone/carrier picker |
| Sağlık Kayıtları | `/health-records` | Seller/Vet | ✅ Tam CRUD |
| Aşı Kayıtları | `/vaccinations` | Seller/Vet | ✅ Tam CRUD, renk kodlu tarihler |
| Protected Routes | middleware.ts | - | ✅ Locale-aware auth redirect |
| Push Notifications | service worker | - | ✅ SW + izin UI + token kayıt |

### 8.2 Gelecek İyileştirmeler (Opsiyonel)

- Generic CRUD table component (tekrarlı kod azaltma)
- Advanced analytics dashboard
- Payment entegrasyonu UI
- Gelişmiş arama filtreleri

---

## 9. EKSEN TEKNOLOJİLER VE ÖZELLIKLER

### 9.1 i18n (Uluslararasılaştırma)
- **next-intl**: 40 dil desteği
- **Messages**: `messages/[locale].json` (tr.json = 1443 satır)
- **RTL Support**: ar, he, fa, ur
- **Translation Script**: `scripts/translate-all.js` (Google Translate API)

### 9.2 UI Components
- **Radix UI**: Accessible, unstyled components
- **Tailwind CSS 4**: Styling
- **lucide-react**: Icons
- **Sonner**: Toast notifications
- **react-hook-form**: Form state management
- **Zod**: Schema validation

### 9.3 Özel Utilities
- `lib/validations.ts`: Zod schemas (becomeSellerFormSchema, etc.)
- `lib/date-locale.ts`: Locale-aware date formatting
- `lib/product-images.ts`: Image compression + upload
- `lib/utils.ts`: Common utilities
- `lib/auth.ts`: Auth helpers

### 9.4 Debugging Tools
- React Query DevTools: `@tanstack/react-query-devtools`
- Console logging: API errors, SignalR events
- `components/debug/` folder (boş, debug UI'lar eklenebilir)

---

## 10. PERFORMANS VE OPTIMIZASYON

### 10.1 Caching Strategy
- React Query default cache: 5 minutes
- Custom cache time: `staleTime` ve `cacheTime` props
- Axios interceptor: Token refresh caching

### 10.2 Image Optimization
- `lib/utils/imageCompression.ts`: Client-side compression
- Next.js `Image` component: ✅ Kullanılıyor (product-card, image-gallery, homepage-banners, seller sayfaları)
- MinIO public-read policy: Direct CDN-like access

### 10.3 Code Splitting
- Next.js App Router: Automatic route-based splitting
- Dynamic imports: Next.js App Router otomatik route-based splitting sağlıyor

---

## 11. FRONT-END WORKFLOW VE BEST PRACTICES

### 11.1 Component Organizasyonu
```
components/
├── auth/           # Auth-related UI (LoginForm, RegisterForm)
├── features/       # Feature-specific components
├── layout/         # Layout wrappers (DashboardLayout)
├── providers/      # Context + Query providers
├── ui/             # Reusable UI (Button, Input, Card, etc.)
└── error/          # Error boundaries
```

### 11.2 Sayfa Dizaynı Pattern
```typescript
"use client";  // Client component

// 1. Imports
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

// 2. Layout wrapper
export default function Page() {
  return (
    <DashboardLayout>
      {/* Content */}
    </DashboardLayout>
  );
}
```

### 11.3 Data Fetching Pattern
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.products.lists(),
  queryFn: () => LivestockTradingAPI.Products.All.Request(params),
});
```

### 11.4 Error Handling
- Try-catch blokları
- Toast notifications (sonner)
- Error boundaries (`components/error/`)
- API error mapping (error code → translated message)

---

## 12. ENTEGRASYON DURUMU VE NOTLAR

### 12.1 ✅ ÇÖZÜLEN PROBLEMLER (2026-03-03)

1. **Protected Routes**: ✅ `middleware.ts` ile locale-aware auth redirect eklendi
   - Dashboard/settings rotaları korunuyor, `auth-token` cookie ile kontrol
   - `AuthContext.tsx`'e cookie sync eklendi (server-side auth detection)

2. **Admin Panel**: ✅ Seller/Transporter moderation sayfaları tam
   - `/seller-moderation`: Verify/Suspend + status filtering
   - `/transporter-moderation`: Verify/Suspend + status filtering

3. **Push Notifications**: ✅ Service worker + izin UI + token kayıt
   - `public/sw.js`: Push event handling + notification click
   - `push-permission.tsx`: Kullanıcı izin banner'ı
   - `IAMAPI.Push.RegisterToken` entegrasyonu

4. **Shipping Management**: ✅ 3 CRUD sayfası (carriers, zones, rates)

5. **Veterinarian Module**: ✅ Health records + vaccinations sayfaları

6. **Image Optimization**: ✅ Homepage banners `next/image` ile düzeltildi

### 12.2 ⚠️ DİKKAT EDİLECEKLER

1. **Real-Time Chat**: SignalR connection management - network failures handling minimal
2. **Multi-Country Filtering**: countryCode parametresi tüm list endpoint'lerinde kullanılmalı
3. **ShippingRates decimal types**: API code generator `__ERROR_TYPE_NOT_HANDLED__` üretmiş, `as any` workaround kullanılıyor

### 12.3 ℹ️ İPUÇLARI

1. **SignalR Reconnection**: Otomatik reconnect (0, 2s, 5s, 10s, 30s)
2. **API Error Codes**: `common/livestock-api/src/errors/` (40 dil)
3. **Sidebar rol filtreleme**: `requiredRoles` property ile menü görünürlüğü kontrol ediliyor

---

## 13. BACKEND İLE KARŞILAŞTIRMA (Güncellenme: 2026-03-03)

### 13.1 Tam Uyumlu (✅)
✅ **CRUD Endpoints**: All, Detail, Pick, Create, Update, Delete patterns
✅ **Role-Based Access**: 7 temel rol, sidebar rol filtreleme
✅ **Multi-Country Filtering**: countryCode parametresi
✅ **Real-Time Chat**: SignalR Hub, Message endpoints
✅ **File Upload**: FileProvider, MinIO integration
✅ **i18n**: 50+ dil, translation exports
✅ **Moderasyon**: Products Approve/Reject + Sellers/Transporters Verify/Suspend
✅ **Protected Routes**: middleware.ts ile auth + locale-aware redirects
✅ **Push Notifications**: Service Worker + izin UI + token registration
✅ **Shipping Management**: Carriers, Zones, Rates CRUD sayfaları
✅ **Veterinarian Module**: Health Records + Vaccinations CRUD
✅ **Seller Forms**: Become Seller, Create/Edit Listing tam implement

### 13.2 İyileştirilebilir Alanlar
⚠️ **Component Reusability**: Admin CRUD tabloları tekrarlı (generic component faydalı olabilir)
⚠️ **Payment Integration**: API endpoint'leri mevcut, UI minimal
⚠️ **Advanced Analytics**: Dashboard temel istatistikler gösteriyor, detaylı grafikler eklenebilir

---

## 14. GELECEK İYİLEŞTİRME ÖNERİLERİ

### 14.1 Öncelik 1 - KISA VADEDE
1. **Generic CRUD Table Component**: Tekrarlı admin tablo kodunu azaltmak için composable component
2. **Payment Entegrasyonu**: Ödeme akışı UI (sipariş onay, ödeme yöntemleri)
3. **Advanced Analytics**: Dashboard'a detaylı grafikler ve trend analizi

### 14.2 Öncelik 2 - ORTA VADEDE
1. **E2E Test Suite**: Playwright/Cypress ile kritik akışların test edilmesi
2. **PWA Enhancement**: Offline support, app install prompt
3. **SEO Optimization**: Structured data, Open Graph meta tags
4. **Performance Monitoring**: Web Vitals tracking, Sentry entegrasyonu

---

## 15. TEKNIK ÖZET

| Kategori | Detay |
|----------|-------|
| **Framework** | Next.js 16.1.6 + React 19 + TypeScript 5.9 |
| **State** | React Query + Zustand + Context API |
| **Styling** | Tailwind CSS 4 + Radix UI |
| **Form** | React Hook Form + Zod |
| **Real-Time** | Microsoft SignalR (@10.0.0) |
| **API Client** | Auto-generated TypeScript (arf-cli) |
| **i18n** | next-intl (40 languages) |
| **File Upload** | Axios multipart + MinIO |
| **Authentication** | JWT + Refresh Token + OAuth (Google) |
| **Components** | 110+ TSX files |
| **Queries** | 18 React Query hooks |
| **Stores** | 3 Zustand stores |
| **Lines of Code** | ~12000-14000 LOC (estimate) |
| **Push Notifications** | Service Worker + Web Push API |
| **Route Protection** | Next.js Middleware (locale-aware) |

---

## 16. SONUÇ (Güncellenme: 2026-03-03)

GlobalLivestock web projesi **%95+ tamamlanmış** durumundadır ve **MVP-ready** seviyesindedir.

### ✅ Tamamlanan (Tüm Kritik Özellikler)
- Authentication system (Login, Register, Social login, Protected Routes Middleware)
- Marketplace UI (Products, Sellers, Transporters, Search)
- Dashboard (Profile, Messages, Notifications, Favorites, Stats)
- Moderasyon Paneli (Products Approve/Reject + Sellers/Transporters Verify/Suspend)
- Real-Time Messaging (SignalR + presence tracking)
- Multi-language support (50+ languages, RTL destekli)
- File upload infrastructure (MinIO + image compression)
- Push Notifications (Service Worker + izin UI + token kayıt)
- Shipping Management (Carriers, Zones, Rates CRUD)
- Veterinarian Module (Health Records, Vaccinations CRUD)
- Seller Operations (Become Seller, Create/Edit Listing, Farms, Locations)
- Role-based sidebar navigation

### 🟡 Gelecek İyileştirmeler (Opsiyonel)
- Generic CRUD table component (kod tekrarı azaltma)
- Payment entegrasyonu UI
- Advanced analytics dashboard
- E2E test suite
- PWA offline support

**Durum**: Proje feature-complete MVP seviyesinde. Kalan iyileştirmeler opsiyonel ve gelecek fazlarda ele alınabilir.
