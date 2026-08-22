# Dayflow HRMS

> A full-stack **Human Resource Management System** built with FastAPI, Next.js App Router, PostgreSQL, and Docker Compose.

![Stack](https://img.shields.io/badge/FastAPI-0.115-green) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (with Compose v2)
- Node.js 20+ (for local frontend dev)

### Run with Docker Compose

```bash
# 1. Clone and navigate
cd dayflow-hrms

# 2. Copy env files
cp .env.example .env
cp backend/.env.example backend/.env

# 3. Start all services
docker compose up --build

# 4. Run database migrations (first time only)
docker compose exec backend alembic upgrade head

# 5. Access the app
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

---

## 🏗️ Architecture

```
Presentation (Next.js 14 App Router)
      ↓ HTTP/JSON + JWT
API Layer (FastAPI routers + Pydantic schemas)
      ↓
Application Layer (Services / Use Cases) ← Service-level auth guards
      ↓
Domain Layer (pure Python entities + business rules, zero DB imports)
      ↓
Infrastructure Layer (SQLAlchemy, PostgreSQL, Celery, Redis)
```

### Clean Architecture Rules
- **Domain entities** are pure Python `@dataclass` — no SQLAlchemy imports
- **Services** depend on **repository interfaces (ABCs)** — never on concrete implementations
- **Role/ownership checks** enforced at the **service layer**, not just routers
- **Routers** do marshalling only — zero business logic

---

## 📁 Folder Structure

```
dayflow-hrms/
├── backend/
│   ├── app/
│   │   ├── core/          # config, security, dependencies, exceptions
│   │   ├── domain/        # pure entities, enums, repo interfaces
│   │   ├── application/   # 7 service modules
│   │   ├── infrastructure/ # SQLAlchemy models, repos, email, PDF, Celery
│   │   └── api/v1/        # FastAPI routers + Pydantic schemas
│   ├── alembic/           # database migrations
│   └── Dockerfile
├── frontend/
│   ├── app/               # Next.js App Router pages
│   ├── components/ui/     # Sidebar, StatCard, Badge, Modal...
│   ├── lib/api/           # typed API client wrappers
│   ├── lib/auth/          # AuthContext + useAuth()
│   └── lib/types/         # TS types mirroring Pydantic schemas
└── docker-compose.yml
```

---

## 👤 Roles

| Role | Access |
|---|---|
| `ADMIN` | Full access — manage employees, approve leave, update payroll, view reports |
| `EMPLOYEE` | Own profile, attendance (check-in/out), apply leave, view payslip |

---

## 📡 API Reference

| Module | Base Path |
|---|---|
| Auth | `/api/v1/auth` |
| Employees | `/api/v1/employees` |
| Attendance | `/api/v1/attendance` |
| Leave | `/api/v1/leave` |
| Payroll | `/api/v1/payroll` |
| Dashboard | `/api/v1/dashboard` |
| Reports | `/api/v1/reports` |
| Notifications | `/api/v1/notifications` |

Full interactive docs at `http://localhost:8000/docs`

---

## 🧪 Running Tests

```bash
# Unit tests (no DB required)
docker compose exec backend pytest app/tests/unit/ -v

# Integration tests (requires test DB)
docker compose exec backend pytest app/tests/integration/ -v
```

---

## ⚙️ Environment Variables

See `backend/.env.example` for all configuration options including:
- Database URL
- JWT secret and expiry
- SMTP credentials (set `EMAILS_ENABLED=true` to enable real email sending)
- Redis URL for Celery
- File storage backend (`local` or `s3`)

---

## 📝 Development Notes

- **Email verification**: In dev mode (`EMAILS_ENABLED=false`), verification tokens are logged and also returned in the signup response for convenience.
- **Migrations**: After any model change, run `docker compose exec backend alembic revision --autogenerate -m "description"` followed by `alembic upgrade head`.
- **PDF Payslips**: Generated using ReportLab. Download from the Payroll page.
- **Celery**: Background tasks (email notifications) run in the `celery_worker` container.
