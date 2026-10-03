# SkillGraph Implementation Plan: Module 07 — Learning & Recommendations

## 1. Module
**07 — Learning Resources, Database Topics & Dynamic Recommendations**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - `LearningResource` catalog with 30 seeded resources mapped to skills.
  - `LearningProgress` tracking course participation (`progressPercent: 0–100%`).
  - `UserTopicProgress` tracking user checklist clicks.
  - Heuristic recommendation engine (`recommendationService.js`) scoring next skills based on gap magnitude, base importance weight, and prerequisite readiness.
  - Frontend views: `Progress.jsx` and `Recommendations.jsx`.
- **TO BE IMPLEMENTED**:
  - Database-backed `Topic` entities replacing hardcoded arrays in `Progress.jsx` and static lookup dictionary `SKILL_TOTAL_TOPICS` in `scoring.js`.
  - Dynamic topic retrieval endpoints (`/api/learning/topics/catalog`).
  - Dynamic topic count resolution in the readiness scoring engine.
  - Optional `proofUrl` submission when marking a learning resource as completed.
  - Effort-adjusted recommendation ranking factoring in course `durationHours`.

---

## 3. Objective
Eliminate hardcoded technical debt by elevating learning topics into dynamic database entities, integrate course proof verification, and calibrate recommendations using course effort metrics.

---

## 4. Existing Files
- `Backend/src/models/LearningResource.js`: Resource schema.
- `Backend/src/models/LearningProgress.js`: Progress schema.
- `Backend/src/models/UserTopicProgress.js`: Topic progress schema.
- `Backend/src/routes/learningRoutes.js`: Learning routes.
- `Backend/src/controllers/learningController.js`: Learning controller.
- `Backend/src/services/learningService.js`: Learning service.
- `Backend/src/routes/recommendationRoutes.js`: Recommendation routes.
- `Backend/src/controllers/recommendationController.js`: Recommendation controller.
- `Backend/src/services/recommendationService.js`: Recommendation ranking engine.
- `Backend/src/utils/scoring.js`: Scoring math and hardcoded `SKILL_TOTAL_TOPICS`.
- `Frontend/src/pages/Progress.jsx`: Milestone checklists page.
- `Frontend/src/pages/Recommendations.jsx`: Recommendations view.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - `Backend/src/routes/learningRoutes.js`: Add `GET /topics/catalog`, `GET /skills/:skillId/topics`, `POST /skills/:skillId/topics`.
  - `Backend/src/controllers/learningController.js`: Add `getTopicCatalog`, `getSkillTopics`, `createTopic`.
  - `Backend/src/services/learningService.js`: Implement database topic queries and attach topics dynamically.
  - `Backend/src/utils/scoring.js`: Update `calculateEffectiveProficiency()` and `calculateReadiness()` to query or accept dynamic topic counts from the `Topic` collection.
  - `Backend/src/services/recommendationService.js`: Factor `durationHours` into quick-wins prioritization.
  - `Frontend/src/services/api.js`: Add `learningApi.getTopicCatalog(skillId)`.
  - `Frontend/src/pages/Progress.jsx`: Replace hardcoded static topic definitions with dynamic API fetching.
  - `Frontend/src/pages/Recommendations.jsx`: Display duration tags and effort badges.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: `LearningResource`, `LearningProgress`, `UserTopicProgress`.
- **TO BE IMPLEMENTED**:
  - `Topic` model (created in Module 02): `skillId`, `title`, `slug`, `order`, `summary`.
  - `LearningProgress`: Add `proofUrl: { type: String, default: '' }`.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: Static lookup in `scoring.js`.
