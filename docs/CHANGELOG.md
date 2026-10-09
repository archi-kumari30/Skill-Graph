# SkillGraph Platform Upgrade Changelog

## [Version 2.1.0] - Production Performance, Deployment Resilience & Authentication Audit

### Summary
Resolved deployment delays, frontend build errors, authentication refresh flow issues, and graph timeout race conditions. Implemented non-blocking HTTP server bootstrap on Render, immediate public page rendering for guest visitors (<100ms), 2500ms CognoDB query timeout with automatic MongoDB fallback, bounded network timeouts across Axios requests, and clean removal of redundant Mongoose indexes.

### Key Enhancements & Root Causes Resolved

#### 1. Instant Public Route Rendering & Guest Authentication Handling
- **Root Cause**: `PublicRoute` previously blocked rendering for all visitors while `AuthContext.initAuth()` awaited a remote call to `POST /api/auth/refresh`. For guest visitors with no active session, this resulted in waiting for a remote roundtrip to Render (which hung for 1–2 minutes during container cold starts), followed by an expected `401 Unauthorized ("Refresh token required")` being treated as a blocking error.
- **Fix**:
  - `PublicRoute` in `Frontend/src/App.jsx` now mounts public views (`/login`, `/register`, `/reset-password`) immediately when no session token exists in `localStorage`.
  - Configured silent refresh in `AuthContext.jsx` with a 4000ms bounded timeout.
  - The login page now displays in **<100ms** even when the backend is cold-starting or temporarily offline.
  - Legitimate guest `401` responses on `/api/auth/refresh` are handled gracefully without redirect loops or blocking UI errors.

#### 2. Backend Startup & Cold-Start Optimization (Render 1–2 Minute Delay)
- **Root Cause**: In `Backend/src/server.js`, `app.listen(PORT)` was blocked inside `connectDB().then(...)` awaiting sequential execution of four heavy database seed scripts (`runCatalogSeed()`, `runAssessmentSeed()`, `runInterviewSeed()`, `seedDefaultColleges()`) and a synchronous `connectCognoDB()` network handshake. On Render free-tier cold starts, this added 45–90 seconds of Atlas WAN queries before the server bound to the port, causing incoming requests to queue or time out.
- **Fix**:
  - Moved `app.listen(PORT)` to start immediately once MongoDB connects.
  - Database seeding is now guarded by `process.env.SEED_ON_STARTUP === 'true'` and does not run on normal production startup.
  - `connectCognoDB()` runs asynchronously in the background with a 4000ms connection timeout, operating seamlessly in MongoDB fallback mode if unreachable.

#### 3. Graph Database Timeout & Fallback Resilience (`skillGapService.js`)
- **Root Cause**: `calculateGap` previously lacked timer cleanup on its 2500ms timeout promise and had no error handler attached to late-resolving/rejecting graph promises after timeout race settlement, risking memory leaks and unhandled promise rejections.
- **Fix**:
  - Implemented working 2500ms timeout with deterministic `clearTimeout(timerId)` cleanup.
  - Added background rejection listener to prevent unhandled promise rejections if CognoDB queries fail after the timeout window.
  - Guaranteed transparent fallback to MongoDB readiness scoring upon query failure or timeout.
  - Created automated test suite `Backend/tests/skillGapTimeout.test.js` covering graph success, timeout, failure, and fallback.

#### 4. Frontend Network Timeouts & Build Stability
- **Fix**: Added a 15-second default timeout to `api.js` Axios instance and a 6-second timeout to token refresh requests.
- **Fix**: Cleaned up duplicate declarations in `AuthContext.jsx` and verified clean Vite production build (`npm run build` exits 0 in 3.58s).

#### 5. Database Schema Cleanliness
- **Fix**: Removed duplicate index definition `collegeSchema.index({ name: 1 })` from `Backend/src/models/College.js` (`name` already has `unique: true`).

---

## [Version 2.0.0] - Complete Product Logic, UI/UX & Functional Upgrade

### Summary
Transformed SkillGraph from a prototype with mock components into a fully functional, production-ready, SaaS/EdTech career readiness and recruitment platform. Enforced strict 3-way role segregation (`STUDENT`, `RECRUITER`, `ADMIN`), eliminated superficial placeholder elements, and backed every button and interface with genuine MongoDB persistence, validation, authorization, and automated tests.

---

### Key Architectural & Feature Highlights

