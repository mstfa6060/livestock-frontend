# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Priority: TASKS.md (Birlesik Gorev Listesi)

When starting a new chat without a specific task, refer to `../TASKS.md` in the parent directory (`d:\Projects\GlobalLivestock\TASKS.md`). This is the **unified task list** across all three projects (web, mobil, backend). Work through the unchecked items in priority order.

Additional project-specific references:
- `PROJECT-ANALYSIS.md` — Web project analysis (pages, components, UX scoring)
- `TECHNICAL-DEBT.md` — Technical debt items (all completed)

## Build and Development Commands

```bash
npm run dev:start        # Kill port 3000, clean locks, start dev server (RECOMMENDED)
npm run dev              # Start development server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run translate:all    # Translate tr.json to all 50 languages
npm run translate:missing # Translate only missing languages
npm run translate -- en  # Translate to a specific language
```

## Architecture Overview

This is a **Next.js 16 App Router** web application for a livestock trading platform (livestock-trading.com), built with React 19 and TypeScript.

### Directory Structure

- `app/[locale]/` - Next.js App Router pages with i18n routing
- `components/` - React components (organized by `features/` and `layout/`)
- `lib/` - Utility functions (`cn()` for Tailwind class merging)
- `common/livestock-api/` - Shared API layer (auto-generated, shared with mobile app)
- `messages/` - Translation JSON files (tr.json, en.json, de.json, etc.)
- `i18n/` - Internationalization configuration
- `scripts/` - Utility scripts (translation, etc.)

### Path Aliases (tsconfig.json)

```typescript
@/*           → ./*                                    // Root project files
@/config/*    → ./common/livestock-api/src/config/*    // API configuration
@/services/*  → ./common/livestock-api/src/services/*  // API services
@/errors/*    → ./common/livestock-api/src/errors/*    // Error translations
@/api/*       → ./common/livestock-api/src/api/*       // Auto-generated API endpoints

// Legacy aliases (used by ApiService.ts)
@config/*     → ./common/livestock-api/src/config/*
@services/*   → ./common/livestock-api/src/services/*
@errors/*     → ./common/livestock-api/src/errors/*
```

### API Layer (`common/livestock-api/`)

**DO NOT EDIT** files in `common/livestock-api/src/api/` - they are auto-generated from the backend.

**IMPORTANT**: Read `common/API-INTEGRATION.md` for detailed API integration documentation. This file is maintained by the backend team and contains:
- Authentication flows (login, register, logout, password reset)
- Token management (JWT, refresh tokens)
- API usage patterns (CRUD operations, pagination, filtering)
- Error handling
- File upload
- Example code (AuthContext, Protected routes)

Always consult this documentation when implementing API integrations.

Structure:
- `src/api/business_modules/` - Business module endpoints (e.g., `livestocktrading`)
- `src/api/base_modules/` - Core module endpoints (e.g., `iam`, `FileProvider`)
- `src/config/livestock-config.ts` - API configuration and axios instance
- `src/services/ApiService.ts` - HTTP request wrapper with token refresh
- `src/errors/locales/` - Turkish error message translations

API calls use namespace pattern:
```typescript
import { IAMAPI } from '@/api/base_modules/iam';

// Making an API call
const user = await IAMAPI.Users.Detail.Request({ userId: 'xxx' });
```

### Environment Configuration

- Development: `https://dev-api.livestock-trading.com` (set `NEXT_PUBLIC_ENVIRONMENT=development`)
- Production: `https://api.livestock-trading.com`

### Infrastructure (Cloudflare DNS → 45.143.4.64)

| Subdomain | URL | Purpose |
|-----------|-----|---------|
| `api` | api.livestock-trading.com | Production API |
| `dev-api` | dev-api.livestock-trading.com | Development API |
| `dev` | dev.livestock-trading.com | Development frontend |
| `www` | www.livestock-trading.com | Production frontend (CNAME → root) |
| `minio` | minio.livestock-trading.com | Object storage (S3-compatible) |
| `rabbitmq` | rabbitmq.livestock-trading.com | Message queue |
| `jenkins` | jenkins.livestock-trading.com | CI/CD |

### Authentication

- Tokens stored in localStorage: `jwt`, `accessToken`, `refreshToken`
- Automatic token refresh on 401 responses
- Redirects to `/auth/login` when session expires
- Login providers: `native` (email/password), `google`, `apple`
- See `common/API-INTEGRATION.md` for complete auth flow documentation

**Administrator Accounts** (configured on backend):
- `nagehanyazici13@gmail.com` - Administrator role
- `m.mustafaocak@gmail.com` - Administrator role

## Internationalization (i18n)

The app supports **50 languages** using `next-intl`. Turkish (tr) is the source language for development.

### Configuration Files
- `i18n/config.ts` - Supported locales and default locale (en)
- `i18n/request.ts` - next-intl server configuration
- `middleware.ts` - Locale routing middleware

