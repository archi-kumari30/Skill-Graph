# SkillGraph Implementation Plan: Master Architectural Roadmap

## 1. Module
**00 — Master Implementation Plan & System-Wide Execution Strategy**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - Full codebase exists spanning `Backend/` (Express, Mongoose, Neo4j driver) and `Frontend/` (React, Vite, Tailwind CSS).
  - 11 Mongoose models exist with seed catalog automating startup initialization (`seedCatalog.js`).
  - 13 REST API namespaces mounted under `/api`.
  - CognoDB/Neo4j graph engine operates with boot-time synchronization.
  - Phase 2 Context documentation (`docs/02-Context/`), Phase 3 SRS (`docs/01-SRS/`), and Gap Analysis (`docs/03-Gap-Analysis/`) completed.
- **TO BE IMPLEMENTED**:
  - Sequenced, dependency-ordered engineering execution of the improvements identified in the Gap Analysis.
  - Structured transitions preventing breaking changes across interrelated services (e.g. scoring engine, database schemas, and AI prompts).

---

## 3. Objective
Establish a rigorous, phased implementation roadmap to upgrade SkillGraph from its existing baseline into a production-grade, resume-worthy platform. This document defines the global execution strategy, dependency sequencing, phase gates, and rollback safety rules across all 14 execution modules.

---

## 4. Existing Files
- `Backend/package.json`: Backend dependencies and scripts.
- `Frontend/package.json`: Frontend dependencies and scripts.
- `Backend/src/server.js`: Server boot and lifecycle.
- `Backend/src/app.js`: Express configuration and routing.
- `docs/01-SRS/SkillGraph-SRS.md`: Software Requirements Specification.
- `docs/02-Context/README.md`: System Context Index.
- `docs/03-Gap-Analysis/gap-analysis.md`: Gap Analysis and Priority Matrix.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: None (Application code untouched).
- **TO BE IMPLEMENTED**:
  - `docs/04-Implementation-Plan/`: 15 modular plan documents detailing step-by-step technical execution without writing application code yet.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**:
  - 11 Mongoose collections: `users`, `skills`, `skillrelationships`, `userskills`, `roles`, `roleskills`, `companies`, `jobs`, `learningresources`, `learningprogresses`, `usertopicprogresses`.
- **TO BE IMPLEMENTED**:
  - New collections: `topics` (formalizing sub-topics), `chatmessages` (AI conversation history), `jobapplications` (application tracking), `authtokens` (refresh token storage), `auditlogs` (admin operation tracking).
  - Schema updates: `User` (`accountRole` adding `'student'`, `resetPasswordToken`), `UserSkill` (`proofUrl`), `Job` (`salaryMin`, `salaryMax`), `Role` (`level: 'junior'|'mid'|'senior'`).

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**:
  - Controllers and services for 13 functional modules.
- **TO BE IMPLEMENTED**:
  - Phased refactoring across services to support dual-token authentication, dynamic database topic aggregation, real-time Neo4j dual-write mutations, DAG cycle detection, streaming SSE for Gemini AI, and standardized pagination responses.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**:
  - All existing `/api/*` endpoints documented in `docs/02-Context/project-context.md`.
- **TO BE IMPLEMENTED**:
  - Backward-compatible endpoint extensions and new dedicated routes:
    - `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/reset-password/:token`
    - `/api/learning/topics/catalog` (database-backed topics)
    - `/api/skills/my-skills/:skillId/verify` (skill verification submission)
    - `/api/jobs/:id/apply`, `/api/jobs/my-applications`
    - `/api/ai/chat/stream` (SSE streaming)
    - `/api/docs` (Swagger / OpenAPI)

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**:
  - 14 React pages in `Frontend/src/pages/`, 5 shared components, and Axios client.
- **TO BE IMPLEMENTED**:
  - Centralized notification toast provider (replacing `alert()`).
  - Word-by-word streaming markdown rendering in `AIAssistant.jsx`.
  - Skill verification submission modal in `MySkills.jsx`.
  - In-app job application drawer and status pill in `Jobs.jsx`.
  - Sub-team / department filter toolbar in `TeamAnalysis.jsx`.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**:
  - 3-tier RBAC (`admin`, `manager`, `employee`).
