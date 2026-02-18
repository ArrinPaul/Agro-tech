# 🌾 AGROTECH — Master TODO Tracker
## Smart Crop & Warehouse Management Platform

> Track every task. Check them off as you go.

---

## PHASE 0 — Project Bootstrap & Environment Setup

### 0.1 — Development Environment
- [x] Install Node.js (LTS v18+)
- [x] Install pnpm / npm / yarn
- [x] Install VS Code extensions (Tailwind IntelliSense, ESLint, Prettier, Convex)
- [x] Create GitHub repository
- [x] Setup `.gitignore` for Node, Convex, env files
- [x] Create initial `README.md`

### 0.2 — Service Account Setup
- [x] Create Clerk account → create new project
- [x] Enable Email/Password sign-in method
- [x] Enable Google OAuth (optional)
- [x] Copy Clerk Publishable Key & Secret Key
- [x] Create Convex account → create new project
- [x] Link Convex project to local workspace
- [x] Store all keys in `.env.local`

### 0.3 — Project Scaffolding
- [x] Initialize React app with Vite (`npm create vite@latest frontend -- --template react-ts`)
- [x] Install Tailwind CSS + PostCSS + Autoprefixer
- [x] Configure `tailwind.config.js`
- [x] Install Convex client (`npm install convex`)
- [x] Run `npx convex dev` to init Convex project
- [x] Install Clerk React SDK (`npm install @clerk/clerk-react`)
- [x] Install React Router (`npm install react-router-dom`)
- [x] Install Recharts (`npm install recharts`)
- [x] Verify dev server boots cleanly

---

## PHASE 1 — Authentication & Base Layout (Week 1)

### 1.1 — Clerk Integration
- [x] Wrap app root with `<ClerkProvider>`
- [x] Create Sign In page (`/sign-in`)
- [x] Create Sign Up page (`/sign-up`)
- [x] Add `<SignedIn>` / `<SignedOut>` wrappers
- [x] Test login + signup flow end-to-end (see TESTING.md)
- [x] Verify JWT token generation (handled by Clerk)

### 1.2 — Clerk → Convex User Sync
- [x] Setup Clerk webhook endpoint (user.created, user.updated)
- [x] Create `convex/auth.ts` — webhook handler
- [x] Create `convex/users.ts` — `insertUser` mutation
- [x] On `user.created` → insert into Convex `users` table with default role
- [x] On `user.updated` → update Convex record
- [x] Test: Sign up new user → verify row appears in Convex dashboard (see TESTING.md)

### 1.3 — Role-Based Access Control
- [x] Define roles: `ADMIN`, `MANAGER`, `OPERATOR`
- [x] Create Convex helper: `getRole(userId)` query
- [x] Create Convex middleware: `requireRole(ctx, allowedRoles[])`
- [x] Apply role checks to test mutations
- [x] Create admin-only route guard component
- [x] Test: Operator cannot access admin mutations (see TESTING.md)

### 1.4 — Frontend Layout & Navigation
- [x] Create `MainLayout` with sidebar + topbar
- [x] Create sidebar nav links: Dashboard, Warehouses, Crops, Resources, Allocations, Reports
- [x] Create `TopBar` with user avatar
- [x] Setup React Router with protected route wrapper
- [x] Create placeholder pages for all routes
- [x] Implement responsive sidebar (collapsible on mobile)
- [x] Add breadcrumb component

---

## PHASE 2 — Database Schema & CRUD Modules (Week 2)

### 2.1 — Convex Schema Definition
- [x] Create `convex/schema.ts`
- [x] Define `users` table (clerkId, email, role, organizationId, createdAt)
- [x] Define `organizations` table (name, createdAt)
- [x] Define `warehouses` table (name, location, totalCapacity, usedCapacity, organizationId, createdAt)
- [x] Define `crops` table (name, quantity, status, organizationId, createdAt)
- [x] Define `resources` table (name, type, stockQuantity, organizationId)
- [x] Define `crop_resource` table (cropId, resourceId, requiredQuantity)
- [x] Define `allocations` table (cropId, warehouseId, allocatedQuantity, createdBy, organizationId, createdAt)
- [x] Define `audit_logs` table (action, entityType, entityId, performedBy, timestamp)
- [x] Add indexes on: organizationId, clerkId, warehouseId, cropId
- [x] Push schema: `npx convex dev` (requires Convex account setup)

