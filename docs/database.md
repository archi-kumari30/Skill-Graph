# Database Schema & Models

## 1. Overview
SkillGraph uses MongoDB with Mongoose ODM schemas. Indexes are created for fast lookups on relationships, ownership, and unique compound constraints.

---

## 2. Core Entities

### User (`Backend/src/models/User.js`)
Stores authenticated user accounts.
- `name` (String, required): Full candidate or recruiter name.
- `email` (String, required, unique, lowercase, trimmed).
- `password` (String, required, minlength: 6, bcrypt hashed pre-save).
- `accountRole` (String, enum: `['student', 'recruiter', 'admin', 'employee', 'manager']`, default: `student`).
- `isActive` (Boolean, default: `true`): Deactivation flag for administrative control.
- `company` (String): Corporate organization name for recruiter accounts.
- `phone` (String): Contact phone number.
- `department` (String): Organizational department.
- `college` (String): Student's academic institution.
- `branch` (String): Academic engineering discipline.
- `yearOfStudy` (String): Academic year (e.g. `3rd Year`).
- `targetRoleId` (ObjectId, ref: `Role`): Selected career path goal.

### Job (`Backend/src/models/Job.js`)
Job requisitions created by recruiters.
- `recruiterId` (ObjectId, ref: `User`, index: true): Owner recruiter for data isolation.
- `companyId` (ObjectId, ref: `Company`).
- `companyName` (String).
- `title` (String, required).
- `description` (String, required).
- `location` (String, required).
- `workMode` (String, enum: `['Remote', 'Onsite', 'Hybrid']`, default: `Hybrid`).
- `employmentType` (String, default: `Full-time`).
- `experience` (String): Experience expectation.
- `salary` (String): Compensation range.
- `deadline` (Date): Application close deadline.
- `openings` (Number, default: 1).
- `status` (String, enum: `['Active', 'Closed', 'Draft', 'Archived']`, default: `Active`).
- `requirements` (Array):
  - `skillId` (ObjectId, ref: `Skill`, required).
  - `expectedProficiency` / `requiredProficiency` (Number, min: 1, max: 5, default: 3).
  - `importance` (enum: `['required', 'important', 'nice_to_have']`, default: `required`).

### JobApplication (`Backend/src/models/JobApplication.js`)
Student applications for job positions.
- `userId` / `studentId` (ObjectId, ref: `User`, required, indexed).
- `jobId` (ObjectId, ref: `Job`, required, indexed).
- `recruiterId` (ObjectId, ref: `User`, indexed): Bound to job's owner for fast recruiter queries.
- `fullName` (String, trimmed): Applicant's full legal name.
- `email` (String, trimmed): Contact email.
- `phone` (String, trimmed): Contact telephone.
- `education` (String, trimmed): Highest degree and institution.
- `resumeUrl` (String, trimmed): Cloud link or document URL.
- `portfolioUrl` (String, trimmed): GitHub or portfolio URL.
- `skills` ([String]): Array of declared key skills.
- `coverLetter` (String, trimmed): Candidate introduction pitch.
- `matchScore` (Number, default: 0): Snapshot compatibility score at time of submission.
- `status` (String, enum: `['applied', 'screening', 'reviewing', 'shortlisted', 'interview', 'interviewing', 'offered', 'rejected', 'withdrawn']`, default: `applied`).
- `appliedAt` (Date, default: Date.now).
- **Index**: Compound unique `{ userId: 1, jobId: 1 }` prevents duplicate submissions.

### Skill & SkillRelationship (`Backend/src/models/Skill.js`, `SkillRelationship.js`)
- Skills store metadata (`name`, `category`, `aliases`).
- Relationships form the DAG edge: `sourceSkillId`, `targetSkillId`, `relationshipType` (`prerequisite`, `related`, `specialization`), `strength`.
- Directed cycle detection ensures no prerequisite loops.

### Topic & UserTopicProgress (`Backend/src/models/Topic.js`, `UserTopicProgress.js`)
- Topics store chapter units under skills with sequential ordering and prerequisite topic pointers.
- `UserTopicProgress` persists topic completion status per user, calculating learning points and recalculating graph readiness.
