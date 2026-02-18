# 🌾 AGROTECH — Master TODO Tracker
## Smart Crop & Warehouse Management Platform

> Track every task. Check them off as you go.

---

## PHASE 0 — Project Bootstrap & Environment Setup

### 0.1 — Development Environment
- [x] Install Node.js (LTS v18+)
- [x] Install pnpm / npm / yarn
- [ ] Install VS Code extensions (Tailwind IntelliSense, ESLint, Prettier, Convex)
- [x] Create GitHub repository
- [x] Setup `.gitignore` for Node, Convex, env files
- [x] Create initial `README.md`

### 0.2 — Service Account Setup
- [ ] Create Clerk account → create new project
- [ ] Enable Email/Password sign-in method
- [ ] Enable Google OAuth (optional)
- [ ] Copy Clerk Publishable Key & Secret Key
- [ ] Create Convex account → create new project
- [ ] Link Convex project to local workspace
- [ ] Store all keys in `.env.local`

### 0.3 — Project Scaffolding
- [x] Initialize React app with Vite (`npm create vite@latest frontend -- --template react-ts`)
- [x] Install Tailwind CSS + PostCSS + Autoprefixer
- [x] Configure `tailwind.config.js`
- [ ] Install Convex client (`npm install convex`)
- [ ] Run `npx convex dev` to init Convex project
- [ ] Install Clerk React SDK (`npm install @clerk/clerk-react`)
- [x] Install React Router (`npm install react-router-dom`)
- [x] Install Recharts (`npm install recharts`)
- [x] Verify dev server boots cleanly

---

## PHASE 1 — Authentication & Base Layout (Week 1)

### 1.1 — Clerk Integration
- [ ] Wrap app root with `<ClerkProvider>`
- [ ] Create Sign In page (`/sign-in`)
- [ ] Create Sign Up page (`/sign-up`)
- [ ] Add `<SignedIn>` / `<SignedOut>` wrappers
- [ ] Test login + signup flow end-to-end
- [ ] Verify JWT token generation

### 1.2 — Clerk → Convex User Sync
- [ ] Setup Clerk webhook endpoint (user.created, user.updated)
- [ ] Create `convex/auth.ts` — webhook handler
- [ ] Create `convex/users.ts` — `insertUser` mutation
- [ ] On `user.created` → insert into Convex `users` table with default role
- [ ] On `user.updated` → update Convex record
- [ ] Test: Sign up new user → verify row appears in Convex dashboard

### 1.3 — Role-Based Access Control
- [ ] Define roles: `ADMIN`, `MANAGER`, `OPERATOR`
- [ ] Create Convex helper: `getRole(userId)` query
- [ ] Create Convex middleware: `requireRole(ctx, allowedRoles[])`
- [ ] Apply role checks to test mutations
- [ ] Create admin-only route guard component
- [ ] Test: Operator cannot access admin mutations

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
- [ ] Create `convex/schema.ts`
- [ ] Define `users` table (clerkId, email, role, organizationId, createdAt)
- [ ] Define `organizations` table (name, createdAt)
- [ ] Define `warehouses` table (name, location, totalCapacity, usedCapacity, organizationId, createdAt)
- [ ] Define `crops` table (name, quantity, status, organizationId, createdAt)
- [ ] Define `resources` table (name, type, stockQuantity, organizationId)
- [ ] Define `crop_resource` table (cropId, resourceId, requiredQuantity)
- [ ] Define `allocations` table (cropId, warehouseId, allocatedQuantity, createdBy, organizationId, createdAt)
- [ ] Define `audit_logs` table (action, entityType, entityId, performedBy, timestamp)
- [ ] Add indexes on: organizationId, clerkId, warehouseId, cropId
- [ ] Push schema: `npx convex dev`

### 2.2 — Organizations Module
- [ ] Create `convex/organizations.ts`
- [ ] Mutation: `createOrganization(name)`
- [ ] Query: `getOrganization(id)`
- [ ] Query: `listOrganizations()`
- [ ] Frontend: Org selector / switcher component
- [ ] Test org creation and listing

### 2.3 — Warehouses CRUD
- [ ] Create `convex/warehouses.ts`
- [ ] Mutation: `createWarehouse(name, location, totalCapacity, orgId)`
- [ ] Mutation: `updateWarehouse(id, fields)`
- [ ] Mutation: `deleteWarehouse(id)` — block if allocations exist
- [ ] Query: `listWarehouses(orgId)` — with pagination
- [ ] Query: `getWarehouse(id)`
- [x] Validation: totalCapacity must be > 0
- [x] Validation: usedCapacity cannot exceed totalCapacity
- [x] Frontend: Warehouse list page (table with search/filter)
- [x] Frontend: Create Warehouse modal/form
- [x] Frontend: Edit Warehouse modal/form
- [x] Frontend: Delete confirmation dialog
- [x] Frontend: Capacity bar indicator (green/yellow/red)

