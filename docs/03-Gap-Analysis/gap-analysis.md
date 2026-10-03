# SkillGraph: Comprehensive Architectural & Production Gap Analysis

## Document Information
- **Project Name**: SkillGraph
- **Phase**: Phase 3 — Requirements and Gap Analysis
- **Target Repository**: `https://github.com/archi-kumari30/Skill-Graph`
- **Source of Truth**: Existing Codebase (`Backend/`, `Frontend/`) and `docs/02-Context/` documentation suite.
- **Purpose**: Systematically identify architectural, functional, security, database, and engineering gaps that prevent SkillGraph from operating as an enterprise-grade, production-style, resume-worthy platform.

---

## Analysis Framework
Every identified gap is evaluated across six standardized dimensions:
1. **Current State**: Exact implementation behavior as it stands in the codebase today.
2. **Evidence**: File paths, code symbols, routes, or schema definitions proving the limitation.
3. **Why It Matters**: Technical risk, production liability, or lost resume/portfolio impact.
4. **Suggested Improvement**: Concrete engineering solution that integrates cleanly with the existing architecture.
5. **Priority**: High / Medium / Low.
6. **Affected Module**: The specific SkillGraph module(s) impacted.

---

## 1. Functional Gaps

### Gap 1.1: Static Mock Data on Career Market Page
- **Current State**: The `CareerMarket.jsx` page renders hardcoded sample data for salary percentiles, hiring demand trends, and in-demand tech stacks.
- **Evidence**: `Frontend/src/pages/CareerMarket.jsx` displays a static notice: `"Sample Market Data: Market analytics are currently based on sample industry benchmarks"` and uses constant JS objects (`marketTrends`, `salaryBands`) rather than querying backend API endpoints.
- **Why It Matters**: Renders the market feature non-functional in real-world scenarios and immediately signals incomplete functionality during portfolio reviews.
- **Suggested Improvement**: Create an aggregation pipeline in `jobService.js` (`GET /api/jobs/analytics`) that dynamically groups jobs by `requiredSkills` and calculates live demand frequencies, category distributions, and salary metrics from active `Job` records.
- **Priority**: Medium
- **Affected Module**: Job Matching & Career Market

### Gap 1.2: External Redirect-Only Job Applications with No In-App Pipeline
- **Current State**: Clicking "Apply" on a job simply opens an external URL in a new browser tab (`window.open(job.applyUrl)`).
- **Evidence**: `Job.js` defines only `applyUrl: String`. No `Application` model or application tracking controller exists in `Backend/src/`.
- **Why It Matters**: SkillGraph can match candidates to jobs, but cannot track whether a student actually applied, interviewed, or received an offer, breaking the student employability feedback loop.
- **Suggested Improvement**: Introduce a lightweight `JobApplication` Mongoose schema (`userId`, `jobId`, `status: ['applied', 'reviewing', 'interviewing', 'rejected', 'offered']`, `appliedAt`, `notes`) and expose endpoints (`POST /api/jobs/:id/apply`, `GET /api/jobs/my-applications`).
- **Priority**: Medium
- **Affected Module**: Job Matching & Student Profile

---

## 2. Authentication & Security Gaps

### Gap 2.1: Single Access Token Without Refresh Token Rotation
- **Current State**: Authentication relies on a single long-lived JWT (24-hour expiration) stored directly in browser `localStorage`.
- **Evidence**: `Backend/src/services/authService.js` creates a token with `{ expiresIn: config.jwtExpiresIn || '24h' }`. No refresh token is generated, stored, or verified. `Frontend/src/context/AuthContext.jsx` saves this token to `localStorage.setItem('skillgraph_token', token)`.
- **Why It Matters**: Long-lived access tokens stored in `localStorage` are vulnerable to Cross-Site Scripting (XSS) exfiltration. If compromised, the token cannot be revoked before 24 hours elapses.
- **Suggested Improvement**: Implement standard dual-token authentication: short-lived access token (15 minutes) sent in JSON response + cryptographically random refresh token stored in an `httpOnly`, `secure`, `sameSite: 'strict'` cookie with database rotation tracking.
- **Priority**: High
- **Affected Module**: Authentication & Authorization

