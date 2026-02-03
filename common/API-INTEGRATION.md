# Frontend API Entegrasyonu

Bu dokuman, GlobalLivestock backend API'si ile frontend entegrasyonunu aciklar.

## Icindekiler

1. [Kurulum](#kurulum)
2. [Yapilandirma](#yapilandirma)
3. [Kimlik Dogrulama (Authentication)](#kimlik-dogrulama)
4. [API Kullanimi](#api-kullanimi)
5. [Token Yonetimi](#token-yonetimi)
6. [Rol Tabanli Yetkilendirme (RBAC)](#rol-tabanli-yetkilendirme)
7. [Hata Yonetimi](#hata-yonetimi)
8. [Dosya Yukleme](#dosya-yukleme)
9. [Real-Time Mesajlasma (SignalR)](#real-time-mesajlasma-signalr)
10. [Ornek Kullanim](#ornek-kullanim)
11. [API Referansi - Tum Endpoint'ler](#api-referansi---tum-endpointler)

---

## Kurulum

`arf-cli` ile olusturulan API client'i `livestock-api` klasorunde bulunur:

```
common/
  livestock-api/
    src/
      api/
        base_modules/
          iam/index.ts          # Auth, Users, Countries, Roles, etc.
          FileProvider/index.ts # Dosya islemleri
        business_modules/
          livestocktrading/index.ts  # Is mantigi API'leri
      config/
        livestock-config.ts     # API URL ve axios yapilandirmasi
      services/
        ApiService.ts           # HTTP istemci ve hata yonetimi
      errors/
        locales/                # Hata mesajlari (TR)
```

### Import Yolu

```typescript
// API namespace'lerini import et
import { IAMAPI } from '@common/livestock-api/src/api/base_modules/iam';
import { LivestockTradingAPI } from '@common/livestock-api/src/api/business_modules/livestocktrading';
import { FileProviderAPI } from '@common/livestock-api/src/api/base_modules/FileProvider';

// Config ve servisler
import { AppConfig, api } from '@common/livestock-api/src/config/livestock-config';
import { ApiService } from '@common/livestock-api/src/services/ApiService';
```

---

## Yapilandirma

### Environment Degiskenleri

`.env.local` dosyasinda:

```env
NEXT_PUBLIC_ENVIRONMENT=development   # veya production
```

### API URL'leri

| Ortam | Base URL |
|-------|----------|
| Development | `https://dev-api.livestock-trading.com` |
| Production | `https://api.livestock-trading.com` |

### Modul URL'leri

```typescript
AppConfig.IAMUrl              // /iam - Kimlik ve erisim yonetimi
AppConfig.LivestockTradingUrl // /livestocktrading - Is mantigi
AppConfig.FileProviderUrl     // /fileprovider - Dosya islemleri
```

---

## Kimlik Dogrulama

### 1. Kullanici Kaydi (Register)

```typescript
import { IAMAPI } from '@common/livestock-api/src/api/base_modules/iam';

const register = async (userData: {
  userName: string;
  firstName: string;
  surname: string;
  email: string;
  password: string;
  phoneNumber: string;
  countryId: number;
}) => {
  try {
    const response = await IAMAPI.Users.Create.Request({
      ...userData,
      providerId: '',
      userSource: IAMAPI.Enums.UserSources.Manual,
      description: '',
      language: 'tr',
      preferredCurrencyCode: 'TRY',
    });

    console.log('Kullanici olusturuldu:', response);
    return response;
  } catch (error) {
    console.error('Kayit hatasi:', error);
    throw error;
  }
};
```

### 2. Giris (Login)

#### Native Login (Email + Sifre)

```typescript
import { IAMAPI } from '@common/livestock-api/src/api/base_modules/iam';

const login = async (email: string, password: string) => {
  try {
    const response = await IAMAPI.Auth.Login.Request({
      provider: 'native',
      userName: email,
      password: password,
      token: '',
      platform: IAMAPI.Enums.ClientPlatforms.Web, // 0
      firstName: '',
      surname: '',
      phoneNumber: '',
      birthDate: undefined,
      externalProviderUserId: '',
    });

    // Token'lari kaydet
    localStorage.setItem('jwt', response.jwt);
    localStorage.setItem('accessToken', response.jwt);
    localStorage.setItem('refreshToken', response.refreshToken);

    // Kullanici bilgisini kaydet
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  } catch (error) {
    console.error('Giris hatasi:', error);
    throw error;
  }
};
```

#### Google Login

```typescript
const googleLogin = async (googleToken: string, googleUserId: string) => {
  const response = await IAMAPI.Auth.Login.Request({
    provider: 'google',
    userName: '',
    password: '',
    token: googleToken,
    platform: IAMAPI.Enums.ClientPlatforms.Web,
    firstName: '',  // Google'dan alinabilir
    surname: '',    // Google'dan alinabilir
    phoneNumber: '',
    birthDate: undefined,
    externalProviderUserId: googleUserId, // Google sub claim
  });

  // Token'lari kaydet
  localStorage.setItem('jwt', response.jwt);
  localStorage.setItem('accessToken', response.jwt);
  localStorage.setItem('refreshToken', response.refreshToken);

  return response;
};
```

#### Apple Login

```typescript
const appleLogin = async (appleToken: string, appleUserId: string) => {
  const response = await IAMAPI.Auth.Login.Request({
    provider: 'apple',
    userName: '',
    password: '',
    token: appleToken,
    platform: IAMAPI.Enums.ClientPlatforms.Web,
    firstName: '',
    surname: '',
    phoneNumber: '',
    birthDate: undefined,
    externalProviderUserId: appleUserId,
  });

  localStorage.setItem('jwt', response.jwt);
  localStorage.setItem('accessToken', response.jwt);
  localStorage.setItem('refreshToken', response.refreshToken);

  return response;
};
```

### 3. Cikis (Logout)

```typescript
const logout = async () => {
  try {
    // Backend'e logout bildir (refresh token'i siler)
    await IAMAPI.Auth.Logout.Request({});
  } catch (error) {
    console.error('Logout API hatasi:', error);
  } finally {
    // Her durumda local token'lari temizle
    localStorage.removeItem('jwt');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Login sayfasina yonlendir
    window.location.href = '/auth/login';
  }
};
```

### 4. Sifremi Unuttum

**Backend icin onemli:** E-postaya eklenecek sifre sifirlama linki formati:

| Ortam | URL |
|-------|-----|
| Development | `http://localhost:3000/reset-password?token={TOKEN}` |
| Production | `https://www.livestock-trading.com/reset-password?token={TOKEN}` |

`{TOKEN}` yerine backend'in olusturdugu sifirlama token'i gelecek.

```typescript
// 1. Reset email gonder
const forgotPassword = async (email: string) => {
  const response = await IAMAPI.Users.ForgotPassword.Request({
    email: email,
  });
  // Kullaniciya email gonderildi mesaji goster
  return response;
};

// 2. Yeni sifre belirle (email'deki link'ten gelen token ile)
const resetPassword = async (token: string, newPassword: string) => {
  const response = await IAMAPI.Users.ResetPassword.Request({
    token: token,
    newPassword: newPassword,
  });
  return response;
};
```

### 5. Sifre Degistirme

```typescript
const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const response = await IAMAPI.Users.UpdatePassword.Request({
    userId: userId,
    oldPassword: oldPassword,
    newPassword: newPassword,
  });
  return response;
};
```

---

## Token Yonetimi

### JWT Token Yapisi

Backend 7 gun gecerli JWT token uretir. Token icindeki claim'ler:

```json
{
  "nameid": "user-uuid",
  "given_name": "username",
  "unique_name": "John Doe",
  "email": "user@example.com",
  "role": ["LivestockTrading.Seller", "LivestockTrading.Buyer"],
  "platform": "0",
  "exp": 1234567890
}
```

### Token Saklama

```typescript
// Login sonrasi
localStorage.setItem('jwt', response.jwt);
localStorage.setItem('accessToken', response.jwt);  // Alias
localStorage.setItem('refreshToken', response.refreshToken);
```

### Otomatik Token Yenileme

`ApiService` ve `livestock-config.ts` icindeki axios interceptor'lar 401 hatasi aldiginda otomatik olarak:

1. `refreshToken` ile yeni JWT ister
2. Yeni token'i kaydeder
3. Orijinal istegi tekrarlar

**Manuel token yenileme (gerekirse):**

```typescript
const refreshTokenManually = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('Refresh token bulunamadi');
  }

  const response = await IAMAPI.Auth.RefreshToken.Request({
    refreshToken: refreshToken,
    platform: IAMAPI.Enums.ClientPlatforms.Web,
  });

  localStorage.setItem('jwt', response.jwt);
  localStorage.setItem('accessToken', response.jwt);
  localStorage.setItem('refreshToken', response.refreshToken);

  return response;
};
```

### Token Kontrolu

```typescript
// Kullanici giris yapmis mi?
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('jwt');
  return !!token;
};

// Token suresi dolmus mu? (basit kontrol)
const isTokenExpired = (): boolean => {
  const token = localStorage.getItem('jwt');
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // saniyeden milisaniyeye
    return Date.now() > expiry;
  } catch {
    return true;
  }
};
```

---

## Rol Tabanli Yetkilendirme

### Rol Yapisi

Platform 7 farklı rol destekler:

| Rol | Kod | Aciklama |
|-----|-----|----------|
| Admin | `LivestockTrading.Admin` | Tam yetki |
| Moderator | `LivestockTrading.Moderator` | Icerik ve satis yonetimi |
| Support | `LivestockTrading.Support` | Musteri destegi |
| Seller | `LivestockTrading.Seller` | Urun satis yetkisi |
| Transporter | `LivestockTrading.Transporter` | Nakliye hizmeti |
| Buyer | `LivestockTrading.Buyer` | Alici (varsayilan) |
| Veterinarian | `LivestockTrading.Veterinarian` | Veteriner hekimler |

### Otomatik Rol Atamasi

Kullanicilar kayit oldugunda veya ilk kez sosyal giris yaptiginda otomatik olarak rol atanir:

**Varsayilan Rol:** Tum yeni kullanicilar `Buyer` rolu alir.

**Admin Rolleri:** Asagidaki email adresleri otomatik olarak `Admin` rolu alir:
- `nagehanyazici13@gmail.com`
- `m.mustafaocak@gmail.com`

Bu email adresleri ile kayit olan veya Google/Apple ile giris yapan kullanicilar otomatik olarak Admin yetkisine sahip olur.

> **Not:** Kullanici rolleri JWT token icinde saklanir. Rol degisikligi icin kullanicinin tekrar giris yapmasi gerekir.

### Rol Yetki Hiyerarsisi

Backend'de rol kontrolleri asagidaki hiyerarsiyi takip eder:

| Islem | Gerekli Roller |
|-------|----------------|
| **Moderasyon** (Onayla/Reddet/Askiya Al) | Admin, Moderator |
| **Urun Yonetimi** (Olustur/Guncelle/Sil) | Admin, Moderator, Seller |
| **Nakliye Yonetimi** | Admin, Moderator, Transporter |
| **Kullanici Yonetimi** | Admin |
| **Urun Satin Alma** | Buyer, Seller (herkes) |
| **Yorum/Degerlendirme** | Buyer, Seller |

**Onemli:** Admin rolu tum islemlere erisim saglar. Moderator rolu icerik yonetimi islemlerine erisim saglar.

### JWT'deki Rol Claim'leri

Login sonrasi gelen JWT token'da `role` claim'i kullanicinin rollerini icerir:

```json
{
  "nameid": "user-uuid",
  "given_name": "username",
  "unique_name": "John Doe",
  "email": "user@example.com",
  "role": ["LivestockTrading.Seller", "LivestockTrading.Buyer"],
  "platform": "0",
  "exp": 1234567890
}
```

**Onemli:** Bir kullanici birden fazla role sahip olabilir (ornegin hem Seller hem Buyer).

### JWT'den Rolleri Okuma

```typescript
// utils/jwt.ts
export interface JwtPayload {
  nameid: string;
  given_name: string;
  unique_name: string;
  email: string;
  role: string | string[];
  platform: string;
  exp: number;
}

export const decodeJwt = (): JwtPayload | null => {
  const token = localStorage.getItem('jwt');
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const getUserRoles = (): string[] => {
  const payload = decodeJwt();
  if (!payload) return [];

  // role tek string veya array olabilir
  if (Array.isArray(payload.role)) {
    return payload.role;
  }
  return payload.role ? [payload.role] : [];
};

export const hasRole = (role: string): boolean => {
  const roles = getUserRoles();
  return roles.includes(role);
};

export const hasAnyRole = (requiredRoles: string[]): boolean => {
  const roles = getUserRoles();
  return requiredRoles.some((r) => roles.includes(r));
};
```

### Rol Sabitleri

```typescript
// constants/roles.ts
export const Roles = {
  Admin: 'LivestockTrading.Admin',
  Moderator: 'LivestockTrading.Moderator',
  Support: 'LivestockTrading.Support',
  Seller: 'LivestockTrading.Seller',
  Transporter: 'LivestockTrading.Transporter',
  Buyer: 'LivestockTrading.Buyer',
  Veterinarian: 'LivestockTrading.Veterinarian',
} as const;

// Rol grupları
export const AdminRoles = [Roles.Admin];
export const StaffRoles = [Roles.Admin, Roles.Moderator, Roles.Support];
export const SellerRoles = [Roles.Admin, Roles.Moderator, Roles.Seller];
export const TransporterRoles = [Roles.Admin, Roles.Moderator, Roles.Transporter];
```

### useRoles Hook

```typescript
// hooks/useRoles.ts
import { useState, useEffect, useMemo } from 'react';
import { getUserRoles, hasRole, hasAnyRole } from '@/utils/jwt';
import { Roles } from '@/constants/roles';

export const useRoles = () => {
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    setRoles(getUserRoles());
  }, []);

  const permissions = useMemo(() => ({
    isAdmin: hasRole(Roles.Admin),
    isModerator: hasRole(Roles.Moderator),
    isSupport: hasRole(Roles.Support),
    isSeller: hasRole(Roles.Seller),
    isTransporter: hasRole(Roles.Transporter),
    isBuyer: hasRole(Roles.Buyer),
    isVeterinarian: hasRole(Roles.Veterinarian),
    isStaff: hasAnyRole([Roles.Admin, Roles.Moderator, Roles.Support]),
    canManageProducts: hasAnyRole([Roles.Admin, Roles.Moderator, Roles.Seller]),
    canManageOrders: hasAnyRole([Roles.Admin, Roles.Moderator]),
    canManageUsers: hasRole(Roles.Admin),
  }), [roles]);

  return {
    roles,
    ...permissions,
    hasRole,
    hasAnyRole,
  };
};
```

### Rol Korumalı Componentler

```typescript
// components/RoleProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackUrl?: string;
}

export const RoleProtectedRoute = ({
  children,
  allowedRoles,
  fallbackUrl = '/unauthorized',
}: RoleProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAnyRole } = useRoles();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (!hasAnyRole(allowedRoles)) {
        router.push(fallbackUrl);
      }
    }
  }, [isAuthenticated, isLoading, allowedRoles, hasAnyRole, router, fallbackUrl]);

  if (isLoading) {
    return <div>Yukleniyor...</div>;
  }

  if (!isAuthenticated || !hasAnyRole(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
};

// Kullanim ornegi
// pages/admin/dashboard.tsx
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';
import { Roles } from '@/constants/roles';

export default function AdminDashboard() {
  return (
    <RoleProtectedRoute allowedRoles={[Roles.Admin, Roles.Moderator]}>
      <div>Admin Dashboard</div>
    </RoleProtectedRoute>
  );
}
```

### Kosullu UI Gosterimi

```typescript
// components/ConditionalRender.tsx
import { useRoles } from '@/hooks/useRoles';

interface ShowForRolesProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ShowForRoles = ({ roles, children, fallback = null }: ShowForRolesProps) => {
  const { hasAnyRole } = useRoles();

  if (!hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Kullanim
import { Roles } from '@/constants/roles';

function ProductActions({ productId }: { productId: string }) {
  return (
    <div>
      {/* Herkes gorebilir */}
      <button>Detay</button>

      {/* Sadece seller ve admin */}
      <ShowForRoles roles={[Roles.Seller, Roles.Admin]}>
        <button>Duzenle</button>
      </ShowForRoles>

      {/* Sadece admin */}
      <ShowForRoles roles={[Roles.Admin]}>
        <button>Sil</button>
      </ShowForRoles>
    </div>
  );
}
```

### Moderasyon API Endpoint'leri (Admin/Moderator)

Asagidaki endpoint'ler sadece Admin ve Moderator rolleri icin erisime aciktir:

#### Urun Moderasyonu

```typescript
// Urunu onayla
const approveProduct = async (productId: string) => {
  const response = await LivestockTradingAPI.Products.Approve.Request({
    id: productId,
  });
  return response; // { success: true, status: 'Approved' }
};

// Urunu reddet
const rejectProduct = async (productId: string, reason: string) => {
  const response = await LivestockTradingAPI.Products.Reject.Request({
    id: productId,
    reason: reason, // Zorunlu: Red sebebi
  });
  return response; // { success: true, status: 'Rejected' }
};
```

#### Satici Moderasyonu

```typescript
// Saticiyi dogrula
const verifySeller = async (sellerId: string) => {
  const response = await LivestockTradingAPI.Sellers.Verify.Request({
    id: sellerId,
  });
  return response; // { success: true, status: 'Verified' }
};

// Saticiyi askiya al
const suspendSeller = async (sellerId: string, reason: string) => {
  const response = await LivestockTradingAPI.Sellers.Suspend.Request({
    id: sellerId,
    reason: reason, // Zorunlu: Askiya alma sebebi
  });
  return response; // { success: true, status: 'Suspended' }
};
```

#### Tasiyici Moderasyonu

```typescript
// Tasiyiciyi dogrula
const verifyTransporter = async (transporterId: string) => {
  const response = await LivestockTradingAPI.Transporters.Verify.Request({
    id: transporterId,
  });
  return response; // { success: true, status: 'Verified' }
};

// Tasiyiciyi askiya al
const suspendTransporter = async (transporterId: string, reason: string) => {
  const response = await LivestockTradingAPI.Transporters.Suspend.Request({
    id: transporterId,
    reason: reason, // Zorunlu: Askiya alma sebebi
  });
  return response; // { success: true, status: 'Suspended' }
};
```

#### Moderasyon Paneli Ornegi

```typescript
// components/admin/ModerationActions.tsx
import { useRoles } from '@/hooks/useRoles';
import { Roles } from '@/constants/roles';
import { LivestockTradingAPI } from '@common/livestock-api/src/api/business_modules/livestocktrading';

interface ModerationActionsProps {
  entityType: 'product' | 'seller' | 'transporter';
  entityId: string;
  onSuccess: () => void;
}

export const ModerationActions = ({ entityType, entityId, onSuccess }: ModerationActionsProps) => {
  const { hasAnyRole } = useRoles();
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sadece Admin/Moderator gorebilir
  if (!hasAnyRole([Roles.Admin, Roles.Moderator])) {
    return null;
  }

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      if (entityType === 'product') {
        await LivestockTradingAPI.Products.Approve.Request({ id: entityId });
      } else if (entityType === 'seller') {
        await LivestockTradingAPI.Sellers.Verify.Request({ id: entityId });
      } else {
        await LivestockTradingAPI.Transporters.Verify.Request({ id: entityId });
      }
      toast.success('Onaylandi!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error('Red sebebi zorunludur');
      return;
    }
    setIsLoading(true);
    try {
      if (entityType === 'product') {
        await LivestockTradingAPI.Products.Reject.Request({ id: entityId, reason });
      } else if (entityType === 'seller') {
        await LivestockTradingAPI.Sellers.Suspend.Request({ id: entityId, reason });
      } else {
        await LivestockTradingAPI.Transporters.Suspend.Request({ id: entityId, reason });
      }
      toast.success('Reddedildi!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="moderation-actions">
      <button onClick={handleApprove} disabled={isLoading}>
        Onayla
      </button>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Red sebebi..."
      />
      <button onClick={handleReject} disabled={isLoading || !reason.trim()}>
        Reddet
      </button>
    </div>
  );
};
```

### Rol API Endpoint'leri (Yakin Zamanda)

Asagidaki endpoint'ler yakin zamanda eklenecektir:

| Endpoint | Aciklama | Durum |
|----------|----------|-------|
| `GET /iam/Users/Me` | Mevcut kullanici bilgileri + roller | Planlanıyor |
| `GET /iam/Roles/All` | Tum roller listesi | Planlanıyor |
| `GET /iam/Roles/Permissions` | Rol bazli izinler | Planlanıyor |

Bu endpoint'ler aktif olana kadar JWT'deki `role` claim'ini kullanin.

---

## API Kullanimi

### Temel API Cagirma Kaliplari

Tum API'ler ayni kalipla cagrilir:

```typescript
const response = await NAMESPACE.Module.Endpoint.Request(requestModel);
```

### Listeleme (All) - Sayfalama, Siralama, Filtreleme

```typescript
import { LivestockTradingAPI } from '@common/livestock-api/src/api/business_modules/livestocktrading';

const getProducts = async (page: number = 1, pageSize: number = 10) => {
  const response = await LivestockTradingAPI.Products.All.Request({
    sorting: {
      key: 'createdAt',
      direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
    },
    filters: [
      {
        key: 'status',
        type: 'equal',
        isUsed: true,
        values: [1], // Aktif urunler
        min: null,
        max: null,
        conditionType: 'and',
      },
    ],
    pageRequest: {
      currentPage: page,
      perPageCount: pageSize,
      listAll: false,
    },
  });

  return response;
};
```

### Detay (Detail)

```typescript
const getProductDetail = async (productId: string) => {
  const response = await LivestockTradingAPI.Products.Detail.Request({
    id: productId,
  });
  return response;
};
```

### Dropdown Listesi (Pick)

```typescript
const getCategoriesForDropdown = async (keyword?: string) => {
  const response = await LivestockTradingAPI.Categories.Pick.Request({
    selectedIds: [],
    keyword: keyword || '',
    limit: 10,
  });
  return response;
};

// Secili deger varsa
const getCategoriesWithSelected = async (selectedCategoryId: string) => {
  const response = await LivestockTradingAPI.Categories.Pick.Request({
    selectedIds: [selectedCategoryId],
    keyword: '',
    limit: 10,
  });
  return response;
};
```

### Olusturma (Create)

```typescript
const createProduct = async (productData: {
  title: string;
  description: string;
  categoryId: string;
  price: number;
}) => {
  const response = await LivestockTradingAPI.Products.Create.Request({
    ...productData,
    // Diger zorunlu alanlar
  });
  return response;
};
```

### Guncelleme (Update)

```typescript
const updateProduct = async (
  productId: string,
  updates: { title?: string; price?: number }
) => {
  const response = await LivestockTradingAPI.Products.Update.Request({
    id: productId,
    ...updates,
  });
  return response;
};
```

### Silme (Delete)

```typescript
const deleteProduct = async (productId: string) => {
  const response = await LivestockTradingAPI.Products.Delete.Request({
    id: productId,
  });
  return response;
};
```

---

## Hata Yonetimi

### Backend Hata Formati

Backend tum response'lari su formatta dondurur:

```json
{
  "hasError": true,
  "error": {
    "code": "UserErrors.InvalidCredentials",
    "message": "Gecersiz kullanici adi veya sifre"
  },
  "payload": null
}
```

### Hata Yakalama

```typescript
try {
  const response = await IAMAPI.Auth.Login.Request({...});
  // Basarili
} catch (error: any) {
  // Hata mesaji zaten Turkce'ye cevrilmis olarak gelir
  const errorMessage = error.message;

  // Orjinal backend hata kodu
  const originalError = error.original;

  // Kullaniciya goster
  toast.error(errorMessage);
}
```

### Ozel Hata Durumlari

```typescript
try {
  await someApiCall();
} catch (error: any) {
  // Session suresi doldu
  if (error.code === 'SESSION_EXPIRED') {
    // Kullanici otomatik olarak /auth/login'e yonlendirilir
    return;
  }

  // Diger hatalar
  handleError(error);
}
```

---

## Dosya Yukleme

### Resim Yukleme

```typescript
import { ApiService } from '@common/livestock-api/src/services/ApiService';
import { AppConfig } from '@common/livestock-api/src/config/livestock-config';

const uploadImage = async (file: File, bucketId: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucketId', bucketId);

  const response = await ApiService.callMultipart<{ fileId: string; url: string }>(
    `${AppConfig.FileProviderUrl}/Files/Upload`,
    formData
  );

  return response;
};

// Kullanim
const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Kullanicinin bucketId'si login response'unda gelir
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const bucketId = user.bucketId;

  const result = await uploadImage(file, bucketId);
  console.log('Yuklenen dosya URL:', result.url);
};
```

---

## Real-Time Mesajlasma (SignalR)

Platform, kullanicilar arasi gercek zamanli mesajlasma icin SignalR kullanir. Bu sistem asagidaki ozellikleri destekler:
- Anlik mesaj iletimi
- "Yaziyor..." gostergesi (Typing Indicator)
- Mesaj okundu bildirimi
- Online/Offline durum takibi (Presence)
- Push notification (mobil)

### SignalR Hub Baglantisi

```typescript
// services/ChatService.ts
import * as signalR from '@microsoft/signalr';

class ChatService {
  private connection: signalR.HubConnection | null = null;
  private static instance: ChatService;

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public async connect(): Promise<void> {
    const token = localStorage.getItem('jwt');
    if (!token) {
      throw new Error('JWT token bulunamadi');
    }

    // Hub URL - API Gateway uzerinden
    const hubUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/livestocktrading/hubs/chat`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Yeniden baglanti denemeleri
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Baglanti durumu degisikliklerini dinle
    this.connection.onreconnecting((error) => {
      console.log('SignalR yeniden baglanıyor...', error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR yeniden baglandi:', connectionId);
    });

    this.connection.onclose((error) => {
      console.log('SignalR baglantisi kapandi:', error);
    });

    await this.connection.start();
    console.log('SignalR baglantisi kuruldu');
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  public getConnection(): signalR.HubConnection | null {
    return this.connection;
  }
}

export const chatService = ChatService.getInstance();
```

### Conversation'a Katilma/Ayrilma

```typescript
// Bir conversation'a katil (mesajlari almak icin)
const joinConversation = async (conversationId: string) => {
  const connection = chatService.getConnection();
  if (connection) {
    await connection.invoke('JoinConversation', conversationId);
  }
};

// Conversation'dan ayril
const leaveConversation = async (conversationId: string) => {
  const connection = chatService.getConnection();
  if (connection) {
    await connection.invoke('LeaveConversation', conversationId);
  }
};
```

### Mesaj Dinleme (Real-Time)

```typescript
// hooks/useChat.ts
import { useEffect, useCallback, useState } from 'react';
import { chatService } from '@/services/ChatService';

interface Message {
  messageId: string;
  conversationId: string;
  senderUserId: string;
  senderName: string;
  content: string;
  attachmentUrls: string | null;
  sentAt: string;
}

interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const connection = chatService.getConnection();
    if (!connection) return;

    // Yeni mesaj geldiginde
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    // Typing indicator
    const handleTypingIndicator = (indicator: TypingIndicator) => {
      if (indicator.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          if (indicator.isTyping) {
            newMap.set(indicator.userId, indicator.userName);
          } else {
            newMap.delete(indicator.userId);
          }
          return newMap;
        });
      }
    };

    // Mesaj okundu bildirimi
    const handleMessageRead = (data: { messageId: string; readAt: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === data.messageId ? { ...m, isRead: true, readAt: data.readAt } : m
        )
      );
    };

    // Event listener'lari ekle
    connection.on('ReceiveMessage', handleNewMessage);
    connection.on('TypingIndicator', handleTypingIndicator);
    connection.on('MessageRead', handleMessageRead);

    // Conversation'a katil
    connection.invoke('JoinConversation', conversationId);

    return () => {
      // Cleanup
      connection.off('ReceiveMessage', handleNewMessage);
      connection.off('TypingIndicator', handleTypingIndicator);
      connection.off('MessageRead', handleMessageRead);
      connection.invoke('LeaveConversation', conversationId);
    };
  }, [conversationId]);

  return { messages, typingUsers, setMessages };
};
```

### Typing Indicator Gonderme

```typescript
// Typing indicator gonder (debounced olmali)
import { LivestockTradingAPI } from '@common/livestock-api/src/api/business_modules/livestocktrading';
import { useCallback, useRef } from 'react';

const useTypingIndicator = (conversationId: string) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    try {
      await LivestockTradingAPI.Messages.SendTypingIndicator.Request({
        conversationId,
        isTyping,
      });
    } catch (error) {
      console.error('Typing indicator gonderilemedi:', error);
    }
  }, [conversationId]);

  const handleTyping = useCallback(() => {
    // Typing basladiginda
    sendTypingIndicator(true);

    // Onceki timeout'u temizle
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 2 saniye sonra typing'i durdur
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  }, [sendTypingIndicator]);

  return { handleTyping };
};
```

### Online Kullanicilari Kontrol Etme

```typescript
// Online kullanicilari kontrol et
const checkOnlineUsers = async (userIds: string[]): Promise<string[]> => {
  const connection = chatService.getConnection();
  if (!connection) return [];

  try {
    const onlineUsers = await connection.invoke<string[]>('GetOnlineUsers', userIds);
    return onlineUsers;
  } catch (error) {
    console.error('Online kullanicilar alinamadi:', error);
    return [];
  }
};
```

### Mesaj Okundu Olarak Isaretle

```typescript
// Hub uzerinden (real-time bildirim icin)
const markMessageAsReadViaHub = async (messageId: string) => {
  const connection = chatService.getConnection();
  if (connection) {
    await connection.invoke('MarkMessageAsRead', messageId);
  }
};

// REST API uzerinden (kalici kayit icin)
const markMessageAsRead = async (messageId: string) => {
  await LivestockTradingAPI.Messages.Update.Request({
    id: messageId,
    isRead: true,
  });
};
```

### Mesajlasma Sayfasi Ornegi

```typescript
// pages/messages/[conversationId].tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LivestockTradingAPI } from '@common/livestock-api/src/api/business_modules/livestocktrading';
import { chatService } from '@/services/ChatService';
import { useChat } from '@/hooks/useChat';

export default function ConversationPage() {
  const router = useRouter();
  const { conversationId } = router.query as { conversationId: string };
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { messages, typingUsers, setMessages } = useChat(conversationId);
  const { handleTyping } = useTypingIndicator(conversationId);

  // Sayfa yuklendiginde SignalR baglan ve mevcut mesajlari yukle
  useEffect(() => {
    const initializeChat = async () => {
      // SignalR baglantisi
      await chatService.connect();

      // Mevcut mesajlari yukle
      const response = await LivestockTradingAPI.Messages.All.Request({
        filters: [
          {
            key: 'conversationId',
            type: 'equal',
            isUsed: true,
            values: [conversationId],
            min: null,
            max: null,
            conditionType: 'and',
          },
        ],
        sorting: { key: 'sentAt', direction: 1 }, // Ascending
        pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
      });

      setMessages(response.data || []);
    };

    if (conversationId) {
      initializeChat();
    }

    return () => {
      chatService.disconnect();
    };
  }, [conversationId]);

  // Mesaj gonder
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsLoading(true);

    try {
      await LivestockTradingAPI.Messages.Create.Request({
        conversationId,
        content: newMessage.trim(),
        attachmentUrls: null,
      });
      setNewMessage('');
    } catch (error: any) {
      console.error('Mesaj gonderilemedi:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="conversation-page">
      {/* Mesaj Listesi */}
      <div className="messages-list">
        {messages.map((msg) => (
          <div key={msg.messageId} className="message">
            <strong>{msg.senderName}</strong>
            <p>{msg.content}</p>
            <small>{new Date(msg.sentAt).toLocaleString('tr-TR')}</small>
          </div>
        ))}
      </div>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className="typing-indicator">
          {Array.from(typingUsers.values()).join(', ')} yaziyor...
        </div>
      )}

      {/* Mesaj Girisi */}
      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Mesajinizi yazin..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} disabled={isLoading || !newMessage.trim()}>
          Gonder
        </button>
      </div>
    </div>
  );
}
```

### Push Notification (Mobil)

Mobil uygulamada push notification almak icin:

1. **Token Kaydi**: Uygulama acildiginda push token'i backend'e kaydedin:

```typescript
// Firebase/OneSignal token'i kaydet
import { IAMAPI } from '@common/livestock-api/src/api/base_modules/iam';