### Translation Files
Located in `messages/` folder:
- `tr.json` - Turkish (SOURCE - develop in this file)
- `en.json` - English
- `de.json` - German
- ... (50 languages total)

### Using Translations in Components
```typescript
"use client";
import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations("auth.login");  // Namespace
  const tc = useTranslations("common");     // Common translations

  return <h1>{t("title")}</h1>;  // Accesses auth.login.title
}
```

### URL Structure
- `/` or `/en` - English (default)
- `/tr` - Turkish
- `/de/login` - German login page

### Adding New Translations
1. Add Turkish text to `messages/tr.json`
2. **DO NOT** run translation scripts automatically - user will run manually when needed
3. Or run `npm run translate -- en` for specific language (only when requested)

### Translation Script
`scripts/translate-all.js` uses Google Cloud Translation API to auto-translate from Turkish to all supported languages.

**⚠️ IMPORTANT - DO NOT RUN TRANSLATION SCRIPTS AUTOMATICALLY:**
- Translation scripts consume Google Cloud Translation API credits
- **NEVER** run `npm run translate:all` or `npm run translate:missing` unless explicitly requested by the user
- Only add new keys to `messages/tr.json` - the user will handle translations manually
- If user asks to translate, confirm before running as it affects 50 languages

## Tech Stack

- **UI**: Tailwind CSS v4, shadcn/ui (new-york style), Lucide icons
- **State**: Zustand (global), React Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Notifications**: Sonner (toasts)
- **Real-time**: SignalR
- **i18n**: next-intl (50 languages)

## Test Ekibi (Regresyon / E2E Test)

"Regresyon testi yap", "hazır ekiple test et" veya "test ekibini kur" denildiğinde bu kullanıcılarla SSH üzerinden API çağrıları yaparak test et.

### Test Kullanıcıları

| Rol | Username | Email | Şifre | UserId | Login |
|-----|----------|-------|-------|--------|-------|
| Admin/Seller | mocak | m.mustafaocak@gmail.com | Deneme123. | 0e6bc908-3887-46ac-b751-b39150eb7552 | ✅ |
| Buyer | mustafaocak | mustafaocak89@hotmail.com | Deneme123. | 6d8a045c-0196-448b-aa59-ce6360b32404 | ✅ |
| Admin/Seller | nagehanyzc | nagehanyazici13@gmail.com | ? | bb6b27e4-50cc-4744-a51f-8f68ea4cfcb4 | ❌ |
| Seller/Buyer | aliyilmaz | ali.yilmaz@test.com | Test1234. | 11f1308c-f0f9-4a8e-ad5a-ebd211957376 | ❌ |
| Buyer | mehmetdemir | mehmet.demir@test.com | Test1234. | 91e3c6e4-7783-4fa9-9745-e5047975b615 | ❌ |
| Buyer | aysekaya | ayse.kaya@test.com | Test1234. | 8e7f81f4-7fb2-4fa1-ac15-86b9a41db719 | ❌ |
| Buyer | test@test.com | test@test.com | ? | 2ebd83d2-1d84-47f5-984f-31746d9a080a | ❌ |

> ✅ = native login ile giriş yapabilir, ❌ = şifre farklı veya Google/Apple ile oluşturulmuş

### Test Akışı (Marketplace E2E)
1. Tüm kullanıcılarla login ol, JWT token'ları tut
2. **aliyilmaz**: Seller profili + Location + Product oluştur (status:0 Draft)
3. **aliyilmaz**: Ürünü onaya gönder (status:1 PendingApproval)
4. **mocak** (admin): Ürünü onayla (Products/Approve → status:2 Active)
5. **mehmetdemir**: Teklif ver (Offers/Create, düşük fiyat)
6. **aysekaya**: Daha yüksek teklif ver (Offers/Create)
7. **aliyilmaz**: Yüksek teklifi kabul et, düşük teklifi reddet (Offers/Update)
8. **QA**: DB kontrolü, SellerUserId doğruluğu, notification log kontrolü

### Ekip Yapısı (2 agent)
- **executor**: Sıralı marketplace akışını yürütür
- **qa-monitor**: Tüm adımlar bittikten sonra DB + API doğrulaması yapar

### API Çağrı Formatı
```bash
ssh -o BatchMode=yes hirovo-server "curl -s -X POST https://dev-api.livestock-trading.com/[path] -H 'Content-Type: application/json' -H 'Authorization: Bearer [JWT]' -d '{...}'"
```

### Login
```bash
POST /iam/Auth/Login → {"provider":"native", "userName":"[username]", "password":"[pass]", "platform":0}
```

## Conventions

- **UI Development Language**: Turkish - Add new UI text to `messages/tr.json`, then run translation script
- **API Error Messages**: Turkish (see `common/livestock-api/src/errors/locales/`)
- Use `cn()` from `lib/utils` for conditional Tailwind classes
- Follow shadcn/ui patterns for new components (add via `npx shadcn@latest add <component>`)
- All user-facing text must use `useTranslations()` hook - no hardcoded strings
