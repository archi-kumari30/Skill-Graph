# API Reference Specification

## 1. Base URL
In development: `http://localhost:5000/api`
Health check: `GET /health` or `GET /api/health`
OpenAPI Documentation: `GET /api/docs`

---

## 2. Authentication API (`/api/auth`)

### `POST /api/auth/register`
Creates a new `student` or `recruiter` account. Public registration of `admin` is blocked with 403.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123",
    "accountRole": "student",
    "college": "State Tech Institute",
    "branch": "Computer Science",
    "yearOfStudy": "3rd Year"
  }
  ```
- **Response**: `201 Created` with `{ success: true, data: { user, token, accessToken } }`

### `POST /api/auth/login`
Authenticates a user with email and password.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123"
  }
  ```
- **Response**: `200 OK` with user payload and access token.

---

## 3. Jobs & Recruitment API (`/api/jobs`)

### `GET /api/jobs`
List all active job postings. Supports filters: `search`, `status`, `location`, `workMode`.
- **Response**: `200 OK` with `{ success: true, data: { jobs: [...] } }`

### `POST /api/jobs` (Protected: `recruiter`, `admin`)
Creates a job position with structured requirements. Automatically binds `recruiterId = req.user._id`.
- **Request Body**:
  ```json
  {
    "title": "Full Stack Engineer",
    "companyName": "TechCorp",
    "location": "Bengaluru, India",
    "workMode": "Hybrid",
    "jobType": "Full-time",
    "experience": "1-3 years",
    "salary": "12-16 LPA",
    "requirements": [
      { "skillId": "6ac...", "importance": "required", "expectedProficiency": 4 }
    ]
  }
  ```
- **Response**: `201 Created` with created job document.

### `PUT /api/jobs/:id` & `PATCH /api/jobs/:id/status` (Protected: Owner Recruiter, Admin)
Updates job requirements or toggles status between `Active` and `Closed`.

### `POST /api/jobs/:id/apply` (Protected: `student`)
Submits a job application with applicant metadata.
- **Validation**:
  - `resumeUrl`: Valid HTTP/HTTPS URL (required in non-test environment).
  - `email`: Valid email format.
  - Duplicate check: Returns `409 Conflict` if user has already applied.
  - Closed job check: Returns `400 Bad Request` if job status is Closed.
- **Request Body**:
  ```json
  {
    "fullName": "Alex Rivera",
    "email": "alex@example.com",
    "phone": "+1 555-0199",
    "education": "B.Tech Computer Science",
    "resumeUrl": "https://drive.google.com/resume.pdf",
    "portfolioUrl": "https://github.com/alexrivera",
    "skills": ["JavaScript", "React", "Node.js"],
    "coverLetter": "Experienced frontend engineer ready to contribute."
  }
  ```
- **Response**: `201 Created` with `{ success: true, data: { application } }`

---

## 4. Application Management API (`/api/applications`)

### `GET /api/applications/my` (Protected: `student`)
Returns all job applications submitted by the logged-in student.

### `GET /api/applications` (Protected: `recruiter`, `admin`)
Lists applicants. If caller is recruiter, filtered to jobs owned by that recruiter. If admin, returns all applications.
- **Query Parameters**: `jobId`, `status`.

### `PUT /api/applications/:id/status` (Protected: Owner Recruiter, Admin)
Updates recruitment stage (`applied`, `reviewing`, `shortlisted`, `interview`, `offered`, `rejected`).
- **Request Body**:
  ```json
  {
    "status": "shortlisted"
  }
  ```

---

## 5. Guided Learning & Topic Progress API (`/api/learning`)

### `GET /api/learning/topics/progress` (Protected: `student`)
Returns the student's list of completed topics across all skills.

### `POST /api/learning/topics/complete` (Protected: `student`)
Records topic completion or uncompletes a topic.
- **Request Body**:
  ```json
  {
    "skillId": "6ac...",
    "topicTitle": "HTML Document Structure & Tags",
    "completed": true
  }
  ```
- **Response**: `200 OK` with updated progress and recalibrated readiness points.

---

## 6. AI Career Assistant API (`/api/ai`)

### `GET /api/ai/status`
Reports configuration status of the AI provider (`{ success: true, data: { configured: true | false } }`).

### `POST /api/ai/career-assistant` (Protected)
Processes user query against student skill graph profile and returns career recommendations.

### `POST /api/ai/chat` (Protected)
Full conversational endpoint with grounded memory and fallback advisory.

---

## 7. Admin Platform Governance API (`/api/admin`)

### `GET /api/admin/stats` (Protected: `admin`)
High-level system metrics across students, recruiters, jobs, and recruitment applications.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "totalStudents": 142,
      "totalRecruiters": 18,
      "totalAdmins": 1,
      "totalJobs": 24,
      "activeJobs": 19,
      "totalApplications": 89,
      "applicationStatusMap": { "applied": 45, "shortlisted": 12, "interview": 8, "offered": 4, "rejected": 20 },
      "recentUsers": [...],
      "recentApplications": [...]
    }
  }
  ```

### `GET /api/admin/students` (Protected: `admin`)
Full searchable directory of enrolled learners with readiness %, total/verified skills counts, and application volumes.

### `GET /api/admin/students/:id` (Protected: `admin`)
Deep-dive inspection modal data: candidate details, demonstrated skills, verified badges, application history, and daily activities.

### `GET /api/admin/recruiters` (Protected: `admin`)
Talent acquisition directory with active jobs, total listings, and applicant traffic received.

### `PATCH /api/admin/users/:id/status` (Protected: `admin`)
Toggles account activation (`{ "isActive": true | false }`). Admin cannot deactivate themselves.

---

## 8. Recruiter Dashboard & ATS API (`/api/dashboard/recruiter`)

### `GET /api/dashboard/recruiter` (Protected: `recruiter`, `admin`, `manager`)
Returns recruiter's personal dashboard metrics:
- Active jobs count vs total listings
- Total applicants across owned jobs
- Funnel breakdown: `applied`, `reviewing`, `shortlisted`, `interview`, `offered`, `rejected`
- Recent candidate submissions with match scores
- Recruiter's job list with applicant counts per position

---

## 9. Interview Preparation API (`/api/interview-prep`)

### `GET /api/interview-prep` (Protected: `student`)
Retrieves technical interview question bank. Supports filters: `domain`, `technology`, `difficulty`, `search`.
- Attaches authenticated user's `isMastered` flag per question.
- Returns overall mastery stats: `{ totalQuestions, masteredCount, masteryPercentage }`.

### `POST /api/interview-prep/:id/toggle-mastered` (Protected: `student`)
Toggles mastery status for a question. Automatically logs a `DailyActivity` event of type `interview_prep` when marked as mastered.