const registerPushToken = async (pushToken: string, platform: 'android' | 'ios') => {
  await IAMAPI.Push.RegisterToken.Request({
    pushToken,
    platform: platform === 'android' ? 1 : 2, // Android=1, iOS=2
    deviceInfo: 'Device model info',
  });
};
```

2. **Notification Handler**: Gelen push notification'lari handle edin:

```typescript
// React Native / Expo ornegi
import messaging from '@react-native-firebase/messaging';

messaging().onMessage(async (remoteMessage) => {
  const { type, conversationId, messageId } = remoteMessage.data;

  if (type === 'new_message') {
    // Yeni mesaj bildirimi goster
    // veya ilgili conversation'a yonlendir
  }
});
```

### SignalR Event'leri

| Event | Yön | Açıklama |
|-------|-----|----------|
| `ReceiveMessage` | Server → Client | Yeni mesaj geldi |
| `TypingIndicator` | Server → Client | Kullanici yaziyor/durdu |
| `MessageRead` | Server → Client | Mesaj okundu |
| `UserOnline` | Server → Client | Kullanici cevrimici oldu |
| `UserOffline` | Server → Client | Kullanici cevrimdisi oldu |
| `JoinConversation` | Client → Server | Conversation'a katil |
| `LeaveConversation` | Client → Server | Conversation'dan ayril |
| `SendTypingIndicator` | Client → Server | Typing durumu gonder |
| `MarkMessageAsRead` | Client → Server | Mesaji okundu olarak isaretle |
| `GetOnlineUsers` | Client → Server | Online kullanicilari sorgula |

### Mesajlasma REST Endpoint'leri

| Endpoint | Aciklama |
|----------|----------|
| `POST /livestocktrading/Conversations/Create` | Yeni konusma baslat |
| `POST /livestocktrading/Conversations/All` | Konusma listesi |
| `POST /livestocktrading/Conversations/Detail` | Konusma detayi |
| `POST /livestocktrading/Messages/Create` | Mesaj gonder |
| `POST /livestocktrading/Messages/All` | Mesaj listesi |
| `POST /livestocktrading/Messages/Update` | Mesaji guncelle (okundu) |
| `POST /livestocktrading/Messages/SendTypingIndicator` | Yaziyor gostergesi |

---

## Ornek Kullanim

### Auth Context (React)

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IAMAPI } from '@common/livestock-api/src/api/base_modules/iam';

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
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sayfa yuklendiginde mevcut kullaniciyi kontrol et
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('jwt');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await IAMAPI.Auth.Login.Request({
      provider: 'native',
      userName: email,
      password: password,
      token: '',
      platform: IAMAPI.Enums.ClientPlatforms.Web,
      firstName: '',
      surname: '',
      phoneNumber: '',
      birthDate: undefined,
      externalProviderUserId: '',
    });

    localStorage.setItem('jwt', response.jwt);
    localStorage.setItem('accessToken', response.jwt);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    setUser(response.user);
  };

  const loginWithGoogle = async (token: string, userId: string) => {
    const response = await IAMAPI.Auth.Login.Request({
      provider: 'google',
      userName: '',
      password: '',
      token: token,
      platform: IAMAPI.Enums.ClientPlatforms.Web,
      firstName: '',
      surname: '',
      phoneNumber: '',
      birthDate: undefined,
      externalProviderUserId: userId,
    });

    localStorage.setItem('jwt', response.jwt);
    localStorage.setItem('accessToken', response.jwt);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    setUser(response.user);
  };

  const logout = async () => {
    try {
      await IAMAPI.Auth.Logout.Request({});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('jwt');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      const response = await IAMAPI.Users.Detail.Request({
        userId: userData.id,
      });
      // Kullanici bilgisini guncelle
      localStorage.setItem('user', JSON.stringify({ ...userData, ...response }));
      setUser({ ...userData, ...response });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Login Sayfasi

```typescript
// pages/auth/login.tsx
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Giris yapilamadi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-posta"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Sifre"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Giris yapiliyor...' : 'Giris Yap'}
      </button>
    </form>
  );
}
```

### Protected Route

```typescript
// components/ProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Yukleniyor...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
```

---

## Public ve Protected Endpoint'ler

### Public Endpoint'ler (JWT Gerektirmez)

| Endpoint | Aciklama |
|----------|----------|
| `POST /iam/Auth/Login` | Giris |
| `POST /iam/Auth/RefreshToken` | Token yenileme |
| `POST /iam/Auth/SendOtp` | OTP gonderme |
| `POST /iam/Auth/VerifyOtp` | OTP dogrulama |
| `POST /iam/Users/Create` | Kayit |
| `POST /iam/Users/ForgotPassword` | Sifremi unuttum |
| `POST /iam/Users/ResetPassword` | Sifre sifirlama |
| `POST /iam/Countries/All` | Ulke listesi |

### Protected Endpoint'ler (JWT Gerektirir)

Diger tum endpoint'ler JWT token gerektirir. Token her istekte `Authorization: Bearer <token>` header'i ile gonderilir.

---

## Platform Degerleri

```typescript
enum ClientPlatforms {
  Web = 0,
  Mobile = 1,
  Service = 2,
  Unknown = 3,
}
```

Frontend uygulamalarinda:
- **Web**: `0`
- **Mobile (React Native, Flutter)**: `1`

---

## Onemli Notlar

1. **Token Suresi**: JWT 7 gun gecerlidir. Refresh token ile yenilenebilir.

2. **Otomatik Yenileme**: `ApiService` 401 aldiginda otomatik olarak token yeniler ve istegi tekrarlar.

3. **Logout**: Logout yapildiginda backend'deki refresh token silinir, tekrar kullanilamaz.

4. **Hata Mesajlari**: Backend hata kodlari otomatik olarak Turkce mesajlara cevrilir.

5. **URL Case Sensitivity**: IAM endpoint'leri icin URL'ler otomatik olarak kucuk harfe cevrilir.

---

## Sorun Giderme

### "401 Unauthorized" Hatasi

1. Token suresi dolmus olabilir - otomatik yenileme calismiyorsa manuel logout/login yapin
2. Refresh token gecersiz - tekrar giris yapin

### "Network Error"

1. Backend servislerin calistigini kontrol edin
2. CORS ayarlarini kontrol edin

### "hasError: true" Response

Backend is mantigi hatasi. `error.message` icinde Turkce aciklama bulunur.

---

## API Referansi - Tum Endpoint'ler

Bu bolum, platformdaki tum API endpoint'lerini, amaclarini ve kullanim senaryolarini icerir.

### Modul Yapisi

| Modul | Base URL | Amac |
|-------|----------|------|
| IAM | `/iam/` | Kimlik ve erisim yonetimi |
| FileProvider | `/fileprovider/` | Dosya yukleme/indirme |
| LivestockTrading | `/livestocktrading/` | Is mantigi (urunler, saticilar, mesajlasma vb.) |

---

## IAM Modulu (Kimlik Yonetimi)

### Auth (Kimlik Dogrulama)

| Endpoint | Amac | Public |
|----------|------|--------|
| `POST /iam/Auth/Login` | Kullanici girisi (native, google, apple) | ✓ |
| `POST /iam/Auth/Logout` | Cikis yap, refresh token'i sil | |
| `POST /iam/Auth/RefreshToken` | JWT token yenile | ✓ |
| `POST /iam/Auth/RevokeRefreshToken` | Refresh token'i iptal et | |
| `POST /iam/Auth/SendOtp` | OTP kodu gonder (telefon dogrulama) | ✓ |
| `POST /iam/Auth/VerifyOtp` | OTP kodunu dogrula | ✓ |

### User (Kullanici)

| Endpoint | Amac | Public |
|----------|------|--------|
| `POST /iam/User/Create` | Yeni kullanici kaydi | ✓ |
| `POST /iam/User/All` | Kullanici listesi (Admin) | |
| `POST /iam/User/Detail` | Kullanici detayi | |
| `POST /iam/User/Delete` | Kullanici sil | |
| `POST /iam/User/ForgotPassword` | Sifre sifirlama emaili gonder | ✓ |
| `POST /iam/User/ResetPassword` | Yeni sifre belirle (token ile) | ✓ |
| `POST /iam/User/UpdatePassword` | Mevcut sifreyi degistir | |

### Lokasyon

| Endpoint | Amac | Public |
|----------|------|--------|
| `POST /iam/Countries/All` | Ulke listesi | ✓ |
| `POST /iam/Provinces/All` | Il listesi | |
| `POST /iam/Districts/ByProvince` | Ilce listesi (il'e gore) | |
| `POST /iam/Neighborhoods/ByDistrict` | Mahalle listesi (ilce'ye gore) | |

### Push Notification

| Endpoint | Amac |
|----------|------|
| `POST /iam/Push/RegisterToken` | Push token kaydet (Firebase/APNs) |

---

## FileProvider Modulu (Dosya Yonetimi)

### Dosya Islemleri

| Endpoint | Amac |
|----------|------|
| `POST /fileprovider/File/Upload` | Dosya yukle |
| `POST /fileprovider/File/Delete` | Dosya sil |
| `POST /fileprovider/Bucket/Detail` | Bucket detayi |
| `POST /fileprovider/Bucket/Copy` | Bucket kopyala |

---

## LivestockTrading Modulu (Is Mantigi)

### Products (Urunler/Ilanlar)

**Amac:** Hayvan, yem, tohum, makine vb. urun ilanlari yonetimi.

| Endpoint | Amac | Rol |
|----------|------|-----|
| `POST /Products/Create` | Yeni ilan olustur | Seller |
| `POST /Products/Update` | Ilani guncelle | Seller (sahibi) |
| `POST /Products/Delete` | Ilani sil | Seller (sahibi) |
| `POST /Products/All` | Ilan listesi (sayfalama, filtreleme) | Herkes |
| `POST /Products/Detail` | Ilan detayi | Herkes |
| `POST /Products/Pick` | Dropdown icin ilan listesi | Herkes |
| `POST /Products/Approve` | Ilani onayla | Moderator |
| `POST /Products/Reject` | Ilani reddet (sebep ile) | Moderator |

#### Urun Olusturma (Products/Create)

**ONEMLI:** Urun olusturmak icin `locationId` alani **ZORUNLUDUR** ve gecerli bir GUID formatinda olmalidir.

**Adim 1: Once Location olusturun**

```typescript
// Urun icin konum olustur
const location = await LivestockTradingAPI.Locations.Create.Request({
  name: 'Ciftlik Konumu',
  addressLine1: 'Ornek Mahallesi, No: 123',
  addressLine2: '',
  city: 'Konya',
  state: 'Konya',
  postalCode: '42000',
  countryCode: 'TR',              // ISO 3166-1 alpha-2 (TR, US, DE vb.)
  latitude: 37.8746,              // Opsiyonel - harita icin
  longitude: 32.4932,             // Opsiyonel - harita icin
  phone: '+905551234567',
  email: 'ciftlik@example.com',
  type: 0,                        // 0: ProductLocation
  isActive: true
});

