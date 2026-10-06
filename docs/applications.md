# Job Application Workflow & Constraints

## 1. Candidate Application Flow
Students can browse job recommendations at `/jobs` and view detailed prerequisites at `/jobs/:id`.

### Application Modal (`JobDetail.jsx`)
Clicking "Apply" opens the application form:
- **Full Name** (pre-populated from profile, editable)
- **Email Address** (pre-populated, validated with `/^\S+@\S+\.\S+$/`)
- **Phone Number** (pre-populated if available)
- **Education Details** (degree, institution)
- **Resume URL** (required in production, must start with `http://` or `https://`)
- **Portfolio / GitHub URL** (optional)
- **Key Skills** (comma-separated tags)
- **Cover Note / Pitch** (candidate introduction)

## 2. Validation & Security Rules
Before saving the application:
1. **Empty Fields Check**: Full name, email, and resume URL must be non-empty.
2. **URL Validation**: `resumeUrl` and `portfolioUrl` must pass URL regex checks.
3. **Closed Job Check**: Jobs with `status: 'Closed'` reject submissions with `400 Bad Request` ("Applications are closed for this position").
4. **Duplicate Application Prevention**:
   - MongoDB compound unique index `{ userId: 1, jobId: 1 }`.
   - Pre-check in `jobService.applyForJob` returns `409 Conflict` ("You have already applied for this position").
5. **Score Snapshot**: The candidate's current graph compatibility score is computed and stored on the application record.

## 3. Student Application Tracker (`Applications.jsx`)
Students monitor submissions under `/applications`:
- Total submissions, In-Review, Interviewing, and Offers metrics.
- Status badge with color indicators (`applied`, `reviewing`, `shortlisted`, `interview`, `offered`, `rejected`).
- Direct links to view the job posting or build a targeted learning path for any missing requirements.