### Gap 2.2: Absence of Password Reset / Recovery Workflow
- **Current State**: Users can only update their password if they already know their current password (`PUT /api/auth/change-password`).
- **Evidence**: `Backend/src/routes/authRoutes.js` contains only `/login`, `/register`, `/me`, and `/change-password`. No `forgot-password` or `reset-password` endpoints exist.
- **Why It Matters**: Any user who forgets their password is permanently locked out with no automated recovery path.
- **Suggested Improvement**: Add `POST /api/auth/forgot-password` (generates SHA-256 hashed reset token with 1-hour expiration on `User` model) and `POST /api/auth/reset-password/:token`.
- **Priority**: High
- **Affected Module**: Authentication & Authorization

### Gap 2.3: In-Memory Rate Limiting and Unsanitized Request Bodies
- **Current State**: IP rate limiting uses in-memory memory storage (`express-rate-limit`), and request bodies are passed directly to queries without NoSQL injection sanitization.
- **Evidence**: `Backend/src/app.js` configures `rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })` using default in-memory store. `express-mongo-sanitize` is not imported or listed in `Backend/package.json`.
- **Why It Matters**: Memory stores reset on every server restart and fail across distributed replicas. Unsanitized inputs open potential operator injection vulnerabilities (e.g. `{"$gt": ""}`).
- **Suggested Improvement**: Install `express-mongo-sanitize` and configure `xss-clean` or manual sanitization middleware in `Backend/src/app.js`.
- **Priority**: High
- **Affected Module**: Security & Backend Core

---

## 3. RBAC (Role-Based Access Control) Gaps

### Gap 3.1: Student Identity Overloaded into the `employee` Enum
- **Current State**: Academic students and professional employees share the identical `accountRole: 'employee'`.
- **Evidence**: `Backend/src/models/User.js` schema defines: `accountRole: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' }`. Academic fields (`college`, `branch`, `yearOfStudy`) are attached to the `User` schema directly.
- **Why It Matters**: Conflates academic workflows (college semester roadmaps, batch cohorts) with enterprise workflows (org trees, corporate project staffing). During portfolio review, it feels like an incomplete pivot between enterprise LMS and student portal.
- **Suggested Improvement**: Formally add `'student'` to the `accountRole` enum: `enum: ['admin', 'manager', 'employee', 'student']`. Update registration logic to allow choosing Student or Employee, customizing dashboard shortcuts accordingly.
- **Priority**: High
- **Affected Module**: Authentication & Student Profile

### Gap 3.2: String-Based Coarse Role Checks Without Permission Scopes
- **Current State**: Authorization is hardcoded to coarse string role checks (`authorize('admin', 'manager')`).
- **Evidence**: `Backend/src/middleware/authMiddleware.js` verifies `roles.includes(req.user.accountRole)`.
- **Why It Matters**: Lacks flexibility if an organization wants a "Mentor" or "Team Lead" who can inspect team readiness or verify skills without having global skill/role deletion rights.
- **Suggested Improvement**: Define a role-to-permissions map (e.g. `ROLES.MANAGER = ['team:read', 'skills:write', 'roles:write']`) and allow route middleware to verify fine-grained capabilities: `authorize('team:read')`.
- **Priority**: Medium
- **Affected Module**: Authentication & Authorization

---

## 4. Admin / Manager Functionality Gaps

### Gap 4.1: Manager Cannot Filter by Department, Cohort, or Sub-Team
- **Current State**: The team analysis engine queries all users in the database with `accountRole: 'employee'`, aggregating them into a single monolithic group.
- **Evidence**: `Backend/src/services/teamService.js` executes `User.find({ accountRole: 'employee' })` without filtering by `department`, `college`, `branch`, or manager assignment.
- **Why It Matters**: In any real-world company or university, an engineering manager or professor only manages their specific team or department. Showing all platform users together makes the analytics unusable in production.
- **Suggested Improvement**: Add `department` and `cohort` query filters to `/api/team/skills` and `/api/team/readiness/:roleId`. Optionally introduce a `managerId` or `organizationId` reference in `User.js`.
- **Priority**: High
- **Affected Module**: Team Capability Analytics

