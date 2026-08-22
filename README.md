# Dayflow HRMS

> **Every workday, perfectly aligned.**  
> A production-grade, full-stack **Human Resource Management System** built with **FastAPI**, **Next.js 14 App Router**, **PostgreSQL**, **Redis**, **Celery**, and **Docker Compose**.

![Stack](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)

---

## ✨ Key Features & SRS Compliance

### 🔐 1. Authentication & Authorization
* **Secure Sign Up:** Register with custom **Employee ID**, Email, Password, and Role (`Employee` vs `Admin / HR Officer`).
* **Password Security Rules:** Enforces 8+ characters with uppercase letter, number, and special character validation.
* **Email Verification:** Asynchronous email verification workflow via SMTP/Brevo with token validation.
* **JWT Session Management:** Secure access and refresh tokens with role-garded authorization.

### 📊 2. Role-Based Dashboards
* **Employee Dashboard:** Quick-access metric cards for attendance check-in/out status, leave balances, recent activity feeds, and profile navigation.
* **Admin / HR Dashboard:** Organization-wide metrics, active employee counts, today's attendance summary, pending leave review queues, and quick employee search.

### 👤 3. Employee Profile & Document Management
* **Comprehensive Profile Views:** 4 dedicated tabs — **Personal Info**, **Job Details** (Department, Designation, Manager, Joining Date), **Salary Structure**, and **Documents**.
* **Self-Service & Admin Edits:** Employees can update contact info, address, and profile photo; Admins possess full editing capabilities for organizational attributes.
* **Document Locker:** Upload and manage ID Proofs, Qualification Certificates, and Employment Contracts (PDF, JPG, PNG up to 5MB) with a 24-hour self-deletion safeguard.

### ⏱️ 4. Attendance Tracking & Monitoring
* **Real-time Clock In / Clock Out:** One-click attendance logging with precise timestamps and working hours computation.
* **Status Classification:** Automatic status assignment (`Present`, `Absent`, `Half-day`, `Leave`).
* **Daily & Weekly Views:** Toggleable view presets for daily tracking or 7-day weekly attendance logs.
* **Admin Correction & Audit Logs:** Admins can adjust attendance times with automated email notifications dispatched to employees.

### 🌴 5. Leave & Time-Off Management
* **Multi-Type Leave Requests:** Apply for **Paid**, **Sick**, or **Unpaid** leave with flexible date ranges and custom remarks.
* **Real-Time Entitlement Tracking:** Auto-deducting leave balance tracker per calendar year.
* **Approval Workflows:** Admins review, approve, or reject requests with reviewer comments. Approved leaves automatically reflect as `LEAVE` on attendance logs.

### 💰 6. Payroll & Salary Management
* **Transparent Salary Structures:** Full breakdown of Basic Salary, HRA, **Hand Money (Cash Allowance)**, **Transaction Fees**, **Monthly Savings**, PF Deductions, Gross Earnings, and Net Salary.
* **Self-Healing Data Engine:** Automatic migration helper populating legacy records with consistent payroll default fields.
* **PDF Payslip Generation:** Dynamic pixel-perfect PDF payslip generation using ReportLab for instant employee download.

### 📧 7. Automated Email & Notification Center
* **Brevo/SMTP Integration:** High-performance background task queue (Celery + Redis) triggering HTML emails for:
  - Account registration & verification
  - Salary structure updates by HR (with full earnings breakdown)
  - Attendance check-in/out and HR correction alerts
  - Leave approval/rejection updates
* **In-App Notification Bell:** Real-time unread counter and notification feed in the app header.

### 📈 8. Analytics & Report Exports
* **Export Monthly Payroll CSV:** Download comprehensive payroll spreadsheets by month.
* **Export Attendance CSV:** Download date-filtered attendance records.
* **Organization Leave Analytics:** Track organization-wide leave usage and utilization percentages.

---

## 🏗️ Architecture & Technical Stack

