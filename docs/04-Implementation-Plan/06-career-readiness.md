# SkillGraph Implementation Plan: Module 06 — Career Readiness & Seniority Tiers

## 1. Module
**06 — Career Roles, Readiness Scoring Engine & Seniority Tiers**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - `Role` catalog across departments (10 standard roles seeded).
  - `RoleSkill` requirement benchmarks with `expectedProficiency` (1–5) and `importance` (`required`: 3, `important`: 2, `nice_to_have`: 1).
  - Multi-factor mathematical readiness score formula in `Backend/src/utils/scoring.js`:
    $$\text{Readiness} = \left(\frac{\sum (\text{Effective Proficiency} \times \text{Weight})}{\sum (\text{Expected Proficiency} \times \text{Weight})}\right) \times 100$$
  - Multi-role compatibility ranking (`matchingService.js`).
  - Gap analysis categorizing skills into `met`, `gap`, `missing` with prerequisite checks (`skillGapService.js`).
  - Frontend views: `CareerExplorer.jsx` and `SkillGaps.jsx`.
- **TO BE IMPLEMENTED**:
  - Seniority-tiered role modeling (`level: 'junior' | 'mid' | 'senior' | 'all'`) allowing students to benchmark themselves against entry-level positions without being penalized for senior-only skills.
  - Seniority filter tabs on `CareerExplorer.jsx`.
  - Multi-target role comparison side-by-side view.

---

## 3. Objective
Refine career readiness evaluation by introducing graduated seniority tiers for career roles, enabling academic students to establish realistic, achievable milestones (Junior $\to$ Mid $\to$ Senior) with adapted expected proficiencies.

---

## 4. Existing Files
- `Backend/src/models/Role.js`: Role schema.
- `Backend/src/models/RoleSkill.js`: Role skill requirement schema.
- `Backend/src/routes/roleRoutes.js`: Role routes.
- `Backend/src/controllers/roleController.js`: Role controller.
- `Backend/src/services/roleService.js`: Role queries and mutations.
- `Backend/src/routes/skillGapRoutes.js`: Gap analysis routes.
- `Backend/src/services/skillGapService.js`: Gap analysis engine.
- `Backend/src/routes/matchingRoutes.js`: Role matching routes.
- `Backend/src/services/matchingService.js`: Multi-role matcher.
- `Backend/src/utils/scoring.js`: Mathematical formulas.
- `Frontend/src/pages/CareerExplorer.jsx`: Role exploration view.
- `Frontend/src/pages/SkillGaps.jsx`: Gap diagnostic view.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - `Backend/src/models/Role.js`: Add `level: { type: String, enum: ['junior', 'mid', 'senior', 'all'], default: 'all' }`.
  - `Backend/src/services/roleService.js`: Support query filter `level` in `getRoles()`.
  - `Backend/src/seed/seedCatalog.js`: Seed distinct Junior and Senior variants for core engineering roles (e.g., "Junior Full-Stack Developer" vs "Senior Full-Stack Developer").
  - `Backend/src/services/matchingService.js`: Include role `level` in compatibility response payloads.
  - `Frontend/src/pages/CareerExplorer.jsx`: Add Seniority Tier tabs ("All Levels", "Junior / Entry", "Mid-Level", "Senior").
  - `Frontend/src/pages/SkillGaps.jsx`: Display role seniority badge and milestone trajectory guidance.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: `Role` schema (`name`, `slug`, `description`, `department`).
- **TO BE IMPLEMENTED**:
  - Update `Role.js`:
    - `level`: String, enum: `['junior', 'mid', 'senior', 'all']`, default: `'all'`, indexed.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: Queries all roles regardless of experience level.
- **TO BE IMPLEMENTED**:
  - In `roleService.js`:
    - In `getRoles(filters)`: Add filtering by `filters.level`.
  - In `seedCatalog.js`:
    - Seed Junior role benchmarks with calibrated requirements:
      - e.g. "Junior Frontend Developer": HTML (Proficiency 3, Required), CSS (Proficiency 3, Required), JavaScript (Proficiency 3, Required), React (Proficiency 2, Important), Git (Proficiency 2, Required).
      - vs "Full-Stack Developer" (Mid/All): HTML (4), CSS (4), JavaScript (4), React (4), Node.js (4), MongoDB (3), Git (3).

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: `GET /api/roles`, `GET /api/roles/:id`, `GET /api/skill-gap`.
- **TO BE IMPLEMENTED**:
  - `GET /api/roles?level=junior`: Returns roles filtered by seniority tier.
  - `GET /api/skill-gap` and `GET /api/skill-gap/:roleId` payload includes role `level` badge and tier-specific diagnostic summary.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: Department filter dropdown.
- **TO BE IMPLEMENTED**:
  - In `Frontend/src/pages/CareerExplorer.jsx`:
    - Add Seniority Tier toggle pills: `[All Levels, Junior / Entry-Level, Mid-Level, Senior]`.
    - Render colored badge on role cards: Green for "Junior", Blue for "Mid", Purple for "Senior".
  - In `Frontend/src/pages/SkillGaps.jsx`:
    - Display banner if a junior student has selected a Senior role: "Tip: You are evaluating against a Senior-level role. Consider targeting Junior Full-Stack Developer for immediate readiness."

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Authenticated users can view roles; Admins/Managers can create/edit.
- **TO BE IMPLEMENTED**:
  - Unchanged; creating tiered roles remains restricted to `admin` and `manager`.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: Role name required.
- **TO BE IMPLEMENTED**:
  - `level` must strictly match one of `['junior', 'mid', 'senior', 'all']`.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: Standard 404 / 400.
- **TO BE IMPLEMENTED**:
  - Preserved.

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Unit tests in `Backend/tests/careerReadiness.test.js`:
    - Test 1: Calculating readiness score for Junior role returns higher score for a student with baseline proficiencies than evaluating against a Senior role.
    - Test 2: Role query with `?level=junior` returns only junior roles.
    - Test 3: Importance weights (3, 2, 1) accurately modulate the score numerator and denominator.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: `mongoose`.
- **TO BE IMPLEMENTED**: None additional.

---

## 15. Implementation Order
1. Update `Role.js` model with `level` attribute.
2. Update `roleService.js` to filter by `level`.
3. Add Junior role definitions and requirements in `seedCatalog.js`.
4. Update `CareerExplorer.jsx` with level filter buttons.
5. Update `SkillGaps.jsx` with level badges.
6. Run `careerReadiness.test.js`.

---

## 16. Acceptance Criteria
- **AC-01**: A student can filter the Career Explorer by "Junior / Entry-Level" to discover beginner-accessible roles.
- **AC-02**: Evaluating readiness against a Junior role produces an achievable readiness percentage that encourages learners.
- **AC-03**: Existing un-tiered roles default to `level: 'all'` without breaking existing user target role selections.

---

## 17. Risks
- **Risk 1 (Role Proliferation)**: Creating too many role variants could clutter the UI.
  - *Mitigation*: Curate a tight set of core engineering tracks (Frontend, Backend, Full-Stack) with Junior/Senior variations, keeping niche roles as `all`.

---

## 18. Rollback Considerations
- Reverting `level` schema additions has zero side effects since existing queries operate primarily on `_id` and `department`.