### Gap 4.2: Absence of System Activity & Audit Logging
- **Current State**: Administrative actions (deleting users, mutating canonical skills, deleting career roles) occur without audit tracking.
- **Evidence**: No `AuditLog` or `ActivityLog` model exists in `Backend/src/models/`. Deletions in `userController.js`, `skillController.js`, and `roleController.js` execute physical deletions silently.
- **Why It Matters**: Enterprise systems require traceability to determine which administrator modified role requirements or deleted user records.
- **Suggested Improvement**: Create an `AuditLog` schema (`action`, `actorId`, `targetEntity`, `targetId`, `changes`, `ipAddress`, `timestamp`) and log high-impact admin operations.
- **Priority**: Medium
- **Affected Module**: Admin & Backend Core

---

## 5. Student / Individual Practitioner Gaps

### Gap 5.1: Unverified Self-Reported Skills With No Proof or Assessment
- **Current State**: All skills logged by users have `verified: false` by default, with no built-in mechanism to ever verify them.
- **Evidence**: `Backend/src/models/UserSkill.js` contains `verified: { type: Boolean, default: false }`. Across the entire backend, no service or route sets `verified: true`.
- **Why It Matters**: Self-assessed skills (ratings 1–5) are completely subjective. Without verification (code assessments, project links, or manager endorsements), career readiness scores lack external credibility.
- **Suggested Improvement**: Add a skill verification workflow: allow users to submit proof (GitHub project URL, live demo link, or certificate URL) via `POST /api/skills/my-skills/:skillId/verify`, and permit managers/instructors to review and toggle `verified: true`.
- **Priority**: High
- **Affected Module**: Student Profile & Skills Catalog

### Gap 5.2: Inability to Track or Compare Multiple Career Goals
- **Current State**: The user model supports only one single `targetRoleId`.
- **Evidence**: `Backend/src/models/User.js` has `targetRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null }`.
- **Why It Matters**: Students frequently explore 2–3 divergent career paths simultaneously (e.g., "Full-Stack Developer" vs. "DevOps Engineer"). Switching target roles completely wipes out context for the other path.
- **Suggested Improvement**: Support `savedRoleIds: [{ type: ObjectId, ref: 'Role' }]` alongside the primary `targetRoleId`, allowing side-by-side gap comparison in `CareerExplorer.jsx`.
- **Priority**: Low
- **Affected Module**: Student Profile & Career Roles

---

## 6. Skill Graph Gaps

### Gap 6.1: Missing Cycle Detection (DAG Enforcement) on Relationships
- **Current State**: Creating skill relationships does not verify that the directed graph remains acyclic (DAG).
- **Evidence**: `Backend/src/services/skillService.js` in `createRelationship()` only checks `if (fromSkillId.toString() === toSkillId.toString())` and catches compound unique index duplicates. It does not check for multi-hop cycles (e.g., A -> B -> C -> A).
- **Why It Matters**: Circular prerequisite relationships cause infinite loops during topological sorting and recursive prerequisite traversal in `skillGapService.js` and `graphService.js`.
- **Suggested Improvement**: Implement a Depth-First Search (DFS) cycle-detection utility in `skillService.js` that checks whether a path already exists from `toSkillId` to `fromSkillId` before permitting a new `prerequisite` edge.
- **Priority**: High
- **Affected Module**: Skills Catalog & Graph Engine

### Gap 6.2: CPU-Bound Canvas Physics Without Stabilization Freezing
- **Current State**: `SkillGraph.jsx` runs continuous physics calculation on the main UI thread via `requestAnimationFrame`.
- **Evidence**: `Frontend/src/pages/SkillGraph.jsx` executes an imperative render loop recalculating repulsion and springs on every frame without an energy threshold to stop the animation when equilibrium is reached.
- **Why It Matters**: Consumes high CPU/GPU power, drains laptop batteries, and drops below 30 FPS when rendering graphs with more than 50 nodes.
- **Suggested Improvement**: Implement simulation stabilization: introduce a `totalVelocity` kinetic energy threshold that halts the simulation loop once nodes settle into equilibrium.
- **Priority**: Medium
- **Affected Module**: Skill Graph Visualization

---

## 7. Career Readiness & Recommendation Gaps

### Gap 7.1: Lack of Seniority-Tiered Skill Benchmarks
- **Current State**: Roles are modeled as monolithic flat titles (e.g. "Frontend Developer").
- **Evidence**: `Role.js` and `RoleSkill.js` store single expected proficiency targets. There is no distinction between Junior, Mid-Level, or Senior requirements.
- **Why It Matters**: A junior student and a 5-year experienced practitioner have completely different expected proficiencies. Benchmarking both against the same requirement produces inaccurate readiness scores.
- **Suggested Improvement**: Add a `level` field (`'junior'`, `'mid'`, `'senior'`) to `Role` or `RoleSkill`, allowing students to benchmark themselves against "Junior Frontend Developer" before targeting Senior levels.
- **Priority**: Medium
- **Affected Module**: Career Roles & Skill Gap

