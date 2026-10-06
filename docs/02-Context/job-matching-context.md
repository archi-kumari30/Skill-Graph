# SkillGraph: Job Catalog, Company Directory & Job Matching Context

## 1. Module Name
**Job Catalog, Company Directory & Job Matching Module**

---

## 2. Purpose
The Job Catalog, Company Directory & Job Matching module connects learner competencies with industry employment opportunities. It maintains company profiles and job vacancies, calculates real-time skill compatibility scores for each job posting against the authenticated user's logged skills, highlights matched and missing competencies, and displays hiring market trends.

---

## 3. Current Functionality
- **Company Directory (`Company` model)**:
  - Catalogs corporate employers with `name`, unique `slug`, `logo`, `industry`, `website`, and `description`.
  - Seeded with prominent tech employers (Google, Microsoft, Amazon, Meta, Netflix, Stripe, Spotify, Uber, Airbnb, Datadog).
- **Structured Job Architecture (`Job` model)**:
  - Stores job opportunities linked to employers (`companyId`) or direct company names.
  - Attributes: `title`, `description`, `location` (e.g. "Bangalore", "Remote"), `workMode` (`Remote`, `Hybrid`, `On-site`), `jobType` / `employmentType` (`Full Time`, `Part Time`, `Internship`, `Contract`), `experience` (e.g. "0–2 years"), `salary` (e.g. "8–12 LPA"), numeric ranges (`salaryMin`, `salaryMax`), `applicationUrl`, `deadline`, and `status` (`Draft`, `Active`, `Closed`).
  - Optional Education Constraints: `degree`, `branch`, `minGraduationYear`, `minCgpa`.
  - Structured Skill Requirements: Each requirement specifies `skillId`, `importance` (`Required`, `Important`, `Nice to Have`), and `expectedProficiency` (1 to 5).
- **Deterministic Weighted Compatibility Matching Engine (`jobService.js`)**:
  - Compares the learner's logged competencies (`UserSkill`) against `Job.requirements`.
  - Formula incorporates importance weights (Required: 3, Important: 2, Nice to have: 1) and proficiency fulfillment ratios:
    $$\text{Proficiency Ratio} = \min\left(1.0, \frac{\text{Current Proficiency}}{\text{Expected Proficiency}}\right)$$
    $$\text{Match Score} = \left(\frac{\sum (\text{Weight} \times \text{Proficiency Ratio})}{\sum \text{Weight}}\right) \times 100$$
- **Prerequisite DAG Analysis & Blocked Status**:
  - Traverses `SkillRelationship` DAG to classify skills into:
    - `matched`: Current proficiency meets or exceeds expected level.
    - `partial`: Candidate has skill but proficiency is lower than required level.
    - `missing`: Candidate lacks skill, but all prerequisites are satisfied.
    - `blocked`: Candidate lacks skill AND is missing upstream prerequisites, exposing the exact causal prerequisite chain (e.g. Advanced React $\rightarrow$ React $\rightarrow$ JavaScript).
- **Guided Career Learning Paths (`JobLearningPath.jsx`)**:
  - Inspired by Naukri Code 360 reference; generates a structured guided path (`GET /api/jobs/:id/learning-path`) organized into chapters, topics, and curated resources.
  - Applies Kahn's algorithm topological sorting on the prerequisite DAG so foundational prerequisites appear in earlier chapters.
  - Topic completion checklist allows learners to mark topics mastered (`POST /api/learning/topics/complete`), updating skill proficiency and dynamically elevating readiness and match scores in real time.
- **In-App Application Tracking (`JobApplication` model & `Applications.jsx`)**:
  - Learners apply directly via modal (`POST /api/jobs/:id/apply`) with optional resume URL and cover letter.
  - Enforces duplicate prevention via compound unique index `{ userId: 1, jobId: 1 }` (HTTP 409) and closed job validation (HTTP 400).
  - Tracks status progression (`applied`, `under_review`, `shortlisted`, `interview`, `offered`, `rejected`, `withdrawn`) at `/applications`.
- **Admin/Manager Job Console (`JobManagement.jsx`)**:
  - Protected by `RoleRoute` at `/admin/jobs`.
  - Interactive job creation and editing with dynamic visual requirement buckets (`Required`, `Important`, `Nice to Have`), status toggling, and applicant management.

---

## 4. Frontend Files Involved
- `Frontend/src/pages/Jobs.jsx`: Primary job board with match scores, work mode filters, and direct links to job details and learning paths.
- `Frontend/src/pages/JobDetail.jsx`: Comprehensive opportunity view with match score ring, "Why is my score X%", 4-category status breakdown (Matched, Partial, Missing, Blocked), education requirements, and modal apply.
- `Frontend/src/pages/JobLearningPath.jsx`: Guided Career Learning Path with chapters, topological progression, and interactive topic completion checkboxes.
- `Frontend/src/pages/Applications.jsx`: Learner application tracker with status pipeline badges and direct links.
- `Frontend/src/pages/JobManagement.jsx`: Manager/Admin job architecture console.
- `Frontend/src/pages/CareerMarket.jsx`: Career market overview showing compensation tiers and trending tech skills.
- `Frontend/src/services/api.js`: Axios client with cache invalidation for `/jobs` and `/applications`.

---