- **TO BE IMPLEMENTED**:
  - In `Backend/src/utils/scoring.js`:
    - Implement cached topic count helper `getSkillTopicCounts()` that queries `Topic.aggregate([ { $group: { _id: '$skillId', count: { $sum: 1 } } } ])`.
    - If a skill has 0 topics in the database, fallback gracefully to default 3.
  - In `Backend/src/services/learningService.js`:
    - `getTopicCatalog(skillId)`: Fetches topics for a skill sorted by `order: 1`.
    - In `updateProgress(userId, resourceId, data)`: If `data.status === 'completed'` and `data.proofUrl` is supplied, save `proofUrl`.
  - In `Backend/src/services/recommendationService.js`:
    - In `getQuickWins()`: Prioritize skills that have available learning resources with `durationHours <= 10` and `difficulty === 'beginner'`.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**:
  - `GET /api/learning/resources`
  - `GET /api/learning/progress`
  - `POST /api/learning/progress`
  - `POST /api/learning/topics/toggle`
- **TO BE IMPLEMENTED**:
  - `GET /api/learning/topics/catalog`: Returns all topics grouped by skill.
  - `GET /api/learning/skills/:skillId/topics`: Returns list of sub-topics for a specific skill.
  - `POST /api/learning/skills/:skillId/topics`: Admin/Manager adds a new sub-topic to a skill. Body: `{ title, slug, summary?, order? }`.
  - `PUT /api/learning/progress/:resourceId`: Body accepts optional `{ proofUrl }`.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: `Progress.jsx` contains static arrays for HTML/CSS/JS topics.
- **TO BE IMPLEMENTED**:
  - In `Frontend/src/pages/Progress.jsx`:
    - Remove hardcoded arrays.
    - Fetch topics via `learningApi.getTopicCatalog()`.
    - Map checklist toggles to real database topic slugs and IDs.
  - In `Frontend/src/pages/Recommendations.jsx`:
    - Display course duration chip (e.g. "8 hrs", "freeCodeCamp", "Beginner").
    - Highlight "Quick Win" badge on high-impact low-duration courses.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Students toggle own progress.
- **TO BE IMPLEMENTED**:
  - Adding new topics (`POST /api/learning/skills/:skillId/topics`) restricted to `admin` and `manager`.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: Status enum checks.
- **TO BE IMPLEMENTED**:
  - `proofUrl` validated as a valid URL format when submitted.
  - Topic slug must match `^[a-z0-9-]+$`.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: Standard 404 / 400.
- **TO BE IMPLEMENTED**:
  - If a topic toggle is attempted for a non-existent skill, return clean `NotFoundError`.

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Integration tests in `Backend/tests/learningTopics.test.js`:
    - Test 1: Querying `GET /api/learning/skills/:skillId/topics` returns seeded topics in order.
    - Test 2: Toggling a dynamic topic updates `UserTopicProgress` and recalculates effective proficiency correctly.
    - Test 3: Updating course progress with `proofUrl` persists the URL.
    - Test 4: Quick-wins endpoint returns low-duration resources first.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: `mongoose`.
- **TO BE IMPLEMENTED**: None additional.

---

## 15. Implementation Order
1. Seed the `Topic` collection in `seedCatalog.js` with topics previously in `scoring.js`.
2. Add topic endpoints in `learningRoutes.js` and `learningController.js`.
3. Update `scoring.js` to dynamically compute total topics from the database.
4. Refactor `Progress.jsx` to load topics via API.
5. Enhance `Recommendations.jsx` with duration chips and quick-win tags.
6. Run `learningTopics.test.js`.

---

## 16. Acceptance Criteria
- **AC-01**: `Progress.jsx` displays topics fetched dynamically from MongoDB without any hardcoded arrays in client source code.
- **AC-02**: Adding a new topic via API immediately appears in the student's progress checklist and dynamically adjusts the readiness formula denominator.
- **AC-03**: Submitting a proof link on course completion saves the artifact in the database.

---

## 17. Risks
- **Risk 1 (Denominator Jump)**: Adding 5 new topics to a skill would immediately lower the completion rate for existing students who had 100%.
  - *Mitigation*: This accurately reflects expanding curriculum, but inform users via UI: "2 new topics added to React roadmap".

---

## 18. Rollback Considerations
- If dynamic topic querying introduces latency into scoring, cache topic counts in a 5-minute memory variable in `scoring.js`.
