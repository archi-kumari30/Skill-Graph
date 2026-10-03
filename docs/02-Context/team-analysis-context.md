# SkillGraph: Team Capability Analytics Context

## 1. Module Name
**Team Capability Analytics Module**

---

## 2. Purpose
The Team Capability Analytics module provides organizational managers and system administrators with high-level intelligence regarding team-wide competency distribution, collective talent readiness against target career roles, capability owners ("Skill Leads"), and organizational skill deficiencies. It models an entire cohort or engineering organization as a unified collective organism to facilitate strategic training, mentorship pairing, and project staffing.

---

## 3. Current Functionality
- **Team-Wide Skills Distribution (`teamService.js`)**:
  - Aggregates competencies across all registered system users.
  - Computes the number of team members possessing each skill, average team proficiency, and maximum team proficiency.
  - Automatically identifies the "Skill Lead" (the individual team member with the highest verified or reported proficiency in that skill).
- **Collective Role Readiness Assessment (`GET /api/team/readiness/:roleId`)**:
  - Evaluates the entire team collectively against a target career role (`RoleSkill`).
  - **Collective Proficiency Calculation**:
    $$\text{Team Max Proficiency} = \max(\text{Member}_1, \text{Member}_2, \dots, \text{Member}_N)$$
  - Evaluates whether the organization as a whole possesses the required skills to execute a role, even if individual members specialize in subsets.
  - Identifies which specific team member acts as the anchor/lead for each requirement.
  - Computes collective readiness percentage across all required role skills.
- **Organizational Gap Detection**:
  - Distinguishes between:
    - `Covered`: Team max proficiency meets or exceeds expected role proficiency.
    - `Partial`: Team max proficiency is below expected proficiency, but at least one member has baseline knowledge.
    - `Missing`: No team member possesses the skill (team proficiency = 0).
- **Team Overview Metrics (`GET /api/team/overview`)**:
  - Calculates total active team members, unique skill breadth count, average organizational proficiency, and coverage percentage.