const locationId = location.id;   // Bu ID'yi urun olustururken kullanin
```

**Adim 2: Urunu locationId ile olusturun**

```typescript
const product = await LivestockTradingAPI.Products.Create.Request({
  title: 'Satilik Holstein Inek',
  slug: 'satilik-holstein-inek',
  description: 'Detayli aciklama...',
  shortDescription: 'Kisa aciklama',
  categoryId: 'category-uuid',     // ZORUNLU - Gecerli GUID
  brandId: null,                   // Opsiyonel
  basePrice: 50000,
  currency: 'TRY',
  discountedPrice: null,
  priceUnit: 'adet',
  stockQuantity: 5,
  stockUnit: 'adet',
  minOrderQuantity: 1,
  maxOrderQuantity: 5,
  isInStock: true,
  sellerId: 'seller-uuid',         // ZORUNLU - Gecerli GUID
  locationId: locationId,          // ZORUNLU - Gecerli GUID (yukarida olusturulan)
  status: 1,                       // 1: Active
  condition: 0,                    // 0: New
  isShippingAvailable: false,
  shippingCost: null,
  isInternationalShipping: false,
  weight: null,
  weightUnit: null,
  attributes: null,
  metaTitle: 'SEO baslik',
  metaDescription: 'SEO aciklama',
  metaKeywords: 'inek, holstein, satilik'
});
```

**HATA:** Eger `locationId` icin gecersiz bir deger gonderirseniz (bos string, null, veya GUID formatinda olmayan bir deger), asagidaki hatayi alirsiniz:

```
System.Text.Json.JsonException: The JSON value could not be converted to System.Guid. Path: $.locationId
```

**Cozum:** `locationId` icin gecerli bir GUID gonderdiginizden emin olun:
- Gecerli format: `"3fa85f64-5717-4562-b3fc-2c963f66afa6"`
- Gecersiz formatlar: `""`, `null`, `"not-a-guid"`, `123`

**Location Type Degerleri:**
| Deger | Anlam | Kullanim |
|-------|-------|----------|
| 0 | ProductLocation | Urun konumu |
| 1 | FarmLocation | Ciftlik konumu |
| 2 | UserAddress | Kullanici adresi |
| 3 | WarehouseLocation | Depo konumu |
| 4 | ShippingAddress | Teslimat adresi |
| 5 | BillingAddress | Fatura adresi |

**Ornek Kullanim - Listeleme:**
```typescript
// Ilan listesi - ulkeye gore filtreleme
const products = await LivestockTradingAPI.Products.All.Request({
  countryCode: 'TR', // Turkiye ilanlari
  sorting: { key: 'createdAt', direction: 0 }, // En yeni
  filters: [
    { key: 'status', type: 'equal', isUsed: true, values: [1] } // Aktif
  ],
  pageRequest: { currentPage: 1, perPageCount: 20, listAll: false }
});
```

### Categories (Kategoriler)

**Amac:** Urun kategorileri (Buyukbas, Kucukbas, Yem, Tohum vb.)

| Endpoint | Amac |
|----------|------|
| `POST /Categories/All` | Kategori listesi (coklu dil destekli) |
| `POST /Categories/Detail` | Kategori detayi |
| `POST /Categories/Pick` | Dropdown icin kategoriler |
| `POST /Categories/Create` | Kategori olustur (Moderator) |
| `POST /Categories/Update` | Kategori guncelle (Moderator) |
| `POST /Categories/Delete` | Kategori sil (Moderator) |

**Ornek Kullanim:**
```typescript
// Kategorileri Turkce olarak getir
const categories = await LivestockTradingAPI.Categories.All.Request({
  languageCode: 'tr',
  pageRequest: { currentPage: 1, perPageCount: 100, listAll: true }
});
```

### Sellers (Saticilar)

**Amac:** Satis yapan kullanicilarin profilleri, ciftlik bilgileri.

| Endpoint | Amac | Rol |
|----------|------|-----|
| `POST /Sellers/Create` | Satici profili olustur | Buyer -> Seller |
| `POST /Sellers/Update` | Profil guncelle | Seller (sahibi) |
| `POST /Sellers/All` | Satici listesi | Herkes |
| `POST /Sellers/Detail` | Satici detayi | Herkes |
| `POST /Sellers/Verify` | Saticiyi dogrula | Moderator |
| `POST /Sellers/Suspend` | Saticiyi askiya al | Moderator |

**ONEMLI:** Urun olusturmadan once Seller profili olusturulmalidir. Kullanicinin Seller ROLU olmasi yeterli degildir, ayrica Seller ENTITY'si de olmalidir.

**Ornek - Seller Profili Kontrolu ve Olusturma:**
```typescript
// Urun olusturmadan once seller profili kontrol et
let sellerId: string;

