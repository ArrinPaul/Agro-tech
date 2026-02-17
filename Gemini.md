# 🤖 Gemini — AGROTECH Implementation Guide
## Step-by-Step Build Instructions for Every Sub-Phase

> This file is your **implementation companion**. It tells you exactly *what to code* and *how* for each sub-phase from the TODO. Follow it sequentially.

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 0 — Project Bootstrap & Environment Setup
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 0.1 — Development Environment

### Terminal Commands
```bash
# Verify Node.js
node -v   # Must be v18+
npm -v

# Install pnpm (recommended)
npm install -g pnpm
```

### VS Code Extensions to Install
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Convex (official extension)
- ES7+ React/Redux Snippets

### GitHub Setup
```bash
mkdir AGROTECH && cd AGROTECH
git init
```

Create `.gitignore`:
```
node_modules/
.env.local
.env
dist/
.convex/
```

---

## 0.2 — Service Account Setup

### Clerk Setup
1. Go to https://dashboard.clerk.com → Create Application
2. **Application Name**: `AGROTECH`
3. **Sign-in methods**: Enable Email/Password + Google OAuth
4. Go to **API Keys** → Copy:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
5. Go to **JWT Templates** → Create Convex template:
   - Name: `convex`
   - Claims: `{ "sub": "{{user.id}}" }`

### Convex Setup
1. Go to https://dashboard.convex.dev → Create Project
2. Name: `agrotech`
3. Copy the deployment URL

### Environment File
Create `frontend/.env.local`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_CONVEX_URL=https://xxxxx.convex.cloud
```

---

## 0.3 — Project Scaffolding

### Step-by-step
```bash
# Create React app
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install core deps
npm install convex @clerk/clerk-react react-router-dom recharts

# Install Tailwind
npm install -D tailwindcss @tailwindcss/vite

# Initialize Convex
npx convex dev --once
```

### Configure Tailwind — `frontend/src/index.css`
```css
@import "tailwindcss";
```

### Configure Vite — `frontend/vite.config.ts`
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### Verify
```bash
cd frontend
npm run dev
# Should see Vite app on localhost:5173
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 1 — Authentication & Base Layout
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1.1 — Clerk Integration

### `frontend/src/main.tsx`
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>
);
```

### `frontend/src/App.tsx`
```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route
          path="/*"
          element={
            <>
              <SignedIn>
                <MainLayout />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### `frontend/src/pages/SignInPage.tsx`
```tsx
import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  );
}
```

### `frontend/src/pages/SignUpPage.tsx`
```tsx
import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
```

---

## 1.2 — Clerk → Convex User Sync

### `convex/auth.config.ts`
```ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

### `convex/users.ts`
```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name ?? "",
      role: "OPERATOR", // default role
      organizationId: undefined,
      createdAt: Date.now(),
    });
  },
});

export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});
```

### Auto-sync hook — `frontend/src/hooks/useStoreUser.ts`
```ts
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function useStoreUser() {
  const { user, isLoaded } = useUser();
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    if (!isLoaded || !user) return;

    syncUser({
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name: user.fullName ?? "",
    });
  }, [user, isLoaded, syncUser]);
}
```

---

## 1.3 — Role-Based Access Control

### `convex/lib/auth.ts` (helper)
```ts
import { QueryCtx, MutationCtx } from "../_generated/server";

export type Role = "ADMIN" | "MANAGER" | "OPERATOR";

