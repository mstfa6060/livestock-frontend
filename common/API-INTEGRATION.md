# Frontend API Entegrasyonu

Bu dokuman, GlobalLivestock backend API'si ile frontend entegrasyonunu aciklar.

## Icindekiler

1. [Kurulum](#kurulum)
2. [Yapilandirma](#yapilandirma)
3. [Kimlik Dogrulama (Authentication)](#kimlik-dogrulama)
4. [API Kullanimi](#api-kullanimi)
5. [Token Yonetimi](#token-yonetimi)
6. [Hata Yonetimi](#hata-yonetimi)
7. [Dosya Yukleme](#dosya-yukleme)
8. [Ornek Kullanim](#ornek-kullanim)

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