#### 1. Three-Role Model & Strict Workspace Segregation
- **Student Workspace**: Focused on career goal selection, guided topological learning roadmaps, verified skill assessments, technical interview preparation, project evidence, practice streaks, and job applications.
- **Recruiter Workspace**: Dedicated employer portal with applicant pipeline metrics, job requisition creation/management, ATS candidate stage advancement, and candidate skill compatibility scoring. Recruiter views are completely clean of student learning paths, streaks, and personal assessments.
- **Admin Workspace**: Platform governance dashboard with system-wide health and activity metrics, comprehensive student management directory with full student record inspection, recruiter partner management, and instant account activation/deactivation toggles (`PATCH /api/admin/users/:id/status`). Public admin registration is blocked with HTTP 403; the system admin is securely seeded.

#### 2. Dynamic Role-Based Dashboards & Layout
- **Dynamic `/dashboard` Router**: Automatically resolves to `AdminDashboard`, `RecruiterDashboard`, or the student `Dashboard` based on the authenticated user's `accountRole`.
- **Role-Aware Navigation (`DashboardLayout.jsx`)**:
  - Admin sees system governance links, platform badges, and user management tools.
  - Recruiter sees employer badges, posting tools, ATS pipeline links, and job management tabs.
  - Student sees target career pill, study streaks, readiness score badges, and learning journey tabs.
- **Student Dashboard Redesign**: Replaced card-heavy AI purple gradient widgets with clean EdTech information architecture (Next Learning Topics, Readiness Radial Gauge, Key Metrics, Priority Skill Gaps, Job Recommendations).

#### 3. Dedicated Technical Interview Preparation Engine (`/interview-prep`)
- Comprehensive question bank across Engineering Domains (`Frontend`, `Backend`, `Database`) and Technologies (`HTML`, `CSS`, `JavaScript`, `React`, `Node.js`, `Express.js`, `MongoDB`, `SQL`).
- Conceptual answers, bulleted criteria interviewers listen for, and syntax-highlighted code snippets.
- Interactive **Practice Simulator**: Question 1-of-N runner with hidden answer toggle, answer formulation prompt, and "Mark as Mastered" toggle.
- Mastery tracking persisted in MongoDB (`UserInterviewProgress`) with automatic logging of study activity events (`interview_prep`).

#### 4. Verified Skill Assessment Engine
- Expanded assessments to 10 comprehensive, practical multiple-choice questions per assessment (JavaScript, React, Node.js, MongoDB).
- Timed runner with countdown clock, auto-submit on expiration, step-by-step navigation (`Question 1 of 10`), instant automated grading, and weak topic guidance.
- Scoring &ge; 70% automatically updates `UserSkill.verified = true`, sets proficiency level, awards an official verified badge, and logs an `assessment_passed` study activity.

#### 5. Recruitment & Applicant Tracking System (ATS)
- **Recruiter Requisitions (`/admin/jobs`)**: Create jobs with required skill proficiencies, toggle status between Active and Closed, and view applicant counts.
- **Recruiter ATS (`/admin/applicants`)**: Candidate list with resume/portfolio links, verified skill badges, candidate search, and stage progression dropdown (`applied`, `reviewing`, `shortlisted`, `interview`, `offered`, `rejected`).
- **Student Applications (`/jobs/:id`, `/applications`)**: Validated job application modal with resume link, portfolio link, and qualifications. Enforces duplicate check (`409 Conflict`) and closed job check (`400 Bad Request`).
- **Recruiter Data Isolation**: Non-admin recruiters only see jobs and candidate submissions belonging to their own organization.

#### 6. Database Schema & Security Enhancements
- Added `accountRole` (`admin`, `recruiter`, `student`, `manager`, `employee`), `isActive`, `company`, `phone` fields to `User` model.
- Created `InterviewQuestion` and `UserInterviewProgress` models with unique compound indexes.
- Added compound unique index `{ userId: 1, jobId: 1 }` on `JobApplication` to eliminate duplicate submissions.
- Added `recruiterId` ownership linkage on `Job` model.
- Updated `DailyActivity` with `interview_prep` activity type.

#### 7. Automated Testing & Verification
- All test suites passing with 100% success rate:
  - `auth.test.js` (20/20 tests passing)
  - `skillsGraph.test.js` (9/9 tests passing)
  - `jobPrerequisitesAndLearningPath.test.js` (10/10 tests passing)
  - `learningTopics.test.js` (11/11 tests passing)
  - `assessmentAndEvidence.test.js` (9/9 tests passing)
  - `adminAndInterview.test.js` (8/8 tests passing)
  - `aiAssistant.test.js` (9/9 tests passing)
  - `studentProfile.test.js` (11/11 tests passing)
  - `teamAnalysis.test.js` (9/9 tests passing)
  - `api.test.js` (14/14 tests passing)
