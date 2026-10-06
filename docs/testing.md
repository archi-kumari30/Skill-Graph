# Testing & Verification Guide

## 1. Automated Test Suite Structure
The platform includes 15 integration and unit test suites:

| Suite | Focus Areas | Tests | Status |
|---|---|---|---|
| `tests/auth.test.js` | Dual-token auth, session cookies, RBAC, password recovery | 20 | PASS |
| `tests/skillsGraph.test.js` | Directed DAG cycle detection, multi-hop cycles, cascading deletes | 9 | PASS |
| `tests/jobPrerequisitesAndLearningPath.test.js` | Recruiter RBAC, blocked prerequisite chains, duplicate apply rejection | 10 | PASS |
| `tests/learningTopics.test.js` | Chapter topics, milestone progression, points calculation | 11 | PASS |
| `tests/assessmentAndEvidence.test.js` | Skill quizzes, project proof, study activity streaks | 9 | PASS |
| `tests/aiAssistant.test.js` | Grounded chat, SSE streaming, chat history isolation | 9 | PASS |
| `tests/studentProfile.test.js` | Academic fields, skill proof verification pipeline | 11 | PASS |
| `tests/teamAnalysis.test.js` | Department cohorts, readiness simulation, skill leads | 9 | PASS |
| `tests/api.test.js` | Core endpoints, security boundaries, status responses | 14 | PASS |
| `tests/validation.test.js` | Schema validation rules and regex enforcement | 6 | PASS |
| `tests/careerReadiness.test.js` | Readiness scoring formulas and gap analysis | 7 | PASS |
| `tests/config.test.js` | Environment configuration integrity | 3 | PASS |
| `tests/database.test.js` | Mongoose schema indices and lifecycle hooks | 10 | PASS |
| `tests/securityAudit.test.js` | Rate limiting, header security, NoSQL sanitization | 8 | PASS |
| `tests/jobMatching.test.js` | Job compatibility rankings and requirements weighting | 8 | PASS |

## 2. Running Backend Tests
Execute within `Backend` directory:
```bash
cmd /c npm test
```
Or run individual test files:
```bash
cmd /c npx jest tests/jobPrerequisitesAndLearningPath.test.js
cmd /c npx jest tests/auth.test.js
cmd /c npx jest tests/learningTopics.test.js
cmd /c npx jest tests/assessmentAndEvidence.test.js
```

## 3. End-to-End Verification Checklist

### Role 1: Student
1. Sign in via Student tab (`student@skillgraph.com` / `studentpassword`).
2. Visit `/dashboard` &mdash; verify readiness score, streak, and command center.
3. Visit `/progress` &mdash; observe chapters and prerequisite-locked topics.
4. Click "Practice & Read", complete a topic, and observe points increase (+20).
5. Visit `/jobs` &mdash; open a job detail (`/jobs/:id`).
6. Click "Apply Now", fill details (name, email, phone, resume link, skills), submit.
7. Observe button transitions to "Already Applied (Applied)".
8. Visit `/applications` &mdash; verify the job appears with status badge.

### Role 2: Recruiter
1. Sign in via Recruiter tab (`recruiter@skillgraph.com` / `recruiterpassword`).
2. Visit `/admin/jobs` &mdash; verify existing jobs, click "Create Job", fill form and skills.
3. Toggle a job between Active and Closed.
4. Visit `/admin/applicants` &mdash; see applicants submitted for recruiter's jobs.
5. Change applicant stage from "Applied" to "Shortlisted" &rarr; verify toast and persistence.

### Role 3: Admin
1. Sign in via Admin tab (`admin@skillgraph.com` / `adminpassword`).
2. Visit `/admin/skills` &mdash; view taxonomy, add skill or edge.
3. Verify public registration blocks admin creation (`403 Forbidden`).
