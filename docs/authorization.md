# Role-Based Access Control (RBAC) & Authorization

## 1. Role Definitions
The platform enforces role-based access control based on user `accountRole`:

| Role | Definition | Capabilities |
|---|---|---|
| `STUDENT` | Standard learner account | Can manage personal profile and skills, access learning roadmap, complete topics, submit projects/assessments, browse jobs, and apply to jobs. |
| `RECRUITER` | Hiring manager / corporate recruiter | Can post and edit job requisitions, define required skills/proficiencies, view applicants **only for their own jobs**, and update candidate application statuses. |
| `ADMIN` | System administrator | Can manage platform catalog, modify skill graph relationships, view global platform statistics, deactivate/delete accounts, and view all applicants across all jobs. |

## 2. Recruiter Data Isolation & Ownership
Recruiters must never view applicants or modify jobs belonging to other recruiters. This is strictly enforced in `Backend/src/services/jobService.js`:

```javascript
// Data isolation in getAllApplications
if (actorUser && actorUser.accountRole !== 'admin') {
  const recruiterJobs = await Job.find({ recruiterId: actorUser._id }, '_id');
  const jobIds = recruiterJobs.map(j => j._id);
  query.$or = [
    { recruiterId: actorUser._id },
    { jobId: { $in: jobIds } }
  ];
}
```

Similarly, updating candidate status (`updateApplicationStatus`) checks:
```javascript
if (actorUser && actorUser.accountRole !== 'admin') {
  const applicationJob = await Job.findById(application.jobId);
  const isOwner = applicationJob && applicationJob.recruiterId &&
    applicationJob.recruiterId.toString() === actorUser._id.toString();
  if (!isOwner) {
    throw new ForbiddenError('You can only update candidates for your own job postings');
  }
}
```

## 3. Account Deactivation Guard
Admins can deactivate users via `isActive: false`.
The `protect` middleware immediately invalidates sessions for deactivated users:
```javascript
if (currentUser.isActive === false) {
  return next(new ForbiddenError('Your account has been deactivated. Please contact the administrator.'));
}
```
Attempting to log into a deactivated account returns `403 Forbidden`.

## 4. Protected Route Matrices

| Endpoint | Method | Allowed Roles | Description |
|---|---|---|---|
| `/api/jobs` | GET | All authenticated | List active job postings |
| `/api/jobs` | POST | `recruiter`, `admin` | Create new job posting |
| `/api/jobs/:id` | PUT / PATCH | `recruiter` (owner), `admin` | Update job posting |
| `/api/jobs/:id` | DELETE | `recruiter` (owner), `admin` | Remove job posting |
| `/api/jobs/:id/apply` | POST | `student` | Submit job application |
| `/api/applications/my` | GET | `student` | View current user's job applications |
| `/api/applications` | GET | `recruiter`, `admin` | List applicants (isolated to recruiter's jobs) |
| `/api/applications/:id/status`| PUT | `recruiter` (owner), `admin` | Advance candidate stage |
| `/api/skills` | POST | `admin` | Create taxonomy skill |
| `/api/skills/relationships` | POST | `admin` | Create graph relationship edge |
| `/api/learning/topics/complete`| POST | `student` | Record topic completion |
