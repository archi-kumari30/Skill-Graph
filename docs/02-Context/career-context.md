# SkillGraph: Career Roles, Skill Gap Analysis & Matching Context

## 1. Module Name
**Career Roles, Skill Gap Analysis & Role Matching Module**

---

## 2. Purpose
The Career Roles, Skill Gap Analysis & Role Matching module defines professional job roles, standardizes competency benchmarks, evaluates learner profiles against industry career baselines, and calculates mathematical readiness metrics. It enables students to explore career trajectories, identify critical skill deficiencies, understand prerequisite dependencies, and rank career options based on current competencies.

---

## 3. Current Functionality
- **Career Role Directory (`Role` model)**:
  - Catalogs professional career definitions across departments (e.g., "Full-Stack Developer", "DevOps Engineer", "Data Scientist", "Cloud Architect").
  - Stores title, unique slug, descriptive summary, and institutional department.
- **Role Competency Requirements (`RoleSkill` model)**:
  - Maps required competencies to specific career roles.
  - Configures `expectedProficiency` (1 to 5 scale).
  - Categorizes requirement severity using `importance` tiers:
    - `required`: Weight 3 (Critical foundational competencies).
    - `important`: Weight 2 (Standard professional competencies).
    - `nice_to_have`: Weight 1 (Supplementary or elective competencies).
- **Mathematical Skill Gap Engine (`skillGapService.js` & `scoring.js`)**:
  - Compares the learner's logged competencies (`UserSkill`) against role benchmarks (`RoleSkill`).
  - **Weighted Readiness Scoring Formula**:
    $$\text{Effective Proficiency} = \text{Current Proficiency} \times \text{Completion Rate}$$
    $$\text{Readiness Score} = \left(\frac{\sum (\text{Effective Proficiency} \times \text{Weight})}{\sum (\text{Expected Proficiency} \times \text{Weight})}\right) \times 100$$
    Where $\text{Completion Rate} = \min(1.0, \frac{\text{Completed Topics}}{\text{Total Topics}})$ derived from `UserTopicProgress`.
  - Classifies skills into three distinct states:
    - `missing`: Skill is not logged in user profile (proficiency 0).
    - `gap`: Skill is logged, but user proficiency is below `expectedProficiency`.
    - `met`: User proficiency meets or exceeds `expectedProficiency`.
  - Prerequisite Tree Validation: Traverses `SkillRelationship` to determine whether a missing skill has satisfied prerequisites or is blocked by upstream dependencies.
- **Career Role Compatibility Matching (`matchingService.js`)**:
  - Evaluates user skills against all active system roles simultaneously.
  - Returns ranked list of roles sorted by match percentage, highlighting matching skills and missing skills count.
- **Career Explorer (`CareerExplorer.jsx`)**:
  - Visual interface for discovering career paths, filtering by department, inspecting required competencies, and setting a role as the user's primary target.
- **Skill Gap Dashboard (`SkillGaps.jsx`)**:
  - Detailed diagnostic screen showing overall role readiness percentage, prioritized list of gaps, prerequisite alerts, and direct links to learning resources.

---

## 4. Frontend Files Involved
- `Frontend/src/pages/CareerExplorer.jsx`: Interactive career catalog displaying role cards, match scores, required skill pills, and "Set as Target" actions.
- `Frontend/src/pages/SkillGaps.jsx`: In-depth gap analysis dashboard for the user's selected target role, featuring readiness meters and actionable gap cards.
- `Frontend/src/services/api.js`: Exports `roleApi`, `skillGapApi`, and `matchingApi`.
- `Frontend/src/components/ProgressBar.jsx`: Visual indicator for role readiness scores and proficiency gaps.

---

## 5. Backend Files Involved
- `Backend/src/routes/roleRoutes.js`: REST endpoints for career roles and requirement mappings.
- `Backend/src/controllers/roleController.js`: Request handlers for role CRUD and skill requirement associations.
- `Backend/src/services/roleService.js`: Queries roles, populates skill requirements, and performs role mutations.
- `Backend/src/routes/skillGapRoutes.js`: Endpoints for computing target role skill gaps.
- `Backend/src/controllers/skillGapController.js`: Dispatches gap calculations.
- `Backend/src/services/skillGapService.js`: Core gap calculation, prerequisite status evaluation, and readiness calculation.
- `Backend/src/routes/matchingRoutes.js`: Endpoints for multi-role compatibility rankings.
- `Backend/src/controllers/matchingController.js`: Dispatches role matching.
- `Backend/src/services/matchingService.js`: Compares user profile against all system roles.
- `Backend/src/utils/scoring.js`: Houses mathematical readiness formulas, topic multipliers, and weighting factors.
- `Backend/src/models/Role.js`: Mongoose model for career roles.
- `Backend/src/models/RoleSkill.js`: Mongoose junction model for role competencies.
- `Backend/src/models/SkillRelationship.js`: Mongoose model for checking prerequisite chains.
- `Backend/src/models/UserTopicProgress.js`: Mongoose model for computing topic completion rates.
- `Backend/src/seed/seedCatalog.js`: Populates 10 standard roles and dozens of requirement mappings on boot.

---

## 6. APIs Involved
- `GET /api/roles`: Returns all career roles with department filtering, search, and pagination.
- `GET /api/roles/:id`: Returns a specific role with populated `RoleSkill` requirements.
- `POST /api/roles`: Creates a new career role (Admin/Manager only).
- `PUT /api/roles/:id`: Updates an existing role's title or description (Admin/Manager only).
- `DELETE /api/roles/:id`: Deletes a career role and its skill requirements (Admin/Manager only).
- `POST /api/roles/:id/skills`: Adds a skill requirement to a role (`skillId`, `expectedProficiency`, `importance`). Requires Admin/Manager.
- `DELETE /api/roles/:id/skills/:skillId`: Removes a skill requirement from a role. Requires Admin/Manager.
- `GET /api/skill-gap`: Computes gap analysis for current authenticated user's `targetRoleId`.
- `GET /api/skill-gap/:roleId`: Computes gap analysis for current user against any specified role ID.
- `GET /api/matching/roles`: Evaluates authenticated user against all roles and returns ranked compatibility list.
- `GET /api/matching/role/:roleId`: Returns detailed compatibility breakdown for a single role.