### Gap 7.2: Recommendation Engine Ignores Learning Resource Duration
- **Current State**: Recommendation priority scoring factors in gap magnitude, importance weight, and prerequisite readiness, but completely ignores learning duration or effort.
- **Evidence**: `Backend/src/services/recommendationService.js` computes scores using formula: `baseWeight + (gap * 8) + prereqBonus + unlockBonus`. It does not ingest `LearningResource.durationHours`.
- **Why It Matters**: A 5-hour quick tutorial and a 90-hour specialization course are scored identically, failing to suggest efficient learning paths for learners with limited time.
- **Suggested Improvement**: Incorporate an effort efficiency ratio into `recommendationService.js`, prioritizing high-impact skills that have beginner-friendly, shorter learning resources.
- **Priority**: Low
- **Affected Module**: Recommendation Engine

---

## 8. Learning & Topic Progress Gaps

### Gap 8.1: Hardcoded Sub-Topics in Client Code and Scoring Dictionaries
- **Current State**: Granular sub-topics (e.g. "Semantic HTML", "CSS Flexbox", "JavaScript Promises") are hardcoded in static JS arrays and a scoring utility dictionary rather than stored in MongoDB.
- **Evidence**: `Backend/src/utils/scoring.js` contains a hardcoded lookup dictionary:
  `const SKILL_TOTAL_TOPICS = { 'html': 7, 'css': 7, 'javascript': 10, ... }`. Any skill not in this dictionary defaults to 3. `Frontend/src/pages/Progress.jsx` hardcodes static topic arrays.
- **Why It Matters**: Adding or updating topics requires hardcoding code changes and redeploying both frontend and backend. Admins and managers cannot manage topics through an API or UI.
- **Suggested Improvement**: Create a formal `Topic` Mongoose schema (`skillId`, `title`, `slug`, `order`, `summary`) and link `UserTopicProgress` to real `topicId` ObjectIds. Expose CRUD endpoints under `/api/learning/skills/:skillId/topics`.
- **Priority**: High
- **Affected Module**: Learning & Progress Tracker

### Gap 8.2: Lack of Course Completion Evidence or Project Submission
- **Current State**: Course progress is updated via simple numeric input (`progressPercent: 100`) without submission proof.
- **Evidence**: `Backend/src/controllers/learningController.js` accepts `{ progressPercent, status }` directly from the client without requiring an artifact URL, repository link, or completion certificate.
- **Why It Matters**: Toggling 100% on all courses takes 5 seconds, trivially gaming the readiness score calculation.
- **Suggested Improvement**: Allow students to optionally submit a `proofUrl` (GitHub repository or certificate link) when marking a resource as completed (`LearningProgress.proofUrl`).
- **Priority**: Medium
- **Affected Module**: Learning & Progress Tracker

---

## 9. Job Matching Gaps

### Gap 9.1: Job Compatibility Ignores Candidate Proficiency Tiers
- **Current State**: The job matching algorithm calculates compatibility purely based on skill presence, ignoring proficiency level.
- **Evidence**: `Backend/src/services/jobService.js` computes matching skills using:
  `job.requiredSkills.filter(reqSkill => userSkillIds.includes(reqSkill.toString()))`. A novice with proficiency 1 matches a skill requirement just as fully as an expert with proficiency 5.
- **Why It Matters**: A student who just learned basic JavaScript syntax gets a 100% match for a senior engineer role requiring expert proficiency.
- **Suggested Improvement**: Weight job matching by user proficiency: award full match points if `proficiency >= 3`, partial points (50%) if `proficiency < 3`, and zero if missing.
- **Priority**: High
- **Affected Module**: Job Matching

