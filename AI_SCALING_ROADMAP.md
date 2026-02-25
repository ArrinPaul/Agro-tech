# 🚀 AgroTech — AI Scaling & Feature Roadmap

## Vision

Transform AgroTech from a smart management platform into an **AI-first agricultural intelligence system** with conversational AI, predictive analytics, multi-language accessibility, and voice interaction.

---

## Phase 9 — AI/ML Forecasting & Explainable AI

**Goal:** Replace rule-based suggestions with machine learning models that explain their reasoning.

### 9.1 — ML Crop Demand Forecasting

| Task | Details |
|------|---------|
| Integrate time-series model | Use **Prophet** or **ARIMA** via a Python microservice (FastAPI) |
| Feature engineering | Season, rainfall data, historical yields, market prices, soil health |
| Multi-horizon forecasting | 7-day, 30-day, 90-day, 365-day demand projections |
| Confidence intervals | Show upper/lower bounds on forecasts with probability ranges |
| Model retraining pipeline | Scheduled weekly retraining via Convex scheduled functions or cron |

**Architecture:**
```
Frontend ──→ Convex Mutation ──→ Convex HTTP Action ──→ FastAPI ML Service
                                                         │
                                                    Prophet / ARIMA
                                                    TensorFlow / PyTorch
                                                         │
                                                    ◄── Predictions
                                                    cached in aiCache table
```

### 9.2 — Explainable AI (XAI)

| Task | Details |
|------|---------|
| SHAP integration | Show feature importance for each prediction (why this forecast?) |
| LIME explanations | Local explanations for individual warehouse recommendations |
| Natural language explanations | Convert SHAP values to human-readable sentences |
| Visual explanations | Waterfall charts showing how each factor moves the prediction |
| Confidence scoring | High/Medium/Low confidence with reasoning for every AI suggestion |

**Example Output:**
```
🌾 Wheat demand forecast: 12,500 units (next 30 days)
   Confidence: HIGH (87%)
   
   Why this prediction:
   ├── Season (Rabi): +35% ↑ (strongest factor)
   ├── Historical trend: +12% ↑ (consistent growth)
   ├── Warehouse capacity: neutral
   └── Weather forecast: -3% ↓ (mild winter expected)
```

### 9.3 — Anomaly Detection

| Task | Details |
|------|---------|
| Resource consumption anomalies | Detect unusual spikes/drops in fertilizer/pesticide usage |
| Warehouse utilization anomalies | Alert when patterns deviate from historical norms |
| Automated root cause analysis | Suggest possible reasons for anomalies |

**Tech Stack Addition:**
- **FastAPI** (Python 3.11+) — ML microservice
- **Prophet / statsmodels** — Time series forecasting
- **SHAP** — Explainable AI
- **scikit-learn** — Anomaly detection (Isolation Forest)
- **Redis** — Model prediction caching (optional)

---

## Phase 10 — Agentic AI Chatbot

**Goal:** Build an intelligent AI chatbot that can query your dashboard, understand your organization data, and take actions on your behalf.

### 10.1 — Core Chatbot Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CHATBOT UI                           │
│  Floating chat widget (bottom-right)                    │
│  Message history, typing indicator, action cards        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  AI AGENT LAYER                         │
│  LangChain / LangGraph Agent                           │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Planner  │→ │  Tool Router  │→ │  Executor    │      │
│  │  (LLM)   │  │  (Function    │  │  (Convex     │      │
│  │          │  │   Calling)    │  │   Actions)   │      │
│  └──────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  TOOLS (Agent Actions)                  │
│  📊 queryDashboard()    — fetch summary stats           │
│  🏭 searchWarehouses()  — find by name/location/capacity│
│  🌱 getCropStatus()     — check lifecycle & allocations │
│  🧪 checkResources()    — stock levels & predictions    │
│  📈 generateReport()    — create on-demand reports      │
│  🔗 createAllocation()  — allocate crops (with confirm) │
│  🤖 getAIInsights()     — fetch latest suggestions      │
│  👥 getOrgInfo()        — organization & user details   │
└─────────────────────────────────────────────────────────┘
```

### 10.2 — Chatbot Features

| Feature | Description |
|---------|-------------|
| **Dashboard Queries** | "What's my warehouse utilization?" / "How many crops are in GROWING status?" |
| **Natural Language Search** | "Find warehouses with more than 500 capacity in North Field" |
| **Action Execution** | "Allocate 200 units of Wheat to Central Silo A" (with confirmation) |
| **Report Generation** | "Generate a resource usage report for last quarter" |
| **AI Insights** | "What are the current AI recommendations?" / "Predict demand for Rice" |
| **Contextual Awareness** | Agent knows current org, user role, and recent actions |
| **Multi-Turn Conversations** | Remembers context across messages within a session |
| **Action Confirmation** | Destructive actions require explicit user approval before execution |

### 10.3 — Example Conversations

```
User: "How are my warehouses doing?"
Bot:  You have 4 warehouses in My Farm:
      • Central Silo A — 72% utilized (720/1000)
      • Cold Storage B — 45% utilized (225/500) 
      • Grain Depot C — 91% utilized (1820/2000) ⚠️
      • Open Yard D — 12% utilized (96/800)
      
      ⚠️ Grain Depot C is nearly full. I recommend redistributing 
      300 units to Open Yard D which has 704 units free.
      
      Would you like me to create this reallocation?

