# 🚀 JobPilot AI — Agentic AI-Powered Job Seeker & Recruitment Platform

<p align="center">
  <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80" alt="JobPilot AI Banner" width="100%" style="border-radius: 16px; max-height: 380px; object-fit: cover;" />
</p>

<p align="center">
  <strong>An enterprise-grade, full-stack recruitment ecosystem connecting top talent with high-growth companies through deterministic 5-pillar matching, interactive Kanban pipelines, multi-version resume intelligence, automated interview scheduling, and platform-wide administrative governance.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React_18_%7C_Vite_%7C_Tailwind_CSS-38bdf8?style=for-the-badge&logo=react" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Node.js_%7C_Express_4-22c55e?style=for-the-badge&logo=node.js" alt="Backend" />
  <img src="https://img.shields.io/badge/ORM-Prisma_5-6366f1?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL_%2B_Zero--Config_In--Memory-3b82f6?style=for-the-badge&logo=postgresql" alt="Database" />
  <img src="https://img.shields.io/badge/Auth-JWT_Access_%2B_Refresh_Cookies-f59e0b?style=for-the-badge&logo=jsonwebtokens" alt="JWT Auth" />
  <img src="https://img.shields.io/badge/Architecture-Modular_Monolith-ec4899?style=for-the-badge" alt="Architecture" />
</p>

---

## 📑 Table of Contents

