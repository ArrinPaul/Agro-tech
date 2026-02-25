<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Convex-1.31-FF6F00?style=for-the-badge&logo=convex&logoColor=white" alt="Convex" />
  <img src="https://img.shields.io/badge/Clerk-5.60-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

<h1 align="center">🌾 AgroTech</h1>
<h3 align="center">Smart Crop & Warehouse Management Platform</h3>

<p align="center">
  An enterprise-grade, real-time agricultural resource management platform powered by AI-driven insights, smart warehouse allocation, and multi-tenant organization support.
</p>

<p align="center">
  <a href="https://agrotech-platform.vercel.app">🌐 Live Demo</a> •
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Security](#-security)
- [Testing](#-testing)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌍 Overview

**AgroTech** is a comprehensive agricultural management platform built for modern farming operations. It enables organizations to manage warehouses, track crop lifecycles, monitor resource inventory, and receive AI-powered recommendations — all in real time.

### Who Is It For?

| Role | Capabilities |
|------|-------------|
| **Admin** | Full system access, user management, organization settings |
| **Manager** | Warehouse & crop management, allocations, reporting |
| **Operator** | View dashboards, execute allocations, track resources |

### Key Highlights

- **Real-Time Sync** — All data updates instantly across connected clients via Convex WebSocket subscriptions
- **Multi-Tenant** — Complete data isolation between organizations with role-based access control
- **AI-Powered** — Automated warehouse optimization suggestions, resource depletion predictions, crop demand forecasting
- **Production-Ready** — Deployed on Vercel + Convex Cloud with Clerk authentication

---

## ✨ Features

### Core Modules

| Module | Description |
|--------|-------------|
| 📊 **Dashboard** | Real-time widgets, utilization charts, quick actions, AI suggestion cards |
| 🏭 **Warehouse Management** | CRUD operations with capacity tracking, utilization indicators, heatmap visualization |
| 🌱 **Crop Management** | Full lifecycle tracking: `PLANTED → GROWING → HARVESTED → STORED` |
| 🧪 **Resource Management** | Fertilizer & pesticide inventory with stock adjustment and low-stock alerts |
| 🔗 **Allocation Engine** | Smart crop-to-warehouse allocation with capacity & resource validation |
| 📋 **Audit Log** | Immutable log of every action across the platform with filtering & search |
| 📈 **Reports** | 5 comprehensive report types with date filtering, charts, and CSV/PDF export |

### AI & Intelligence

| Feature | Description |
|---------|-------------|
| 🤖 **Warehouse Optimization** | Identifies overutilized/underutilized warehouses and suggests redistribution |
| 📉 **Resource Depletion Prediction** | Forecasts days until stock runs out based on historical consumption |
| 📊 **Crop Demand Forecast** | Seasonal demand modeling with 30/60/90-day projections |
| 💡 **Smart Recommendations** | Ranks top warehouses for new allocations based on capacity and utilization |
| 🔔 **Automated Alerts** | Real-time notifications for critical capacity, low stock, and status changes |

### Advanced Capabilities

- **Bulk Operations** — CSV import/export, batch status updates, multi-select actions
- **PDF Reports** — Server-side PDF generation with jsPDF
- **Dark Mode** — Full dark theme support across all pages and components
- **Responsive Design** — Mobile-first layout optimized for phone, tablet, and desktop
- **Keyboard Navigation** — Accessibility-first with `Ctrl+A`, `Delete`, `Enter` shortcuts
- **Optimistic UI** — Instant visual feedback before server confirmation

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| [React](https://react.dev) | 19.2 | UI framework with hooks & concurrent features |
| [TypeScript](https://typescriptlang.org) | 5.9 | Type-safe development |
| [Vite](https://vitejs.dev) | 7.3 | Ultra-fast build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com) | 4.1 | Utility-first styling |
| [React Router](https://reactrouter.com) | 7.13 | Client-side routing |
| [Recharts](https://recharts.org) | 3.7 | Declarative charting library |
| [Lucide React](https://lucide.dev) | 0.574 | Icon library |
| [jsPDF](https://github.com/parallax/jsPDF) | 4.1 | PDF report generation |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Convex](https://convex.dev) | 1.31 | Serverless backend, real-time database, WebSocket subscriptions |
| [Clerk](https://clerk.com) | 5.60 | Authentication (Email/Password + Google OAuth) |

### DevOps & Testing

| Technology | Purpose |
|-----------|---------|
| [Vercel](https://vercel.com) | Frontend deployment & CDN |
| [Convex Cloud](https://convex.dev) | Backend hosting & database |
| [Playwright](https://playwright.dev) | End-to-end testing |
| [ESLint](https://eslint.org) | Code linting |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                               │
│     React 19 + TypeScript + Tailwind CSS 4 + React Router v7        │
│     ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐      │
│     │    Pages      │  │   Components   │  │    Contexts      │      │
│     │  (16 views)   │──│  (20+ shared)  │──│  (Data, Auth,    │      │
│     │              │  │               │  │   Org, Theme)    │      │
│     └──────────────┘  └────────────────┘  └──────────────────┘      │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ Convex React SDK
                              │ (Real-time WebSocket)
┌─────────────────────────────▼────────────────────────────────────────┐
│                         CONVEX LAYER                                 │
│     Serverless Functions + Real-Time Database + HTTP Actions         │
│     ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐      │
│     │   Queries    │  │   Mutations    │  │   HTTP Actions   │      │
│     │  (Reads)     │  │   (Writes)     │  │  (Webhooks)      │      │
│     └──────────────┘  └────────────────┘  └──────────────────┘      │
│                                                                      │
│     ┌────────────────────────────────────────────────────────┐      │
│     │              Convex Database (10 Tables)               │      │
│     │  users · organizations · warehouses · crops · resources │      │
│     │  allocations · auditLogs · alerts · aiCache · rateLimits│      │
│     └────────────────────────────────────────────────────────┘      │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ Clerk Webhook + JWT
┌─────────────────────────────▼────────────────────────────────────────┐
│                           AUTH LAYER                                 │
│     Clerk Authentication Service                                     │
│     Email/Password · Google OAuth · JWT Tokens · RBAC               │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User signs in** via Clerk → JWT token issued
2. **UserSync component** calls `createOrGetUser` mutation → user record created in Convex
3. **Organization auto-selected** → all queries scoped to `organizationId`
4. **Real-time subscriptions** — Convex pushes updates to all connected clients via WebSocket
5. **Mutations** validate capacity, stock, roles → write to DB → trigger reactive re-renders

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **npm** or **pnpm**
- **Convex account** ([sign up free](https://convex.dev))
- **Clerk account** ([sign up free](https://clerk.com))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/agrotech.git
cd agrotech
```

### 2. Install Dependencies

```bash
npm install           # Installs root + frontend deps (via postinstall)
```

### 3. Configure Environment Variables

```bash
# Copy the example env file
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_KEY
VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
```

### 4. Configure Convex Authentication

Create the file `convex/auth.config.ts` (**critical for data sync**):

```typescript
export default {
  providers: [
    {
      domain: "https://your-clerk-domain.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
```

> Replace `your-clerk-domain` with your actual Clerk frontend API domain found in Clerk Dashboard → API Keys → "Clerk Frontend API".

### 5. Start Convex Backend

```bash
npx convex dev
```

This will:
- Prompt you to log in to Convex (first time)
- Create/link your Convex project
- Deploy your schema and functions
- Start watching for changes

### 6. Start Frontend Dev Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The app will be available at **http://localhost:5173**

### 7. Seed Sample Data (Optional)

After signing up and creating your first user:
1. Open the Convex Dashboard → Functions
2. Run the `seed:seedData` mutation with your `organizationId`
3. This creates sample warehouses, crops, resources, and allocations

---

## 🔑 Environment Variables

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `VITE_CONVEX_URL` | ✅ | Convex deployment URL | Auto-generated by `npx convex dev` |
| `CLERK_SECRET_KEY` | ⚠️ | Clerk secret (for webhooks) | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |

### Clerk Configuration

1. Enable **Email/Password** sign-in in Clerk Dashboard
2. (Optional) Enable **Google OAuth** for social sign-in
3. Configure a **JWT Template** for Convex:
   - Go to Clerk Dashboard → JWT Templates → New Template
   - Select **"Convex"** template
   - Copy the **Issuer URL** (this goes into `convex/auth.config.ts`)

---

## 📁 Project Structure

```
AGROTECH/
├── convex/                          # Convex backend
│   ├── auth.config.ts               # Clerk JWT verification config
│   ├── schema.ts                    # Database schema (10 tables)
│   ├── auth.ts                      # Auth handlers & user sync
│   ├── http.ts                      # HTTP actions (Clerk webhook)
│   ├── warehouses.ts                # Warehouse CRUD mutations/queries
│   ├── crops.ts                     # Crop CRUD with lifecycle management
│   ├── resources.ts                 # Resource management & crop-resource linking
│   ├── allocations.ts               # Allocation engine with validation
│   ├── organizations.ts             # Multi-tenant organization management
│   ├── auditLogs.ts                 # Immutable audit trail
│   ├── reports.ts                   # 5 comprehensive report queries
│   ├── resourceTracking.ts          # Usage history & depletion prediction
│   ├── aiCache.ts                   # AI calculation result caching
│   ├── alerts.ts                    # Real-time notification system
│   ├── rateLimiting.ts              # Rate limiting for sensitive operations
│   ├── seed.ts                      # Sample data seeder
│   ├── users.ts                     # User management (admin)
│   └── lib/
│       ├── auth.ts                  # RBAC middleware helpers
│       └── errors.ts               # Typed error responses
│
├── frontend/                        # React frontend
│   ├── src/
│   │   ├── App.tsx                  # Router & route definitions
│   │   ├── main.tsx                 # Entry point with providers & UserSync
│   │   ├── index.css                # Global Tailwind styles
│   │   ├── components/              # 20+ reusable UI components
│   │   │   ├── BulkActions.tsx      # Batch operations (delete, export, status)
│   │   │   ├── BulkImport.tsx       # CSV import with drag-drop & validation
│   │   │   ├── ConfirmDialog.tsx    # Destructive action confirmation
│   │   │   ├── ConvexNotificationPanel.tsx  # Real-time notification bell
│   │   │   ├── Modal.tsx            # Reusable modal dialog
│   │   │   ├── Pagination.tsx       # Paginated list controls
│   │   │   ├── SearchBar.tsx        # Debounced search with filters
│   │   │   ├── SortableTable.tsx    # Sortable, filterable data table
│   │   │   ├── Toast.tsx            # Toast notification system
│   │   │   ├── WarehouseHeatmap.tsx  # Warehouse utilization heatmap
│   │   │   └── charts/             # Lazy-loaded chart components
│   │   ├── contexts/                # React Context providers
│   │   │   ├── AuthContext.tsx      # Authentication state
│   │   │   ├── ConvexDataContext.tsx # Central data provider (all CRUD + AI)
│   │   │   ├── OrganizationContext.tsx  # Multi-tenant org selector
│   │   │   └── ThemeContext.tsx     # Dark/light mode
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── layouts/                 # MainLayout (sidebar + topbar)
│   │   ├── pages/                   # 16 feature pages
│   │   ├── types/                   # TypeScript definitions
│   │   └── utils/                   # Utility modules
│   ├── e2e/                         # Playwright E2E tests
│   └── package.json
│
├── convex.json                      # Convex project configuration
├── vercel.json                      # Vercel deployment config
├── package.json                     # Root package (postinstall scripts)
└── TODO.md                          # Development progress tracker
```

---

## 🗃 Database Schema

The platform uses **10 tables** in Convex with indexed queries for performance:

| Table | Description | Key Fields | Indexes |
|-------|-------------|------------|---------|
| `users` | User accounts synced from Clerk | clerkId, email, role, organizationId | `by_clerk_id`, `by_organization` |
| `organizations` | Multi-tenant orgs | name | — |
| `warehouses` | Storage facilities | name, location, totalCapacity, usedCapacity | `by_organization` |
| `crops` | Agricultural products | name, quantity, status | `by_organization`, `by_status` |
| `resources` | Fertilizer & pesticide inventory | name, type, stockQuantity, unit | `by_organization`, `by_type` |
| `cropResources` | Crop↔Resource linking | cropId, resourceId, requiredQuantity | `by_crop`, `by_resource` |
| `allocations` | Crop-to-warehouse assignments | cropId, warehouseId, allocatedQuantity | `by_organization`, `by_warehouse`, `by_crop` |
| `auditLogs` | Immutable action log | action, entityType, performedBy | `by_organization`, `by_entity`, `by_user` |
| `alerts` | Real-time notifications | type, severity, title, message | `by_organization`, `by_user`, `by_read` |
| `aiCache` | AI calculation cache | cacheKey, result, expiresAt | `by_org_key`, `by_expiry` |

### Entity Relationships

```
organizations ──┬── warehouses
                ├── crops ──── cropResources ──── resources
                ├── allocations (crop + warehouse)
                ├── auditLogs
                ├── alerts
                └── users
```

---

## 📡 API Reference

### Queries (Real-Time Reads)

| Function | Description |
|----------|-------------|
| `warehouses.listWarehouses(orgId)` | List all warehouses in an organization |
| `crops.listCrops(orgId)` | List all crops with status filtering |
| `resources.listResources(orgId)` | List resources, filterable by type |
| `allocations.listAllocations(orgId)` | List all allocations with enriched data |
| `auditLogs.listAuditLogs(orgId)` | Paginated audit log with user details |
| `reports.getDashboardSummary(orgId)` | Real-time aggregated dashboard data |
| `reports.getWarehouseReport(orgId, dateRange)` | Warehouse utilization analysis |
| `reports.getCropReport(orgId, dateRange)` | Crop performance metrics |
| `auth.getCurrentUser()` | Get authenticated user record |

### Mutations (Writes)

| Function | Description |
|----------|-------------|
| `warehouses.createWarehouse(...)` | Create warehouse with capacity validation |
| `crops.createCrop(...)` | Create crop with initial status `PLANTED` |
| `crops.updateCropStatus(id, status)` | Transition crop lifecycle stage |
| `resources.adjustStock(id, delta)` | Increment/decrement resource stock |
| `allocations.allocateCropToWarehouse(...)` | Allocate with capacity + resource validation |
| `allocations.deallocate(id)` | Reverse allocation & restore capacity |
| `auth.createOrGetUser(clerkId, email, name)` | Sync Clerk user to Convex |

> For complete API documentation, see `API_DOCS.md`.

---

## 🚀 Deployment

### Frontend — Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

**Vercel Settings:**
| Setting | Value |
|---------|-------|
| Framework | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

**Environment Variables (set in Vercel Dashboard):**
- `VITE_CLERK_PUBLISHABLE_KEY` — Production Clerk key
- `VITE_CONVEX_URL` — Production Convex URL

### Backend — Convex Cloud

```bash
npx convex deploy
```

**Post-Deployment:**
1. Set `CLERK_HOSTNAME` in Convex Dashboard environment variables
2. Configure Clerk webhook endpoint: `https://YOUR_CONVEX_URL/clerk-webhook`
3. Verify production build: `npm run build && npm run preview`

> For detailed deployment instructions, see `DEPLOYMENT.md`.

---

## 🔒 Security

| Layer | Implementation |
|-------|---------------|
| **Authentication** | Clerk with JWT tokens, Email/Password + Google OAuth |
| **Authorization** | 3-tier RBAC: Admin → Manager → Operator |
| **Data Isolation** | Every query/mutation scoped to `organizationId` |
| **Input Validation** | Server-side + client-side with XSS sanitization |
| **Rate Limiting** | Backend rate limiter on sensitive operations |
| **Audit Trail** | Immutable logs for every write operation |
| **Security Headers** | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` |
| **CSRF Protection** | Token-based CSRF prevention utilities |

> For comprehensive security documentation, see `SECURITY.md`.

---

## 🧪 Testing

### End-to-End Tests (Playwright)

```bash
cd frontend

# Run all tests
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui
```

### Test Suites

| Suite | Coverage |
|-------|----------|
| Public Pages | Login & signup page rendering |
| Accessibility | Heading hierarchy, ARIA labels, keyboard navigation |
| Responsive | Mobile viewport rendering |

### Code Quality

```bash
cd frontend
npm run lint           # ESLint — 0 errors
npx tsc --noEmit       # TypeScript — 0 errors
```

---

## 🗺 Roadmap

### Completed ✅

| Phase | Milestone |
|-------|-----------|
| 1 | Authentication & Layout (Clerk + RBAC) |
| 2 | Database Schema & CRUD Modules |
| 3 | Allocation Engine with Validation |
| 4 | AI Suggestion Engine (Optimization, Depletion, Forecasting) |
| 5 | Dashboard & Reports (5 types, charts, CSV/PDF export) |
| 6 | Performance & Security (Pagination, Rate Limiting, Dark Mode) |
| 7 | Deployment (Vercel + Convex Cloud) |
| 8 | Advanced Features (Bulk Ops, Notifications, Heatmap) |

### Upcoming 🚧

| Phase | Feature | Description |
|-------|---------|-------------|
| 9 | **AI/ML Forecasting** | ML-based crop demand models, explainable AI with SHAP/LIME |
| 10 | **Agentic AI Chatbot** | Natural-language assistant that queries dashboard & org data |
| 11 | **Multi-Language & Voice** | i18n (Hindi, Spanish, etc.), speech-to-text, text-to-speech |
| 12 | **SaaS & Billing** | Stripe integration, subscription tiers (Free/Pro/Enterprise) |
| 13 | **Mobile App** | React Native cross-platform mobile application |
| 14 | **IoT Integration** | Sensor data from warehouses (temperature, humidity, moisture) |

> See [TODO.md](TODO.md) for the granular task tracker.

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode conventions
- Use Tailwind CSS utilities (no custom CSS unless necessary)
- All mutations must include audit logging
- All queries must be scoped by `organizationId`
- Test new pages with both light and dark themes
- Ensure mobile responsiveness for all new components
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for modern agriculture
</p>