try {
  // Mevcut seller profili var mi kontrol et
  const sellerResponse = await LivestockTradingAPI.Sellers.Detail.Request({
    id: user.id,
  });
  sellerId = sellerResponse.id;
} catch {
  // Seller profili yoksa olustur
  const newSeller = await LivestockTradingAPI.Sellers.Create.Request({
    userId: user.id,
    businessName: user.displayName || "My Business",
    businessType: "Individual",
    taxNumber: "",
    registrationNumber: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    email: user.email || "",
    phone: "",
    website: "",
    isActive: true,
    status: 0,
    businessHours: "",
    acceptedPaymentMethods: "",
    returnPolicy: "",
    shippingPolicy: "",
    socialMediaLinks: "",
  });
  sellerId = newSeller.id;
}

// Artik sellerId ile urun olusturabilirsiniz
await LivestockTradingAPI.Products.Create.Request({
  // ...
  sellerId: sellerId,
  // ...
});
```

### Transporters (Nakliyeciler)

**Amac:** Hayvan tasimaciligi yapan kullanicilarin profilleri.

| Endpoint | Amac | Rol |
|----------|------|-----|
| `POST /Transporters/Create` | Nakliyeci profili olustur | |
| `POST /Transporters/Update` | Profil guncelle | Transporter (sahibi) |
| `POST /Transporters/All` | Nakliyeci listesi | Herkes |
| `POST /Transporters/Detail` | Nakliyeci detayi | Herkes |
| `POST /Transporters/Verify` | Nakliyeciyi dogrula | Moderator |
| `POST /Transporters/Suspend` | Nakliyeciyi askiya al | Moderator |

### Farms (Ciftlikler)

**Amac:** Saticilarin ciftlik bilgileri (konum, kapasite vb.)

| Endpoint | Amac |
|----------|------|
| `POST /Farms/Create` | Ciftlik ekle |
| `POST /Farms/Update` | Ciftlik guncelle |
| `POST /Farms/Delete` | Ciftlik sil |
| `POST /Farms/All` | Ciftlik listesi |
| `POST /Farms/Detail` | Ciftlik detayi |

### Conversations & Messages (Mesajlasma)

**Amac:** Alici-satici arasi mesajlasma sistemi.

| Endpoint | Amac |
|----------|------|
| `POST /Conversations/Create` | Yeni konusma baslat |
| `POST /Conversations/All` | Konusma listesi |
| `POST /Conversations/Detail` | Konusma detayi |
| `POST /Messages/Create` | Mesaj gonder |
| `POST /Messages/All` | Mesaj listesi |
| `POST /Messages/Update` | Mesaji guncelle (okundu) |
| `POST /Messages/SendTypingIndicator` | "Yaziyor..." gostergesi |

**Ornek - Konusma Baslatma:**
```typescript
// Ilan sahibine mesaj gondermek icin konusma baslat
const conversation = await LivestockTradingAPI.Conversations.Create.Request({
  participantUserId2: sellerId, // Ilan sahibi
  productId: productId,         // Ilgili ilan
  subject: 'Ilan hakkinda soru'
});