```
   Presentation Layer (Next.js 14 App Router + TailwindCSS + Framer Motion)
                          ↓ HTTP / JSON API + JWT
       API Layer (FastAPI Routers + Pydantic v2 Schemas + CORS)
                          ↓
   Application Layer (Domain Services & Business Use-Cases + Auth Guards)
                          ↓
      Domain Layer (Pure Python Dataclasses & Entities — Zero DB Coupling)
                          ↓
  Infrastructure Layer (SQLAlchemy ORM + PostgreSQL 16 + Redis + Celery)
```

### Key Architectural Highlights
* **Clean Architecture:** Strict separation of Concerns — Domain models have zero database dependencies.
* **Service-Level Guards:** Access control and ownership rules strictly validated in service layers.
* **Self-Healing Database Migrations:** Dynamic payload completion prevents missing default values on legacy schemas.

---

## 📁 Repository Structure

```
dayflow-hrms/
├── backend/
│   ├── app/
│   │   ├── core/           # Security, JWT, config, database session
│   │   ├── domain/         # Pure entities (Employee, Payroll, Attendance, Leave)
│   │   ├── application/    # Business services (Auth, Employee, Payroll, Attendance, Leave)
│   │   ├── infrastructure/ # SQLAlchemy models, Mailer, PDF Generator, Celery Tasks
│   │   └── api/v1/         # FastAPI endpoints & Pydantic request/response schemas
│   ├── alembic/            # Database migration scripts
│   └── Dockerfile
├── frontend/
│   ├── app/                # Next.js App Router (Dashboard, Profile, Attendance, Leave, Payroll, Admin)
│   ├── components/         # Reusable UI components (Sidebar, StatCard, PageHeader, Modals)
│   ├── lib/api/            # Typed Axios API client wrappers
│   ├── lib/auth/           # AuthContext & Session hooks
│   └── lib/types/          # TypeScript interfaces
└── docker-compose.yml      # Orchestration for Backend, Frontend, DB, Redis, Celery Worker
```

---

## 🚀 Quick Start with Docker

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose v2)
* Node.js 20+ (optional, for local frontend iteration)

### Startup Steps

```bash
# 1. Clone the repository
git clone https://github.com/suvakovan/odoo-nmit-hackathon-dayflow-hrms.git
cd odoo-nmit-hackathon-dayflow-hrms/dayflow-hrms

# 2. Setup environment files
cp .env.example .env
cp backend/.env.example backend/.env

# 3. Launch all services via Docker Compose
docker compose up -d --build

# 4. Run database migrations
docker compose exec backend alembic upgrade head
```

### Service Access URLs
* **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
* **Backend API Server:** [http://localhost:8000](http://localhost:8000)
* **Interactive OpenAPI (Swagger) Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📡 API Endpoint Overview

| Module | Base Path | Key Capabilities |
|---|---|---|
| **Auth** | `/api/v1/auth` | Signup, Login, Email Verification, Password Reset |
| **Employees** | `/api/v1/employees` | List Employees, View Profile, Edit Profile, Document Upload/Delete |
| **Attendance** | `/api/v1/attendance` | Check-In, Check-Out, History, Flagged Records, Time Correction |
| **Leave** | `/api/v1/leave` | Apply Leave, Personal History, Balance Tracker, Approve/Reject |
| **Payroll** | `/api/v1/payroll` | Employee Payslip View, PDF Download, Admin Salary Updates |
| **Reports** | `/api/v1/reports` | Export Payroll CSV, Attendance CSV, Leave Summary JSON |
| **Notifications**| `/api/v1/notifications` | User Alerts, Mark as Read, Unread Counter |

---

## 🧪 Testing

```bash
# Execute backend unit test suite
docker compose exec backend pytest app/tests/unit/ -v

# Execute backend integration test suite
docker compose exec backend pytest app/tests/integration/ -v

# Build frontend production bundle
cd frontend && npm run build
```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more details.