### 2.2 — Organizations Module
- [x] Create `convex/organizations.ts`
- [x] Mutation: `createOrganization(name)`
- [x] Query: `getOrganization(id)`
- [x] Query: `listOrganizations()`
- [x] Frontend: Org selector / switcher component (`OrganizationSelector.tsx`)
- [x] Test org creation and listing (see PHASE_2_3_TESTING.md)

### 2.3 — Warehouses CRUD
- [x] Create `convex/warehouses.ts`
- [x] Mutation: `createWarehouse(name, location, totalCapacity, orgId)`
- [x] Mutation: `updateWarehouse(id, fields)`
- [x] Mutation: `deleteWarehouse(id)` — block if allocations exist
- [x] Query: `listWarehouses(orgId)` — with pagination
- [x] Query: `getWarehouse(id)`
- [x] Validation: totalCapacity must be > 0
- [x] Validation: usedCapacity cannot exceed totalCapacity
- [x] Frontend: Connected to Convex via ConvexDataContext
- [x] Frontend: Real-time data with useQuery hooks
- [x] Frontend: CRUD operations integrated (see PHASE_2_3_TESTING.md)
- [x] Frontend: Error handling with user-friendly messages

### 2.4 — Crops CRUD
- [x] Create `convex/crops.ts`
- [x] Mutation: `createCrop(name, quantity, orgId)`
- [x] Mutation: `updateCrop(id, fields)`
- [x] Mutation: `deleteCrop(id)` — block if allocations exist
- [x] Query: `listCrops(orgId)` — with pagination
- [x] Query: `getCrop(id)`
- [x] Define crop statuses: `PLANTED`, `GROWING`, `HARVESTED`, `STORED`
- [x] Mutation: `updateCropStatus(id, newStatus)`
- [x] Frontend: Connected to Convex via ConvexDataContext
- [x] Frontend: Real-time updates with Convex subscriptions
- [x] Frontend: All CRUD operations working (see PHASE_2_3_TESTING.md)

### 2.5 — Resources CRUD
- [x] Create `convex/resources.ts`
- [x] Mutation: `createResource(name, type, stockQuantity, orgId)`
- [x] Mutation: `updateResource(id, fields)`
- [x] Mutation: `deleteResource(id)` — block if linked to crops
- [x] Query: `listResources(orgId)` — filterable by type
- [x] Query: `getResource(id)`
- [x] Query: `listCropResources(orgId)` — get all crop-resource links
- [x] Define types: `FERTILIZER`, `PESTICIDE`
- [x] Mutation: `adjustStock(id, delta)` — increment/decrement
- [x] Frontend: Connected to Convex with real-time sync
- [x] Frontend: Stock adjustments working
- [x] Frontend: Low stock detection via AI suggestions

### 2.6 — Crop–Resource Linking
- [x] Create mutations in `convex/resources.ts`
- [x] Mutation: `linkResourceToCrop(cropId, resourceId, requiredQuantity)`
- [x] Mutation: `unlinkResourceFromCrop(cropId, resourceId)`
- [x] Query: `getResourcesForCrop(cropId)`
- [x] Query: `getCropsForResource(resourceId)`
- [x] Query: `listCropResources(orgId)` for all links
- [x] Frontend: Integrated in ConvexDataContext
- [x] Frontend: Helper methods: getResourcesForCrop, getCropsForResource

---

## PHASE 3 — Allocation Engine (Week 3)

### 3.1 — Core Allocation Logic
- [x] Create `convex/allocations.ts`
- [x] Mutation: `allocateCropToWarehouse(cropId, warehouseId, quantity, orgId)`
  - [x] Step 1: Validate warehouse exists & belongs to org
  - [x] Step 2: Check `totalCapacity - usedCapacity >= quantity`
  - [x] Step 3: Validate all required resources have sufficient stock
  - [x] Step 4: Deduct resource stock for each linked resource
  - [x] Step 5: Increment `warehouse.usedCapacity` by quantity
  - [x] Step 6: Insert allocation record
  - [x] Step 7: Insert audit log entry
  - [x] Step 8: Convex mutations are automatically transactional
