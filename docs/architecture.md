# SkillGraph Architecture Overview

## 1. System Philosophy & Objectives
SkillGraph is an enterprise-grade career readiness, skill-gap intelligence, job matching, and structured learning platform centered around a directed skill dependency graph.

The platform transforms raw user skills into verified career paths:
```text
User Skills
     ↓
SkillGraph (DAG Engine & Prerequisites)
     ↓
Career Role / Job Requirements
     ↓
Skill Matching & Prerequisite Analysis
     ↓
Topological Guided Learning Path & Practice
     ↓
Verified Skill Assessments & Interview Prep
     ↓
Job Compatibility Matching & Application Tracking (ATS)
```

## 2. Dedicated Role Isolation Architecture
SkillGraph enforces strict separation between user types to guarantee tailored workflows:

### A. STUDENT (Learner & Candidate)
- **Primary Goal**: Career skill development, prerequisite learning, skill verification, and job placement.
- **Dedicated Views**:
  - `Student Dashboard`: Career readiness radial gauge, streak tracker, weekly study pacing, priority skill gaps, next learning topic CTA, job recommendations.
  - `Career Paths & Explorer`: Role requirements, salary trends, target career selection.
  - `Learning Roadmap`: Prerequisite-driven chapters and topics inspired by Code360 information architecture.
  - `Skill Graph`: Interactive dependency graph visualization.
  - `My Skills`: Self-reported proficiencies and verified badge status.
  - `Assessments`: Timed 10-question verified tests with instant grading and badge awarding.
  - `Interview Prep`: Technical interview questions bank, key points to mention, code snippets, and interactive practice simulator.
  - `Projects & Evidence`: Tangible proof linked directly to skills.
  - `Study Activity`: Authentic daily streak calculation and practice logging.
  - `Job Market & Applications`: Compatibility matching (0-100%) and multi-stage status tracker.

### B. RECRUITER (Talent Acquisition & Hiring Manager)
- **Primary Goal**: Job requisition management, candidate sourcing, skill compatibility verification, and recruitment pipeline progression.
- **Strict Role Isolation**: Recruiters NEVER see student learning paths, streaks, assessments, or personal skills in navigation.
- **Dedicated Views**:
  - `Recruiter Dashboard`: Active jobs count, total applicants, funnel breakdown (Applied, Reviewing, Shortlisted, Interview, Offered, Rejected), recent candidate submissions table, owned jobs summary.
  - `My Jobs (`/admin/jobs`)`: Table of posted positions, openings, status toggle (Active/Closed), and direct ATS links.
  - `Applicants / ATS (`/admin/applicants`)`: Candidate pipeline with resume/portfolio links, verified skill badges, candidate search, and stage progression dropdown.
  - `Company Profile`: Hiring manager and organization details.

### C. ADMIN (System Governance & Operations)
- **Primary Goal**: Platform oversight, user account management, platform statistics, and taxonomy governance.
- **Strict Role Isolation**: Admins NEVER see student learning paths or personal streak trackers as their primary interface. Public registration of admins is blocked with HTTP 403; seeded via secure bootstrap.
- **Dedicated Views**:
  - `Admin Dashboard`: Real-time platform metrics (students, recruiters, active jobs, applications), system health monitor, recruitment funnel breakdown, latest user registrations, recent job submissions.
  - `Student Management (`/admin/students`)`: Searchable student directory, target career roles, readiness scores, total vs verified skills, application counts, account activation toggle (Active/Disabled), and full student record inspection slide-over.
  - `Recruiter Management (`/admin/recruiters`)`: Employer partners table, active jobs count, total applicants received, and account activation privileges.
  - `Job Management & ATS`: System-wide job listings and application oversight.
  - `Skill Graph Topology`: DAG dependency inspection.

---

## 3. System Architecture Layers

### Frontend Layer (React 18 + Vite + TailwindCSS)
- **Dynamic Role Navigation**: `DashboardLayout` dynamically renders role-specific secondary navigation bars, top headers, and drawer menus based on `user.accountRole`.
- **RoleDashboard Router**: `/dashboard` dynamically resolves to `AdminDashboard`, `RecruiterDashboard`, or student `Dashboard`.
- **Route Guards**:
  - `PrivateRoute`: Authenticated user clearance.
  - `PublicRoute`: Redirects authenticated users away from login/register.
  - `RoleRoute`: RBAC enforcement on sensitive endpoints.

### Backend Layer (Node.js + Express)
- **Controllers & Routing**:
  - `/api/auth`: Login, registration, role aliasing, token issuance.
  - `/api/admin`: Platform statistics, student management, recruiter management, account activation.
  - `/api/dashboard`: Student command center, recruiter pipeline metrics.
  - `/api/interview-prep`: Question bank, domain/tech filtering, user mastery tracking.
  - `/api/jobs`: Job requisition CRUD, compatibility matching, candidate application submission.
  - `/api/applications`: ATS pipeline management and student application history.
  - `/api/assessments`: 10-question evaluations, automated grading, skill badge verification.
  - `/api/learning`: Prerequisite-driven topic progress tracking.
  - `/api/activity`: Daily study logs and authentic streak tracking.
- **Middleware**:
  - `protect`: JWT token verification, account status validation (`user.isActive !== false`).
  - `restrictTo`: Role-based route authorization.
  - `limiter`, `helmet`, `mongoSanitize`, `cors`: Production-grade security controls.

### Persistence Layer
- **MongoDB Atlas**: Document storage with compound indexing (`{ userId: 1, jobId: 1 }` for duplicate prevention, `{ userId: 1, questionId: 1 }` for mastery tracking, ESR indexing on jobs).
- **CognoDB / Graph Driver**: Graph engine integration with automatic MongoDB fallback for high availability.