### 2.4 — Crops CRUD
- [ ] Create `convex/crops.ts`
- [ ] Mutation: `createCrop(name, quantity, orgId)`
- [ ] Mutation: `updateCrop(id, fields)`
- [ ] Mutation: `deleteCrop(id)` — block if allocations exist
- [ ] Query: `listCrops(orgId)` — with pagination
- [ ] Query: `getCrop(id)`
- [x] Define crop statuses: `PLANTED`, `GROWING`, `HARVESTED`, `STORED`
- [x] Mutation: `updateCropStatus(id, newStatus)`
- [x] Frontend: Crop list page
- [x] Frontend: Create/Edit Crop forms
- [x] Frontend: Status badge component
- [x] Frontend: Crop detail view

### 2.5 — Resources CRUD
- [ ] Create `convex/resources.ts`
- [ ] Mutation: `createResource(name, type, stockQuantity, orgId)`
- [ ] Mutation: `updateResource(id, fields)`
- [ ] Mutation: `deleteResource(id)` — block if linked to crops
- [ ] Query: `listResources(orgId)` — filterable by type
- [ ] Query: `getResource(id)`
- [x] Define types: `FERTILIZER`, `PESTICIDE`
- [x] Mutation: `adjustStock(id, delta)` — increment/decrement
- [x] Frontend: Resource list page with type filter tabs
- [x] Frontend: Create/Edit Resource forms
- [x] Frontend: Stock level indicator
- [x] Frontend: Low stock warning badge

### 2.6 — Crop–Resource Linking
- [ ] Create mutations in `convex/resources.ts` or separate file
- [x] Mutation: `linkResourceToCrop(cropId, resourceId, requiredQuantity)`
- [x] Mutation: `unlinkResourceFromCrop(cropId, resourceId)`
- [x] Query: `getResourcesForCrop(cropId)`
- [x] Query: `getCropsForResource(resourceId)`
- [x] Frontend: Resource assignment UI on crop detail page
- [x] Frontend: Show linked resources with required vs. available quantities

---

## PHASE 3 — Allocation Engine (Week 3)

### 3.1 — Core Allocation Logic
- [ ] Create `convex/allocations.ts`
- [x] Mutation: `allocateCropToWarehouse(cropId, warehouseId, quantity, userId)`
  - [x] Step 1: Validate warehouse exists & belongs to org
  - [x] Step 2: Check `totalCapacity - usedCapacity >= quantity`
  - [x] Step 3: Validate all required resources have sufficient stock
  - [x] Step 4: Deduct resource stock for each linked resource
  - [x] Step 5: Increment `warehouse.usedCapacity` by quantity
  - [x] Step 6: Insert allocation record
  - [x] Step 7: Insert audit log entry
  - [ ] Step 8: If any step fails → rollback (Convex transactional mutation)
- [x] Mutation: `deallocate(allocationId)` — reverse the process
- [x] Query: `listAllocations(orgId)` — with pagination
- [x] Query: `getAllocationsForWarehouse(warehouseId)`
- [x] Query: `getAllocationsForCrop(cropId)`

### 3.2 — Validation & Error Handling
- [ ] Create typed error responses (INSUFFICIENT_CAPACITY, INSUFFICIENT_RESOURCES, etc.)
- [x] Frontend: Show clear error messages on allocation failure
- [x] Frontend: Pre-check capacity before allowing submit
- [x] Frontend: Pre-check resource availability before allowing submit
- [ ] Add optimistic UI update on successful allocation

### 3.3 — Allocation UI
- [x] Frontend: Allocation page — list all allocations (table)
- [x] Frontend: "New Allocation" form (select crop → select warehouse → enter quantity)
- [x] Frontend: Show warehouse remaining capacity in dropdown
- [x] Frontend: Show resource sufficiency warnings
- [x] Frontend: Allocation detail view (who, when, what)
- [x] Frontend: Deallocate button with confirmation

### 3.4 — Audit Logging
- [ ] Create `convex/auditLogs.ts`
- [x] Mutation: `logAction(action, entityType, entityId, performedBy)`
- [x] Query: `listAuditLogs(orgId)` — with pagination + filters
- [x] Frontend: Audit log page (admin only)
- [x] Frontend: Filter by entity type, user, date range

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