export async function getCurrentUserOrThrow(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) throw new Error("User not found in database");
  return user;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Role[]
) {
  const user = await getCurrentUserOrThrow(ctx);
  if (!allowedRoles.includes(user.role as Role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(", ")}`);
  }
  return user;
}
```

### Frontend route guard — `frontend/src/components/RequireRole.tsx`
```tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ReactNode } from "react";

interface Props {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RequireRole({ allowedRoles, children, fallback }: Props) {
  const user = useQuery(api.users.getCurrentUser);

  if (!user) return <div>Loading...</div>;
  if (!allowedRoles.includes(user.role)) {
    return fallback ? <>{fallback}</> : <div>Access Denied</div>;
  }

  return <>{children}</>;
}
```

---

## 1.4 — Frontend Layout & Navigation

### `frontend/src/layouts/MainLayout.tsx`
```tsx
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import Dashboard from "../pages/Dashboard";
import Warehouses from "../pages/Warehouses";
import Crops from "../pages/Crops";
import Resources from "../pages/Resources";
import Allocations from "../pages/Allocations";
import Reports from "../pages/Reports";
import AIInsights from "../pages/AIInsights";
import AuditLogs from "../pages/AuditLogs";
import { useStoreUser } from "../hooks/useStoreUser";

export default function MainLayout() {
  useStoreUser();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/crops" element={<Crops />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/allocations" element={<Allocations />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
```

### `frontend/src/components/Sidebar.tsx`
```tsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Warehouse,
  Sprout,
  Package,
  ArrowLeftRight,
  FileBarChart,
  Brain,
  ScrollText,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/warehouses", label: "Warehouses", icon: Warehouse },
  { to: "/crops", label: "Crops", icon: Sprout },
  { to: "/resources", label: "Resources", icon: Package },
  { to: "/allocations", label: "Allocations", icon: ArrowLeftRight },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/ai-insights", label: "AI Insights", icon: Brain },
  { to: "/audit-logs", label: "Audit Logs", icon: ScrollText },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-green-700">🌾 AGROTECH</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

### `frontend/src/components/TopBar.tsx`
```tsx
import { UserButton } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function TopBar() {
  const user = useQuery(api.users.getCurrentUser);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <span className="text-sm text-gray-500">
          Role: <span className="font-semibold text-gray-700">{user?.role ?? "..."}</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.email}</span>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 2 — Database Schema & CRUD Modules
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2.1 — Convex Schema

### `convex/schema.ts`
```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.string(), // "ADMIN" | "MANAGER" | "OPERATOR"
    organizationId: v.optional(v.id("organizations")),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_org", ["organizationId"]),

  organizations: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }),

  warehouses: defineTable({
    name: v.string(),
    location: v.string(),
    totalCapacity: v.number(),
    usedCapacity: v.number(),
    organizationId: v.id("organizations"),
    createdAt: v.number(),
  })
    .index("by_org", ["organizationId"]),

  crops: defineTable({
    name: v.string(),
    quantity: v.number(),
    status: v.string(), // "PLANTED" | "GROWING" | "HARVESTED" | "STORED"
    organizationId: v.id("organizations"),
    createdAt: v.number(),
  })
    .index("by_org", ["organizationId"]),

  resources: defineTable({
    name: v.string(),
    type: v.string(), // "FERTILIZER" | "PESTICIDE"
    stockQuantity: v.number(),
    organizationId: v.id("organizations"),
  })
    .index("by_org", ["organizationId"])
    .index("by_type", ["type"]),

  crop_resource: defineTable({
    cropId: v.id("crops"),
    resourceId: v.id("resources"),
    requiredQuantity: v.number(),
  })
    .index("by_crop", ["cropId"])
    .index("by_resource", ["resourceId"]),

  allocations: defineTable({
    cropId: v.id("crops"),
    warehouseId: v.id("warehouses"),
    allocatedQuantity: v.number(),
    createdBy: v.id("users"),
    organizationId: v.id("organizations"),
    createdAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_warehouse", ["warehouseId"])
    .index("by_crop", ["cropId"]),

  audit_logs: defineTable({
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    performedBy: v.id("users"),
    timestamp: v.number(),
  })
    .index("by_time", ["timestamp"]),
});
```

After creating this file, run:
```bash
npx convex dev
```

---

## 2.2 — Organizations Module

### `convex/organizations.ts`
```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./lib/auth";

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["ADMIN"]);

    return await ctx.db.insert("organizations", {
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

export const get = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

---

## 2.3 — Warehouses CRUD

### `convex/warehouses.ts`
```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./lib/auth";

export const create = mutation({
  args: {
    name: v.string(),
    location: v.string(),
    totalCapacity: v.number(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (args.totalCapacity <= 0) {
      throw new Error("Total capacity must be greater than 0");
    }

    const id = await ctx.db.insert("warehouses", {
      name: args.name,
      location: args.location,
      totalCapacity: args.totalCapacity,
      usedCapacity: 0,
      organizationId: args.organizationId,
      createdAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      action: "CREATE_WAREHOUSE",
      entityType: "warehouse",
      entityId: id,
      performedBy: user._id,
      timestamp: Date.now(),
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("warehouses"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    totalCapacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const warehouse = await ctx.db.get(args.id);
    if (!warehouse) throw new Error("Warehouse not found");

    if (args.totalCapacity !== undefined) {
      if (args.totalCapacity <= 0) throw new Error("Capacity must be > 0");
      if (args.totalCapacity < warehouse.usedCapacity) {
        throw new Error("Cannot reduce capacity below used amount");
      }
    }

    const { id, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(args.id, cleanUpdates);

    await ctx.db.insert("audit_logs", {
      action: "UPDATE_WAREHOUSE",
      entityType: "warehouse",
      entityId: args.id,
      performedBy: user._id,
      timestamp: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("warehouses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check for existing allocations
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_warehouse", (q) => q.eq("warehouseId", args.id))
      .first();

    if (allocations) {
      throw new Error("Cannot delete warehouse with active allocations");
    }

    await ctx.db.delete(args.id);

    await ctx.db.insert("audit_logs", {
      action: "DELETE_WAREHOUSE",
      entityType: "warehouse",
      entityId: args.id,
      performedBy: user._id,
      timestamp: Date.now(),
    });
  },
});

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("warehouses")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("warehouses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

### Frontend — `frontend/src/pages/Warehouses.tsx` (starter)
```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export default function Warehouses() {
  // Replace with actual org ID from context
  const warehouses = useQuery(api.warehouses.list, {
    organizationId: "YOUR_ORG_ID" as any, // wire up from org context
  });
  const createWarehouse = useMutation(api.warehouses.create);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Warehouses</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          + Add Warehouse
        </button>
      </div>

      {/* Warehouse Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 font-medium text-gray-500">Location</th>
              <th className="px-6 py-3 font-medium text-gray-500">Capacity</th>
              <th className="px-6 py-3 font-medium text-gray-500">Utilization</th>
              <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {warehouses?.map((wh) => {
              const util = Math.round((wh.usedCapacity / wh.totalCapacity) * 100);
              const color = util > 80 ? "red" : util > 50 ? "yellow" : "green";
              return (
                <tr key={wh._id}>
                  <td className="px-6 py-4 font-medium">{wh.name}</td>
                  <td className="px-6 py-4 text-gray-500">{wh.location}</td>
                  <td className="px-6 py-4">{wh.usedCapacity}/{wh.totalCapacity}</td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-${color}-500`}
                        style={{ width: `${util}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{util}%</span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button className="text-blue-600 hover:underline">Edit</button>
                    <button className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TODO: Add Create/Edit modal component */}
    </div>
  );
}
```

> **Pattern**: Repeat this same structure for Crops and Resources pages. Each gets:
> - A list view with table
> - Create/Edit modal
> - Delete confirmation
> - Convex queries + mutations

---

## 2.4 — Crops CRUD

### `convex/crops.ts`
```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./lib/auth";

export const create = mutation({
  args: {
    name: v.string(),
    quantity: v.number(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const id = await ctx.db.insert("crops", {
      name: args.name,
      quantity: args.quantity,
      status: "PLANTED",
      organizationId: args.organizationId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      action: "CREATE_CROP",
      entityType: "crop",
      entityId: id,
      performedBy: user._id,
      timestamp: Date.now(),
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("crops"),
    name: v.optional(v.string()),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleanUpdates);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("crops"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const validStatuses = ["PLANTED", "GROWING", "HARVESTED", "STORED"];
    if (!validStatuses.includes(args.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { id: v.id("crops") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_crop", (q) => q.eq("cropId", args.id))
      .first();

    if (allocations) {
      throw new Error("Cannot delete crop with active allocations");
    }

    await ctx.db.delete(args.id);
  },
});

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crops")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("crops") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

---

## 2.5 — Resources CRUD

### `convex/resources.ts`
```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./lib/auth";

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    stockQuantity: v.number(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    if (!["FERTILIZER", "PESTICIDE"].includes(args.type)) {
      throw new Error("Type must be FERTILIZER or PESTICIDE");
    }

    return await ctx.db.insert("resources", {
      name: args.name,
      type: args.type,
      stockQuantity: args.stockQuantity,
      organizationId: args.organizationId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("resources"),
    name: v.optional(v.string()),
    stockQuantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleanUpdates);
  },
});

export const adjustStock = mutation({
  args: {
    id: v.id("resources"),
    delta: v.number(),
  },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.id);
    if (!resource) throw new Error("Resource not found");

    const newQty = resource.stockQuantity + args.delta;
    if (newQty < 0) throw new Error("Stock cannot be negative");

    await ctx.db.patch(args.id, { stockQuantity: newQty });
  },
});

export const remove = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    const linked = await ctx.db
      .query("crop_resource")
      .withIndex("by_resource", (q) => q.eq("resourceId", args.id))
      .first();

    if (linked) {
      throw new Error("Cannot delete resource linked to crops");
    }

    await ctx.db.delete(args.id);
  },
});

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resources")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// --- Crop-Resource Linking ---

export const linkToCrop = mutation({
  args: {
    cropId: v.id("crops"),
    resourceId: v.id("resources"),
    requiredQuantity: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("crop_resource", {
      cropId: args.cropId,
      resourceId: args.resourceId,
      requiredQuantity: args.requiredQuantity,
    });
  },
});

export const unlinkFromCrop = mutation({
  args: {
    cropId: v.id("crops"),
    resourceId: v.id("resources"),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("crop_resource")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .filter((q) => q.eq(q.field("resourceId"), args.resourceId))
      .unique();

    if (link) await ctx.db.delete(link._id);
  },
});

export const getResourcesForCrop = query({
  args: { cropId: v.id("crops") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("crop_resource")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .collect();

    const resources = await Promise.all(
      links.map(async (link) => {
        const resource = await ctx.db.get(link.resourceId);
        return { ...link, resource };
      })
    );

    return resources;
  },
});
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 3 — Allocation Engine
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3.1 — Core Allocation Logic

### `convex/allocations.ts`
```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./lib/auth";

export const allocate = mutation({
  args: {
    cropId: v.id("crops"),
    warehouseId: v.id("warehouses"),
    allocatedQuantity: v.number(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Step 1: Validate warehouse
    const warehouse = await ctx.db.get(args.warehouseId);
    if (!warehouse) throw new Error("Warehouse not found");
    if (warehouse.organizationId !== args.organizationId) {
      throw new Error("Warehouse does not belong to this organization");
    }

    // Step 2: Check capacity
    const remainingCapacity = warehouse.totalCapacity - warehouse.usedCapacity;
    if (args.allocatedQuantity > remainingCapacity) {
      throw new Error(
        `Insufficient capacity. Available: ${remainingCapacity}, Requested: ${args.allocatedQuantity}`
      );
    }

    // Step 3: Get required resources for this crop
    const cropResources = await ctx.db
      .query("crop_resource")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .collect();

    // Step 4: Validate and deduct resources
    for (const cr of cropResources) {
      const resource = await ctx.db.get(cr.resourceId);
      if (!resource) throw new Error(`Resource not found: ${cr.resourceId}`);

      const totalRequired = cr.requiredQuantity * args.allocatedQuantity;
      if (resource.stockQuantity < totalRequired) {
        throw new Error(
          `Insufficient resource: ${resource.name}. Available: ${resource.stockQuantity}, Required: ${totalRequired}`
        );
      }

      // Deduct stock
      await ctx.db.patch(cr.resourceId, {
        stockQuantity: resource.stockQuantity - totalRequired,
      });
    }

    // Step 5: Update warehouse used capacity
    await ctx.db.patch(args.warehouseId, {
      usedCapacity: warehouse.usedCapacity + args.allocatedQuantity,
    });

    // Step 6: Create allocation record
    const allocationId = await ctx.db.insert("allocations", {
      cropId: args.cropId,
      warehouseId: args.warehouseId,
      allocatedQuantity: args.allocatedQuantity,
      createdBy: user._id,
      organizationId: args.organizationId,
      createdAt: Date.now(),
    });

    // Step 7: Audit log
    await ctx.db.insert("audit_logs", {
      action: "ALLOCATE_CROP",
      entityType: "allocation",
      entityId: allocationId,
      performedBy: user._id,
      timestamp: Date.now(),
    });

    return allocationId;
  },
});

export const deallocate = mutation({
  args: { id: v.id("allocations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const allocation = await ctx.db.get(args.id);
    if (!allocation) throw new Error("Allocation not found");

    // Restore warehouse capacity
    const warehouse = await ctx.db.get(allocation.warehouseId);
    if (warehouse) {
      await ctx.db.patch(allocation.warehouseId, {
        usedCapacity: Math.max(0, warehouse.usedCapacity - allocation.allocatedQuantity),
      });
    }

    // Restore resource stock
    const cropResources = await ctx.db
      .query("crop_resource")
      .withIndex("by_crop", (q) => q.eq("cropId", allocation.cropId))
      .collect();

    for (const cr of cropResources) {
      const resource = await ctx.db.get(cr.resourceId);
      if (resource) {
        await ctx.db.patch(cr.resourceId, {
          stockQuantity: resource.stockQuantity + cr.requiredQuantity * allocation.allocatedQuantity,
        });
      }
    }

    // Delete allocation
    await ctx.db.delete(args.id);

    // Audit log
    await ctx.db.insert("audit_logs", {
      action: "DEALLOCATE",
      entityType: "allocation",
      entityId: args.id,
      performedBy: user._id,
      timestamp: Date.now(),
    });
  },
});

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Enrich with warehouse and crop names
    return Promise.all(
      allocations.map(async (a) => {
        const crop = await ctx.db.get(a.cropId);
        const warehouse = await ctx.db.get(a.warehouseId);
        const createdByUser = await ctx.db.get(a.createdBy);
        return {
          ...a,
          cropName: crop?.name ?? "Unknown",
          warehouseName: warehouse?.name ?? "Unknown",
          createdByName: createdByUser?.name ?? "Unknown",
        };
      })
    );
  },
});

export const getForWarehouse = query({
  args: { warehouseId: v.id("warehouses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("allocations")
      .withIndex("by_warehouse", (q) => q.eq("warehouseId", args.warehouseId))
      .collect();
  },
});

export const getForCrop = query({
  args: { cropId: v.id("crops") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("allocations")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .collect();
  },
});
```

---

## 3.4 — Audit Logs

### `convex/auditLogs.ts`
```ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_time")
      .order("desc")
      .take(100);

    return Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.performedBy);
        return {
          ...log,
          performedByName: user?.name ?? "Unknown",
        };
      })
    );
  },
});
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 4 — AI Suggestion Engine
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 4.1–4.5 — AI Module

### `convex/ai.ts`
```ts
import { query } from "./_generated/server";
import { v } from "convex/values";

interface Suggestion {
  type: "OPTIMIZATION" | "DEPLETION_WARNING" | "RECOMMENDATION" | "FORECAST";
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  data?: any;
}

export const getSuggestions = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args): Promise<Suggestion[]> => {
    const suggestions: Suggestion[] = [];

    // ─── 1. Warehouse Optimization ───
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    for (const wh of warehouses) {
      const utilization = wh.totalCapacity > 0
        ? (wh.usedCapacity / wh.totalCapacity) * 100
        : 0;

      if (utilization > 95) {
        suggestions.push({
          type: "OPTIMIZATION",
          title: `Critical: ${wh.name} nearly full`,
          message: `${wh.name} is at ${utilization.toFixed(1)}% capacity. Immediate redistribution recommended.`,
          severity: "critical",
          data: { warehouseId: wh._id, utilization },
        });
      } else if (utilization > 80) {
        suggestions.push({
          type: "OPTIMIZATION",
          title: `High utilization: ${wh.name}`,
          message: `${wh.name} is at ${utilization.toFixed(1)}% capacity. Consider redistributing to lower-utilized warehouses.`,
          severity: "warning",
          data: { warehouseId: wh._id, utilization },
        });
      } else if (utilization < 20 && wh.usedCapacity > 0) {
        suggestions.push({
          type: "OPTIMIZATION",
          title: `Underutilized: ${wh.name}`,
          message: `${wh.name} is only at ${utilization.toFixed(1)}% capacity. Consider consolidating inventory.`,
          severity: "info",
          data: { warehouseId: wh._id, utilization },
        });
      }
    }

    // ─── 2. Resource Depletion Warning ───
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Calculate average usage from allocations
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    for (const resource of resources) {
      // Simple depletion check based on stock level
      if (resource.stockQuantity <= 0) {
        suggestions.push({
          type: "DEPLETION_WARNING",
          title: `Out of stock: ${resource.name}`,
          message: `${resource.name} (${resource.type}) is completely depleted. Restock immediately.`,
          severity: "critical",
          data: { resourceId: resource._id },
        });
      } else if (resource.stockQuantity < 50) {
        suggestions.push({
          type: "DEPLETION_WARNING",
          title: `Low stock: ${resource.name}`,
          message: `${resource.name} has only ${resource.stockQuantity} units remaining. Consider restocking.`,
          severity: "warning",
          data: { resourceId: resource._id },
        });
      }
    }

    // ─── 3. Smart Warehouse Recommendation ───
    const underutilized = warehouses
      .filter((wh) => (wh.usedCapacity / wh.totalCapacity) < 0.5)
      .sort((a, b) => (a.usedCapacity / a.totalCapacity) - (b.usedCapacity / b.totalCapacity))
      .slice(0, 3);

    if (underutilized.length > 0) {
      suggestions.push({
        type: "RECOMMENDATION",
        title: "Best warehouses for new allocations",
        message: `Top picks: ${underutilized.map((w) => `${w.name} (${Math.round((w.usedCapacity / w.totalCapacity) * 100)}% used)`).join(", ")}`,
        severity: "info",
        data: { warehouseIds: underutilized.map((w) => w._id) },
      });
    }

    // ─── 4. Crop Demand Forecast (simple) ───
    const crops = await ctx.db
      .query("crops")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    for (const crop of crops) {
      const cropAllocations = allocations.filter((a) => a.cropId === crop._id);
      if (cropAllocations.length >= 3) {
        const totalAllocated = cropAllocations.reduce((sum, a) => sum + a.allocatedQuantity, 0);
        const avgAllocation = totalAllocated / cropAllocations.length;

        suggestions.push({
          type: "FORECAST",
          title: `Demand trend: ${crop.name}`,
          message: `Average allocation: ${avgAllocation.toFixed(0)} units across ${cropAllocations.length} allocations. Plan warehouse capacity accordingly.`,
          severity: "info",
          data: { cropId: crop._id, avgAllocation },
        });
      }
    }

    return suggestions;
  },
});

// Dedicated warehouse recommendation function
export const recommendWarehouse = query({
  args: {
    quantity: v.number(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const candidates = warehouses
      .filter((wh) => wh.totalCapacity - wh.usedCapacity >= args.quantity)
      .map((wh) => ({
        ...wh,
        remaining: wh.totalCapacity - wh.usedCapacity,
        utilization: (wh.usedCapacity / wh.totalCapacity) * 100,
      }))
      .sort((a, b) => a.utilization - b.utilization) // lowest utilization first
      .slice(0, 3);

    return candidates.map((wh, i) => ({
      rank: i + 1,
      warehouseId: wh._id,
      name: wh.name,
      location: wh.location,
      remaining: wh.remaining,
      utilization: wh.utilization.toFixed(1) + "%",
      reason: i === 0 ? "Lowest utilization with sufficient capacity" : "Good capacity available",
    }));
  },
});
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 5 — Dashboard & Reporting
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 5.1 — Dashboard Page

### `frontend/src/pages/Dashboard.tsx` (starter)
```tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#22c55e", "#eab308", "#ef4444", "#3b82f6"];

export default function Dashboard() {
  // Wire up with actual org ID
  const orgId = "YOUR_ORG_ID" as any;

  const warehouses = useQuery(api.warehouses.list, { organizationId: orgId });
  const crops = useQuery(api.crops.list, { organizationId: orgId });
  const resources = useQuery(api.resources.list, { organizationId: orgId });
  const suggestions = useQuery(api.ai.getSuggestions, { organizationId: orgId });

  const warehouseChartData = warehouses?.map((wh) => ({
    name: wh.name,
    used: wh.usedCapacity,
    free: wh.totalCapacity - wh.usedCapacity,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Warehouses" value={warehouses?.length ?? 0} color="green" />
        <StatCard title="Crops" value={crops?.length ?? 0} color="blue" />
        <StatCard title="Resources" value={resources?.length ?? 0} color="purple" />
        <StatCard
          title="AI Suggestions"
          value={suggestions?.length ?? 0}
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouse Utilization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Warehouse Utilization</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={warehouseChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="used" stackId="a" fill="#22c55e" name="Used" />
              <Bar dataKey="free" stackId="a" fill="#e5e7eb" name="Free" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Suggestions Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">AI Suggestions</h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {suggestions?.map((s, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border-l-4 ${
                  s.severity === "critical"
                    ? "bg-red-50 border-red-500"
                    : s.severity === "warning"
                    ? "bg-yellow-50 border-yellow-500"
                    : "bg-blue-50 border-blue-500"
                }`}
              >
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-gray-600 mt-1">{s.message}</p>
              </div>
            ))}
            {suggestions?.length === 0 && (
              <p className="text-gray-400 text-sm">No suggestions — everything looks good!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    yellow: "bg-yellow-50 text-yellow-700",
  };

  return (
    <div className={`rounded-lg p-4 ${colorMap[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
```

---

## 5.3 — Reports Module

### `convex/reports.ts`
```ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const warehouseReport = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    return warehouses.map((wh) => ({
      name: wh.name,
      location: wh.location,
      totalCapacity: wh.totalCapacity,
      usedCapacity: wh.usedCapacity,
      utilization: ((wh.usedCapacity / wh.totalCapacity) * 100).toFixed(1) + "%",
      remaining: wh.totalCapacity - wh.usedCapacity,
    }));
  },
});

export const allocationReport = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    return Promise.all(
      allocations.map(async (a) => {
        const crop = await ctx.db.get(a.cropId);
        const warehouse = await ctx.db.get(a.warehouseId);
        return {
          crop: crop?.name ?? "Unknown",
          warehouse: warehouse?.name ?? "Unknown",
          quantity: a.allocatedQuantity,
          date: new Date(a.createdAt).toLocaleDateString(),
        };
      })
    );
  },
});

export const resourceUsageReport = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    return resources.map((r) => ({
      name: r.name,
      type: r.type,
      currentStock: r.stockQuantity,
      status: r.stockQuantity === 0 ? "DEPLETED" : r.stockQuantity < 50 ? "LOW" : "OK",
    }));
  },
});
```

### CSV Export Utility — `frontend/src/utils/exportCsv.ts`
```ts
export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 6 — Polish, Performance & Security
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 6.1 — Key Optimization Patterns

### Debounced Search Hook — `frontend/src/hooks/useDebounce.ts`
```ts
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

### Loading Skeleton — `frontend/src/components/Skeleton.tsx`
```tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Toast Notification — `frontend/src/components/Toast.tsx`
```tsx
import { useState, useCallback, createContext, useContext, ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{
  addToast: (message: string, type: ToastType) => void;
}>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const colorMap: Record<ToastType, string> = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${colorMap[t.type]} text-white px-4 py-3 rounded-lg shadow-lg text-sm animate-slide-in`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

---

## 6.2 — Security Checklist (code patterns)

Every Convex mutation should start with:
```ts
handler: async (ctx, args) => {
  // 1. Authenticate
  const user = await getCurrentUserOrThrow(ctx);

  // 2. Authorize (role check)
  // For admin-only ops:
  if (user.role !== "ADMIN") throw new Error("Forbidden");

  // 3. Validate org isolation
  const entity = await ctx.db.get(args.entityId);
  if (entity?.organizationId !== user.organizationId) {
    throw new Error("Access denied: organization mismatch");
  }

  // 4. Validate inputs
  if (args.name.length > 200) throw new Error("Name too long");
  if (args.quantity < 0) throw new Error("Quantity cannot be negative");

  // ... proceed with logic
}
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 7 — Deployment
# ━━━━━━━━━━━━━━━━━━━━━━━━

## 7.1 — Deploy Commands

### Frontend → Vercel
```bash
cd frontend
npm run build         # Verify build succeeds locally
npx vercel            # Deploy (follow prompts)
npx vercel --prod     # Production deploy
```

Set environment variables in Vercel dashboard:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_CONVEX_URL`

### Convex → Production
```bash
npx convex deploy     # Deploy to production
```

Set in Convex dashboard:
- `CLERK_JWT_ISSUER_DOMAIN`

### `.env.example` (commit this)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_CONVEX_URL=https://your-project.convex.cloud
```

---

## 7.2 — Pre-Launch Testing Matrix

| Test Case | Expected | Status |
|-----------|----------|--------|
| Sign up new user | User appears in Convex | ⬜ |
| Sign in existing user | Dashboard loads | ⬜ |
| Create warehouse (Admin) | Warehouse appears in list | ⬜ |
| Create warehouse (Operator) | Access denied | ⬜ |
| Create crop + allocate | Capacity updates, resources deducted | ⬜ |
| Over-allocate | Error: insufficient capacity | ⬜ |
| AI suggestions appear | Suggestions based on data state | ⬜ |
| Cross-org data access | Should return empty / error | ⬜ |
| Export CSV | File downloads correctly | ⬜ |
| Mobile responsive | Sidebar collapses, tables scroll | ⬜ |

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# QUICK REFERENCE — File Checklist
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| File | Purpose | Phase |
|------|---------|-------|
| `convex/schema.ts` | Database schema | 2.1 |
| `convex/auth.config.ts` | Clerk auth config | 1.2 |
| `convex/lib/auth.ts` | Auth helpers | 1.3 |
| `convex/users.ts` | User sync + queries | 1.2 |
| `convex/organizations.ts` | Org CRUD | 2.2 |
| `convex/warehouses.ts` | Warehouse CRUD | 2.3 |
| `convex/crops.ts` | Crop CRUD | 2.4 |
| `convex/resources.ts` | Resource CRUD + linking | 2.5 |
| `convex/allocations.ts` | Allocation engine | 3.1 |
| `convex/auditLogs.ts` | Audit log queries | 3.4 |
| `convex/ai.ts` | AI suggestion engine | 4.1 |
| `convex/reports.ts` | Report queries | 5.3 |
| `src/main.tsx` | App entry + providers | 1.1 |
| `src/App.tsx` | Router + auth | 1.1 |
| `src/layouts/MainLayout.tsx` | Layout shell | 1.4 |
| `src/components/Sidebar.tsx` | Navigation | 1.4 |
| `src/components/TopBar.tsx` | Header bar | 1.4 |
| `src/components/RequireRole.tsx` | Role guard | 1.3 |
| `src/components/Skeleton.tsx` | Loading states | 6.1 |
| `src/components/Toast.tsx` | Notifications | 6.1 |
| `src/hooks/useStoreUser.ts` | User sync hook | 1.2 |
| `src/hooks/useDebounce.ts` | Search debounce | 6.1 |
| `src/utils/exportCsv.ts` | CSV export | 5.3 |
| `src/pages/Dashboard.tsx` | Main dashboard | 5.1 |
| `src/pages/Warehouses.tsx` | Warehouse management | 2.3 |
| `src/pages/Crops.tsx` | Crop management | 2.4 |
| `src/pages/Resources.tsx` | Resource management | 2.5 |
| `src/pages/Allocations.tsx` | Allocation management | 3.3 |
| `src/pages/Reports.tsx` | Reports | 5.3 |
| `src/pages/AIInsights.tsx` | AI suggestions page | 4.6 |
| `src/pages/AuditLogs.tsx` | Audit trail | 3.4 |
| `src/pages/SignInPage.tsx` | Sign in | 1.1 |
| `src/pages/SignUpPage.tsx` | Sign up | 1.1 |

---

> **How to use this guide**: Work through each phase sequentially. Copy the code blocks, adapt `YOUR_ORG_ID` placeholders, and test each module before moving to the next. The TODO.md file tracks your progress — check items off as you complete them.
>
> **Last Updated**: 2026-02-11
