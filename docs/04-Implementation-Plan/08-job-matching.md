# SkillGraph Implementation Plan: Module 08 — Job Matching & Applications

## 1. Module
**08 — Job Matching, Application Tracking & Dynamic Market Analytics**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - `Company` directory (10 seeded) and `Job` catalog (20 seeded).
  - Job matching algorithm counts binary skill presence: any logged skill counts as 100% regardless of whether user proficiency is Novice (1) or Expert (5).
  - Unstructured salary string (`salary: "$120k - $150k"`) preventing numeric range queries.
  - External redirect-only application link (`applyUrl`) with zero in-app application tracking.
  - `CareerMarket.jsx` renders static mock data with a "Sample Market Data" banner.
- **TO BE IMPLEMENTED**:
  - Proficiency-weighted job compatibility scoring algorithm.
  - Structured numeric salary filtering (`minSalary`, `maxSalary`).
  - Native in-app job application lifecycle tracking (`JobApplication` collection).
  - Real-time job market aggregation API replacing mock data on `CareerMarket.jsx`.

---

## 3. Objective
Elevate the employment tier from a static external directory into a credible, interactive job matching and application tracking engine that factors candidate proficiency and aggregates live hiring trends.

---

## 4. Existing Files
- `Backend/src/models/Company.js`: Employer schema.
- `Backend/src/models/Job.js`: Job vacancy schema.
- `Backend/src/models/UserSkill.js`: Candidate competencies.
- `Backend/src/routes/jobRoutes.js`: Job routes.
- `Backend/src/controllers/jobController.js`: Job controller.
- `Backend/src/services/jobService.js`: Job matching and query logic.
- `Frontend/src/pages/Jobs.jsx`: Job board view.
- `Frontend/src/pages/CareerMarket.jsx`: Market trends view.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - `Backend/src/routes/jobRoutes.js`: Add `POST /:id/apply`, `GET /my-applications`, `GET /analytics`.
  - `Backend/src/controllers/jobController.js`: Add `applyToJob`, `getMyApplications`, `getJobMarketAnalytics`.
  - `Backend/src/services/jobService.js`:
    - Refactor `calculateJobMatch()` to use proficiency weighting.
    - Implement `applyForJob(userId, jobId, data)` and `getUserApplications(userId)`.
    - Implement `getMarketAnalytics()` aggregation pipeline.
  - `Frontend/src/services/api.js`: Add `jobApi.apply(jobId, data)`, `jobApi.getMyApplications()`, `jobApi.getMarketAnalytics()`.
  - `Frontend/src/pages/Jobs.jsx`: Add "Apply In-App" button, application modal (resume URL + portfolio note), and application status pill.
  - `Frontend/src/pages/CareerMarket.jsx`: Connect to `/api/jobs/analytics`, remove "Sample Market Data" banner.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: `Company`, `Job`.
- **TO BE IMPLEMENTED**:
  - `JobApplication` model (created in Module 02): `userId`, `jobId`, `status: ['applied', 'reviewing', 'interviewing', 'rejected', 'offered']`, `resumeUrl`, `notes`, `appliedAt`.
  - `Job.salaryMin`: Number, `Job.salaryMax`: Number, `Job.salaryCurrency`: String.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: Binary array intersection for skill matching.
