# Authentication Specification

## 1. Overview
SkillGraph implements a secure, stateless JWT dual-token authentication system supporting exactly three distinct user roles:
1. `STUDENT`: Learners seeking skill analysis, guided paths, and job applications.
2. `RECRUITER`: Hiring managers and technical recruiters creating requisitions and reviewing matched applicants.
3. `ADMIN`: Single platform administrator managing taxonomy, security, and users.

## 2. Exactly 3 Login Options
The login interface provides dedicated role selectors and quick-fill demo buttons:
- **Student Login**:
  - Demo Account: `student@skillgraph.com` / `studentpassword`
  - Target Path: `/dashboard`
- **Recruiter Login**:
  - Demo Account: `recruiter@skillgraph.com` / `recruiterpassword`
  - Target Path: `/admin/jobs`
- **Admin Login**:
  - Demo Account: `admin@skillgraph.com` / `adminpassword`
  - Target Path: `/admin/skills`

> **Note on Deprecated / Redundant Roles:**
> Extraneous legacy roles (e.g. `Employer`, `Teacher`, `Mentor`, `Super Admin`) have been removed. Existing database fixtures use alias mapping (`employee` -> `student`, `manager` -> `recruiter`) to maintain backward compatibility.

## 3. Public Self-Registration
The registration portal strictly allows registration for only two roles:
- **Student**:
  - Fields: `name`, `email`, `password`, `college`, `branch`, `yearOfStudy`
  - Role Assigned: `student`
- **Recruiter**:
  - Fields: `name`, `email`, `password`, `company`, `department`, `phone`
  - Role Assigned: `recruiter`
- **Admin**:
  - **No Public Registration**: Admin accounts cannot be registered via UI or public endpoints.
  - Attempting to pass `accountRole: "admin"` in public registration returns `403 Forbidden` (`Admin accounts cannot be registered publicly`).
  - The Admin account is seeded via server startup (`seedCatalog.js`) or configured through environment variables.

## 4. Endpoints & Payloads

### POST /api/auth/register
- **Request Format**:
  ```json
  {
    "name": "Alex Student",
    "email": "alex@skillgraph.com",
    "password": "Password123",
    "accountRole": "student",
    "college": "National Institute of Technology",
    "branch": "Computer Science",
    "yearOfStudy": "3rd Year"
  }
  ```
- **Response Format (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "data": {
      "user": {
        "_id": "6ac3a5e...",
        "name": "Alex Student",
        "email": "alex@skillgraph.com",
        "accountRole": "student",
        "college": "National Institute of Technology",
        "branch": "Computer Science",
        "yearOfStudy": "3rd Year"
      },
      "token": "eyJhbGciOi...",
      "accessToken": "eyJhbGciOi..."
    }
  }
  ```

### POST /api/auth/login
- **Request Format**:
  ```json
  {
    "email": "student@skillgraph.com",
    "password": "studentpassword"
  }
  ```
- **Response Format (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "_id": "6ac3a...",
        "name": "Alex Student",
        "email": "student@skillgraph.com",
        "accountRole": "student"
      },
      "token": "eyJhbGciOi...",
      "accessToken": "eyJhbGciOi..."
    }
  }
  ```

### POST /api/auth/refresh
- Uses HTTP-only cookie `skillgraph_rf` or request body `refreshToken` to rotate tokens.

### POST /api/auth/logout
- Clears the refresh token cookie and invalidates session records in `AuthToken`.
