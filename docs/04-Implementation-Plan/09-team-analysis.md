# SkillGraph Implementation Plan: Module 09 — Team Capability Analytics

## 1. Module
**09 — Team Capability Analytics, Departmental Cohorts & Training Simulation**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - Manager-only analytics protected by `authorize('admin', 'manager')`.
  - Aggregates all registered system users into a single monolithic team.
  - Identifies organizational "Skill Leads" based on maximum proficiency.
  - Calculates collective team role readiness (`GET /api/team/readiness/:roleId`).
  - Frontend dashboard in `Frontend/src/pages/TeamAnalysis.jsx`.
- **TO BE IMPLEMENTED**:
  - Department and Academic Cohort filtering (`?department=Engineering`, `?branch=CS`, `?college=...`).
  - Interactive "What-If" Training / Hiring Simulation endpoint (`POST /api/team/simulate`).
  - Predictive decision-support UI in `TeamAnalysis.jsx` showing projected readiness gain before committing training resources.

---

## 3. Objective
Upgrade organizational analytics from a static whole-database aggregation into a flexible, cohort-scoped management tool that enables department heads and managers to simulate the readiness impact of targeted skill training or new hires.

---

## 4. Existing Files
- `Backend/src/models/User.js`: User model.
- `Backend/src/models/UserSkill.js`: Competencies model.
- `Backend/src/models/Role.js`: Role model.
- `Backend/src/models/RoleSkill.js`: Role requirements model.
- `Backend/src/routes/teamRoutes.js`: Team routes.
- `Backend/src/controllers/teamController.js`: Team controller.
- `Backend/src/services/teamService.js`: Aggregation service.
- `Frontend/src/pages/TeamAnalysis.jsx`: Team analytics view.
- `Frontend/src/services/api.js`: Team API client.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - `Backend/src/routes/teamRoutes.js`: Add `POST /simulate`.
  - `Backend/src/controllers/teamController.js`: Add `simulateTrainingImpact` handler.
  - `Backend/src/services/teamService.js`:
    - Refactor `getTeamOverview()`, `getTeamSkills()`, and `getTeamRoleReadiness()` to accept filter parameters `{ department, branch, college }`.
    - Implement `simulateTeamReadiness(roleId, hypotheticalSkills, filters)`.
  - `Frontend/src/services/api.js`: Add `teamApi.simulate(roleId, hypotheticalChanges, filters)`.
  - `Frontend/src/pages/TeamAnalysis.jsx`: Add Department / Cohort dropdown selectors and an interactive "Simulate Training" slide-over drawer.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: Existing models.
- **TO BE IMPLEMENTED**:
  - None required; filters leverage existing fields on `User` (`department`, `branch`, `college`).

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: Queries all users with `accountRole: 'employee'`.
- **TO BE IMPLEMENTED**:
  - In `teamService.js`:
    - Construct dynamic user match query:
      ```javascript
      const userFilter = { accountRole: { $in: ['employee', 'student'] } };
      if (filters.department) userFilter.department = filters.department;
      if (filters.branch) userFilter.branch = filters.branch;
      if (filters.college) userFilter.college = filters.college;
      ```
    - Implement `simulateTeamReadiness(roleId, hypotheticalChanges, filters)`:
      - Computes current collective baseline readiness.
      - Applies hypothetical skill proficiencies into the aggregation set (e.g. "Add Kubernetes at Proficiency 4").
      - Re-evaluates max team proficiencies and recalculated readiness percentage.
      - Returns: `{ baselineReadiness, projectedReadiness, readinessGain, resolvedGaps: [] }`.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: `GET /api/team/overview`, `GET /api/team/skills`, `GET /api/team/readiness/:roleId`, `GET /api/team/members`.
- **TO BE IMPLEMENTED**:
  - Query parameter support across all GET endpoints: `?department=...&branch=...&college=...`.
  - `POST /api/team/simulate`: Body: `{ roleId: string, hypotheticalChanges: [{ skillId: string, proficiency: number }], filters?: object }`.
  - Response: `{ success: true, data: { currentScore: 62.5, projectedScore: 85.0, gain: +22.5, resolvedGaps: ['Kubernetes', 'Docker'] } }`.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: Role dropdown only.
- **TO BE IMPLEMENTED**:
  - In `TeamAnalysis.jsx`:
    - Add Department and Cohort filter dropdowns in the header toolbar.
    - Add "Simulate Training Impact" button opening a simulation drawer.
    - Inside drawer: pick a missing skill from the role, select hypothetical target proficiency (e.g. 4), and see live projected readiness boost (+22.5%) before committing team training hours.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Restricted to `admin` and `manager`.
- **TO BE IMPLEMENTED**:
  - Maintain strict `authorize('admin', 'manager')` restriction across all endpoints including `/simulate`.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: RoleId existence check.
- **TO BE IMPLEMENTED**:
  - `hypotheticalChanges` must be an array of objects with valid `skillId` and `proficiency` between 1 and 5.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: Standard 404 / 403.
- **TO BE IMPLEMENTED**:
  - If a filter matches 0 users (empty cohort), return structured `{ totalMembers: 0, readiness: 0 }` with informative message rather than failing.

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Integration tests in `Backend/tests/teamAnalysis.test.js`:
    - Test 1: Querying with `?department=Engineering` filters out users from other departments.
    - Test 2: Simulating proficiency 5 on a missing role skill raises projected readiness and lists the skill in `resolvedGaps`.
    - Test 3: Regular student calling `/simulate` receives HTTP 403 Forbidden.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: `mongoose`.
- **TO BE IMPLEMENTED**: None additional.

---

## 15. Implementation Order
1. Update `teamService.js` to accept filter objects.
2. Implement simulation algorithm in `teamService.js`.
3. Add `/simulate` route and controller handler in `teamRoutes.js` and `teamController.js`.
4. Update `TeamAnalysis.jsx` with cohort filters and simulation panel.
5. Run `teamAnalysis.test.js`.

---

## 16. Acceptance Criteria
- **AC-01**: A manager can filter the capability matrix specifically to the "Computer Science" branch or "Engineering" department.
- **AC-02**: Simulating the addition of a missing required skill produces an exact recalculated readiness score with explicit delta (+X%).
- **AC-03**: Non-managers cannot access the simulation API.

---

## 17. Risks
- **Risk 1 (Simulation Computation Overhead)**: Running in-memory simulations for large teams.
  - *Mitigation*: The simulation clones the computed role requirements array and updates only the targeted skill index, resulting in sub-10ms response times.

---

## 18. Rollback Considerations
- The simulation endpoint is completely stateless and does not write to the database, ensuring zero rollback risk to persistent data.