### Gap 9.2: Unstructured Salary Display String Prevents Filtering
- **Current State**: Salaries are stored as arbitrary strings (e.g., `"$120,000 - $150,000"`).
- **Evidence**: `Backend/src/models/Job.js` defines `salary: { type: String, default: '' }`.
- **Why It Matters**: Users cannot filter or sort jobs by minimum compensation (e.g., "Show jobs with salary > $100k").
- **Suggested Improvement**: Update `Job.js` schema with structured numeric fields: `salaryMin: Number`, `salaryMax: Number`, `salaryCurrency: { type: String, default: 'USD' }`, while retaining `salary` for display formatting.
- **Priority**: Low
- **Affected Module**: Job Matching

---

## 10. Team Analytics Gaps

### Gap 10.1: Lack of Sub-Team / Departmental Scope
- **Current State**: Team analytics aggregates the entire database user pool into one monolithic team.
- **Evidence**: `Backend/src/services/teamService.js` queries `User.find({ accountRole: 'employee' })` with no departmental partition.
- **Why It Matters**: In realistic organizational settings, engineering managers only review their specific department or squad.
- **Suggested Improvement**: Add `department` query parameters to `/api/team/overview`, `/api/team/skills`, and `/api/team/readiness/:roleId`.
- **Priority**: High
- **Affected Module**: Team Capability Analytics

### Gap 10.2: Absence of "What-If" Training Simulation
- **Current State**: Managers can view current collective readiness, but cannot simulate how specific training or hiring would impact the score.
- **Evidence**: `Backend/src/services/teamService.js` only computes current static readiness.
- **Why It Matters**: Demonstrating predictive decision support elevates the project from a simple CRUD dashboard to an intelligent enterprise tool.
- **Suggested Improvement**: Implement a simulation endpoint (`POST /api/team/simulate`) that accepts hypothetical skill acquisitions (e.g. `[{ skillId, proficiency: 4 }]`) and recalculates projected team readiness.
- **Priority**: Low
- **Affected Module**: Team Capability Analytics

---

## 11. AI Assistant Gaps

### Gap 11.1: Blocking JSON Response Without Real-Time Token Streaming
- **Current State**: The AI assistant waits for Google Gemini to finish generating the entire response before sending a single blocking JSON payload back to the client.
- **Evidence**: `Backend/src/services/aiService.js` uses native Node.js `https.request` to collect all chunks into `responseBody` before executing `JSON.parse(responseBody)` and returning `{ reply }`.
- **Why It Matters**: Generative AI queries can take 3–8 seconds to generate long text. During this time, the user stares at a spinner, creating a sluggish user experience.
- **Suggested Improvement**: Implement Server-Sent Events (SSE) via `GET /api/ai/chat/stream` or upgrade to the official `@google/genai` SDK supporting streaming chunks directly to the client.
- **Priority**: High
- **Affected Module**: AI Career Assistant

### Gap 11.2: Chat History Is Not Persisted in the Database
- **Current State**: Chat history exists purely in the frontend React component state (`messages` array).
- **Evidence**: `Frontend/src/components/AIAssistant.jsx` stores messages in `useState([])`. Refreshing the page or logging in from another device wipes out the conversation. No `Conversation` or `ChatMessage` model exists in `Backend/src/models/`.
- **Why It Matters**: Learners lose valuable coaching advice, study plans, and historical recommendations whenever they navigate away or refresh.
- **Suggested Improvement**: Create a `ChatMessage` Mongoose model (`userId`, `role: ['user', 'assistant']`, `content`, `timestamp`) and persist message turns.
- **Priority**: Medium
- **Affected Module**: AI Career Assistant

---

## 12. Database & Data Consistency Gaps

### Gap 12.1: Boot-Time Only MongoDB-to-Neo4j Synchronization
- **Current State**: Graph database synchronization only runs automatically during server initialization in `server.js` or via manual admin trigger.
- **Evidence**: `Backend/src/server.js` checks graph counts on startup. When an admin creates or deletes a skill or relationship via `/api/skills` in `skillService.js`, the write updates MongoDB, but does NOT update Neo4j in real time.
- **Why It Matters**: The graph database rapidly drifts out of sync with MongoDB during runtime mutations, leading to stale pathfinding and graph statistics until the server restarts.
- **Suggested Improvement**: Add dual-write synchronization hooks in `skillService.js`: when a skill or relationship is created/updated/deleted in MongoDB, immediately dispatch the corresponding Cypher query in `graphService.js`.
- **Priority**: High
- **Affected Module**: Database & Graph Engine