- [x] Mutation: `deallocate(id)` — reverse the process
- [x] Query: `listAllocations(orgId)` — with enriched data
- [x] Frontend helpers: `getAllocationsForWarehouse`, `getAllocationsForCrop`
- [x] Auto-detect current user from Clerk auth in mutations

### 3.2 — Validation & Error Handling
- [x] Create typed error responses (`convex/lib/errors.ts`)
- [x] Frontend error utilities (`frontend/src/utils/errors.ts`)
- [x] User-friendly error messages with `getFriendlyErrorMessage`
- [x] Frontend: Toast notifications for all operations
- [x] Backend: Detailed validation error messages
- [x] All edge cases handled (see PHASE_2_3_TESTING.md)

### 3.3 — Allocation UI
- [x] Frontend: Connected to Convex via ConvexDataContext
- [x] Frontend: Real-time allocation list with auto-refresh
- [x] Frontend: All allocation operations integrated
- [x] Frontend: Error handling and validation
- [x] Frontend: AI-powered warehouse recommendations
- [x] Frontend: Resource availability checking (see PHASE_2_3_TESTING.md)

### 3.4 — Audit Logging
- [x] Create `convex/auditLogs.ts`
- [x] Automatic audit log creation in all mutations
- [x] Query: `listAuditLogs(orgId)` with enriched user data
- [x] Frontend: Connected via ConvexDataContext
- [x] Frontend: Real-time audit log updates
- [x] Logged actions: allocations, deallocations, CRUD operations

---

## PHASE 4 — AI Suggestion Engine (Week 4)

### 4.1 — AI Module Setup
- [ ] Create `convex/ai.ts`
- [x] Define suggestion types: `OPTIMIZATION`, `DEPLETION_WARNING`, `RECOMMENDATION`, `FORECAST`
- [x] Create base suggestion structure: `{ type, title, message, severity, data }`

### 4.2 — Warehouse Optimization Suggestions
- [x] Query: `getWarehouseUtilization(orgId)` — returns utilization % per warehouse
- [x] Logic: If utilization > 80% → generate "High utilization" suggestion
- [x] Logic: If utilization > 95% → generate "Critical capacity" alert
- [x] Logic: If utilization < 20% → suggest consolidation
- [x] Suggest redistribution targets (warehouses with lowest utilization)

### 4.3 — Resource Depletion Prediction
- [ ] Track resource usage history (from allocation deductions)
- [ ] Calculate: average monthly usage per resource
- [ ] Calculate: `daysRemaining = currentStock / avgDailyUsage`
- [x] If daysRemaining < 30 → generate depletion warning
- [x] If daysRemaining < 7 → generate critical depletion alert

### 4.4 — Smart Warehouse Recommendation
- [x] Function: `recommendWarehouse(cropId, quantity, orgId)`
- [x] Rank warehouses by: remaining capacity (descending)
- [x] Filter: only warehouses with enough capacity
- [x] Return top 3 recommendations with reasoning
- [ ] (Future) Factor in location proximity

### 4.5 — Crop Demand Forecast
- [ ] Track historical allocation data per crop
- [x] Implement simple moving average prediction
- [ ] OR: Rule-based seasonal model (define planting seasons)
- [x] Generate forecast: expected demand for next 30/60/90 days
- [x] Surface forecast on dashboard

### 4.6 — AI Suggestions UI
- [x] Frontend: AI Suggestions panel on dashboard (card-based)
- [x] Color-code by severity: info (blue), warning (yellow), critical (red)
- [x] "Dismiss" and "Act on it" buttons per suggestion
- [x] Frontend: Dedicated AI Insights page with full history
- [x] Auto-refresh suggestions on data changes

---

## PHASE 5 — Dashboard & Reporting (Week 5)

### 5.1 — Dashboard Widgets
- [x] Total warehouses count widget
- [x] Total crops count widget
- [x] Resource stock summary widget
- [x] Active allocations count widget
- [x] AI suggestions panel (top 5)
- [x] Quick action buttons (create warehouse, add crop, allocate)

