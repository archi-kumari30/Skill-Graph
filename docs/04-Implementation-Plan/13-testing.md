# SkillGraph Implementation Plan: Module 13 — Automated Testing & QA

## 1. Module
**13 — Automated Testing Strategy, Backend Test Suites & Frontend Unit Tests**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - Jest and Supertest configured in `Backend/package.json`.
  - Single integration test file: `Backend/tests/api.test.js` testing basic `/api/health` and `/api/auth/register` endpoints.
  - Zero automated tests for mathematical scoring algorithms, graph cycle traversal, or RBAC guards.
  - Zero frontend tests (no testing libraries installed in `Frontend/package.json`).
- **TO BE IMPLEMENTED**:
  - Comprehensive backend unit test suites for scoring mathematics (`scoring.test.js`) and DAG cycle detection (`graphValidation.test.js`).
  - Backend integration test suites for dual-token auth rotation, skill verification workflows, proficiency-weighted job matching, and team simulation.
  - Frontend component test suite using Vitest and React Testing Library in `Frontend/`.
  - Automated test coverage reporting targetting $>80\%$ on critical algorithmic and security modules.

---

## 3. Objective
Establish an automated quality engineering foundation across both backend and frontend, ensuring algorithmic correctness, regression prevention, and strong demonstration of software engineering rigor for portfolio evaluation.

---

## 4. Existing Files
- `Backend/package.json`: Backend test script.
- `Backend/tests/setup.js`: MongoMemoryServer / test setup.
- `Backend/tests/api.test.js`: Baseline API tests.
- `Frontend/package.json`: Frontend package manifest.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - `Backend/package.json`: Add coverage scripts `test:coverage`.
  - `Frontend/package.json`: Add dependencies `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, and script `test: vitest run`.
  - `Frontend/vite.config.js`: Add `test: { globals: true, environment: 'jsdom' }`.
  - Create test files:
    - `Backend/tests/scoring.test.js` (Unit)
    - `Backend/tests/graphValidation.test.js` (Unit)
    - `Backend/tests/auth.test.js` (Integration)
    - `Backend/tests/studentVerification.test.js` (Integration)
    - `Backend/tests/jobMatching.test.js` (Integration)
    - `Backend/tests/teamAnalysis.test.js` (Integration)
    - `Frontend/src/tests/components.test.jsx` (Frontend Unit)

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - In-memory database testing using `mongodb-memory-server` in `Backend/tests/setup.js` ensuring tests run isolated without requiring a live external MongoDB instance.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: `Backend/tests/setup.js` connects to test DB.
- **TO BE IMPLEMENTED**:
  - Update `Backend/tests/setup.js`:
    - Ensure clean collection purging between test runs (`beforeEach`).
    - Seed standard test catalog fixtures for skills, roles, and users.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**: None.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Create `Frontend/src/tests/components.test.jsx` testing:
    - `ProgressBar`: Renders exact percentages and color themes.
    - `EmptyState`: Renders title and action CTA buttons.
    - `LoadingSkeleton`: Shimmer styles and aria accessibility attributes.
    - `AIAssistant`: Drawer opens and renders chat input.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: None in test suite.
- **TO BE IMPLEMENTED**:
  - RBAC security test suite verifying unauthorized roles receive HTTP 403 Forbidden across `/api/team/*`, `/api/skills/verifications/*`, and administrative endpoints.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Test suites verifying validation middleware catches invalid payloads and malformed ObjectIds.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Tests ensuring all API errors return standardized JSON envelopes (`{ success: false, message: "..." }`).

---

## 13. Testing Plan
- Detailed breakdown of new test suites:
  1. **Scoring Mathematics Suite (`scoring.test.js`)**:
     - Tests `calculateEffectiveProficiency()` with completion rates.
     - Tests `calculateReadiness()` with importance weights (3, 2, 1).
     - Tests edge case: zero skills logged (returns 0%).
     - Tests edge case: all proficiencies exceeded (caps readiness score cleanly at 100%).
  2. **Graph Cycle Detection Suite (`graphValidation.test.js`)**:
     - Tests direct cycle prevention (A $\to$ B, B $\to$ A).
     - Tests transitive multi-hop cycle prevention (A $\to$ B $\to$ C $\to$ A).
     - Tests valid multi-parent diamond DAG structures.
  3. **Auth & RBAC Suite (`auth.test.js`)**:
     - Tests registration with role `'student'`.
     - Tests dual-token generation, cookie setting, and refresh rotation.
     - Tests token reuse detection and revocation.
  4. **Job Matching Suite (`jobMatching.test.js`)**:
     - Tests proficiency-weighted matching (novice partial points vs expert full points).
     - Tests in-app job application creation and duplication prevention.
  5. **Team Analysis Suite (`teamAnalysis.test.js`)**:
     - Tests departmental filtering.
     - Tests what-if training simulation calculations.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: `jest`, `supertest`.
- **TO BE IMPLEMENTED**:
  - Backend: `mongodb-memory-server` (^9.1.8).
  - Frontend: `vitest` (^1.5.0), `@testing-library/react` (^14.3.1), `@testing-library/jest-dom` (^6.4.2), `jsdom` (^24.0.0).

---

## 15. Implementation Order
1. Install testing dependencies in `Frontend/package.json`.
2. Configure `Frontend/vite.config.js` with Vitest environment.
3. Update `Backend/tests/setup.js` with automated database seeding and teardown.
4. Implement unit test suites (`scoring.test.js`, `graphValidation.test.js`).
5. Implement integration test suites (`auth.test.js`, `jobMatching.test.js`, `teamAnalysis.test.js`).
6. Implement frontend component tests (`components.test.jsx`).
7. Run `npm test` across both workspaces and generate coverage report.

---

## 16. Acceptance Criteria
- **AC-01**: `npm test` in `Backend/` runs all unit and integration test suites cleanly with 100% pass rate.
- **AC-02**: `npm test` in `Frontend/` runs Vitest component tests cleanly with 100% pass rate.
- **AC-03**: Scoring formulas and graph cycle detection algorithms have 100% code coverage.
- **AC-04**: Tests run completely standalone in memory without requiring an external internet connection or external database servers.

---

## 17. Risks
- **Risk 1 (Memory Server Download on Slow Connections)**: First-time download of `mongodb-memory-server` binary can be slow.
  - *Mitigation*: Fall back to a local MongoDB test connection URI (`mongodb://localhost:27017/skillgraph_test`) if memory server binary download times out.

---

## 18. Rollback Considerations
- Test files reside in isolated `/tests/` directories and do not impact runtime production code.