// Mesaj gonder
await LivestockTradingAPI.Messages.Create.Request({
  conversationId: conversation.id,
  content: 'Merhaba, bu ilan hala gecerli mi?',
  attachmentUrls: null
});
```

### Offers (Teklifler)

**Amac:** Urunler icin fiyat teklifi sistemi.

| Endpoint | Amac |
|----------|------|
| `POST /Offers/Create` | Teklif ver |
| `POST /Offers/Update` | Teklifi guncelle (kabul/red) |
| `POST /Offers/All` | Teklif listesi |
| `POST /Offers/Detail` | Teklif detayi |

### Favorite Products (Favoriler)

**Amac:** Kullanicilarin favori ilanlari.

| Endpoint | Amac |
|----------|------|
| `POST /FavoriteProducts/Create` | Favorilere ekle |
| `POST /FavoriteProducts/Delete` | Favorilerden cikar |
| `POST /FavoriteProducts/All` | Favori listesi |

**Ornek:**
```typescript
// Favorilere ekle
await LivestockTradingAPI.FavoriteProducts.Create.Request({
  productId: 'product-uuid'
});

// Favorileri listele
const favorites = await LivestockTradingAPI.FavoriteProducts.All.Request({
  pageRequest: { currentPage: 1, perPageCount: 20, listAll: false }
});
```

### Product Reviews (Urun Degerlendirmeleri)

**Amac:** Urunler icin yorum ve puanlama.

| Endpoint | Amac |
|----------|------|
| `POST /ProductReviews/Create` | Degerlendirme yaz |
| `POST /ProductReviews/Update` | Degerlendirme guncelle |
| `POST /ProductReviews/Delete` | Degerlendirme sil |
| `POST /ProductReviews/All` | Degerlendirme listesi |

### Seller Reviews (Satici Degerlendirmeleri)

**Amac:** Saticilara puan ve yorum.

| Endpoint | Amac |
|----------|------|
| `POST /SellerReviews/Create` | Satici degerlendirmesi yaz |
| `POST /SellerReviews/All` | Satici degerlendirmeleri |

### Transport System (Nakliye Sistemi)

**Amac:** Hayvan nakli talep ve teklif sistemi.

| Endpoint | Amac |
|----------|------|
| `POST /TransportRequests/Create` | Nakliye talebi olustur |
| `POST /TransportRequests/All` | Talepler listesi |
| `POST /TransportOffers/Create` | Nakliye teklifi ver |
| `POST /TransportOffers/All` | Teklifler listesi |
| `POST /TransportTrackings/All` | Nakliye takip |

### Product Media (Urun Medyalari)

| Endpoint | Amac |
|----------|------|
| `POST /ProductImages/Create` | Urun resmi ekle |
| `POST /ProductImages/All` | Resim listesi |
| `POST /ProductVideos/Create` | Urun videosu ekle |
| `POST /ProductDocuments/Create` | Urun dokumani ekle |

### Product Details (Urun Detaylari)

| Endpoint | Amac |
|----------|------|
| `POST /AnimalInfos/Create` | Hayvan bilgisi (irk, yas, kilo vb.) |
| `POST /HealthRecords/Create` | Saglik kaydi |
| `POST /Vaccinations/Create` | Asi kaydi |
| `POST /VeterinaryInfos/Create` | Veteriner bilgisi |
| `POST /FeedInfos/Create` | Yem bilgisi |
| `POST /SeedInfos/Create` | Tohum bilgisi |
| `POST /MachineryInfos/Create` | Makine bilgisi |
| `POST /ChemicalInfos/Create` | Kimyasal bilgisi |

### Locations (Konumlar)

**Amac:** Urunler, ciftlikler ve kullanicilar icin konum/adres yonetimi. Cok ulkeli filtreleme icin kritik bir entity.

| Endpoint | Amac |
|----------|------|
| `POST /Locations/Create` | Yeni konum olustur |
| `POST /Locations/Update` | Konum guncelle |
| `POST /Locations/Delete` | Konum sil |
| `POST /Locations/All` | Konum listesi |
| `POST /Locations/Detail` | Konum detayi |
| `POST /Locations/Pick` | Dropdown icin konumlar |

**Ornek - Konum Olusturma:**
```typescript
const location = await LivestockTradingAPI.Locations.Create.Request({
  name: 'Ana Ciftlik',
  addressLine1: 'Merkez Mahallesi, Ciftlik Yolu No: 45',
  addressLine2: '',
  city: 'Konya',
  state: 'Konya',
  postalCode: '42000',
  countryCode: 'TR',              // ISO 3166-1 alpha-2
  latitude: 37.8746,
  longitude: 32.4932,
  phone: '+905551234567',
  email: 'ciftlik@example.com',
  type: 0,                        // 0: ProductLocation
  isActive: true
});

