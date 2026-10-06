# SkillGraph: Learning Resources, Progress & Recommendations Context

## 1. Module Name
**Learning Resources, Topic Progress & Recommendation Engine Module**

---

## 2. Purpose
The Learning Resources, Topic Progress & Recommendation Engine module powers personalized skill acquisition for SkillGraph learners. It catalogs educational materials (courses, tutorials, documentation), monitors granular topic-level checklist completions, tracks course progress percentages, and runs a heuristic prioritization algorithm to deliver sequenced learning recommendations based on career skill gaps and prerequisite readiness.

---

## 3. Current Functionality
- **Learning Resource Catalog (`LearningResource` model)**:
  - Catalogs educational content mapped to specific technical skills (`skillId`).
  - Supports resource formats: `course`, `video`, `article`, `book`, `documentation`.
  - Captures educational attributes: `provider` (e.g., Coursera, freeCodeCamp, MDN), `durationHours`, `difficulty` (`beginner`, `intermediate`, `advanced`), `isFree` (Boolean), and external destination `url`.
  - Automatically seeded with 30 curated educational resources via `seedCatalog.js`.
- **Course Enrollment & Progress Tracking (`LearningProgress` model)**:
  - Manages student participation in learning resources.
  - Tracks status lifecycle: `not_started` -> `in_progress` -> `completed`.
  - Records self-reported progress percentage (`0` to `100`), `startedAt` timestamp, and `completedAt` timestamp.
- **Granular Topic Checklists (`UserTopicProgress` model)**:
  - Tracks student completion of fine-grained sub-topics within a skill (e.g., within "HTML": `html-basics`, `semantic-html`, `forms-inputs`, `canvas-multimedia`).
  - Toggle Endpoint (`POST /api/learning/topics/toggle` and `POST /api/learning/topics/complete`): Dynamically switches topic completion state. Completing topics updates user skill proficiency in `UserSkill`, elevating readiness scores in real time.
