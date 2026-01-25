# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview

This is a **Next.js 16 App Router** web application for a livestock trading platform (livestock-trading.com), built with React 19 and TypeScript.

### Directory Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - React components (organized by `features/` and `layout/`)
- `lib/` - Utility functions (`cn()` for Tailwind class merging)
- `common/livestock-api/` - Shared API layer (auto-generated, shared with mobile app)

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

## Tech Stack

- **UI**: Tailwind CSS v4, shadcn/ui (new-york style), Lucide icons
- **State**: Zustand (global), React Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Notifications**: Sonner (toasts)
- **Real-time**: SignalR

## Conventions

- Error messages displayed to users are in Turkish (see `common/livestock-api/src/errors/locales/`)
- Use `cn()` from `lib/utils` for conditional Tailwind classes
- Follow shadcn/ui patterns for new components (add via `npx shadcn@latest add <component>`)
