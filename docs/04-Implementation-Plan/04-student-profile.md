# SkillGraph Implementation Plan: Module 04 — Student Profile & Verification

## 1. Module
**04 — Student Profile, Academic Identity & Skill Verification Workflow**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - `User` schema stores academic attributes: `college`, `branch`, `yearOfStudy`, `department`, `targetRoleId`, `bio`, `avatar`.
  - `UserSkill` junction stores learner competencies with `proficiency` (1–5) and `verified: false`.
  - User can update profile via `PUT /api/users/profile`.
  - `Frontend/src/pages/Profile.jsx` allows editing personal info and target role.
  - `Frontend/src/pages/MySkills.jsx` allows adding, editing, and deleting skills.
- **TO BE IMPLEMENTED**:
  - Skill Verification Pipeline:
    - Learner submits project link, GitHub repository, or certificate URL as proof of competency.
    - Status lifecycle on `UserSkill`: `unverified` -> `pending` -> `verified` | `rejected`.
    - Manager/instructor endpoint to review pending submissions and verify them.
  - Visual verification badges (verified checkmark badge) across `MySkills.jsx`, `Profile.jsx`, and `Dashboard.jsx`.
  - Multi-target role comparison support (`savedRoleIds`).

---

## 3. Objective
Transform self-reported skill ratings into credible, verifiable competencies by introducing a proof-submission and manager-verification pipeline, while formalizing academic student credentials and multi-career goal tracking.

---

## 4. Existing Files
- `Backend/src/models/User.js`: User schema.
- `Backend/src/models/UserSkill.js`: User skill junction schema.
- `Backend/src/routes/userRoutes.js`: User profile endpoints.
- `Backend/src/controllers/userController.js`: User controller.
- `Backend/src/services/userService.js`: User service.
- `Backend/src/routes/skillRoutes.js`: Skill inventory routes.
- `Backend/src/controllers/skillController.js`: Skill controller.
- `Backend/src/services/skillService.js`: Skill service.
- `Frontend/src/pages/Profile.jsx`: Profile page.
- `Frontend/src/pages/MySkills.jsx`: My skills inventory.
- `Frontend/src/pages/Dashboard.jsx`: Learner dashboard.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - `Backend/src/models/UserSkill.js`: Add `proofUrl`, `verificationStatus`, `verificationNotes`, `verifiedAt`, `verifiedBy`.
  - `Backend/src/models/User.js`: Add `savedRoleIds: [{ type: ObjectId, ref: 'Role' }]`.
  - `Backend/src/routes/skillRoutes.js`: Add verification submission and review routes.
  - `Backend/src/controllers/skillController.js`: Add `submitSkillVerification`, `getPendingVerifications`, `reviewSkillVerification`.
  - `Backend/src/services/skillService.js`: Implement verification state transitions.
  - `Frontend/src/services/api.js`: Add `skillApi.submitVerification`, `skillApi.getPendingVerifications`, `skillApi.reviewVerification`.
  - `Frontend/src/pages/MySkills.jsx`: Add "Verify Skill" button opening a proof-submission modal; render status badges ("Unverified", "Pending Review", "Verified").
  - `Frontend/src/pages/Profile.jsx`: Add multi-role selection badges and display verified skill tally.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: `UserSkill` model with `verified: Boolean`.
- **TO BE IMPLEMENTED**:
  - Updates to `UserSkill.js`:
    - `proofUrl`: String, trim, default: `''`.
    - `verificationStatus`: String, enum: `['unverified', 'pending', 'verified', 'rejected']`, default: `'unverified'`.
    - `verificationNotes`: String, default: `''`.
    - `verifiedAt`: Date, default: null.
    - `verifiedBy`: ObjectId, ref: `'User'`, default: null.
  - Updates to `User.js`:
    - `savedRoleIds`: `[{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]`, default: `[]`.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: Basic CRUD on user skills.
- **TO BE IMPLEMENTED**:
  - In `skillService.js`:
    - `submitVerification(userId, skillId, proofUrl, notes)`: Updates `UserSkill` document setting `proofUrl`, `verificationStatus: 'pending'`, `verificationNotes: notes`.
    - `getPendingVerifications(filter)`: Queries `UserSkill` where `verificationStatus === 'pending'`, populating `userId` (name, email, college) and `skillId` (name, category). Accessible to managers/admins.
    - `reviewVerification(userSkillId, reviewerId, decision, reviewerNotes)`: `decision` must be `'verified'` or `'rejected'`. Updates `verificationStatus`, sets `verified: decision === 'verified'`, records `verifiedAt` and `verifiedBy`.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: `/api/skills/my-skills` (GET, POST, PUT, DELETE).
