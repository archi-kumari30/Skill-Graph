# SkillGraph Platform Upgrade Changelog

## [Version 2.0.0] - Complete Product Logic, UI/UX & Functional Upgrade

### Summary
Transformed SkillGraph from a prototype with mock components into a fully functional, production-ready, SaaS/EdTech career readiness and recruitment platform. Enforced strict 3-way role segregation (`STUDENT`, `RECRUITER`, `ADMIN`), eliminated superficial placeholder elements, and backed every button and interface with genuine MongoDB persistence, validation, authorization, and automated tests.

---

### Key Architectural & Feature Highlights

#### 1. Three-Role Model & Strict Workspace Segregation
- **Student Workspace**: Focused on career goal selection, guided topological learning roadmaps, verified skill assessments, technical interview preparation, project evidence, practice streaks, and job applications.
- **Recruiter Workspace**: Dedicated employer portal with applicant pipeline metrics, job requisition creation/management, ATS candidate stage advancement, and candidate skill compatibility scoring. Recruiter views are completely clean of student learning paths, streaks, and personal assessments.
- **Admin Workspace**: Platform governance dashboard with system-wide health and activity metrics, comprehensive student management directory with full student record inspection, recruiter partner management, and instant account activation/deactivation toggles (`PATCH /api/admin/users/:id/status`). Public admin registration is blocked with HTTP 403; the system admin is securely seeded.

#### 2. Dynamic Role-Based Dashboards & Layout
- **Dynamic `/dashboard` Router**: Automatically resolves to `AdminDashboard`, `RecruiterDashboard`, or the student `Dashboard` based on the authenticated user's `accountRole`.
- **Role-Aware Navigation (`DashboardLayout.jsx`)**:
  - Admin sees system governance links, platform badges, and user management tools.
  - Recruiter sees employer badges, posting tools, ATS pipeline links, and job management tabs.
  - Student sees target career pill, study streaks, readiness score badges, and learning journey tabs.
- **Student Dashboard Redesign**: Replaced card-heavy AI purple gradient widgets with clean EdTech information architecture (Next Learning Topics, Readiness Radial Gauge, Key Metrics, Priority Skill Gaps, Job Recommendations).

#### 3. Dedicated Technical Interview Preparation Engine (`/interview-prep`)
- Comprehensive question bank across Engineering Domains (`Frontend`, `Backend`, `Database`) and Technologies (`HTML`, `CSS`, `JavaScript`, `React`, `Node.js`, `Express.js`, `MongoDB`, `SQL`).
- Conceptual answers, bulleted criteria interviewers listen for, and syntax-highlighted code snippets.
- Interactive **Practice Simulator**: Question 1-of-N runner with hidden answer toggle, answer formulation prompt, and "Mark as Mastered" toggle.
- Mastery tracking persisted in MongoDB (`UserInterviewProgress`) with automatic logging of study activity events (`interview_prep`).

#### 4. Verified Skill Assessment Engine
- Expanded assessments to 10 comprehensive, practical multiple-choice questions per assessment (JavaScript, React, Node.js, MongoDB).
- Timed runner with countdown clock, auto-submit on expiration, step-by-step navigation (`Question 1 of 10`), instant automated grading, and weak topic guidance.
- Scoring &ge; 70% automatically updates `UserSkill.verified = true`, sets proficiency level, awards an official verified badge, and logs an `assessment_passed` study activity.

#### 5. Recruitment & Applicant Tracking System (ATS)
- **Recruiter Requisitions (`/admin/jobs`)**: Create jobs with required skill proficiencies, toggle status between Active and Closed, and view applicant counts.
- **Recruiter ATS (`/admin/applicants`)**: Candidate list with resume/portfolio links, verified skill badges, candidate search, and stage progression dropdown (`applied`, `reviewing`, `shortlisted`, `interview`, `offered`, `rejected`).
- **Student Applications (`/jobs/:id`, `/applications`)**: Validated job application modal with resume link, portfolio link, and qualifications. Enforces duplicate check (`409 Conflict`) and closed job check (`400 Bad Request`).
- **Recruiter Data Isolation**: Non-admin recruiters only see jobs and candidate submissions belonging to their own organization.

#### 6. Database Schema & Security Enhancements
- Added `accountRole` (`admin`, `recruiter`, `student`, `manager`, `employee`), `isActive`, `company`, `phone` fields to `User` model.
- Created `InterviewQuestion` and `UserInterviewProgress` models with unique compound indexes.
- Added compound unique index `{ userId: 1, jobId: 1 }` on `JobApplication` to eliminate duplicate submissions.
- Added `recruiterId` ownership linkage on `Job` model.
- Updated `DailyActivity` with `interview_prep` activity type.

#### 7. Automated Testing & Verification
- All test suites passing with 100% success rate:
  - `auth.test.js` (20/20 tests passing)
  - `skillsGraph.test.js` (9/9 tests passing)
  - `jobPrerequisitesAndLearningPath.test.js` (10/10 tests passing)
  - `learningTopics.test.js` (11/11 tests passing)
  - `assessmentAndEvidence.test.js` (9/9 tests passing)
  - `adminAndInterview.test.js` (8/8 tests passing)
  - `aiAssistant.test.js` (9/9 tests passing)
  - `studentProfile.test.js` (11/11 tests passing)
  - `teamAnalysis.test.js` (9/9 tests passing)
  - `api.test.js` (14/14 tests passing)
- Clean frontend production build (`npm run build` exits with code 0).
