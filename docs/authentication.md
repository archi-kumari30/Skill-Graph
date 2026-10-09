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
- **Cookie Security Attributes**:
  - `httpOnly: true` (prevents XSS exfiltration)
  - `secure: true` in production (enforces HTTPS)
  - `sameSite: 'none'` in production (enables cross-site cookie transmission between Vercel and Render)
  - `path: '/'`
  - `maxAge: 7 * 24 * 60 * 60 * 1000` (7 days)
- **Token Rotation & Compromise Detection**:
  - Upon successful refresh, the existing token is marked `revoked: true` and a new refresh token and access token pair are dispatched.
  - If a previously revoked refresh token is presented, the system detects potential token reuse and immediately invalidates *all* active refresh tokens for that user account (`AuthToken.updateMany({ userId }, { revoked: true })`).
- **Guest State Handling (HTTP 401)**:
  - If a client sends a request without a refresh cookie or body token (standard guest visitor), the endpoint responds with `HTTP 401 Unauthorized` and payload `{"success": false, "error": {"message": "Refresh token required"}}`.
  - This is an expected guest response and must not be treated as a fatal application crash or trigger infinite page reloads.

### POST /api/auth/logout
- Clears the refresh token cookie and invalidates session records in `AuthToken`.

---

## 5. Client-Side Lifecycle & Fast Guest Rendering

### Non-Blocking Guest Mounting
- `PublicRoute` checks if an existing session token is stored in `localStorage`.
- **Pure Guest Visitors**: For visitors without a stored token, `PublicRoute` mounts the public interface (`/login`, `/register`) **immediately (<100ms)** without blocking on a remote network roundtrip to Render.
- **Silent Cookie Recovery**: `AuthContext.initAuth()` executes in the background with a bounded 4000ms timeout.
  - If a valid session cookie exists from a previous login, the user and token state update silently and redirect the user to the role dashboard.
  - If no cookie exists (HTTP 401), the error is caught cleanly and the visitor remains on the login interface without disruptions.

### Request Timeouts
- Axios client configured with a global 15-second network timeout.
- Authentication silent refresh configured with a dedicated 4-to-6 second timeout to prevent UI freezes during network fluctuations or backend cold starts.