- **TO BE IMPLEMENTED**:
  - `POST /api/skills/my-skills/:skillId/verify`: Authenticated user submits proof. Body: `{ proofUrl: string, notes?: string }`.
  - `GET /api/skills/verifications/pending`: Restricted to `manager`, `admin`. Returns paginated list of pending verifications across all students.
  - `PUT /api/skills/verifications/:id/review`: Restricted to `manager`, `admin`. Body: `{ decision: 'verified' | 'rejected', notes?: string }`.
  - `PUT /api/users/profile/saved-roles`: Authenticated user saves or removes alternative target roles. Body: `{ roleId: string, action: 'add' | 'remove' }`.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: Skills list with proficiency rating and delete button.
- **TO BE IMPLEMENTED**:
  - In `MySkills.jsx`:
    - Verification column displaying badge:
      - `unverified`: Gray shield outline + "Verify" button.
      - `pending`: Yellow clock icon + "Pending Review" tooltip.
      - `verified`: Green check shield + "Verified" pill with reviewer info.
      - `rejected`: Red alert icon + "Needs Revision" with review feedback.
    - Modal dialog: "Submit Skill Verification Proof" (URL input for GitHub, Portfolio, or Certificate + brief note).
  - In `Profile.jsx`:
    - Display "Academic Profile" card showing Student role badge, College, Branch, Year of Study, and count of Verified Skills vs Total Skills.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: User can only edit own skills.
- **TO BE IMPLEMENTED**:
  - Submitting verification proof requires ownership (`userId === req.user._id`).
  - Reviewing verifications (`/api/skills/verifications/*`) requires `authorize('admin', 'manager')`.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: Proficiency 1–5 range.
- **TO BE IMPLEMENTED**:
  - `proofUrl` must be a valid HTTP/HTTPS URL string.
  - `decision` must strictly be `'verified'` or `'rejected'`.
  - User cannot submit verification for a skill they have not yet logged in their inventory.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: Standard 404 and 400 errors.
- **TO BE IMPLEMENTED**:
  - Submitting proof for an already verified skill throws `ConflictError` ("Skill is already verified").
  - Invalid proof URL format throws `ValidationError` ("Please provide a valid web URL (e.g. GitHub repo, demo, or certificate)").

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Integration tests in `Backend/tests/studentVerification.test.js`:
    - Test 1: Student submits proof URL -> status updates to `'pending'`.
    - Test 2: Non-manager calling review endpoint receives 403 Forbidden.
    - Test 3: Manager approving proof updates `verified: true` and sets `verifiedBy`.
    - Test 4: Manager rejecting proof sets `verified: false` and preserves reviewer feedback.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: `mongoose`.
- **TO BE IMPLEMENTED**: None additional.

---

## 15. Implementation Order
1. Update `UserSkill.js` and `User.js` models.
2. Implement verification methods in `skillService.js`.
3. Add verification controller methods in `skillController.js` and routes in `skillRoutes.js`.
4. Update `api.js` client with verification endpoints.
5. Enhance `MySkills.jsx` with verification modal and status badges.
6. Enhance `Profile.jsx` with academic student badges.
7. Run `studentVerification.test.js`.

---

## 16. Acceptance Criteria
- **AC-01**: A student can attach a GitHub link to their "React" skill and see the status change to "Pending Review".
- **AC-02**: A manager logging in can view pending submissions and click "Approve", immediately turning the student's badge to "Verified".
- **AC-03**: Verified status is preserved in database and reflected on profile cards.
- **AC-04**: Non-manager users cannot approve their own or other users' skills.

---

## 17. Risks
- **Risk 1 (Link Rot in Proof URLs)**: External proof links may break or become private over time.
  - *Mitigation*: Store the submission timestamp and allow students to resubmit updated URLs if broken.
- **Risk 2 (Reviewer Bottleneck)**: If managers do not review submissions, skills remain pending indefinitely.
  - *Mitigation*: Ensure pending items are prominently badged on the Manager dashboard.

---

## 18. Rollback Considerations
- Existing `verified: false` records remain valid; default `verificationStatus: 'unverified'` maintains full backward compatibility.