User: "Yes, do it"
Bot:  ✅ Reallocated 300 units from Grain Depot C to Open Yard D.
      Grain Depot C is now at 76%. Audit log updated.
```

### 10.4 — Implementation Plan

| Step | Task | Tech |
|------|------|------|
| 1 | Chat UI component (floating widget) | React, Tailwind |
| 2 | Message history & state management | React Context, Convex table |
| 3 | LLM integration (function calling) | OpenAI GPT-4o / Claude API |
| 4 | Tool definitions (Convex queries as tools) | LangChain Tools |
| 5 | Agent orchestration | LangGraph / ReAct Agent |
| 6 | Action confirmation dialogs | Custom confirmation flow |
| 7 | Streaming responses | SSE or WebSocket streaming |
| 8 | Conversation memory | Convex `chatHistory` table |
| 9 | Rate limiting & guardrails | Token limits, content filtering |

**Tech Stack Addition:**
- **OpenAI GPT-4o** or **Anthropic Claude** — LLM backbone
- **LangChain.js** or **Vercel AI SDK** — Agent framework
- **Convex HTTP Actions** — Serverless endpoint for LLM calls
- New Convex table: `chatHistory` (messages, sessions, org scoping)

---

## Phase 11 — Multi-Language & Voice Support

**Goal:** Make AgroTech accessible to farmers worldwide with native language support and voice interaction.

### 11.1 — Internationalization (i18n)

| Task | Details |
|------|---------|
| i18n framework | Integrate **react-i18next** with namespace-based translation files |
| Language files | JSON translation files per locale |
| Language switcher | Dropdown in topbar with flag icons |
| RTL support | Arabic, Hebrew layout support |
| Number/date formatting | Locale-aware formatting (Intl API) |
| Dynamic loading | Lazy-load language packs on demand |

**Supported Languages (Priority):**

| Language | Locale | Reason |
|----------|--------|--------|
| English | `en` | Default |
| Hindi | `hi` | Indian agriculture market |
| Spanish | `es` | Latin American farming |
| Portuguese | `pt-BR` | Brazilian agriculture |
| French | `fr` | African agriculture |
| Arabic | `ar` | Middle Eastern farming (RTL) |
| Mandarin | `zh` | Chinese agriculture |

**File Structure:**
```
frontend/src/locales/
├── en/
│   ├── common.json        # Shared strings (buttons, labels)
│   ├── dashboard.json     # Dashboard-specific strings
│   ├── warehouses.json    # Warehouse module strings
│   ├── crops.json         # Crop module strings
│   └── ai.json           # AI insights strings
├── hi/
│   ├── common.json
│   └── ...
├── es/
│   └── ...
└── index.ts              # Language registry
```

### 11.2 — Voice-to-Text (Speech Recognition)

| Task | Details |
|------|---------|
| Web Speech API | Browser-native speech recognition (`SpeechRecognition`) |
| Whisper fallback | OpenAI Whisper API for better accuracy / unsupported browsers |
| Mic button | Microphone icon in search bars and chatbot input |
| Language detection | Auto-detect spoken language and switch UI accordingly |
| Continuous listening | Toggle mode for hands-free operation |
| Command recognition | "Create warehouse", "Show crops", "Allocate rice" |

**Architecture:**
```
🎤 Microphone
    │
    ▼
┌──────────────────┐    ┌──────────────────┐
│ Web Speech API   │ OR │ OpenAI Whisper   │
│ (Browser-native) │    │ (Cloud API)      │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
              Transcribed Text
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    Search Bar    Chatbot     Commands
    (filter)     (query)     (actions)