// Olusturulan location.id'yi urun olustururken kullanin
```

**Location Type Enum:**
| Deger | Tip | Aciklama |
|-------|-----|----------|
| 0 | ProductLocation | Urun satildigi konum |
| 1 | FarmLocation | Ciftlik adresi |
| 2 | UserAddress | Kullanici ev adresi |
| 3 | WarehouseLocation | Depo adresi |
| 4 | ShippingAddress | Teslimat adresi |
| 5 | BillingAddress | Fatura adresi |

**Ulke Kodlari (CountryCode):**
ISO 3166-1 alpha-2 formatinda olmalidir:
- Turkiye: `TR`
- Almanya: `DE`
- Amerika: `US`
- Ingiltere: `GB`
- Fransa: `FR`

Tam liste: [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

---

### System (Sistem Verileri)

| Endpoint | Amac |
|----------|------|
| `POST /Currencies/All` | Para birimi listesi |
| `POST /Languages/All` | Dil listesi |
| `POST /TaxRates/All` | Vergi oranlari |
| `POST /Banners/All` | Ana sayfa banner'lari |
| `POST /FAQs/All` | Sikca sorulan sorular |
| `POST /ShippingCarriers/All` | Kargo firmalari |
| `POST /ShippingZones/All` | Kargo bolgeleri |
| `POST /ShippingRates/All` | Kargo ucretleri |
| `POST /PaymentMethods/All` | Odeme yontemleri |

### User Activity (Kullanici Aktiviteleri)

| Endpoint | Amac |
|----------|------|
| `POST /ProductViewHistories/Create` | Urun goruntulemesi kaydet |
| `POST /SearchHistories/Create` | Arama gecmisi kaydet |
| `POST /UserPreferences/Update` | Kullanici tercihleri guncelle |
| `POST /Notifications/All` | Bildirim listesi |

---

## Endpoint Turleri ve Kullanim Kaliplari

### 1. All (Listeleme)

Sayfalama, siralama ve filtreleme destekler.

```typescript
const response = await API.Entity.All.Request({
  countryCode: 'TR',                    // Ulke filtresi (opsiyonel)
  languageCode: 'tr',                   // Dil (opsiyonel)
  sorting: {
    key: 'createdAt',                   // Siralama alani
    direction: 0                        // 0: Descending, 1: Ascending
  },
  filters: [
    {
      key: 'status',
      type: 'equal',                    // equal, contains, range
      isUsed: true,
      values: [1],                      // Degerler
      min: null,
      max: null,
      conditionType: 'and'              // and, or
    }
  ],
  pageRequest: {
    currentPage: 1,
    perPageCount: 20,
    listAll: false                      // true: tum kayitlar
  }
});

