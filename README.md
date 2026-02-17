# 🌾 AgroTech — Smart Crop & Warehouse Management Platform

A scalable agricultural resource management platform featuring real-time data, smart warehouse allocation, resource tracking, and AI-powered operational suggestions.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, TypeScript, Tailwind CSS 4 |
| **Routing** | React Router v7 |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Backend** | Convex *(planned — currently using mock data)* |
| **Auth** | Clerk *(planned)* |

## Features

- 📊 **Dashboard** — Overview widgets, utilization charts, quick actions
- 🏭 **Warehouse Management** — CRUD with capacity tracking & utilization indicators
- 🌱 **Crop Management** — Track crops through lifecycle stages (Planted → Growing → Harvested → Stored)
- 🧪 **Resource Management** — Fertilizer & pesticide inventory with stock alerts
- 🔗 **Allocation Engine** — Assign crops to warehouses with capacity & resource validation
- 🤖 **AI Insights** — Warehouse optimization suggestions, depletion warnings, demand forecasts
- 📋 **Audit Log** — Track all actions across the platform
- 🔐 **Role-Based Access** — Admin, Manager, Operator roles

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
AGROTECH/
├── frontend/
│   ├── src/
│   │   ├── components/     # Shared UI components (Modal, Toast, ConfirmDialog)
│   │   ├── contexts/       # DataContext with mock data & business logic
│   │   ├── layouts/        # MainLayout with sidebar & routing
│   │   ├── pages/          # Feature pages (Dashboard, Warehouses, Crops, etc.)
│   │   ├── types/          # TypeScript type definitions
│   │   ├── App.tsx          # Root router & provider setup
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles (Tailwind)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.*.json
├── TODO.md                  # Development progress tracker
└── README.md
```

## License

MIT