```

### 11.3 — Text-to-Speech (Voice Output)

| Task | Details |
|------|---------|
| Web Speech Synthesis | Browser-native TTS for chatbot responses |
| ElevenLabs integration | Natural-sounding AI voices (premium) |
| Read-aloud for reports | "Read this report" button on reports page |
| Multi-language voices | Voice output matches selected UI language |
| Speed control | Adjustable speech rate (0.5x – 2x) |
| Accessibility mode | Auto-read notifications and alerts |

**Implementation:**
```tsx
// Voice output hook
function useTextToSpeech() {
  const speak = (text: string, lang: string = 'en') => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    speechSynthesis.speak(utterance);
  };
  return { speak, stop: () => speechSynthesis.cancel() };
}
```

**Tech Stack Addition:**
- **react-i18next** — i18n framework
- **Web Speech API** — Browser STT/TTS (zero dependency)
- **OpenAI Whisper** — Cloud STT fallback
- **ElevenLabs** (optional) — Premium TTS voices

---

## Phase 12 — SaaS & Billing

| Task | Details |
|------|---------|
| Stripe integration | Subscription management via Stripe Checkout |
| Pricing tiers | Free (1 org, 100 records), Pro ($29/mo), Enterprise (custom) |
| Usage metering | Track API calls, warehouses, AI queries per org |
| Billing portal | Self-service invoice & plan management |
| Feature gating | Limit features by tier (AI only on Pro+) |

---

## Scaling Strategy

### Current Architecture (Handles ~1,000 users)

```
Vercel (Frontend CDN) ←→ Convex Cloud (Backend + DB)
                              ↕
                         Clerk Auth
```

### Scaled Architecture (10,000+ users)

```
┌──────────────────────────────────────────────────────────────┐
│                      CDN / Edge Layer                        │
│              Vercel Edge Functions + CDN                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    API Gateway                               │
│         Rate Limiting · Auth · Load Balancing                │
└──────┬───────────────┬───────────────┬───────────────────────┘
       │               │               │
┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│   Convex    │ │  ML Service │ │  LLM Agent  │
│ (Primary    │ │  (FastAPI)  │ │  Service    │
│  Backend)   │ │  Prophet,   │ │  GPT-4o /   │
│  Real-time  │ │  SHAP,      │ │  LangChain  │
│  Database   │ │  scikit     │ │  WebSocket  │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
┌──────▼───────────────▼───────────────▼──────┐
│              Shared Infrastructure          │
│  Redis (caching) · S3 (file storage)        │
│  CloudWatch / Datadog (monitoring)          │
│  Clerk (auth) · Stripe (billing)            │
└─────────────────────────────────────────────┘
```

### Key Scaling Decisions

| Decision | Approach |
|----------|----------|
| **Database** | Convex auto-scales. For extreme loads: read replicas via Convex Enterprise |
| **ML Service** | Separate FastAPI microservice on AWS ECS / Railway / Fly.io |
| **LLM Calls** | Convex HTTP Actions → OpenAI API (with response caching in `aiCache`) |
| **File Storage** | Convex file storage for CSV/PDF, S3 for large datasets |
| **Real-time** | Convex WebSocket subscriptions (auto-scales to millions of connections) |
| **Caching** | `aiCache` table for ML predictions (TTL-based), Redis for session data |
| **Monitoring** | Convex Dashboard + Vercel Analytics + custom logging |

---

## Implementation Priority

| Priority | Phase | Effort | Impact | Dependencies |
|----------|-------|--------|--------|-------------|
| 🔴 High | 10 — Agentic AI Chatbot | 3-4 weeks | Transformative UX | OpenAI/Claude API key |
| 🔴 High | 11 — Multi-Language | 2-3 weeks | Market expansion | react-i18next |
| 🟡 Medium | 9 — ML Forecasting | 3-4 weeks | Better predictions | FastAPI microservice |
| 🟡 Medium | 11.2 — Voice-to-Text | 1-2 weeks | Accessibility | Web Speech API (free) |
| 🟢 Low | 11.3 — Text-to-Speech | 1 week | Nice-to-have | Web Speech API (free) |
| 🟢 Low | 12 — SaaS Billing | 2-3 weeks | Revenue model | Stripe account |

---

## Quick Wins (Can Start Today)

1. **Voice search** — Add a mic button using the browser's Web Speech API (zero dependencies)
2. **i18n setup** — Install `react-i18next`, extract English strings, add Hindi translations
3. **Chat UI** — Build the floating chat widget UI (no AI backend yet)
4. **Explainable suggestions** — Add "why" explanations to existing rule-based AI suggestions

---

> **Last Updated:** February 25, 2026