### Gap 12.2: Hard Deletes Without Cascading Cleanup or Soft Deletions
- **Current State**: Records are deleted permanently using `findByIdAndDelete()`.
- **Evidence**: Deleting a skill in `skillController.js` does not clean up references inside `RoleSkill.skillId`, `Job.requiredSkills`, `LearningResource.skillId`, or `UserTopicProgress.skillId`.
- **Why It Matters**: Creates dangling ObjectId references across multiple collections, leading to `null` errors when models populate deleted skills.
- **Suggested Improvement**: Implement cascading cleanup in `skillService.js` (removing related `RoleSkill`, `LearningResource`, `SkillRelationship` records when a skill is deleted), or implement soft deletes (`isDeleted: Boolean`, `deletedAt: Date`).
- **Priority**: High
- **Affected Module**: Database & Storage

---

## 13. API Architecture Gaps

### Gap 13.1: Absence of Interactive OpenAPI / Swagger Documentation
- **Current State**: No interactive API specification or documentation is hosted.
- **Evidence**: `Backend/src/app.js` has no Swagger middleware (`swagger-ui-express` is not installed).
- **Why It Matters**: External developers, frontend engineers, or recruiters inspecting the repo have no interactive documentation to explore the 13 route namespaces and test endpoints.
- **Suggested Improvement**: Integrate `swagger-jsdoc` and `swagger-ui-express` mounted at `/api/docs`.
- **Priority**: Medium
- **Affected Module**: Backend Core & Developer Experience

### Gap 13.2: Inconsistent Pagination Response Structures
- **Current State**: Pagination metadata varies across endpoints.
- **Evidence**: `skillService.js` returns `{ skills, total, page, pages }`, whereas `jobService.js` returns `{ jobs, total, page, limit }`, and `roleService.js` returns unpaginated arrays.
- **Why It Matters**: Forces frontend components to write custom pagination handling logic for each individual endpoint rather than reusing a standardized pagination interface.
- **Suggested Improvement**: Standardize all paginated endpoints using a uniform helper: `{ items: [], pagination: { total, page, limit, totalPages } }` via `Backend/src/utils/helpers.js`.
- **Priority**: Medium
- **Affected Module**: Backend APIs

---

## 14. Frontend & User Experience Gaps

### Gap 14.1: Component-Level Fetching Without Caching or Query Invalidation
- **Current State**: Every page uses raw `useEffect` with local `useState` to fetch data from scratch on mount.
- **Evidence**: `Dashboard.jsx`, `MySkills.jsx`, `SkillGaps.jsx`, `Jobs.jsx` all define independent `useEffect` hooks calling Axios. Navigating between tabs re-triggers full loading spinners.
- **Why It Matters**: Creates noticeable layout shifts, excessive network requests, and prevents optimistic UI updates when mutating skills or topics.
- **Suggested Improvement**: Introduce a caching layer (e.g., TanStack Query / React Query or SWR) or centralized state store with cached invalidation hooks.
- **Priority**: Medium
- **Affected Module**: Frontend Core

### Gap 14.2: Reliance on Native Alerts Instead of Accessible UI Toasts
- **Current State**: Several user interactions rely on browser `alert()` popups or silent failures.
- **Evidence**: In `MySkills.jsx` and `Profile.jsx`, certain validation or error scenarios invoke native `alert(error)` or render inline text without standard transient toast notifications.
- **Why It Matters**: Native browser `alert()` halts the browser JavaScript thread and creates an unpolished user experience.
- **Suggested Improvement**: Implement a lightweight Toast Notification context (e.g. `react-hot-toast` or custom React Toast component) for non-blocking success/error feedback.
- **Priority**: Low
- **Affected Module**: Frontend UI/UX

---

## 15. Validation Gaps

### Gap 15.1: Missing Declarative Schema Validation Middleware
- **Current State**: Request validation is performed imperatively with ad-hoc `if (!field)` statements in controllers.
- **Evidence**: `authController.js`, `skillController.js`, and `jobController.js` contain scattered manual checks: `if (!email || !password) throw new ValidationError(...)`.
- **Why It Matters**: Inconsistent validation rules, missing deep type validation (e.g. checking if URLs are well-formed), and boilerplate duplication across controllers.
- **Suggested Improvement**: Introduce declarative validation middleware using a standard validation library (e.g. `zod` or `joi`) to validate `req.body`, `req.query`, and `req.params` before controllers execute.
- **Priority**: Medium
- **Affected Module**: Backend Core & Controllers