- Clean frontend production build (`npm run build` exits with code 0).

---

## [Version 2.3.0] - Faculty Review Feedback Implementation Baseline

### Summary
Implemented all 24 critical review requirements identified during faculty review: universal dismissible notifications, real-time SSE AI streaming, notification bell and center with deduplication, Career Hierarchy Tree view in SkillGraph, recruiter database query isolation, assessment-only verified skill integrity, and unified "Portfolio & Projects" terminology.

### Key Upgrades
1. **Notification Center (`/api/notifications`, `<NotificationCenter />`)**:
   - New `Notification` model with user compound indexes.
   - Top-navigation notification bell with live unread badge.
   - Slide-out popover drawer with mark-as-read and mark-all-as-read actions.
   - Automated in-app alerts on job match &ge; 80%, application status updates, and new submissions.
2. **Real SSE AI Streaming (`POST /api/ai/chat/stream`)**:
   - Progressively streamed response tokens directly over HTTP connection (`text/event-stream`).
   - Replaced simulated timers with native `ReadableStream` reader and progressive chat UI rendering.
3. **Career Hierarchy Tree in SkillGraph (`/skills/graph`)**:
   - Added interactive switcher between "Career Hierarchy Tree" and "Interactive Network Canvas".
   - Tree structures skills into Engineering Domains &rarr; Technologies &rarr; Topics with status badges: Strong/Verified, In Progress, Needs Learning, and Prerequisites Locked.
4. **Verified Skills Data Integrity**:
   - Removed client self-declared verification capabilities.
   - Skill verification status (`verified = true`) is strictly derived from passing assessments with &ge; 70% score.
5. **Universal Dismissible Toast UX**:
   - Customized `<Toaster>` with explicit "X" close button and 4-second auto-dismissal.
6. **Strict Login Validation**:
   - Front-end inline validation against email RFC format and password bounds.
   - Server-side email length caps and regex sanitization.
7. **Recruiter Data Isolation**:
   - Server-side scoping ensures recruiters only access jobs and applications owned by their account.
   - Admin view displays Recruiter Name, Recruiter Email, and company.
8. **Terminology Consistency**:
   - Standardized all navigation, buttons, headings, and metrics to "Portfolio & Projects".

---

## [Version 2.4.0] - End-to-End Product Flow, Role Isolation & Interview Preparation Integrity

### Summary
Fixed end-to-end product architecture and flow discrepancies to ensure production-grade functionality. Eliminated confusing placeholder flows, enforced complete role workspace isolation (`/student/*`, `/recruiter/*`, `/admin/*`), revamped SkillGraph around Target Career and strictly clamped compatibility, eliminated redundant top actions, unified primary preparation into Technical Interview Prep, and established single-source profile configurations.

### Key Upgrades
1. **Student Notifications Integrity**:
   - Eliminated incorrect/irrelevant "Apply" action buttons in notifications.
   - Notifications now strictly informational with direct links to "View Job" or application details.
2. **Skill Graph Real-Data Architecture (`/skill-graph`)**:
   - Eliminated meaningless "Level 1 / Level 2 / Level 3" labels. Replaced with unambiguous status markers: `✓ Verified`, `✓ Already Know`, `→ Learning`, `○ Not Started`.
   - Structured around Target Career with Job Match % strictly clamped between 0% and 100%.
   - Clear visual breakdown of **"YOU KNOW"** (demonstrated profile skills) vs **"YOU NEED TO LEARN"** (target career role requirements).
   - Prominent action CTAs: "Prepare for Interview", "Take Assessment to Verify", "View Skill Gaps".
   - Clickable skill cards with interactive panel linking to interview preparation, assessments, and skill details.
3. **Interview Preparation Engine & Real-Time Filtering (`/interview-prep`)**:
   - Fixed API response unnesting (`payload = res?.data?.data !== undefined ? res.data.data : ...`).
   - Implemented real-time search filtering: typing concepts like "HTML" or "React" immediately filters topics and questions without requiring form submission.
   - Wired URL query parameters (`?tech=`, `?jobId=`, `?domain=`) to automatically scope interview practice.
   - Interactive practice mode with solution reveal, evaluation criteria, and toggled mastery tracking.
