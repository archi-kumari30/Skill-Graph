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
  - Automatically seeded with 10 prominent tech employers (Google, Microsoft, Amazon, Meta, Netflix, Stripe, Spotify, Uber, Airbnb, Datadog) via `seedCatalog.js`.
- **Job Postings Catalog (`Job` model)**:
  - Stores job opportunities linked to employers (`companyId`).
  - Attributes: `title`, `description`, `location` (e.g., "Remote", "San Francisco, CA"), `jobType` (`Full-time`, `Part-time`, `Contract`, `Internship`), `salary` display string, and external `applyUrl`.
  - Maps requirements using an array of `requiredSkills` (ObjectIds referencing the `Skill` collection).
  - Seeded with 20 real-world tech job listings across full-stack, backend, DevOps, data science, and mobile domains.
- **Skill Compatibility Matching Engine (`jobService.js`)**:
  - Compares the learner's logged competencies (`UserSkill`) against `Job.requiredSkills`.
  - **Compatibility Formula**:
    $$\text{Match Percentage} = \left(\frac{\text{Matching Skills Count}}{\text{Total Required Skills}}\right) \times 100$$
  - Decomposes job requirements into:
    - `matchedSkills`: Skills the user possesses.
    - `missingSkills`: Skills the user lacks.
  - Enables sorting by match percentage, recent postings, and filtering by location, job type, company, and minimum match score.
- **Job Board UI (`Jobs.jsx`)**:
  - Searchable interface featuring job cards, employer logos, match percentage badges (color-coded: Green $\ge 80\%$, Amber $\ge 50\%$, Gray $< 50\%$), expandable skill requirement pills, and external apply links.
- **Career Market Trends (`CareerMarket.jsx`)**:
  - Provides a broad overview of salary percentiles, in-demand technical stacks, and market demand indicators. *(Note: Displays a clear "Sample Market Data" banner as noted in Current Limitations)*.

---

## 4. Frontend Files Involved
- `Frontend/src/pages/Jobs.jsx`: Primary job board displaying job cards, compatibility match meters, filter toolbars, and application buttons.
- `Frontend/src/pages/CareerMarket.jsx`: Career market overview showing compensation tiers and trending tech skills.
- `Frontend/src/services/api.js`: Exports `jobApi` (jobs listing, single job lookup, company endpoints).

---

## 5. Backend Files Involved
- `Backend/src/routes/jobRoutes.js`: REST endpoints for jobs and companies.
- `Backend/src/controllers/jobController.js`: Request handlers for job matching, job CRUD, and company management.
- `Backend/src/services/jobService.js`: Business logic calculating job skill matches, querying companies, and managing job postings.
- `Backend/src/models/Company.js`: Mongoose schema for employers.
- `Backend/src/models/Job.js`: Mongoose schema for job listings.
- `Backend/src/models/UserSkill.js`: Model queried to compare candidate skills.
- `Backend/src/models/Skill.js`: Model populated for skill names and categories.
- `Backend/src/seed/seedCatalog.js`: Seeds 10 companies and 20 job listings on boot.

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