### 5.2 — Charts & Visualizations
- [x] Warehouse utilization bar chart (Recharts)
- [x] Resource stock levels donut chart
- [x] Allocation history line chart (over time)
- [x] Crop status distribution pie chart
- [x] Dashboard layout — responsive grid

### 5.3 — Reports Module
- [ ] Create `convex/reports.ts`
- [ ] Query: `getWarehouseReport(orgId, dateRange)`
- [ ] Query: `getAllocationReport(orgId, dateRange)`
- [ ] Query: `getResourceUsageReport(orgId, dateRange)`
- [x] Frontend: Reports page with date range picker
- [x] Frontend: Tabular report view
- [x] Frontend: Export to CSV (client-side generation)

---

## PHASE 6 — Polish, Performance & Security (Week 6)

### 6.1 — Performance Optimization
- [ ] Add Convex indexes on all frequently queried fields
- [ ] Implement pagination on all list queries
- [x] Add debounced search on list pages
- [ ] Lazy load dashboard charts
- [ ] Implement optimistic UI updates on mutations
- [ ] Cache expensive AI calculations (store results, refresh periodically)

### 6.2 — Security Hardening
- [ ] Verify Clerk JWT validation on every Convex mutation
- [ ] Enforce role checks on all mutations (not just frontend)
- [ ] Enforce organization isolation on every query and mutation
- [ ] Add input validation (string length, number ranges, etc.)
- [ ] Ensure audit logs cannot be deleted by non-admins
- [ ] Rate limit sensitive operations (via Convex or deployment layer)

### 6.3 — UI/UX Polish
- [x] Loading skeletons on all data-fetching pages
- [x] Empty state illustrations
- [x] Toast notifications for success/error/warning
- [x] Confirm dialogs for destructive actions
- [x] Mobile responsive testing & fixes
- [ ] Keyboard navigation & accessibility audit
- [x] Dark mode support

### 6.4 — Error Handling
- [x] Global error boundary component
- [ ] Convex mutation error handling with user-friendly messages
- [ ] Network error retry logic
- [x] 404 page
- [x] Unauthorized (403) redirect page

---

## PHASE 7 — Deployment & Launch (Week 7)

### 7.1 — Pre-Deployment Checklist
- [x] All env vars documented in `.env.example`
- [ ] Remove all `console.log` debug statements
- [ ] Run lint + format across entire codebase
- [ ] Test all CRUD operations end-to-end
- [ ] Test allocation flow end-to-end
- [ ] Test AI suggestions with various data states
- [ ] Test role-based access (all 3 roles)
- [ ] Test multi-org data isolation

### 7.2 — Deploy Frontend
- [x] Push to GitHub
- [ ] Connect Vercel to GitHub repo
- [ ] Set environment variables in Vercel
- [ ] Configure custom domain (if applicable)
- [ ] Verify SSL is active
- [ ] Test production build

### 7.3 — Deploy Convex
- [ ] Run `npx convex deploy` for production
- [ ] Set production environment variables
- [ ] Verify production Clerk keys
- [ ] Test webhook delivery in production

### 7.4 — Post-Launch
- [ ] Monitor Convex dashboard for errors
- [ ] Monitor Clerk dashboard for auth issues
- [ ] Setup basic uptime monitoring
- [ ] Document known issues
- [ ] Plan Phase 8 advanced features

---

## PHASE 8 — Advanced Features (Future)

- [ ] Multi-tenant SaaS billing (Stripe integration)
- [ ] Subscription tiers (Free, Pro, Enterprise)
- [ ] Advanced AI forecasting (ML model integration)
- [ ] Push notifications system
- [ ] Real-time alerts (WebSocket / Convex subscriptions)
- [ ] Warehouse heatmap visualization (map-based)
- [ ] PDF report export (server-side generation)
- [ ] CSV bulk import for crops/resources
- [ ] API documentation for third-party integrations
- [ ] Mobile app (React Native)

---

> **Progress Tracking**: Check off items as you complete them. Each `- [ ]` becomes `- [x]` when done.
>
> **Last Updated**: 2026-02-18