4. **Unified "Prepare for Interview" Preparation Flow**:
   - Updated primary action across Job Details (`/jobs/:id`), Job Market (`/jobs`), and Applications (`/applications`) from generic "Guided Learning Path" to "Prepare for Interview" linking directly to `/interview-prep`.
   - Preserved study roadmap as secondary guided study path with explicit assessment verification callouts.
5. **Roadmap Verification Integrity (`/jobs/:id/learning-path`)**:
   - Added verification integrity callouts clarifying that topic completion records self-study progress (`Studied ✓`), whereas official `Verified` skill status strictly requires scoring &ge; 70% on the skill assessment.
6. **Student Profile Real-Data & Single Source Target Setting (`/profile`)**:
   - Established Career Paths (`/careers`) as the single source for target career role configuration.
   - Displays real categorized skills (`Verified`, `Learning`, `Not Yet Demonstrated`) with clickable actions.
   - Displays real user technical portfolio projects from MongoDB with GitHub and live demo links.
   - Displays real job application pipeline status and job offers (`No offers yet` empty state).
7. **Strict Role-Based Routing & Navbar Deduplication**:
   - Added explicit role dashboard routes (`/student/dashboard`, `/recruiter/dashboard`, `/admin/dashboard`) in `App.jsx`.
   - Wrapped student-only learning and career tools in `<RoleRoute allowedRoles={['student', 'employee']}>` to prevent recruiters and admins from accessing student pages.
   - Removed duplicate "Post Job" button from recruiter top navbar; preserved primary button on Job Management page.
   - Filtered out student learning tools from Admin sidebar.

---

## [Version 2.2.0] - Skill Graph Navigation Stability & Real Event-Driven Notification System

### Summary
Resolved the blank white screen navigation issue between Skill Graph and Dashboard by hardening React Router route definitions, unwrapping nested API payloads defensively, safeguarding SVG canvas animation frame lifecycles, and introducing an isolated React `ErrorBoundary`. Enhanced the notification infrastructure into a 100% database-backed, event-driven system with MongoDB persistence, unread counter synchronization, status transition triggers, assessment verification alerts, and idempotent delivery.

### Key Fixes & Enhancements
1. **Skill Graph Navigation & White Screen Elimination**:
   - **Root Cause Resolution**: Resolved API payload nesting discrepancies in `Dashboard.jsx` and `DashboardLayout.jsx` where Axios returned `{ success: true, data: { ... } }`, causing direct property access to yield undefined states.
   - **Physics Simulation Lifecycle**: Guarded `requestAnimationFrame` loop in `SkillGraph.jsx` to only run when `viewMode === 'canvas'`, guarded against null `containerRef.current` access, safely converted node and edge identifiers to strings, and nullified animation frame references upon unmount.
   - **Defensive Rendering**: Added explicit Loading (`LoadingSpinner`), Error (`ErrorState`), and Empty (`Network` icon with assessment link) states in `SkillGraph.jsx`.
   - **Route Harmonization**: Standardized student dashboard route to `/dashboard` across `Login.jsx`, `DashboardLayout.jsx` brand logo, and `App.jsx` redirects, eliminating path desynchronization and history corruption.
   - **React ErrorBoundary**: Created `Frontend/src/components/ErrorBoundary.jsx` and wrapped page content in `DashboardLayout.jsx`, providing user-friendly fallback interfaces with 1-click recovery rather than unhandled blank screens.

2. **Real Event-Driven Database-Backed Notification System**:
   - **MongoDB Notification Persistence**: Backed by genuine `Notification` documents in MongoDB with indexation on `userId`, `read`, and `createdAt`.
   - **Job Application Events**: Submitting an application triggers an `application_submitted` notification for the student with action `[View Application]` (`/applications`) and a `new_applicant` notification for the recruiter (`/admin/applicants`).
   - **Candidate Pipeline Status Transitions**: Status updates (`applied` &rarr; `shortlisted` &rarr; `interview` &rarr; `selected` &rarr; `rejected`) trigger tailored in-app and email notifications with idempotency guards preventing duplicate entries on page refreshes or repeat updates.
   - **Read / Unread State Synchronization**: Clicking notifications or using "Mark All Read" persists read flags via `PATCH` and `PUT` endpoints (`/api/notifications/:id/read`, `/api/notifications/read-all`) and accurately decrements badge counters across sessions.
   - **Skill Assessment Verification Trigger**: Scoring &ge; 70% on any verified assessment emits an `assessment_result` notification with action `[View Skill]` linking directly to `/skills/:id`.