// Response
const items = response.data;            // Kayit listesi
const page = response.page;             // Sayfa bilgisi
```

### 2. Detail (Tekil Kayit)

```typescript
const response = await API.Entity.Detail.Request({
  id: 'entity-uuid'
});
```

### 3. Pick (Dropdown)

Arama ve secili deger destekler.

```typescript
const response = await API.Entity.Pick.Request({
  selectedIds: ['uuid1', 'uuid2'],      // Onceden secili degerler
  keyword: 'ara',                        // Arama metni
  limit: 10                              // Maksimum sonuc
});
```

### 4. Create (Olusturma)

```typescript
const response = await API.Entity.Create.Request({
  // Entity alanlari
  name: 'Yeni Kayit',
  // ...
});

console.log(response.id);               // Olusturulan kayit ID'si
```

### 5. Update (Guncelleme)

```typescript
const response = await API.Entity.Update.Request({
  id: 'entity-uuid',
  // Guncellenecek alanlar
  name: 'Yeni Isim'
});
```

### 6. Delete (Silme)

```typescript
const response = await API.Entity.Delete.Request({
  id: 'entity-uuid'
});
```

---

## Ozel Endpoint'ler

### Moderasyon (Admin/Moderator)

```typescript
// Urunu onayla
await LivestockTradingAPI.Products.Approve.Request({ id: productId });