## 5. Backend Files Involved
- `Backend/src/routes/jobRoutes.js`: REST endpoints for jobs, matches, applications, and learning paths.
- `Backend/src/routes/applicationRoutes.js`: REST endpoints mounted at `/api/applications`.
- `Backend/src/controllers/jobController.js`: Request handlers for jobs, matches, and applications.
- `Backend/src/services/jobService.js`: Business logic for prerequisite traversal, topological sorting, and application lifecycle.
- `Backend/src/models/Job.js`: Mongoose schema for structured job requirements.
- `Backend/src/models/JobApplication.js`: Mongoose schema for application tracking.
- `Backend/src/models/Company.js`: Mongoose schema for employers.
- `Backend/tests/jobPrerequisitesAndLearningPath.test.js`: 10 integration tests validating RBAC, DAG prerequisite traversal, blocked chains, Kahn sort, 409 duplicate blocks, and 400 closed job blocks.

---

## 6. APIs Involved
- `GET /api/jobs`: Returns job listings with computed match scores for authenticated user (`search`, `location`, `jobType`, `companyId`, `minMatchScore`, `page`, `limit`).
- `GET /api/jobs/:id`: Returns single job posting with populated company details, full skill requirement list, and user match breakdown.
- `POST /api/jobs`: Creates a new job posting (Admin/Manager only).
- `PUT /api/jobs/:id`: Updates an existing job posting (Admin/Manager only).
- `DELETE /api/jobs/:id`: Deletes a job posting (Admin/Manager only).
- `GET /api/jobs/companies`: Lists all registered companies.
- `POST /api/jobs/companies`: Registers a new company profile (Admin/Manager only).
- `GET /api/jobs/companies/:id`: Fetches company details and all associated job postings.

---

## 7. Database Models Involved
- `Company` (`Backend/src/models/Company.js`):
  - Fields: `name` (unique), `slug` (unique), `logo`, `industry`, `website`, `description`.
- `Job` (`Backend/src/models/Job.js`):
  - Fields: `title`, `companyId` (ref Company), `description`, `location`, `jobType` (enum), `salary`, `requiredSkills` ([ref Skill]), `applyUrl`.
- `UserSkill` (`Backend/src/models/UserSkill.js`):
  - Ingested during job queries to compare user skills against `requiredSkills`.
- `Skill` (`Backend/src/models/Skill.js`):
  - Referenced in `Job.requiredSkills` to populate skill names and category badges.

---

## 8. Authentication / Authorization
- Browsing jobs (`GET /api/jobs`, `GET /api/jobs/:id`) requires `authenticate` to compute candidate compatibility scores.
- Creating, modifying, or deleting jobs and company profiles requires `authorize('admin', 'manager')`.
- Standard learners (`accountRole: 'employee'`) have read-only access to job and company listings.

---

## 9. Dependencies
- `mongoose` (^8.3.4): Multi-collection joins, array querying, and schema validation.
- `react` (^18.2.0): State management, filtering, and component rendering.
- `lucide-react` (^0.378.0): Company, location, salary, and external link icons.

---

## 10. Current Workflow
1. **Browsing Opportunities**:
   - Learner navigates to `Jobs.jsx`.
   - Frontend calls `GET /api/jobs`.
2. **Dynamic Match Calculation**:
   - `jobService.js` retrieves user skills from `UserSkill` for `req.user._id`.
   - For each job, compares `Job.requiredSkills` with user skills.
   - Computes match percentage and segregates matched vs missing skills.
3. **Filtering and Inspection**:
   - Learner filters by remote status, job type (Full-time/Internship), or minimum match score (e.g. $\ge 70\%$).
   - Learner clicks a job card to inspect missing competencies needed to qualify.
4. **Application**:
   - Learner clicks "Apply", which opens the external employer application portal (`Job.applyUrl`) in a new browser tab.

---

## 11. Current Limitations
- **Mock Market Trends**: `CareerMarket.jsx` displays static, hardcoded sample metrics for market trends and salary bands rather than dynamically computing them from active job listings.
- **In-App Application Workflow**: Native application tracking (submitting resumes, application state transitions: `applied`, `reviewing`, `interviewing`, `rejected`, `offered`) is Not currently implemented; applications rely entirely on external redirect URLs.
- **Recruiter / Employer Portal**: A portal for corporate recruiters to register, post vacancies, and review candidate applicant profiles is Not currently implemented; jobs are curated by system admins/managers.
- **Structured Salary Ranges**: `salary` is stored as an unstructured display string (e.g., "$130k - $160k") rather than structured numerical fields (`salaryMin`, `salaryMax`, `currency`), preventing numeric range filtering.
- **Skill Proficiency in Job Requirements**: Jobs require skills by ID without specifying required proficiency tiers (1-5); match score treats any logged skill as a full match regardless of user proficiency level.

---

## 12. Existing Validation
- **Job Creation Guard**: `title` and `companyId` are required fields.
- **Job Type Enum**: Must be one of `['Full-time', 'Part-time', 'Contract', 'Internship']`.
- **Company Name Uniqueness**: Enforced via Mongoose schema unique index.
- **URL Format**: URLs are stored as strings; protocol validation is Not currently implemented at schema level.

---

## 13. Existing Error Handling
- **Job Not Found**: Throws `NotFoundError` ("Job not found") -> HTTP 404.
- **Company Not Found**: Throws `NotFoundError` ("Company not found") -> HTTP 404.
- **Duplicate Company**: Traps code `11000` and throws `ConflictError` ("Company already exists") -> HTTP 409.
- **UI Error Feedback**: `Jobs.jsx` displays `ErrorState.jsx` with retry buttons if the API request fails.

---

## 14. Important Relationships with Other Modules
- **Student Profile**: Uses learner's `UserSkill` records to calculate personalized compatibility match scores.
- **Skills Catalog**: Jobs reference canonical `Skill` documents in `requiredSkills`.
- **Career Roles**: Job openings align with career role titles and required skill sets.
- **AI Assistant**: Ingests top job matches to recommend relevant career openings and highlight missing requirements during coaching chats.