- **Team Analysis Dashboard (`TeamAnalysis.jsx`)**:
  - Protected view accessible only to `manager` and `admin` roles.
  - Role switcher dropdown allowing managers to simulate readiness across different career disciplines (e.g., assessing the frontend team's collective DevOps readiness).
  - Detailed capability table displaying required skills, expected vs team max proficiency, skill owner names, and coverage status pills.

---

## 4. Frontend Files Involved
- `Frontend/src/pages/TeamAnalysis.jsx`: Manager-only dashboard displaying team readiness meters, capability matrix tables, and organizational gap cards.
- `Frontend/src/App.jsx`: Route guard wrapping `/team` in `<RoleRoute allowedRoles={['admin', 'manager']}>`.
- `Frontend/src/services/api.js`: Exports `teamApi` (overview, skills distribution, role readiness, members).
- `Frontend/src/components/ProgressBar.jsx`: Visual representation of team readiness and proficiency gauges.

---

## 5. Backend Files Involved
- `Backend/src/routes/teamRoutes.js`: Protected REST endpoints for team analytics.
- `Backend/src/controllers/teamController.js`: Dispatches requests and formats team analytical responses.
- `Backend/src/services/teamService.js`: Executes aggregation queries across users, user skills, roles, and role skills.
- `Backend/src/middleware/authMiddleware.js`: Restricts route access via `authorize('admin', 'manager')`.
- `Backend/src/models/User.js`: Queries team member accounts.
- `Backend/src/models/UserSkill.js`: Aggregates competencies across the organization.
- `Backend/src/models/Role.js`: Role definitions evaluated for team readiness.
- `Backend/src/models/RoleSkill.js`: Competency benchmarks for collective comparison.
- `Backend/src/models/Skill.js`: Populates skill names and categories.

---

## 6. APIs Involved
- `GET /api/team/overview`: Returns high-level metrics (total team members, total unique skills, team average proficiency).
- `GET /api/team/skills`: Returns aggregated skill catalog with member counts, average proficiencies, and designated skill leads.
- `GET /api/team/readiness/:roleId`: Returns collective team readiness score, coverage matrix, and member assignments for a specific role.
- `GET /api/team/members`: Lists all team members with their individual skill counts and top specialties.

---

## 7. Database Models Involved
- `User` (`Backend/src/models/User.js`):
  - Ingests all user accounts to compute aggregate team size and identify skill lead identities.
- `UserSkill` (`Backend/src/models/UserSkill.js`):
  - Primary source of truth for cross-organizational capability mapping.
- `Role` (`Backend/src/models/Role.js`):
  - Target career role against which the team is benchmarked.
- `RoleSkill` (`Backend/src/models/RoleSkill.js`):
  - Benchmark criteria (importance, expected proficiency) for team evaluation.
- `Skill` (`Backend/src/models/Skill.js`):
  - Populates skill details for the capability matrix.

---

## 8. Authentication / Authorization
- Every endpoint in `teamRoutes.js` enforces `authenticate` and `authorize('admin', 'manager')`.
- Standard learners (`accountRole: 'employee'`) receive `403 Forbidden` if they attempt to call `/api/team/*`.
- On the client side, navigation to `/team` is hidden from employees and protected by `RoleRoute` in `App.jsx`, redirecting unauthorized users to `/dashboard`.

---

## 9. Dependencies
- `mongoose` (^8.3.4): Multi-stage aggregation pipelines and database joins.
- `react` (^18.2.0): State management, role switching, and table rendering.
- `recharts` (^2.12.7): Visual data charts for team competency distributions.
- `lucide-react` (^0.378.0): Status, lead, and team icons.

---

## 10. Current Workflow
1. **Manager Access**:
   - A user with `accountRole: 'manager'` or `'admin'` logs into SkillGraph.
   - Clicks "Team Analysis" in the sidebar navigation.
2. **Data Aggregation**:
   - The frontend requests `GET /api/team/overview` and `GET /api/team/readiness/:roleId` (defaulting to the first available role).
   - `teamService.js` performs aggregation queries grouping `UserSkill` records across all users in the system.
3. **Collective Evaluation**:
   - For each requirement of the selected role, the service finds the maximum proficiency held by any team member.
   - Identifies the team member holding that maximum proficiency as the "Lead".
   - Flags gaps where `teamMaxProficiency < expectedProficiency`.
4. **Strategic Planning**:
   - Manager reviews which skills are single points of failure (dependent on a single person) and which skills represent collective organizational deficits requiring team training programs.

---

## 11. Current Limitations
- **Monolithic Team Aggregation**: All users in the database are treated as a single monolithic team; organizational hierarchies, sub-teams, departments, or project pods (e.g. "Mobile Team", "Core Backend Pod") are Not currently implemented.
- **Reporting Hierarchy (Manager-to-Report Mapping)**: No `managerId` or `reportsTo` relationship exists in the `User` schema; managers see all users globally rather than just their direct reports.
- **Automated Hiring Recommendations**: Algorithmic suggestions for recruitment (e.g., "Hiring a senior Kubernetes specialist will fill 4 team gaps") are Not currently implemented.
- **Skill Availability / Bandwidth Tracking**: Team readiness assumes 100% capacity; tracking actual member allocation or bandwidth on ongoing projects is Not currently implemented.

---

## 12. Existing Validation
- **Role Parameter Guard**: `roleId` in `/api/team/readiness/:roleId` must be a valid MongoDB ObjectId.
- **Role Existence Check**: `teamService.js` validates that the referenced `Role` exists before executing aggregations.
- **RBAC Guard**: Token payload `role` must be `'admin'` or `'manager'`.

---

## 13. Existing Error Handling
- **Role Not Found**: Throws `NotFoundError` ("Role not found") -> HTTP 404.
- **Unauthorized Role**: Trapped by `authMiddleware.authorize`, raising `ForbiddenError` ("You do not have permission to perform this action") -> HTTP 403.
- **Empty Team**: If no users or skills exist, `teamService.js` returns zeroed metric objects rather than failing with division-by-zero errors.

---

## 14. Important Relationships with Other Modules
- **Student Profile**: Aggregates `UserSkill` records from all registered individual learners.
- **Skills Catalog**: Uses `Skill` metadata to classify and color-code competencies.
- **Career Roles**: Evaluates organizational capability against role benchmarks from `Role` and `RoleSkill`.
- **Authentication**: Heavily relies on RBAC (`authorize('admin', 'manager')`) to safeguard organizational insights from individual employees/students.