---

## 7. Database Models Involved
- `Role` (`Backend/src/models/Role.js`):
  - Fields: `name`, `slug` (unique), `description`, `department`.
- `RoleSkill` (`Backend/src/models/RoleSkill.js`):
  - Fields: `roleId` (ref Role), `skillId` (ref Skill), `expectedProficiency` (Number 1-5), `importance` (`required`, `important`, `nice_to_have`).
  - Compound Unique Index: `{ roleId: 1, skillId: 1 }`.
- `User` (`Backend/src/models/User.js`):
  - Referenced for `targetRoleId` and user identity.
- `UserSkill` (`Backend/src/models/UserSkill.js`):
  - Evaluated against `RoleSkill` to find proficiency deltas.
- `SkillRelationship` (`Backend/src/models/SkillRelationship.js`):
  - Traversed to evaluate prerequisite readiness for missing competencies.
- `UserTopicProgress` (`Backend/src/models/UserTopicProgress.js`):
  - Queried to calculate topic completion rate multipliers.

---

## 8. Authentication / Authorization
- Browsing roles (`GET /api/roles`, `GET /api/roles/:id`) is accessible to all authenticated users.
- Role administrative actions (creating roles, updating roles, deleting roles, adding/removing role skill requirements) require `authorize('admin', 'manager')`.
- Skill gap analysis (`/api/skill-gap`) and role matching (`/api/matching/*`) are user-scoped and require `authenticate`.

---

## 9. Dependencies
- `mongoose` (^8.3.4): Queries, aggregations, and multi-model populations.
- `react` (^18.2.0): State and interface rendering.
- `recharts` (^2.12.7): Visual radar and bar charts representing skill comparisons.
- `lucide-react` (^0.378.0): Status and navigation icons.

---

## 10. Current Workflow
1. **Target Selection**:
   - Student navigates to `CareerExplorer.jsx`.
   - Views roles ranked by compatibility match percentage (`GET /api/matching/roles`).
   - Clicks "Set as Target", updating `User.targetRoleId` via `PUT /api/users/profile`.
2. **Gap Analysis Execution**:
   - Student navigates to `SkillGaps.jsx`.
   - Frontend calls `GET /api/skill-gap`.
   - `skillGapService.js` retrieves `RoleSkill` entries for `targetRoleId` and `UserSkill` entries for `req.user._id`.
   - Calculates effective proficiency using topic completion multipliers from `UserTopicProgress`.
   - Computes readiness score and categorizes missing skills.
   - For each missing skill, queries `SkillRelationship` to verify if prerequisite skills are mastered.
3. **Actionable Roadmap Inspection**:
   - User reviews gaps: skills with satisfied prerequisites are tagged "Ready to Learn"; skills with unmet dependencies display warning badges listing blocking prerequisites.

---

## 11. Current Limitations
- **Seniority Tiers**: Career roles are unversioned and flat (e.g., "Frontend Developer"); hierarchical seniority levels (Junior, Mid, Senior, Lead, Staff) with graduated proficiency requirements are Not currently implemented.
- **Custom Student Roles**: Students cannot define private or custom career targets; they can only select roles created by Admins or Managers.
- **Company-Specific Role Overrides**: Role requirements are global; company-specific skill benchmarks (e.g., "Google Frontend Engineer" vs "Startup Frontend Engineer") are Not currently implemented.
- **Proficiency Decay**: Continuous skill degradation / forgetting curve algorithms over time are Not currently implemented.
- **Soft Skills / Non-Technical Metrics**: Behavioral, leadership, or soft-skill benchmarks are Not currently implemented; only technical skills are modeled.

---

## 12. Existing Validation
- **Proficiency Range**: `expectedProficiency` must be between 1 and 5.
- **Importance Tiers**: Must be one of `['required', 'important', 'nice_to_have']`.
- **Target Role Guard**: `GET /api/skill-gap` asserts that the user has a valid `targetRoleId` assigned, throwing a 400 Bad Request error if unassigned.
- **Duplicate Skill Mapping**: Unique index `{ roleId: 1, skillId: 1 }` prevents assigning the same skill multiple times to a role.

---

## 13. Existing Error Handling
- **Missing Target Role**: Throws `ValidationError` ("User does not have a target role set. Please set a target role first.") -> HTTP 400.
- **Role Not Found**: Throws `NotFoundError` ("Role not found") -> HTTP 404.
- **Duplicate Role Slug**: Traps unique key code `11000` and throws `ConflictError` ("Role with this name already exists") -> HTTP 409.
- **Frontend Feedback**: `SkillGaps.jsx` displays an empty state prompt if no target role is chosen, guiding the user to the Career Explorer.

---

## 14. Important Relationships with Other Modules
- **Student Profile**: Links user to target career path via `User.targetRoleId`.
- **Skills Catalog**: Uses canonical `Skill` and `SkillRelationship` models to define requirement graphs.
- **Learning & Recommendations**: Skill gaps directly dictate prioritized learning resource recommendations.
- **Team Analysis**: Aggregates role requirements across all team members to compute collective organizational role readiness.
- **AI Assistant**: Ingests target role requirements and gap details to provide targeted career coaching.