- **Topological Guided Career Learning Paths (`JobLearningPath.jsx`)**:
  - Modeled after the Naukri Code 360 reference; generates a personalized path for any job vacancy.
  - Groups curriculum into chapters ordered topologically (Kahn's DAG sort) based on prerequisite dependencies.
  - Each chapter displays skill importance, prerequisite warnings, progress percentage, topic difficulty tags, and curated learning resources.
- **Deterministic Recommendation Engine (`recommendationService.js`)**:
  - Identifies skills deficient in the user's active `targetRoleId`.
  - **Prioritization Scoring Formula (0 to 100 Scale)**:
    $$\text{Score} = \text{Base Weight} + (\text{Gap Magnitude} \times 8) + \text{Prerequisite Bonus} + \text{Unlock Bonus}$$
    - **Base Weight**: `required` = 50, `important` = 30, `nice_to_have` = 10.
    - **Gap Magnitude**: $(\text{Expected Proficiency} - \text{Current Proficiency})$.
    - **Prerequisite Modifier**: $+15$ bonus if all prerequisite skills are already met; $-30$ penalty if upstream prerequisites are missing.
    - **Downstream Unlock Bonus**: $+15$ bonus if mastering this skill unlocks other dependent gap skills.
  - Matches each prioritized skill with top-rated learning resources from the catalog.
- **Quick-Wins Generator (`GET /api/recommendations/quick-wins`)**:
  - Highlights low-effort, high-impact skills (skills with minor gaps or beginner difficulty that immediately raise role readiness).
- **Frontend Progress Roadmap (`Progress.jsx`)**:
  - Interactive learning checklist interface where students toggle completed topics, view milestone progress bars, and track active course modules.
- **Frontend Recommendations View (`Recommendations.jsx`)**:
  - Displays prioritized recommendations with priority badges, reason descriptions ("Required for Full-Stack Developer", "Prerequisites satisfied"), and enrolled course links.

---

## 4. Frontend Files Involved
- `Frontend/src/pages/Progress.jsx`: Comprehensive milestone tracker displaying topic-level checklists grouped by skill, progress bars, and course status.
- `Frontend/src/pages/Recommendations.jsx`: Recommendation view displaying ranked skill cards, priority indicators, and linked educational resources.
- `Frontend/src/services/api.js`: Exports `learningApi` (resources, progress, topics) and `recommendationApi` (recommendations, quick-wins).
- `Frontend/src/components/ProgressBar.jsx`: Visual representation of progress percentage.

---

## 5. Backend Files Involved
- `Backend/src/routes/learningRoutes.js`: REST routes for learning catalog, enrollment, and topic toggles.
- `Backend/src/controllers/learningController.js`: Dispatches resource and topic actions.
- `Backend/src/services/learningService.js`: Queries resources, updates course progress, and toggles `UserTopicProgress`.
- `Backend/src/routes/recommendationRoutes.js`: Endpoints for prioritized learning recommendations.
- `Backend/src/controllers/recommendationController.js`: Dispatches recommendation calculations.
- `Backend/src/services/recommendationService.js`: Core recommendation ranking algorithm and course bundling.
- `Backend/src/utils/scoring.js`: Defines `SKILL_TOTAL_TOPICS` lookup dictionary and scoring mathematics.
- `Backend/src/models/LearningResource.js`: Schema for educational content.
- `Backend/src/models/LearningProgress.js`: Junction schema for course enrollment.
- `Backend/src/models/UserTopicProgress.js`: Schema for sub-topic checkboxes.
- `Backend/src/seed/seedCatalog.js`: Seeds 30 initial learning materials on boot.

---

## 6. APIs Involved
- `GET /api/learning/resources`: Returns catalog of learning resources with filters (`skillId`, `type`, `difficulty`, `isFree`, `page`, `limit`).
- `GET /api/learning/resources/:id`: Returns details of a single learning resource.
- `POST /api/learning/resources`: Creates a new learning resource (Admin/Manager only).
- `PUT /api/learning/resources/:id`: Updates an existing resource (Admin/Manager only).
- `DELETE /api/learning/resources/:id`: Deletes a learning resource (Admin/Manager only).
- `GET /api/learning/progress`: Returns authenticated user's enrolled courses and completion metrics.
- `POST /api/learning/progress`: Enrolls user in a resource (`{ resourceId }`).
- `PUT /api/learning/progress/:resourceId`: Updates course progress (`{ progressPercent, status }`).
- `GET /api/learning/topics`: Returns user's completed sub-topics (optional query param `skillId`).
- `POST /api/learning/topics/toggle`: Toggles completion of a sub-topic (`{ skillId, topicId, topicTitle }`).
- `GET /api/recommendations`: Returns prioritized list of skills with recommended learning courses for active target role.
- `GET /api/recommendations/quick-wins`: Returns high-impact, easily achievable skill recommendations.

---

## 7. Database Models Involved
- `LearningResource` (`Backend/src/models/LearningResource.js`):
  - Fields: `title`, `url`, `type`, `provider`, `skillId` (ref Skill), `durationHours`, `difficulty`, `isFree`.
- `LearningProgress` (`Backend/src/models/LearningProgress.js`):
  - Fields: `userId` (ref User), `resourceId` (ref LearningResource), `status`, `progressPercent`, `startedAt`, `completedAt`.
  - Compound Unique Index: `{ userId: 1, resourceId: 1 }`.
- `UserTopicProgress` (`Backend/src/models/UserTopicProgress.js`):
  - Fields: `userId` (ref User), `skillId` (ref Skill), `topicId`, `topicTitle`, `isCompleted`, `completedAt`.
  - Compound Unique Index: `{ userId: 1, skillId: 1, topicId: 1 }`.
- `UserSkill` (`Backend/src/models/UserSkill.js`):
  - Ingested to evaluate current proficiency levels.
- `RoleSkill` (`Backend/src/models/RoleSkill.js`):
  - Ingested to determine required proficiencies and importance weights.
- `SkillRelationship` (`Backend/src/models/SkillRelationship.js`):
  - Ingested to evaluate prerequisite readiness and unlock potentials.

---

## 8. Authentication / Authorization
- Catalog querying (`GET /api/learning/resources`) is accessible to authenticated users.
- Resource administration (creating, editing, deleting learning resources) requires `authorize('admin', 'manager')`.
- Progress tracking (`/api/learning/progress/*`) and topic toggling (`/api/learning/topics/toggle`) operate strictly on the authenticated user's ID (`req.user._id`).
- Recommendations (`/api/recommendations`) are personalized to the authenticated caller.

---

## 9. Dependencies
- `mongoose` (^8.3.4): Database operations, population, and atomic upsert operations.
- `react` (^18.2.0): Dynamic checklist rendering and progress calculation.
- `lucide-react` (^0.378.0): Status icons, checkmarks, and media indicators.

---

## 10. Current Workflow
1. **Discovering Recommended Skills**:
   - Learner visits `Recommendations.jsx`.
   - The page requests `GET /api/recommendations`.
   - `recommendationService.js` identifies target role skill gaps, scores them by priority, filters blocking prerequisites, and attaches relevant `LearningResource` items.
2. **Course Enrollment**:
   - Learner clicks "Enroll" on a course card.
   - Frontend calls `POST /api/learning/progress` with `{ resourceId }`.
   - A `LearningProgress` record is created with `status: 'in_progress'`.
3. **Tracking Sub-Topic Milestones**:
   - Learner visits `Progress.jsx`.
   - Checks off individual sub-topics as they study (e.g., "Semantic HTML", "Async/Await").
   - Frontend calls `POST /api/learning/topics/toggle`.
   - Server updates `UserTopicProgress`.
4. **Readiness Recalculation**:
   - The next time the user checks the Dashboard or Skill Gaps, `scoring.js` factors the new topic completion count into the effective proficiency formula, boosting the overall readiness percentage.

---

## 11. Current Limitations
- **Hardcoded Topic Taxonomy**: Topic definitions are maintained in frontend arrays and `scoring.js` dictionaries (`SKILL_TOTAL_TOPICS`) rather than as formal database models (`Topic` / `SkillTopic`). Unseeded skills default to an arbitrary 3 topics.
- **Self-Reported Verification**: Topic completions and course progress are completely self-reported without automated verification or quiz validation.
- **External LMS Syncing**: Webhooks or API integrations with external learning platforms (Udemy, Coursera, YouTube API) to automatically track video watch time or course completion are Not currently implemented.
- **In-App Media Player**: In-app video streaming or document rendering is Not currently implemented; courses open external URLs in new browser tabs.
- **Certificate Uploads**: Uploading PDF course certificates or credential verification links is Not currently implemented.

---

## 12. Existing Validation
- **Resource Type Enum**: Must be one of `['course', 'video', 'article', 'book', 'documentation']`.
- **Difficulty Enum**: Must be one of `['beginner', 'intermediate', 'advanced']`.
- **Progress Status Enum**: Must be one of `['not_started', 'in_progress', 'completed']`.
- **Percentage Bounds**: `progressPercent` must be between `0` and `100`.
- **Atomic Topic Toggles**: Compound index `{ userId: 1, skillId: 1, topicId: 1 }` guarantees idempotent toggling without duplicate progress records.

---

## 13. Existing Error Handling
- **Resource Not Found**: Throws `NotFoundError` ("Learning resource not found") -> HTTP 404.
- **Invalid Progress Percent**: Throws `ValidationError` ("Progress percent must be between 0 and 100") -> HTTP 400.
- **Fallback Recommendations**: If a user has not chosen a `targetRoleId`, `recommendationService.js` catches this condition and returns general recommendations based on the user's lowest-proficiency logged skills rather than throwing an unhandled exception.

---

## 14. Important Relationships with Other Modules
- **Skills Catalog**: Resources and topics are directly categorized under canonical `Skill` IDs.
- **Career Roles & Skill Gap**: Target role gaps define what skills appear in `Recommendations`.
- **Readiness Scoring**: Topic completion percentages directly scale user proficiency scores in `scoring.js`.
- **Student Dashboard**: Dashboard displays active courses and topic progress summaries.
- **AI Assistant**: Ingests active course enrollments and completed topics to personalize study plans.
