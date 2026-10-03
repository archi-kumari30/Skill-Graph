# SkillGraph: Student & User Profile Context

## 1. Module Name
**Student & User Profile Module**

---

## 2. Purpose
The Student & User Profile module manages learner and practitioner identities within SkillGraph. In the current system architecture, students and learners are modeled as users with `accountRole: 'employee'`. This module provides capabilities for students to maintain their academic credentials (college, branch, year of study), manage their personal technical skill inventory, select target career goals, and access an aggregated personal dashboard displaying readiness scores and skill gap metrics.

---

## 3. Current Functionality
- **Student Identity Modeling**: Implemented using the `User` model with `accountRole: 'employee'` and dedicated academic profile attributes:
  - `college`: Academic institution name.
  - `branch`: Academic discipline/major (e.g., "Computer Science", "Information Technology").
  - `yearOfStudy`: Current academic level (e.g., "3rd Year", "Final Year").
  - `department`: Institutional department (defaults to "Engineering").
  - `targetRoleId`: ObjectId referencing the user's desired career goal in the `Role` collection.
  - `bio` & `avatar`: Personal biography and avatar URL.
- **Profile Management (`GET/PUT /api/users/profile`)**: Allows users to inspect and update their personal details, academic background, and target career role.
- **Personal Skill Inventory (`/api/skills/my-skills`)**:
  - `GET /api/skills/my-skills`: Lists all skills associated with the authenticated user, populated with canonical skill metadata and user-specific proficiency ratings (1-5).
  - `POST /api/skills/my-skills`: Adds a skill to the user's profile with a specified proficiency level (1 to 5). Supports referencing an existing catalog skill or dynamically creating a custom personal skill (`isPersonal: true`).
  - `PUT /api/skills/my-skills/:skillId`: Updates the self-assessed proficiency rating for an existing logged skill.
  - `DELETE /api/skills/my-skills/:skillId`: Removes a skill from the user's personal inventory.
- **Student Dashboard Overview (`GET /api/dashboard/overview`)**:
  - Aggregates core learner statistics: total skills acquired, average proficiency, target role details, target role readiness percentage, top skill gaps count, and enrolled/completed learning resources.
- **Administrative User Management (Admin Only)**:
  - `GET /api/users`: Lists all users across the system with pagination and search.
  - `GET /api/users/:id`: Fetches a specific user's complete profile and skill inventory.
  - `DELETE /api/users/:id`: Permanently deletes a user account and associated user skill records.

---

## 4. Frontend Files Involved
- `Frontend/src/pages/Profile.jsx`: Profile editing view containing personal information inputs, academic credential fields (College, Branch, Year of Study), and target role dropdown selector.
- `Frontend/src/pages/Dashboard.jsx`: Learner dashboard showing readiness progress circle, metrics cards, top missing skill gaps, quick action shortcuts, and active course widgets.
- `Frontend/src/pages/MySkills.jsx`: Skills management interface displaying the user's skill inventory, category filter tabs, proficiency rating badges, an "Add Skill" modal with autocomplete search, and inline proficiency adjusters.
- `Frontend/src/context/AuthContext.jsx`: Maintains active student profile state in memory and provides `updateProfile()` for synchronous updates.
- `Frontend/src/components/ProgressBar.jsx`: Renders proficiency bars (1 to 5) and percentage completion bars.

---

## 5. Backend Files Involved
- `Backend/src/routes/userRoutes.js`: Exposes user profile and administrative user endpoints.
- `Backend/src/controllers/userController.js`: Handles profile retrieval, updates, and user listing.
- `Backend/src/services/userService.js`: Implements user lookup, role updates, and user profile persistence.
- `Backend/src/routes/dashboardRoutes.js`: Exposes dashboard overview endpoint.
- `Backend/src/controllers/dashboardController.js`: Formats dashboard summary metrics.
- `Backend/src/services/dashboardService.js`: Computes aggregated metrics (readiness, gaps, courses, skills).
- `Backend/src/routes/skillRoutes.js`: Contains `/my-skills` route definitions.
- `Backend/src/controllers/skillController.js`: Handles user skill mutations.
- `Backend/src/services/skillService.js`: Manages `UserSkill` documents, validates proficiencies, and creates custom personal skills.
- `Backend/src/models/User.js`: User schema containing academic and profile attributes.
- `Backend/src/models/UserSkill.js`: Junction schema linking user to skills with proficiency.

---

## 6. APIs Involved
- `GET /api/users/profile`: Retrieves current authenticated student's profile.
- `PUT /api/users/profile`: Updates name, bio, department, targetRoleId, branch, college, and yearOfStudy.
- `GET /api/dashboard/overview`: Returns user dashboard metrics (total skills, average proficiency, readiness score, target role, gaps count, active courses).
- `GET /api/skills/my-skills`: Returns all skills logged by the user with proficiency and verification status.
- `POST /api/skills/my-skills`: Adds a skill to user profile. Body: `{ skillId, proficiency, name?, category? }`.
- `PUT /api/skills/my-skills/:skillId`: Updates proficiency for a skill. Body: `{ proficiency }`.
- `DELETE /api/skills/my-skills/:skillId`: Removes a skill from user profile.
- `GET /api/users`: Admin-only endpoint listing all registered users.
- `GET /api/users/:id`: Admin-only endpoint fetching full profile for a specific user ID.
- `DELETE /api/users/:id`: Admin-only endpoint deleting a user account.

