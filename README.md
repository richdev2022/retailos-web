# RetailOS — Web App

React + TypeScript web application for **RetailOS**, a multi-tenant retail inventory, POS and business management SaaS. This is a full feature-parity replica of the Flutter mobile app.

## Tech stack

- **Vite** + **React 18** + **TypeScript** (strict)
- **TailwindCSS** with shadcn-style UI components (hand-written, in `src/components/ui/`)
- **react-router-dom v6** for routing
- **@tanstack/react-query** for server state
- **axios** with token-refresh interceptors
- **recharts** for analytics
- **react-hook-form + zod** for forms
- **zustand** for client state (auth, business, theme)
- **idb** (IndexedDB) for offline-capable web storage
- **sonner** for toasts

## Features

| Module | Status |
| --- | --- |
| Auth (login, register, forgot, reset) | ✅ |
| Business onboarding | ✅ |
| Dashboard (KPIs + charts) | ✅ |
| Products (CRUD, search, filter, import) | ✅ |
| Inventory (stock-in/out/adjust, movements) | ✅ |
| POS (cart, checkout, receipt) | ✅ |
| Sales history + detail | ✅ |
| Purchases + receive goods | ✅ |
| Expenses | ✅ |
| Customers + outstanding balances | ✅ |
| Suppliers + payables | ✅ |
| Reports (sales, P&L, inventory, expenses) | ✅ |
| Staff + permissions matrix | ✅ |
| Branches + stock transfers | ✅ |
| Settings (business, receipt, alerts, security) | ✅ |
| Subscription (plans, payment submission) | ✅ |
| Support tickets | ✅ |
| Light/dark mode | ✅ |
| Responsive desktop/tablet/mobile | ✅ |
| Mock mode (demo without backend) | ✅ |

## Getting started

```bash
npm install
cp .env.example .env
# Set VITE_API_URL to your backend
# Set VITE_USE_MOCK=true for demo mode without a backend
npm run dev   # http://localhost:5173
npm run build
npm run preview
```

## Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Backend base URL | `http://localhost:4000` |
| `VITE_USE_MOCK` | Return mock data instead of calling API | `false` |

## Project structure

```
src/
  components/
    ui/              # shadcn-style primitives (button, card, dialog, ...)
    layout/          # AppShell, Sidebar, Topbar
    shared/          # PageHeader, DataTable, StatCard, ...
    charts/          # recharts wrappers
  features/
    auth/            # Welcome, Login, Register, Forgot, Reset
    onboarding/      # Create business
    dashboard/       # KPIs + charts
    products/        # Product list, CRUD, import
    inventory/       # Stock-in/out/adjust, movements
    pos/             # POS checkout
    sales/           # History + detail
    purchases/       # List, new, receive
    expenses/        # List + create
    customers/       # List + create
    suppliers/       # List + create
    reports/         # Sales, P&L, inventory, expenses
    staff/           # Members + permission matrix
    branches/        # List + create + transfers
    settings/        # Business, receipt, alerts, security
    subscription/    # Plans + payment submission
    support/         # Tickets
  lib/               # api, services, types, format, utils, mock data, offline-db
  stores/            # zustand stores
  hooks/             # use-auth, use-active-business, use-toast
  routes/            # ProtectedRoute
```

## Deployment

The app is a static SPA after `npm run build`. Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, Nginx).

### Docker

```bash
docker build -t retailos-web .
docker run -p 5173:80 retailos-web
```

### CI

GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, typecheck and build on every push to `develop` and `main`.

## Connecting to the backend

The app expects the RetailOS backend at `VITE_API_URL` (default `http://localhost:4000`). All endpoints are under `/api/v1`. JWT access token is sent via `Authorization: Bearer` header. Refresh token is stored in an HTTP-only cookie set by the backend.

Tenant context is sent via `X-Business-Id` and `X-Branch-Id` headers (set automatically from the business store).