// Urunu reddet
await LivestockTradingAPI.Products.Reject.Request({
  id: productId,
  reason: 'Uygunsuz icerik'
});

// Saticiyi dogrula
await LivestockTradingAPI.Sellers.Verify.Request({ id: sellerId });

// Saticiyi askiya al
await LivestockTradingAPI.Sellers.Suspend.Request({
  id: sellerId,
  reason: 'Kural ihlali'
});
```

### Typing Indicator (Yaziyor Gostergesi)

```typescript
await LivestockTradingAPI.Messages.SendTypingIndicator.Request({
  conversationId: 'conv-uuid',
  isTyping: true
});
```

---

## Enum Degerleri

### Product Status
| Deger | Anlam |
|-------|-------|
| 0 | Draft (Taslak) |
| 1 | Active (Aktif) |
| 2 | Sold (Satildi) |
| 3 | Expired (Suresi Doldu) |
| 4 | PendingApproval (Onay Bekliyor) |
| 5 | Approved (Onaylandi) |
| 6 | Rejected (Reddedildi) |

### Seller/Transporter Status
| Deger | Anlam |
|-------|-------|
| 0 | Pending (Onay Bekliyor) |
| 1 | Verified (Dogrulandi) |
| 2 | Suspended (Askiya Alindi) |

### Offer Status
| Deger | Anlam |
|-------|-------|
| 0 | Pending (Beklemede) |
| 1 | Accepted (Kabul Edildi) |
| 2 | Rejected (Reddedildi) |
| 3 | Countered (Karsi Teklif) |
| 4 | Expired (Suresi Doldu) |

### Conversation Status
| Deger | Anlam |
|-------|-------|
| 0 | Active (Aktif) |
| 1 | Archived (Arsivlendi) |
| 2 | Blocked (Engellendi) |

### Client Platform
| Deger | Anlam |
|-------|-------|
| 0 | Web |
| 1 | Mobile (Android/iOS) |
| 2 | Service |

---

## API Istatistikleri

| Modul | Endpoint Sayisi |
|-------|-----------------|
| IAM | 23 |
| FileProvider | 7 |
| LivestockTrading | 200+ |
| **Toplam** | **230+** |

---

## Backend Gelistirme Talimatlari

Bu bolum, frontend testleri sirasinda tespit edilen sorunlari ve onerilen cozumleri icerir.

### 1. Slug Benzersizligi (KRITIK)

**Sorun:** `Products` tablosunda `slug` alani unique degildir. Ayni slug'a sahip birden fazla urun olusturulabilir.

**Etki:** Frontend `/products/{slug}` URL'i ile urun detayini gosterirken yanlis urunu gosterebilir.

**Cozum:**
```sql
ALTER TABLE Products ADD CONSTRAINT UQ_Products_Slug UNIQUE (slug);
```

### 2. Seller Profili Otomatik Olusturma

**Mevcut Durum:** Kullaniciya `LivestockTrading.Seller` rolu atandiginda, veritabaninda otomatik olarak `Seller` entity'si olusturulmuyor.

**Etki:** Kullanici Seller rolune sahip olsa bile, urun olusturamaz cunku `Seller` kaydi yok.

**Onerilen Cozum:** Rol atandiginda veya `Products.Create` cagrildiginda otomatik Seller olusturma:
```csharp
// Products.Create icinde
var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == currentUserId);
if (seller == null)
{
    seller = await _sellerService.CreateAsync(new CreateSellerRequest
    {
        UserId = currentUserId,
        BusinessName = user.DisplayName,
        BusinessType = "Individual",
        Email = user.Email,
        IsActive = true,
        Status = 0
    });
}
// Sonra product.SellerId = seller.Id olarak kullan
```

### 3. Products.DetailBySlug Endpoint Onerisi

**Mevcut Durum:** `Products.Detail` endpoint'i sadece `id` (GUID) kabul ediyor.

**Etki:** Frontend URL'de slug kullaniyor, her seferinde once slug ile arama yapmak zorunda kaliyor (2 API cagirisi).

**Onerilen Cozum:**
```csharp
[HttpPost("DetailBySlug")]
public async Task<ProductDetailResponse> DetailBySlug(DetailBySlugRequest request)
{
    var product = await _context.Products
        .Include(p => p.Seller)
        .Include(p => p.Category)
        .Include(p => p.Images)
        .FirstOrDefaultAsync(p => p.Slug == request.Slug);

    if (product == null)
        throw new NotFoundException("PRODUCT_NOT_FOUND");

    return MapToDetailResponse(product);
}
```

### 4. Sellers.DetailByUserId Endpoint Onerisi

**Mevcut Durum:** `Sellers.Detail` endpoint'i sadece `sellerId` kabul ediyor.

**Etki:** Frontend, kullanicinin seller profilini bulmak icin `Sellers.All` ile filtreleme yapmak zorunda kaliyor.

**Onerilen Cozum:**
```csharp
[HttpPost("DetailByUserId")]
public async Task<SellerDetailResponse> DetailByUserId(DetailByUserIdRequest request)
{
    var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == request.UserId);
    if (seller == null)
        throw new NotFoundException("SELLER_NOT_FOUND");
    return MapToDetailResponse(seller);
}
```

### 5. Oncelik Tablosu

| Oncelik | Konu | Etki |
|---------|------|------|
| KRITIK | Slug benzersizligi | Yanlis urun gosterme riski |
| YUKSEK | Seller otomatik olusturma | Kullanici deneyimi |
| ORTA | DetailBySlug endpoint | Performans (2 API yerine 1) |
| DUSUK | DetailByUserId endpoint | Performans |

**Son Guncelleme:** 2026-02-03
