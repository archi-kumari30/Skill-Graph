# Jobs & Recruitment Architecture

## 1. Overview
SkillGraph connects structured career tracks with market opportunities. Recruiters create job openings with skill prerequisites, and candidates are evaluated against those requirements using directed graph matching algorithms.

## 2. Recruiter Job Console
Recruiters access `/admin/jobs` where they can:
1. **Create Jobs**:
   - Title, Company Name, Location, Work Mode (`Remote`, `Onsite`, `Hybrid`), Employment Type, Experience Level, Compensation, Application Deadline.
   - **Structured Requirements**: Multi-skill builder configuring Skill name, Importance (`required`, `important`, `nice_to_have`), and Target Proficiency (1 to 5).
2. **Toggle Job Status**: One-click status switch between `Active` and `Closed`.
3. **Recruiter Ownership**: Every job created by a recruiter records `recruiterId: req.user._id`.
4. **Data Isolation**: Recruiters can only modify or view applicants for jobs where `recruiterId === req.user._id`.

## 3. Applicant Tracking System (ATS)
Accessible at `/admin/applicants`:
- **Job Filter**: Recruiters can view applicants across all their jobs or filter to a specific requisition.
- **Candidate Cards**: Displays candidate Name, Email, Phone, College/Branch, Key Skills, Match Compatibility Percentage, Application Date, Resume link, and Portfolio link.
- **Recruitment Stages**: Interactive stage dropdown allowing recruiters to advance applicants through:
  - `applied` &rarr; `reviewing` &rarr; `shortlisted` &rarr; `interview` &rarr; `offered` &rarr; `rejected`.
- Updates persist directly to MongoDB via `PUT /api/applications/:id/status`.
