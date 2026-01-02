# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Quick Start

**Tech Stack**: FastAPI (Python 3.13) + Next.js 15 (React 19, TypeScript) + SQLite (PostgreSQL-ready)

**Project Type**: Monorepo - Full-stack AI-powered personal finance app with LangGraph agents

### Development Commands

**Backend** (FastAPI):
```bash
# Setup
python -m venv .venv && source .venv/bin/activate
pip install uv && uv sync --frozen

# Run migrations
uv run alembic upgrade head

# Create migration after model changes
uv run alembic revision --autogenerate -m "description"

# Dev server
fastapi dev app/main.py  # http://localhost:8000
# API docs: http://localhost:8000/docs
```

**Frontend** (Next.js):
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
npm run build && npm start  # production build
```

**Docker** (both services):
```bash
docker compose up --build  # local dev
docker compose -f docker-compose.prod.yml up -d  # production
docker compose logs -f  # view logs
```

---

## Architecture (Non-Obvious Stuff)

### 1. Dual Agent Pattern
Two separate LangGraph agents instead of one:

- **Transaction Parser** (`/app/agent/`) - Uses Claude Haiku (fast, cheap)
  - Converts natural language → structured transactions
  - Parallel tool execution for multi-transaction inputs
  - Creates **transaction previews** (in-memory, no DB writes yet)

- **Financial Assistant** (`/app/assistant/`) - Uses Claude Sonnet (better reasoning)
  - Conversational financial analysis and insights
  - Access to analytics, budget tools, advice generation

**Why separate?**: Different LLMs, different tool sets, separation of concerns

### 2. Transaction Preview Pattern
The agent returns in-memory transaction objects, NOT database records. Frontend presents them for user confirmation before actual DB insert.

**Why?**: User control, batch creation, undo capability

### 3. Calculated Balance vs Stored Balance
Account balance is calculated on-the-fly from `initial_balance + sum(transactions)`, not stored in a column.

```python
@property
def current_balance(self):
    balance = self.initial_balance
    for tx in self.transactions:
        balance += tx.amount if tx.type == INCOME else -tx.amount
    return balance
```

**Why?**: Single source of truth, automatic consistency, no sync issues

### 4. Multi-Account & Currency
- Users can have multiple accounts (checking, savings, credit card)
- **Currency is per-account, not per-user** (supports multi-currency portfolios)
- Transactions always belong to one account

### 5. SSE Streaming (Not WebSocket)
Agent interactions use Server-Sent Events for streaming responses.

```
data: {"type":"thinking","message":"..."}
data: {"type":"tool_start","tool_name":"..."}
data: {"type":"message_chunk","content":"..."}
data: {"type":"done"}
```

**Why SSE?**: Simpler, unidirectional sufficient, HTTP-based (fewer firewall issues)

---

## Security & Data Isolation

**User Isolation**: Every table has `user_id` foreign key. ALWAYS filter by `user_id` in CRUD operations to prevent data leakage.

**Authentication**: JWT tokens (HS256), bcrypt password hashing. Token stored in localStorage (frontend) and sent as `Authorization: Bearer <token>`.

**Key Files**:
- `/app/auth/auth.py` - Password hashing, JWT creation/verification
- `/app/auth/dependencies.py` - `get_current_active_user` dependency
- `/frontend/src/contexts/AuthContext.tsx` - Global auth state

---

## Database (SQLAlchemy + Alembic)

**Location**: `data/money_intelligence.db` (SQLite)

**Key Models**: User → Accounts → Transactions (with Categories, Tags via M2M)

**Important Relationships**:
- Transaction.category_id is **nullable** (can categorize later)
- Tags are Many-to-Many with Transactions and Reminders (via junction tables)
- Soft delete available via `is_active` flag

**Indexes for performance**:
- Transactions: `(user_id, date)`, `(user_id, category_id)`
- Reminders: `(user_id, reminder_date)`

---

## Frontend Architecture

**Structure**: Next.js App Router with React 19

**Key Patterns**:
- `ApiClient` class (`/frontend/src/lib/api.ts`) - Centralized HTTP with automatic JWT injection
- `AuthContext` - Global auth state provider
- All dashboard pages are client components (`"use client"`)
- Protected routes redirect unauthenticated users

**CRITICAL**: `NEXT_PUBLIC_API_URL` must be set at **BUILD TIME** (baked into JS bundle)
- Local: `http://localhost:8000/api`
- Production: Set in GitHub Secrets for CI/CD build

---

## Deployment (DigitalOcean VPS)

**Current Setup**: $4/month droplet (512MB RAM) + GitHub Actions CI/CD

**Architecture**:
```
GitHub push → Actions builds images → ghcr.io registry → VPS pulls → Nginx routes traffic
```

**Key Security Note**: Ports bound to `127.0.0.1:8000` and `127.0.0.1:3000` (not `0.0.0.0`) because Docker bypasses UFW firewall. Only Nginx should be publicly accessible.

**Why GitHub Actions builds?**: Small VPS (512MB RAM) can't build Next.js images locally. GitHub's runners handle builds, VPS just pulls pre-built images.

**Deployment Flow**:
1. Push to `main` → GitHub Actions triggers
2. Builds backend + frontend Docker images (on GitHub servers)
3. Pushes to GitHub Container Registry (ghcr.io)
4. SSHs into VPS, pulls images, restarts containers
5. Alembic migrations run automatically on backend startup

**Full deployment guide**: See `DEPLOYMENT_GUIDE.md` for complete VPS setup, Nginx config, GitHub Secrets, troubleshooting, etc.

---

## Common Patterns

### Adding a New Feature
1. **Database**: Add model to `/app/database/models/`
2. **Migration**: `uv run alembic revision --autogenerate -m "add feature"`
3. **CRUD**: Create `/app/crud/feature_crud.py` (static methods pattern)
4. **Schemas**: Define Pydantic models in `/app/schemas/feature.py`
5. **Router**: Add endpoints in `/app/routers/feature.py`
6. **Frontend**: Create page/component in `/frontend/src/app/`

### Adding Agent Tools
1. Create tool in `/app/assistant/tools/new_tool.py`
2. Define `create_new_tools()` factory function
3. Import and include in `/app/assistant/graph.py`

### Frontend API Calls
```typescript
import { apiClient } from '@/lib/api';

const data = await apiClient.get<Transaction[]>('/transaction');
const result = await apiClient.post<Transaction>('/transaction', payload);
```

---

## Important Gotchas

1. **Always filter by user_id** in backend queries (security)
2. **NEXT_PUBLIC_* vars** must be set at build time (not runtime)
3. **Docker port binding**: Use `127.0.0.1:PORT` in production (security)
4. **Transaction amounts** must be positive (validated at SQLAlchemy level)
5. **Soft deletes**: Use `is_active=False` instead of actual deletion
6. **Date parsing**: Agent handles past/present/future, skips future transactions
7. **Parallel tool execution**: LangGraph executes multiple tools simultaneously for performance

---

## Useful Docs & Resources

- API Documentation: http://localhost:8000/docs (Swagger UI)
- Full Deployment Guide: `DEPLOYMENT_GUIDE.md` (1200+ lines of VPS setup, CI/CD, troubleshooting)
- Database Schema: Read `/app/database/models/` directly
- API Endpoints: Check `/app/routers/` or Swagger docs