- **TO BE IMPLEMENTED**:
  - Formalize 4-tier RBAC: `admin`, `manager`, `employee`, and `student`.
  - Refresh token cookie exchange (`/api/auth/refresh`).
  - Route guards updated in `App.jsx` to accommodate student-specific and manager-specific pathways.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**:
  - Ad-hoc manual `if (!field)` checks in controllers.
- **TO BE IMPLEMENTED**:
  - Centralized declarative validation middleware (using standard schema validation) verifying request params, queries, and bodies before controller execution.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**:
  - Centralized Express error handler (`errorMiddleware.js`) mapping `AppError` subclasses.
- **TO BE IMPLEMENTED**:
  - Structured domain exception classes: `CyclicDependencyError`, `TokenExpiredError`, `RateLimitExceededError`, `ResourceLockedError`.
  - Prevention of silent error swallowing into empty arrays in `graphService.js`.

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**:
  - Minimal backend integration tests (`Backend/tests/api.test.js`). Zero frontend tests.
- **TO BE IMPLEMENTED**:
  - Phase-by-phase test gates:
    - Unit tests for scoring mathematics (`scoring.test.js`) and DAG cycle detection (`cycleDetection.test.js`).
    - Integration tests for auth refresh flows and RBAC permission guards.
    - Component smoke tests using Vitest + React Testing Library.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**:
  - Listed in `Backend/package.json` and `Frontend/package.json`.
- **TO BE IMPLEMENTED**:
  - Backend: `@google/genai` (official SDK), `cookie-parser`, `express-mongo-sanitize`, `swagger-ui-express`, `swagger-jsdoc`.
  - Frontend: `react-hot-toast` (accessible toasts).
  - DevOps: Docker, Docker Compose, GitHub Actions.

---

## 15. Implementation Order
The master plan is structured into **5 sequential phases**:

```
Phase A: Foundation & Stability (Modules 01 -> 02 -> 03)
   └── Project environment, database models/sync, dual-token auth & RBAC.
Phase B: Core Domain Taxonomy (Modules 04 -> 05 -> 06)
   └── Student profile & verification, DAG skill graph, career readiness tiers.
Phase C: Progressive Learning & Employability (Modules 07 -> 08 -> 09)
   └── Dynamic database topics, proficiency-weighted job matching, team analytics.
Phase D: Advanced Intelligence & Polish (Modules 10 -> 11 -> 12)
   └── Gemini AI streaming & persistence, frontend toast/UX polish, OpenAPI docs.
Phase E: Quality Engineering & Operations (Modules 13 -> 14)
   └── Automated test suites, Docker multi-container orchestration, CI/CD.
```

---

## 16. Acceptance Criteria
- **AC-01**: Every module change preserves backward compatibility with existing seeded catalog data.
- **AC-02**: Zero broken routes or unresolved promises across all 13 existing API namespaces.
- **AC-03**: All 18 gaps identified in `docs/03-Gap-Analysis/gap-analysis.md` are resolved systematically.
- **AC-04**: Test coverage expands to cover core algorithms, authentication, and RBAC guards.

---

## 17. Risks
- **Risk 1 (Dual-Engine Inconsistency)**: Real-time Neo4j sync might fail if the Neo4j instance is unreachable while MongoDB succeeds.
  - *Mitigation*: Wrap Neo4j calls in asynchronous retry buffers or background queue fallbacks so MongoDB transactional operations are not blocked.
- **Risk 2 (Scoring Formula Regression)**: Migrating topics from static dictionary to database could alter readiness score values.
  - *Mitigation*: Seed database `Topic` collection with identical counts matching `SKILL_TOTAL_TOPICS` before switching the scoring service query.

---

## 18. Rollback Considerations
- Each implementation module must maintain isolated git feature branches (`feature/module-XX`).
- Database schema changes must include idempotent fallback migration scripts ensuring existing documents remain valid if new fields are absent.
- Environment variables must retain sensible fallback defaults if new `.env` keys are unset.