- **TO BE IMPLEMENTED**:
  - In `jobService.js`:
    - **Proficiency-Weighted Match Scoring**:
      $$\text{Skill Score} = \begin{cases} 1.0 & \text{if } \text{proficiency} \ge 3 \\ 0.5 & \text{if } 1 \le \text{proficiency} < 3 \\ 0.0 & \text{if missing} \end{cases}$$
      $$\text{Job Match Percentage} = \left(\frac{\sum \text{Skill Scores}}{\text{Total Required Skills}}\right) \times 100$$
    - Add salary range filter in `getJobs()`: `$gte: minSalary`, `$lte: maxSalary`.
    - `getMarketAnalytics()`:
      - Aggregates top 10 most demanded skills across all active `Job` records.
      - Calculates average salary across industry roles.
      - Groups openings by company and location (Remote vs On-site).

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: `GET /api/jobs`, `GET /api/jobs/:id`, `GET /api/jobs/companies`.
- **TO BE IMPLEMENTED**:
  - `POST /api/jobs/:id/apply`: Authenticated user applies. Body: `{ resumeUrl: string, notes?: string }`.
  - `GET /api/jobs/my-applications`: Returns user's applied jobs with status lifecycle.
  - `GET /api/jobs/analytics`: Returns dynamic market analytics payload `{ topSkills: [], avgSalary: number, totalOpenings: number, remotePercentage: number }`.
  - `GET /api/jobs?minSalary=100000&maxSalary=150000`: Supports numeric salary filtering.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: External link button in `Jobs.jsx`; hardcoded constants in `CareerMarket.jsx`.
- **TO BE IMPLEMENTED**:
  - In `Jobs.jsx`:
    - Add tab switch: "All Opportunities" vs "My Applications".
    - In "My Applications" view, list applied jobs with status badge (`Applied`, `Under Review`, `Interviewing`, `Offer`).
    - Add "Quick Apply" modal prompting for resume link and notes.
    - Add minimum salary slider / input in the filter bar.
  - In `CareerMarket.jsx`:
    - Fetch from `jobApi.getMarketAnalytics()`.
    - Render real-time bar charts of top in-demand skills and average compensation.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Standard user auth.
- **TO BE IMPLEMENTED**:
  - Applying and viewing personal applications requires `authenticate`.
  - Managers can view all applicants for their posted jobs.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: Title and companyId required.
- **TO BE IMPLEMENTED**:
  - Prevent duplicate applications via `{ userId: 1, jobId: 1 }` compound unique index check.
  - `resumeUrl` must be a valid URL string.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: Standard errors.
- **TO BE IMPLEMENTED**:
  - Re-applying to the same job throws `ConflictError` ("You have already applied for this position").

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Integration tests in `Backend/tests/jobMatching.test.js`:
    - Test 1: User with beginner proficiency (level 1) receives partial score (50%) for that skill instead of full 100%.
    - Test 2: User successfully submits in-app job application.
    - Test 3: Duplicate application is rejected with 409 Conflict.
    - Test 4: `/api/jobs/analytics` aggregates skill frequency counts accurately from MongoDB.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: `mongoose`.
- **TO BE IMPLEMENTED**: None additional.

---

## 15. Implementation Order
1. Update `Job.js` schema with numeric salary fields.
2. Implement `JobApplication.js` model.
3. Update `jobService.js` with weighted scoring, application handling, and market analytics aggregation.
4. Add routes in `jobRoutes.js` and controller methods in `jobController.js`.
5. Update `Jobs.jsx` with application modal and status tracking.
6. Connect `CareerMarket.jsx` to `/api/jobs/analytics`.
7. Run `jobMatching.test.js`.

---

## 16. Acceptance Criteria
- **AC-01**: A student with proficiency 1 in JavaScript receives 50% match credit on a job requiring JavaScript, whereas a student with proficiency 4 receives 100%.
- **AC-02**: A student can submit an application and view its status in "My Applications".
- **AC-03**: `CareerMarket.jsx` visualizes real live statistics computed from the MongoDB `Job` collection with zero hardcoded sample data.

---

## 17. Risks
- **Risk 1 (Few Seed Jobs Skewing Analytics)**: If only 20 seed jobs exist, market trends could appear sparse.
  - *Mitigation*: Ensure `seedCatalog.js` seeds a balanced distribution of 20+ realistic job postings across web, mobile, DevOps, and data domains.

---

## 18. Rollback Considerations
- If in-app application flow has issues, the external `applyUrl` remains intact as a fallback.