---

## 7. Database Models Involved
- `User` (`Backend/src/models/User.js`):
  - Relevant student fields: `name`, `email`, `accountRole`, `department`, `branch`, `college`, `yearOfStudy`, `targetRoleId`, `bio`, `avatar`.
- `UserSkill` (`Backend/src/models/UserSkill.js`):
  - Stores student competency records: `userId`, `skillId`, `proficiency` (1-5), `verified` (default `false`).
- `Role` (`Backend/src/models/Role.js`):
  - Target career goal linked via `User.targetRoleId`.
- `LearningProgress` (`Backend/src/models/LearningProgress.js`):
  - Queried in dashboard service to compute active course metrics.
- `UserTopicProgress` (`Backend/src/models/UserTopicProgress.js`):
  - Queried to calculate granular topic completion rates.

---

## 8. Authentication / Authorization
- All student profile and skill management endpoints require valid JWT authentication via `authMiddleware.authenticate`.
- Profile modifications in `userController.js` and `authController.js` operate strictly on `req.user._id`, ensuring users can only read or edit their own profile.
- Skill mutations in `skillController.js` enforce `userId: req.user._id`.
- System user administration endpoints (`GET /api/users`, `DELETE /api/users/:id`) require `authorize('admin')`.

---

## 9. Dependencies
- `mongoose` (^8.3.4): Database queries, schema definitions, and model population.
- `react` (^18.2.0): Profile forms and state management.
- `recharts` (^2.12.7): Visual chart rendering on the dashboard.
- `lucide-react` (^0.378.0): Icon components across user profile and dashboard screens.

---

## 10. Current Workflow
1. **Academic Profile Setup**:
   - Student navigates to `Profile.jsx`.
   - Fills in `college`, `branch`, `yearOfStudy`, and selects a `targetRoleId` from the career roles dropdown.
   - Clicks "Save Changes", which invokes `PUT /api/users/profile` (or `PUT /api/auth/me`).
   - Profile state updates in `AuthContext` and is persisted in MongoDB.
2. **Logging Technical Competencies**:
   - Student navigates to `MySkills.jsx`.
   - Searches catalog for existing skills (e.g., "React", "Python") or enters a new custom skill.
   - Adjusts the proficiency slider from 1 (Novice) to 5 (Expert).
   - Submits form; `POST /api/skills/my-skills` creates a `UserSkill` record.
3. **Reviewing Dashboard Insights**:
   - Student navigates to `Dashboard.jsx`.
   - `dashboardService.getOverview()` calculates the student's target role readiness score, top missing skill gaps, and learning checklist progress.
   - Dashboard presents a summary card deck and quick navigation links.

---

## 11. Current Limitations
- **No Distinct 'student' Enum**: A dedicated `'student'` role does not exist in the database schema; students must register under `accountRole: 'employee'`.
- **Skill Verification Not Implemented**: The `verified` flag on `UserSkill` defaults to `false`. No automated coding assessments, certificate verification, or instructor approval workflows are currently implemented.
- **Resume / Transcript Parser**: Automatic skill extraction from uploaded resumes (PDF/DOCX) or university transcripts is Not currently implemented.
- **Academic GPA / Performance Tracking**: Fields for semester GPA, CGPA, or academic milestones are Not currently implemented.
- **Avatar Image File Uploads**: Image uploads to cloud storage (e.g., S3/Cloudinary) or local disk are Not currently implemented; avatars accept only raw URL strings.

---

## 12. Existing Validation
- **Proficiency Range**: `UserSkill.proficiency` must be an integer between 1 and 5 (`min: 1, max: 5`).
- **Duplicate Prevention**: Compound unique index `{ userId: 1, skillId: 1 }` prevents a user from logging the same skill multiple times.
- **Target Role Validation**: If `targetRoleId` is provided during profile update, `userService.js` verifies the role ID exists in the `Role` collection.
- **Name and Email**: Non-empty trimmed strings enforced by Mongoose schema.

---

## 13. Existing Error Handling
- **User Not Found**: Throws `NotFoundError` ("User not found") -> HTTP 404.
- **Role Not Found**: Throws `NotFoundError` ("Target role not found") -> HTTP 404.
- **Duplicate Skill**: If user attempts to add an already registered skill, returns `ConflictError` ("Skill already added to your profile") -> HTTP 409.
- **Invalid Proficiency**: If proficiency is outside 1-5, returns `ValidationError` ("Proficiency must be between 1 and 5") -> HTTP 400.
- **Frontend Feedback**: `MySkills.jsx` and `Profile.jsx` render inline alerts on failure and success banners on successful updates.

---

## 14. Important Relationships with Other Modules
- **Authentication**: Extends the authenticated `User` record with academic fields and identity.
- **Skills Catalog**: Links users to global and personal skills via `UserSkill` records.
- **Career & Role Matching**: `targetRoleId` anchors the entire skill gap analysis and career readiness engine.
- **Learning & Progress**: Drives milestone tracking and course recommendations displayed on the student dashboard.
- **Job Matching**: Learner skills are matched against job requirements to calculate employment fit scores.
- **AI Assistant**: Injects student academic info, skills, and target role into AI prompt context.