---

## 16. Error Handling Gaps

### Gap 16.1: Service Layer Swallowing Errors into Empty Fallbacks
- **Current State**: Several service methods catch database errors and return empty arrays rather than rethrowing or logging specific domain errors.
- **Evidence**: `graphService.js` catches Cypher query exceptions and silently returns empty fallback arrays, obscuring whether the query failed due to syntax errors, connection drops, or empty records.
- **Why It Matters**: Makes debugging intermittent database or driver connectivity issues difficult in production.
- **Suggested Improvement**: Differentiate between "no records found" (valid state) and "driver connection failed" (error state), logging structured error details with severity levels.
- **Priority**: Medium
- **Affected Module**: Error Handling & Graph Service

---

## 17. Testing Gaps

### Gap 17.1: Minimal Backend Test Coverage & Zero Frontend Tests
- **Current State**: Only a single basic API test file exists (`Backend/tests/api.test.js`), covering only simple auth and health checks. Frontend has zero automated tests.
- **Evidence**: `Backend/tests/` contains only `setup.js` and `api.test.js`. `Frontend/package.json` contains no test dependencies (no Vitest, Jest, or Cypress).
- **Why It Matters**: Any refactoring or feature implementation risks regression bugs. Automated test coverage is a primary criterion evaluated during senior engineering and resume reviews.
- **Suggested Improvement**: Add integration test suites for core scoring algorithms (`scoring.test.js`), skill gap calculations (`skillGap.test.js`), and component smoke tests using Vitest + React Testing Library in `Frontend/`.
- **Priority**: High
- **Affected Module**: Testing & Quality Assurance

---

## 18. Deployment & Scalability Gaps

### Gap 18.1: Lack of Containerization (Docker) and CI/CD Automation
- **Current State**: Project runs via local Node.js processes; no Docker containerization or CI/CD pipelines exist.
- **Evidence**: No `Dockerfile`, `docker-compose.yml`, or `.github/workflows/` files exist in the repository.
- **Why It Matters**: Makes setting up local development cumbersome (requiring manual MongoDB and Neo4j installations) and prevents automated verification on git push.
- **Suggested Improvement**: Provide a `docker-compose.yml` defining `backend`, `frontend`, `mongodb`, and `neo4j` containers, alongside a GitHub Actions workflow running linter and unit tests on pull requests.
- **Priority**: High
- **Affected Module**: DevOps & Infrastructure

---

## Gap Summary Matrix

| ID | Category | Gap Title | Priority | Affected Module |
| :---: | :--- | :--- | :---: | :--- |
| **2.1** | Auth / Security | Single long-lived JWT without refresh token rotation | **High** | Auth & RBAC |
| **2.2** | Auth / Security | Absence of password reset / forgot password flow | **High** | Auth & RBAC |
| **2.3** | Security | In-memory rate limiting and unsanitized request bodies | **High** | Security |
| **3.1** | RBAC | Student identity overloaded into `employee` role enum | **High** | Auth & Student |
| **4.1** | Manager / Admin | Manager cannot filter team by department or cohort | **High** | Team Analysis |
| **5.1** | Student / User | Self-assessed skills have zero verification workflow | **High** | Student Profile |
| **6.1** | Skill Graph | Missing DAG cycle detection on prerequisite edges | **High** | Skill Graph |
| **8.1** | Learning | Hardcoded sub-topics in client code and scoring logic | **High** | Learning Module |
| **9.1** | Job Matching | Job compatibility ignores candidate proficiency tier | **High** | Job Matching |
| **11.1**| AI Assistant | Blocking JSON responses without token streaming | **High** | AI Assistant |
| **12.1**| Database | Graph engine out-of-sync; no real-time dual-write | **High** | Database & Graph |
| **12.2**| Database | Hard deletes without cascading cleanup of references | **High** | Database & Storage |
| **17.1**| Testing | Minimal backend test coverage and zero frontend tests | **High** | Quality Assurance |
| **18.1**| Deployment | No Docker containerization or GitHub Actions CI/CD | **High** | DevOps |
| **1.1** | Functional | Static mock data on Career Market page | **Medium** | Job Matching |
| **1.2** | Functional | External redirect-only job application tracking | **Medium** | Job Matching |
| **3.2** | RBAC | String role checks instead of permission-based access | **Medium** | Auth & RBAC |
| **4.2** | Admin / Manager | Absence of administrative audit logging | **Medium** | Admin Core |
| **6.2** | Skill Graph | CPU-bound canvas physics without stabilization sleep | **Medium** | Visualization |
| **7.1** | Career | Lack of seniority-tiered (Junior/Mid/Senior) roles | **Medium** | Career Roles |
| **8.2** | Learning | Lack of completion proof/link for completed courses | **Medium** | Learning Module |
| **11.2**| AI Assistant | Chat history is not persisted in the database | **Medium** | AI Assistant |
| **13.1**| API | Absence of interactive Swagger / OpenAPI documentation| **Medium** | Developer Experience |
| **13.2**| API | Inconsistent pagination metadata structure | **Medium** | Backend APIs |
| **14.1**| Frontend | Component-level data fetching without client cache | **Medium** | Frontend Core |
| **15.1**| Validation | Missing declarative schema validation middleware | **Medium** | Backend Core |
| **16.1**| Error Handling | Service layer swallowing errors into empty arrays | **Medium** | Backend Services |
| **5.2** | Student | Inability to track multiple saved career goals | **Low** | Student Profile |
| **7.2** | Career | Recommendations ignore course duration / effort | **Low** | Recommendation Engine |
| **9.2** | Job Matching | Unstructured salary string prevents numeric filtering| **Low** | Job Matching |
| **10.2**| Team Analytics | Absence of "What-If" training simulation endpoint | **Low** | Team Analytics |
| **14.2**| Frontend | Reliance on native alerts instead of UI toasts | **Low** | Frontend UI |