1. [🌟 Executive Overview](#-executive-overview)
2. [✨ Key Features & Capabilities](#-key-features--capabilities)
3. [👥 Role-Based Architecture & Permissions](#-role-based-architecture--permissions)
   - [1. Candidate / Job Seeker (`JOB_SEEKER`)](#1-candidate--job-seeker-job_seeker)
   - [2. Recruiter / Employer (`RECRUITER`)](#2-recruiter--employer-recruiter)
   - [3. Platform Administrator (`ADMIN`)](#3-platform-administrator-admin)
4. [🧠 Deterministic 5-Pillar Matching Engine](#-deterministic-5-pillar-matching-engine)
5. [🔄 End-to-End Workflow & How It Works](#-end-to-end-workflow--how-it-works)
6. [📐 System Architecture & Diagrams](#-system-architecture--diagrams)
   - [High-Level Architecture](#high-level-architecture)
   - [Entity-Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
   - [Recruitment Pipeline Sequence](#recruitment-pipeline-sequence)
   - [Candidate Application State Machine](#candidate-application-state-machine)
7. [💻 Tech Stack & Engineering Specs](#-tech-stack--engineering-specs)
8. [📂 Project Structure](#-project-structure)
9. [⚡ Getting Started & Quickstart](#-getting-started--quickstart)
   - [Prerequisites](#prerequisites)
   - [Option A: Instant Boot (Zero-Config In-Memory Mode)](#option-a-instant-boot-zero-config-in-memory-mode)
   - [Option B: PostgreSQL Production Mode](#option-b-postgresql-production-mode)
10. [🔑 Pre-Seeded Demo Credentials](#-pre-seeded-demo-credentials)
11. [⚙️ Environment Variables Reference](#-environment-variables-reference)
12. [📡 Complete REST API Catalog](#-complete-rest-api-catalog)
13. [🛡️ Security, Privacy & IDOR Protection](#-security-privacy--idor-protection)
14. [🚀 Git Setup & Deployment Guide](#-git-setup--deployment-guide)

---

## 🌟 Executive Overview

**JobPilot AI** solves the core inefficiencies of modern hiring: resume black holes for job seekers and resume spam for recruiters. Rather than relying on black-box opacity, JobPilot AI features an explainable, deterministic **5-Pillar Matching Engine** that calculates true candidate-job compatibility and pinpoints exact skill gaps.

The platform is engineered as a clean **Modular Monolith** supporting:
- Dual-mode data access: Live **PostgreSQL via Prisma ORM** with automatic failover to a high-fidelity **In-Memory Store** for zero-setup local evaluation.
- Modern **React 18 single-page application** powered by Vite, Tailwind CSS, TanStack React Query, and Zustand.
- Enterprise-grade **Role-Based Access Control (RBAC)** separating Candidates, Recruiters, and Platform Admins.

---

## ✨ Key Features & Capabilities

- 🎯 **5-Pillar Deterministic Match Scoring**: Scores every candidate-job pair from 0 to 100% across Skills (40%), Experience (20%), Semantic Fit (20%), Portfolio Projects (10%), and Career Preferences (10%).
- 💡 **Skill Gap Intelligence**: Automatically detects missing requirements and advises candidates on exact score gains (e.g., `+8% boost by acquiring Docker`).
- 📋 **Interactive Kanban Pipeline**: Recruiters can drag-and-drop or 1-tap transition applicants through 6 stages (`APPLIED` → `UNDER_REVIEW` → `SHORTLISTED` → `INTERVIEW` → `OFFER` → `REJECTED`).
- 📄 **Multi-Version Resume Management**: Upload multiple resumes, designate a primary default, and set 3-tier privacy controls (`PRIVATE`, `APPLICATION_ONLY`, `RECRUITER_VISIBLE`).
- 📅 **Automated Interview Coordination**: Schedule screening, behavioral, technical, and final interviews with built-in Google Meet links, notes, and auto-advancement of candidates.
- 🔔 **Real-Time Notifications & Smart Job Alerts**: In-app notifications and automated daily/weekly digests based on customizable minimum match score thresholds.
- 🛡️ **Admin Governance & Audit Trail**: 1-click company verification badges, job moderation, user suspension/reactivation, and immutable tamper-evident audit logs.
- ⚡ **Zero-Dependency Boot**: Runs immediately out of the box with zero database configuration needed thanks to the built-in resilient in-memory store.

---

## 👥 Role-Based Architecture & Permissions

JobPilot AI enforces strict role separation across three primary personas:

```
                  ┌───────────────────────────────────────────────┐
                  │              JobPilot AI Platform             │
                  └───────────────────────┬───────────────────────┘
                                          │
         ┌────────────────────────────────┼────────────────────────────────┐
         │                                │                                │
         ▼                                ▼                                ▼
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│   JOB_SEEKER    │              │    RECRUITER    │              │      ADMIN      │
│  (Candidate)    │              │ (Hiring Manager)│              │ (Super Admin)   │
└─────────────────┘              └─────────────────┘              └─────────────────┘
```

### 1. Candidate / Job Seeker (`JOB_SEEKER`)
Designed for professionals seeking their next career leap with maximum transparency:
- **Comprehensive Profile**: Manage skills, work history, education, practical projects, certifications, and career preferences (target role, preferred locations, workplace type, minimum salary).
- **Multi-Resume Repository**: Upload multiple tailored resumes (PDF, DOC, DOCX), assign versions, toggle primary resumes, and govern recruiter visibility.
- **Match-Driven Job Discovery**: Search and filter jobs by keywords, location, remote/hybrid status, and salary, viewing calculated match scores and skill gap insights directly on job cards.
- **1-Click Application Flow**: Apply using pre-uploaded resumes with customized cover letters, and track all submitted applications in real time.
- **Application Lifecycle Tracking**: View timeline history with status updates and timestamps; withdraw active applications anytime prior to final offers.
- **Interview Hub**: Access upcoming scheduled interview slots, calendar invites, and direct Google Meet video links.
- **Custom Job Alerts**: Define automated alerts with minimum match thresholds (e.g. only notify me for jobs with $\ge 75\%$ match).
- **Saved Jobs**: Bookmark interesting openings to review or apply for later.

### 2. Recruiter / Employer (`RECRUITER`)
Empowers hiring managers and talent acquisition teams to hire faster and with higher signal:
- **Company Profile Management**: Maintain company branding, logo, overview, industry, website, size, and headquarters.
- **Job Lifecycle Management**: Draft, publish, edit, and close job postings. Define required vs. nice-to-have skills, compensation ranges, experience requirements, and workplace policy (`REMOTE`, `HYBRID`, `ONSITE`).
- **Kanban Applicant Management**: Visual drag-and-drop board organized across 6 hiring stages with candidate summaries, match scores, and 1-tap stage stepping.
- **Private Candidate Evaluation**: Add internal recruitment notes and review applicant resumes with strict IDOR protections.
- **Interview Scheduling Engine**: Schedule technical, behavioral, screening, or final interviews with automatic duration, meeting URLs, and candidate notification.
- **Applicant Filtering**: Filter candidate pools by job opening, status, or date applied.

### 3. Platform Administrator (`ADMIN`)
Provides full governance, trust, and platform health oversight:
- **Executive Analytics Dashboard**: Real-time metrics on total users (by role), verified companies, active vs. closed jobs, application conversion funnels, interview velocity, and server memory/uptime.
- **Company Verification & Trust Badge**: Review registered organizations and grant/revoke the verified trust badge in 1 click.
- **Job Moderation & Takedowns**: Inspect all platform job postings, moderate content, and close non-compliant listings with recorded moderation reasons.
- **User Governance**: Audit all registered accounts, verify email statuses, manage roles, and suspend/reactivate accounts.
- **System Audit Trail**: Complete immutable stream tracking every administrative action, resume view, application submission, and status transition with IP addresses, user agents, and metadata.

---

## 🧠 Deterministic 5-Pillar Matching Engine

Rather than relying on unreliable heuristics, JobPilot AI computes match scores using a deterministic weighted algorithm calibrated across five core pillars:

$$\text{Overall Score} = (S \times 0.40) + (E \times 0.20) + (M \times 0.20) + (P \times 0.10) + (C \times 0.10)$$

```
┌────────────────────────────────────────────────────────────────────────┐
│                    JobPilot 5-Pillar Score Breakdown                   │
├───────────────────────────────────┬────────┬───────────────────────────┤
│ Pillar                            │ Weight │ Measurement Metric        │
├───────────────────────────────────┼────────┼───────────────────────────┤
│ 1. Core Technical Skills          │  40%   │ Required (80%) + Nice(20%)│
│ 2. Years of Experience            │  20%   │ Verified candidate years  │
│ 3. Semantic & Title Alignment     │  20%   │ Headline & role overlap   │
│ 4. Practical Projects & Portfolio │  10%   │ Real-world project tech   │
│ 5. Career & Workplace Preferences │  10%   │ Salary & Remote/Hybrid fit│
└───────────────────────────────────┴────────┴───────────────────────────┘
```

```mermaid
flowchart LR
    A[Candidate Profile & Resume] --> M[Deterministic Matching Engine]
    B[Job Posting Specifications] --> M

    subgraph Pillars [5 Evaluation Pillars]
        M --> P1[Pillar 1: Skills Overlap - 40%]
        M --> P2[Pillar 2: Experience Depth - 20%]
        M --> P3[Pillar 3: Semantic Alignment - 20%]
        M --> P4[Pillar 4: Project Portfolio - 10%]
        M --> P5[Pillar 5: Workplace Preferences - 10%]
    end

    P1 --> Calc[Weighted Aggregator]
    P2 --> Calc
    P3 --> Calc
    P4 --> Calc
    P5 --> Calc

    Calc --> Out[Composite Score 0-100%]
    Out --> Tier1[Exceptional Match: 85-100%]
    Out --> Tier2[Strong Match: 70-84%]
    Out --> Tier3[Moderate Match: 50-69%]
    Out --> Tier4[Low Match: 0-49%]
```

### Tech Synonym Normalization
To prevent false negatives, skills are normalized before matching:
- `js`, `react.js`, `reactjs` $\rightarrow$ `react`
- `ts`, `typescript` $\rightarrow$ `typescript`
- `nodejs`, `node.js` $\rightarrow$ `nodejs`
- `postgres`, `postgresdb` $\rightarrow$ `postgresql`
- `tailwind`, `tailwindcss` $\rightarrow$ `tailwind css`
- `rest`, `restful`, `rest api` $\rightarrow$ `rest apis`

---

## 🔄 End-to-End Workflow & How It Works

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as 👤 Candidate
    actor Recruiter as 👔 Recruiter
    actor Admin as 🛡️ Super Admin
    participant System as ⚙️ JobPilot Engine
    participant DB as 🗄️ Database / Store

    %% Registration & Verification
    Recruiter->>System: Register company & profile
    Admin->>System: Verify company profile (Trust Badge granted)
    
    %% Job Creation & Matching
    Recruiter->>System: Create Job Posting (Required skills, salary, workplace)
    Candidate->>System: Upload Resume & update skills
    System->>System: Compute 5-Pillar Score & Skill Gap suggestions
    Candidate->>System: Browse Jobs (Views personalized match score & gap analysis)

    %% Application
    Candidate->>System: Submit Application (Selected Resume + Cover Letter)
    System->>DB: Record Application & StatusHistory (APPLIED)
    System->>Recruiter: Notify: New candidate application

    %% Recruiter Pipeline
    Recruiter->>System: Open Kanban Board -> Review Resume
    Recruiter->>System: Move to SHORTLISTED
    Recruiter->>System: Schedule Technical Interview (Google Meet link + Time)
    System->>DB: Create Interview Record & Advance Status to INTERVIEW
    System->>Candidate: Notify: Interview Scheduled with Google Meet link

    %% Decision
    Recruiter->>System: Transition to OFFER or REJECTED
    System->>Candidate: Real-time status update notification
    System->>DB: Log immutable Audit Trail
```

---

## 📐 System Architecture & Diagrams

### High-Level Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Frontend)"]
        UI_Candidate["Candidate Portal\n(Jobs, Match Score, Resumes, Applications)"]
        UI_Recruiter["Recruiter Console\n(Post Jobs, Kanban Pipeline, Interviews)"]
        UI_Admin["Admin Console\n(Verification, Moderation, Audit Stream)"]
    end

    subgraph FrontendCore ["Frontend Architecture (React 18 + Vite)"]
        Router["React Router v6\n(Protected & Role-Based Routes)"]
        Query["TanStack React Query\n(Caching, Invalidation & Prefetching)"]
        State["Zustand Stores\n(useAuthStore & useUIStore)"]
        API_Client["Axios HTTP Client\n(JWT Interceptor & Error Handling)"]
    end

    subgraph APILayer ["Backend Architecture (Node.js + Express)"]
        Security["Security Middleware\n(Helmet, CORS, Rate Limiters)"]
        AuthMid["Auth & RBAC Middleware\n(authenticate, authorize)"]
        Validation["Zod Request Validators"]
        RouterHub["API Router Gateway\n(/api/v1/*)"]
    end

    subgraph ServiceLayer ["Domain Services & Business Logic"]
        AuthSvc["Auth Service\n(Bcrypt, JWT Rotation)"]
        MatchSvc["5-Pillar Match Score Engine\n(Deterministic Calculation)"]
        JobSvc["Job & Discovery Service"]
        AppSvc["Application & Kanban Service"]
        InterviewSvc["Interview Scheduling Service"]
        StorageSvc["Storage Service\n(Cloudinary & Secure Fallback)"]
        AdminSvc["Admin Governance & Audit Service"]
    end

    subgraph DataLayer ["Data & Persistence Layer"]
        PrismaORM["Prisma ORM Client"]
        PostgreSQL[("PostgreSQL Database\n(ACID Relational Model)")]
        MemoryStore[("In-Memory Mock Fallback Engine\n(Zero-Config Instant Boot)")]
    end

    ClientLayer --> Router
    Router --> Query
    Query --> API_Client
    State --> API_Client
    API_Client --> Security
    Security --> AuthMid --> Validation --> RouterHub
    RouterHub --> ServiceLayer
    ServiceLayer --> PrismaORM
    PrismaORM -.->|If DATABASE_URL set| PostgreSQL
    PrismaORM -.->|Fallback if offline| MemoryStore
```

---

### Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o| UserProfile : "has"
    User ||--o| Recruiter : "acts as"
    User ||--o{ RefreshToken : "owns"
    User ||--o{ Resume : "creates"
    User ||--o{ Application : "submits"
    User ||--o{ SavedJob : "bookmarks"
    User ||--o{ JobMatch : "receives"
    User ||--o{ Notification : "receives"
    User ||--o| NotificationPreference : "configures"
    User ||--o{ AuditLog : "triggers"

    Company ||--o{ Recruiter : "employs"
    Company ||--o{ Job : "hosts"

    Recruiter ||--o{ Job : "posts"

    Job ||--o{ Application : "receives"
    Job ||--o{ SavedJob : "saved in"
    Job ||--o{ JobMatch : "evaluated in"

    Resume ||--o{ ResumeSkill : "extracts"
    Resume ||--o{ Application : "attached to"
    Resume ||--o{ JobMatch : "scored in"

    Application ||--o{ ApplicationStatusHistory : "tracks"
    Application ||--o{ Interview : "schedules"

    User {
        string id PK
        string email UK
        string passwordHash
        enum role "JOB_SEEKER | RECRUITER | ADMIN"
        boolean isEmailVerified
        string avatarUrl
        string googleId UK
        datetime createdAt
    }

    UserProfile {
        string id PK
        string userId FK
        string fullName
        string headline
        string location
        string bio
        string[] skills
        json education
        json experience
        json projects
        json certifications
        json careerPreferences
    }

    Company {
        string id PK
        string name UK
        string description
        string logoUrl
        string website
        string location
        string industry
        string companySize
        boolean isVerified
    }

    Recruiter {
        string id PK
        string userId FK
        string companyId FK
        string position
        boolean isCompanyAdmin
    }

    Job {
        string id PK
        string companyId FK
        string recruiterId FK
        string title
        string description
        string location
        enum workplaceType "REMOTE | HYBRID | ONSITE"
        int minSalary
        int maxSalary
        string currency
        enum status "DRAFT | ACTIVE | CLOSED"
        string[] requiredSkills
        string[] niceToHaveSkills
    }

    Resume {
        string id PK
        string userId FK
        string title
        string fileUrl
        string cloudinaryId
        boolean isPrimary
        enum visibility "PRIVATE | APPLICATION_ONLY | RECRUITER_VISIBLE"
        int version
        int qualityScore
    }

    Application {
        string id PK
        string jobId FK
        string candidateId FK
        string resumeId FK
        enum status "APPLIED | UNDER_REVIEW | SHORTLISTED | INTERVIEW | OFFER | REJECTED | WITHDRAWN"
        string coverLetter
        string recruiterNotes
    }

    ApplicationStatusHistory {
        string id PK
        string applicationId FK
        string fromStatus
        string toStatus
        string changedById
        string reason
        datetime createdAt
    }

    Interview {
        string id PK
        string applicationId FK
        datetime scheduledAt
        int durationMinutes
        enum type "SCREENING | BEHAVIORAL | TECHNICAL | HR | FINAL"
        string meetingUrl
        string notes
        enum status "SCHEDULED | COMPLETED | CANCELLED | RESCHEDULED"
    }

    AuditLog {
        string id PK
        string userId FK
        string action
        string resource
        string resourceId
        string ipAddress
        string userAgent
        json metadata
        datetime createdAt
    }
```

---

### Candidate Application State Machine

```mermaid
stateDiagram-v2
    [*] --> APPLIED: Candidate applies with Resume & Cover Letter
    APPLIED --> UNDER_REVIEW: Recruiter reviews application
    APPLIED --> WITHDRAWN: Candidate withdraws
    UNDER_REVIEW --> SHORTLISTED: Candidate meets criteria
    UNDER_REVIEW --> REJECTED: Candidate does not qualify
    UNDER_REVIEW --> WITHDRAWN: Candidate withdraws
    SHORTLISTED --> INTERVIEW: Recruiter schedules interview
    SHORTLISTED --> REJECTED: Candidate does not qualify
    INTERVIEW --> OFFER: Passed all interview stages
    INTERVIEW --> REJECTED: Candidate rejected after interview
    OFFER --> [*]: Candidate accepts or declines
    REJECTED --> [*]
    WITHDRAWN --> [*]
```

---

## 💻 Tech Stack & Engineering Specs

### Frontend (`/frontend`)
| Technology | Version | Purpose |
|:---|:---|:---|
| **React** | `18.3.1` | Declarative component UI library |
| **Vite** | `5.4.10` | Lightning-fast ESM dev server and production bundler |
| **Tailwind CSS** | `3.4.14` | Utility-first styling with custom brand color tokens |
| **TanStack React Query**| `5.59.20` | Server-state caching, background refetching & mutations |
| **Zustand** | `5.0.1` | Ultra-lightweight reactive global state management |
| **React Hook Form** | `7.53.1` | High-performance uncontrolled form handling |
| **Zod** | `3.23.8` | Client-side schema validation |
| **Lucide React** | `0.454.0` | Comprehensive accessible UI icon set |
| **Axios** | `1.7.7` | HTTP client with automatic JWT credentials inclusion |

### Backend (`/backend`)
| Technology | Version | Purpose |
|:---|:---|:---|
| **Node.js** | `>= 18.x` | Runtime environment |
| **Express** | `4.21.1` | Web framework & API router |
| **Prisma ORM** | `5.22.0` | Next-generation type-safe database toolkit |
| **PostgreSQL** | `>= 14.x` | Enterprise relational database |
| **JSON Web Tokens** | `9.0.2` | Stateless Access Tokens & rotating HTTP-only Refresh Tokens |
| **BcryptJS** | `2.4.3` | Cryptographic password hashing (10 salt rounds) |
| **Helmet** | `8.0.0` | HTTP security headers |
| **Express Rate Limit** | `7.4.1` | DDoS & brute-force request rate limiting |
| **Cookie Parser** | `1.4.7` | Cookie parsing for secure refresh token retrieval |
| **Zod** | `3.23.8` | Strict runtime request body and query validation |

---

## 📂 Project Structure

```
JobPilot AI/
├── README.md                      # Comprehensive project documentation
├── backend/                       # Express & Prisma Backend
│   ├── prisma/
│   │   └── schema.prisma          # PostgreSQL relational schema & enums
│   ├── src/
│   │   ├── config/                # Environment & Database config
│   │   │   ├── db.js              # Prisma client & connection health checker
│   │   │   └── env.js             # Validated environment configuration
│   │   ├── errors/
│   │   │   └── AppError.js        # Standardized HTTP error class
│   │   ├── middleware/            # Security, Auth, Validation & Error middlewares
│   │   │   ├── authMiddleware.js      # authenticate, authorize, optionalAuthenticate
│   │   │   ├── errorMiddleware.js     # Centralized error handler & 404 catcher
│   │   │   ├── securityMiddleware.js  # Helmet, CORS, and Rate Limiting
│   │   │   └── validateMiddleware.js  # Zod schema validation middleware
│   │   ├── modules/               # Domain-driven modular components
│   │   │   ├── admin/             # Platform stats, company verification, user moderation
│   │   │   ├── alerts/            # Job alert subscriptions & automated digests
│   │   │   ├── applications/      # Candidate applications, Kanban board, timeline
│   │   │   ├── auth/              # Register, login, refresh, logout, Google OAuth
│   │   │   ├── companies/         # Company profiles & recruiter associations
│   │   │   ├── health/            # Liveness, readiness, and metrics check
│   │   │   ├── interviews/        # Interview scheduling & Google Meet invites
│   │   │   ├── jobs/              # Job posting, search, recommendations & matching
│   │   │   ├── notifications/     # In-app notifications & read management
│   │   │   ├── profiles/          # User profiles & market skill gap intelligence
│   │   │   └── resumes/           # Multi-version resume upload & privacy controls
│   │   ├── services/              # Shared infrastructure services
│   │   │   ├── emailService.js        # Resend email client & mock fallback
│   │   │   ├── matchScoreService.js   # 5-Pillar Deterministic Matching Engine
│   │   │   └── storageService.js      # Cloudinary CDN & secure file abstraction
│   │   ├── utils/                 # Helpers (Token generation, loggers, responses)
│   │   └── server.js              # Express app bootstrap & graceful shutdown
│   ├── .env.example               # Backend environment variables template
│   └── package.json
└── frontend/                      # React 18 + Vite Single Page Application
    ├── src/
    │   ├── api/                   # Modular Axios API service callers
    │   │   ├── adminApi.js
    │   │   ├── alertApi.js
    │   │   ├── applicationApi.js
    │   │   ├── authApi.js
    │   │   ├── client.js          # Axios instance with credentials & interceptors
    │   │   ├── companyApi.js
    │   │   ├── interviewApi.js
    │   │   ├── jobApi.js
    │   │   ├── notificationApi.js
    │   │   ├── profileApi.js
    │   │   └── resumeApi.js
    │   ├── components/            # Reusable UI components
    │   │   ├── alerts/            # CreateAlertModal
    │   │   ├── applications/      # ApplyModal
    │   │   ├── common/            # Badge, Button, Card, Input, Skeleton, Toast
    │   │   ├── interviews/        # ScheduleInterviewModal, UpcomingInterviewsCard
    │   │   ├── jobs/              # JobMatchBreakdownCard
    │   │   ├── layout/            # AppLayout, Navbar, MobileDrawer, MobileBottomNav
    │   │   ├── notifications/     # NotificationBell with unread counter
    │   │   ├── profile/           # SkillGapIntelligenceCard
    │   │   └── recruiter/         # Drag-and-Drop KanbanBoard
    │   ├── pages/                 # Route pages
    │   │   ├── admin/             # AdminDashboardPage (Stats, Verification, Jobs, Users)
    │   │   ├── applications/      # ApplicationsPage (Timeline, tracking, withdrawal)
    │   │   ├── auth/              # LoginPage, RegisterPage (with quick demo fill buttons)
    │   │   ├── candidate/         # JobAlertsPage
    │   │   ├── jobs/              # JobsPage, JobDetailPage, SavedJobsPage
    │   │   ├── profile/           # ProfilePage (Education, skills, experience editor)
    │   │   ├── recruiter/         # CreateJobPage, RecruiterApplicationsPage, CompanyProfilePage
    │   │   ├── Dashboard.jsx      # Role-adaptive Dashboard
    │   │   ├── Home.jsx           # Landing page with hero & platform highlights
    │   │   └── NotFound.jsx       # 404 page
    │   ├── routes/                # ProtectedRoute, RoleRoute & AppRoutes
    │   ├── store/                 # Zustand global stores (useAuthStore, useUIStore)
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## ⚡ Getting Started & Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) version **18.x** or higher
- `npm` (comes bundled with Node.js) or `yarn` / `pnpm`
- *(Optional for Production)* [PostgreSQL](https://www.postgresql.org/) database

---

### Option A: Instant Boot (Zero-Config In-Memory Mode)

You can launch and test the entire platform **without installing or configuring PostgreSQL**. The backend automatically detects that no database is connected and activates the built-in, pre-seeded In-Memory Store.

#### 1. Start the Backend:
```bash
cd backend
npm install
npm run dev
```
*The server will start at `http://localhost:5000` with the message:*  
`[INFO] JobPilot AI backend running on port 5000 in [development] mode`

#### 2. Start the Frontend (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```
*The frontend will start at `http://localhost:5173`.*

Open [http://localhost:5173](http://localhost:5173) in your browser. You can click the **Demo 1-Tap Login** buttons on the Login page to test Candidate, Recruiter, and Admin roles immediately!

---

### Option B: PostgreSQL Production Mode

To persist data in a real PostgreSQL instance:

#### 1. Configure Backend Environment:
In `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/jobpilot_db?schema=public"
JWT_ACCESS_SECRET="jobpilot_production_access_secret_key_2026"
JWT_REFRESH_SECRET="jobpilot_production_refresh_secret_key_2026"
FRONTEND_URL="http://localhost:5173"
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

#### 2. Run Database Migrations:
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

#### 3. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Pre-Seeded Demo Credentials

The platform comes pre-seeded with test accounts across all roles:

| Role | Email | Password | Pre-loaded Data & Features |
|:---|:---|:---|:---|
| **Candidate** (`JOB_SEEKER`) | `alex.seeker@example.com` | `Password123` | Full profile with skills, uploaded resume (94 quality score), 1 active application, 1 scheduled technical interview. |
| **Recruiter** (`RECRUITER`) | `sarah.recruiter@techcorp.com` | `Password123` | Linked to verified company **TechCorp Solutions**, active job postings, applicants on the Kanban board. |
| **Super Admin** (`ADMIN`) | `admin@jobpilot.ai` | `Password123` | Full access to Platform Analytics, Company Verification toggles, Job Moderation, and live Audit Trail. |

> 💡 **Quick Login Tip**: On the `/login` screen, simply click **"Alex Seeker (Candidate)"** or **"Sarah Recruiter"** to auto-fill credentials and sign in instantly.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database (Prisma + PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobpilot_db?schema=public
# DIRECT_URL= (Optional for Supabase / Neon connection poolers)

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_ACCESS_SECRET=your_super_secret_access_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# Cloudinary (Optional - local fallback used if unconfigured)
CLOUDINARY_CLOUD_NAME=jobpilot-mock
CLOUDINARY_API_KEY=1234567890
CLOUDINARY_API_SECRET=mock-cloudinary-secret

# Email (Resend - console fallback used if unconfigured)
RESEND_API_KEY=re_mock_api_key_for_dev
RESEND_FROM_EMAIL=notifications@jobpilot.ai

# Frontend URL & CORS
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 📡 Complete REST API Catalog

All endpoints are prefixed with `/api/v1`.

### 1. System & Health
| Method | Route | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/health` | Public | System liveness, database health, uptime & memory |

### 2. Authentication (`/auth`)
| Method | Route | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/auth/register` | Public | Register new candidate or recruiter account |
| `POST` | `/auth/login` | Public | Authenticate user, issue access token & refresh cookie |
| `POST` | `/auth/refresh` | Public | Rotate refresh token and issue new access token |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token and clear cookies |
| `GET` | `/auth/me` | Authenticated | Retrieve authenticated user profile and company info |
| `POST` | `/auth/google` | Public | Google OAuth token verification and account linking |

### 3. Profiles (`/profiles`)
| Method | Route | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/profiles/me` | Authenticated | Get current candidate profile details |
| `PATCH` | `/profiles/me` | Authenticated | Update skills, education, experience, and preferences |
| `GET` | `/profiles/me/skill-gaps` | Authenticated | Market demand analysis & personalized skill gap advice |
| `GET` | `/profiles/:userId` | Authenticated | View public candidate profile |

### 4. Resumes (`/resumes`)
| Method | Route | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/resumes` | Candidate | List all candidate's resumes |
| `POST` | `/resumes` | Candidate | Upload new resume with title, file, and visibility |
| `GET` | `/resumes/:id` | Authenticated | View resume details with strict IDOR permission checks |
| `PATCH` | `/resumes/:id` | Candidate | Update resume title or visibility setting |
| `PATCH` | `/resumes/:id/primary`| Candidate | Set resume as the primary application default |
| `DELETE`| `/resumes/:id` | Candidate | Delete resume and attached cloud storage |

### 5. Jobs (`/jobs`)
| Method | Route | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/jobs` | Public | Search & filter active job openings |
| `GET` | `/jobs/:id` | Public | Get job details and company summary |
| `GET` | `/jobs/:id/match-score`| Candidate | Compute deterministic 5-pillar score for this job |
| `GET` | `/jobs/candidate/recommendations` | Candidate | High-matching jobs tailored to candidate skills |
| `GET` | `/jobs/candidate/saved`| Candidate | List all bookmarked jobs |
| `POST` | `/jobs/:id/save` | Candidate | Toggle saving / bookmarking a job |
| `GET` | `/jobs/recruiter/my-jobs` | Recruiter/Admin | List jobs posted by current recruiter's company |
| `POST` | `/jobs` | Recruiter/Admin | Post a new job opening |
| `PATCH` | `/jobs/:id` | Recruiter/Admin | Update job title, skills, salary, or details |
| `PATCH` | `/jobs/:id/close` | Recruiter/Admin | Mark job status as CLOSED |

### 6. Applications (`/applications`)
| Method | Route | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/applications/jobs/:jobId` | Candidate | Apply for job with selected resume & cover letter |
| `GET` | `/applications/me` | Candidate | List submitted applications with timeline history |
| `GET` | `/applications/:id` | Authenticated | View application details (Candidate or hiring Recruiter) |
| `POST` | `/applications/:id/withdraw` | Candidate | Withdraw application prior to final decision |
| `GET` | `/applications/recruiter` | Recruiter/Admin | Fetch applications for company jobs (Kanban feed) |
| `PATCH` | `/applications/:id/status`| Recruiter/Admin | Transition application stage & update recruiter notes |

### 7. Interviews (`/interviews`)
| Method | Route | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/interviews` | Recruiter/Admin | Schedule interview (auto-advances applicant to INTERVIEW) |
| `GET` | `/interviews/my-interviews`| Candidate | View upcoming candidate interviews |
| `GET` | `/interviews/recruiter` | Recruiter/Admin | View upcoming recruiter company interviews |
| `PATCH` | `/interviews/:id` | Recruiter/Admin | Update interview timing, meeting URL, or status |

### 8. Job Alerts (`/job-alerts`)
| Method | Route | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/job-alerts` | Candidate/Admin | List active job alert subscriptions |
| `POST` | `/job-alerts` | Candidate/Admin | Create new alert with keywords, salary, and match filter |
| `PATCH` | `/job-alerts/:id` | Candidate/Admin | Update alert criteria or pause/resume alert |
| `DELETE`| `/job-alerts/:id` | Candidate/Admin | Delete job alert |
| `POST` | `/job-alerts/:id/trigger`| Candidate/Admin | Run immediate matching trigger test |
| `GET` | `/job-alerts/preferences`| Candidate/Admin | Retrieve email notification preferences |
| `PATCH` | `/job-alerts/preferences`| Candidate/Admin | Update notification channels & minimum match threshold |

### 9. Admin Platform Console (`/admin`)
| Method | Route | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/admin/stats` | Admin Only | Global platform analytics & infrastructure health |
| `GET` | `/admin/companies` | Admin Only | List all registered companies with verification state |
| `PATCH` | `/admin/companies/:id/verify` | Admin Only | 1-click toggle company trust verification badge |
| `GET` | `/admin/jobs` | Admin Only | View all platform jobs for content moderation |
| `PATCH` | `/admin/jobs/:id/moderate` | Admin Only | Moderate or take down job with recorded reason |
| `GET` | `/admin/users` | Admin Only | Manage all users across roles |
| `PATCH` | `/admin/users/:id/status` | Admin Only | Suspend, activate, or verify user accounts |
| `GET` | `/admin/audit-logs` | Admin Only | Query immutable platform audit trail |

### 10. Notifications (`/notifications`)
| Method | Route | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/notifications` | Authenticated | List user notifications |
| `GET` | `/notifications/unread-count` | Authenticated | Get count of unread notifications |
| `PATCH` | `/notifications/read-all`| Authenticated | Mark all notifications as read |
| `PATCH` | `/notifications/:id/read`| Authenticated | Mark single notification as read |

---

## 🛡️ Security, Privacy & IDOR Protection

JobPilot AI incorporates defense-in-depth security principles across its architecture:

1. **Insecure Direct Object Reference (IDOR) Defense**:
   - Resumes marked as `PRIVATE` can **only** be viewed by the resume owner and platform admins.
   - Resumes marked as `APPLICATION_ONLY` can **only** be viewed by recruiters if the candidate has actively submitted an application to one of that recruiter's job openings.
   - Unauthorized attempts immediately return `403 Forbidden` and log a security audit event.

2. **Dual-Token Authentication Architecture**:
   - Short-lived Access Tokens (15-minute expiration) transmitted via `Authorization: Bearer <token>`.
   - Long-lived Refresh Tokens (7-day expiration) stored inside **`httpOnly`, `SameSite=Lax`** cookies to prevent theft via Cross-Site Scripting (XSS).
   - Refresh tokens are tracked in the database and support immediate revocation on logout or account compromise.

3. **Cryptographic Protection**:
   - All passwords hashed using `bcryptjs` with 10 salt rounds before storage.
   - No plain-text passwords ever touch application logs or responses.

4. **Security Headers & Defense Middleware**:
   - `helmet` automatically secures HTTP headers (CSP, HSTS, X-Content-Type-Options, etc.).
   - `express-rate-limit` prevents brute-force login attempts and DDoS floods.
   - Strict CORS origin whitelisting matching production frontend domains.

5. **Tamper-Evident Audit Logging**:
   - Every sensitive administrative event (company verification, job takedown, user moderation, resume access) creates an immutable `AuditLog` recording the actor, target resource, timestamp, IP address, user agent, and payload.

---

## 🚀 Git Setup & Deployment Guide

### Recommended `.gitignore`
Make sure your root `.gitignore` ignores dependency trees and environment secrets:
```gitignore
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Production Builds
dist/
frontend/dist/
build/

# Environment Variables & Secrets
.env
backend/.env
frontend/.env
*.env.local

# Logs & Temporary Files
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
Thumbs.db
```

### Initializing Git & Pushing to GitHub

```bash
# 1. Initialize git in the root folder
git init

# 2. Add all files
git add .

# 3. Create your initial commit
git commit -m "feat: complete JobPilot AI platform with 5-pillar matching, recruiter kanban, and admin console"

# 4. Set branch to main
git branch -M main

# 5. Link your GitHub remote repository
git remote add origin https://github.com/your-username/jobpilot-ai.git

# 6. Push to GitHub
git push -u origin main
```

### Production Deployment Suggestions

- **Frontend (Vite / React)**: Deploy to [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/). Set the build command to `npm run build` and output directory to `dist`.
- **Backend (Node.js / Express)**: Deploy to [Render](https://render.com/), [Railway](https://railway.app/), or [Fly.io](https://fly.io/). Set the start command to `npm start`.
- **Database (PostgreSQL)**: Use [Supabase](https://supabase.com/) or [Neon Serverless Postgres](https://neon.tech/). Simply set the `DATABASE_URL` in your backend deployment environment variables and run `npx prisma migrate deploy`.

---

<p align="center">
  <strong>Built with ❤️ by the JobPilot AI Engineering Team.</strong><br />
  <em>Empowering transparent, intelligent, and human-centric talent acquisition.</em>
</p>