---

## Recommended Upgrade Direction

To transform SkillGraph into a standout, production-grade, and resume-worthy project without introducing random bloat, future implementation should focus on the following **5 high-impact upgrades**:

### 1. Formalize the Student Identity & Verification Pipeline (RBAC & Student Engineering)
- Add `'student'` to `User.accountRole` enum, separating students from enterprise employees.
- Implement a skill verification workflow: allow students to submit project links or certificates to verify their logged skills (`UserSkill.verified`), and grant managers/instructors approval capabilities.
- *Resume Value*: Demonstrates authentic domain modeling, multi-role RBAC, and approval workflow state management.

### 2. Move Learning Topics to a First-Class Database Model (Data Modeling & Scalability)
- Replace hardcoded topic arrays in `scoring.js` and `Progress.jsx` with a dedicated `Topic` Mongoose collection (`skillId`, `title`, `slug`, `order`, `summary`).
- Dynamically calculate topic completion percentages in `scoring.js` from database records rather than a static dictionary.
- *Resume Value*: Demonstrates robust relational-document database design, dynamic aggregation pipelines, and elimination of brittle technical debt.

### 3. Implement Graph DAG Cycle Detection & Real-Time Dual-Engine Sync (Graph Engineering)
- Implement a DFS cycle-detection validator in `skillService.js` that blocks circular prerequisite loops before persisting edges to MongoDB.
- Hook incremental dual-write mutations: automatically mirror MongoDB skill/relationship creations, updates, and deletions into Neo4j in real time.
- *Resume Value*: Demonstrates advanced graph theory (DAGs, topological sorting) and dual-database consistency management.

### 4. Upgrade AI Assistant with Real-Time Streaming & Official SDK (Generative AI Engineering)
- Migrate from native raw `https.request` to the official Google Gen AI SDK (`@google/genai`).
- Implement Server-Sent Events (SSE) streaming for real-time word-by-word typing responses in the `AIAssistant.jsx` drawer.
- Store conversation history in a `ChatMessage` collection for persistent sessions across logins.
- *Resume Value*: Demonstrates modern production AI engineering, streaming HTTP architecture, and grounded context synthesis.

### 5. Dockerize the Stack & Establish Automated Testing (DevOps & Reliability)
- Create a production-ready `docker-compose.yml` orchestrating MongoDB, Neo4j, Backend, and Frontend.
- Write unit test suites for scoring algorithms (`scoring.test.js`) and integration tests for auth and gap analysis with automated GitHub Actions CI.
- *Resume Value*: Demonstrates DevOps competence, containerized multi-container orchestration, and test-driven reliability.
