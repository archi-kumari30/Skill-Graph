# SkillGraph Implementation Plan: Module 03 — Authentication & RBAC

## 1. Module
**03 — Authentication, Dual-Token Session Management & 4-Tier RBAC**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me`, `PUT /api/auth/change-password`.
  - Single access token issued with 24-hour expiration, stored in browser `localStorage`.
  - 3-tier RBAC (`admin`, `manager`, `employee`).
  - Passwords hashed with bcrypt (12 rounds), `password` field set to `select: false`.
  - Route guards: `PrivateRoute`, `PublicRoute`, `RoleRoute`.
- **TO BE IMPLEMENTED**:
  - Dual-token session management: short-lived access token (15 minutes) + cryptographically secure HTTP-only refresh token (7 days).
  - Token rotation and revocation tracking via `AuthToken` collection in MongoDB.
  - Automated silent refresh via Axios interceptor on the frontend.
  - Self-service password recovery flow (`forgot-password` and `reset-password/:token`).
  - Formalization of `'student'` role in registration, authorization checks, and frontend UI.

---

## 3. Objective
Upgrade authentication security to production standards by implementing refresh token rotation, cookie-based session security, automated password recovery, and expanding the RBAC model to formally recognize students distinct from enterprise employees.

---

## 4. Existing Files
- `Backend/src/routes/authRoutes.js`: Auth endpoints.
- `Backend/src/controllers/authController.js`: Auth controller.
- `Backend/src/services/authService.js`: Business logic and token signing.
- `Backend/src/middleware/authMiddleware.js`: `authenticate` and `authorize` middlewares.
- `Backend/src/models/User.js`: User model.
- `Frontend/src/context/AuthContext.jsx`: React auth context.
- `Frontend/src/services/api.js`: Axios client and interceptors.
- `Frontend/src/pages/Login.jsx`: Login screen.
- `Frontend/src/pages/Register.jsx`: Registration screen.
- `Frontend/src/App.jsx`: Route guards.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - `Backend/src/routes/authRoutes.js`: Add `/refresh`, `/forgot-password`, `/reset-password/:token`, `/logout`.
  - `Backend/src/controllers/authController.js`: Add handlers for refresh, forgotPassword, resetPassword, and secure logout.
  - `Backend/src/services/authService.js`: Issue short-lived access token + long-lived refresh token; implement `refreshTokenRotation()`, `generatePasswordResetToken()`, `resetPasswordWithToken()`.
  - `Backend/src/middleware/authMiddleware.js`: Update `authorize` to accommodate `'student'` and allow student/employee parity for shared features.
  - `Frontend/src/services/api.js`: Add 401 response interceptor with token queuing to automatically invoke `/api/auth/refresh` and replay failed requests.
  - `Frontend/src/context/AuthContext.jsx`: Store access token in memory with fallback to silent refresh on page reload; expose `forgotPassword()` and `resetPassword()`.
  - `Frontend/src/pages/Register.jsx`: Add Role selector allowing users to choose "Student / Academic Learner" or "Professional Engineer".
  - `Frontend/src/pages/Login.jsx`: Add "Forgot Password?" trigger modal.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: `User` collection.
- **TO BE IMPLEMENTED**:
  - `AuthToken` collection (defined in Module 02) used to store hashed refresh tokens.
  - `User` schema: `resetPasswordToken: String`, `resetPasswordExpires: Date`.
  - `User.accountRole`: `enum: ['admin', 'manager', 'employee', 'student']`.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: Signs single JWT via `jwt.sign({ id, role }, secret)`.
- **TO BE IMPLEMENTED**:
  - In `authService.js`:
    - `generateTokens(user)`: Returns `{ accessToken, refreshToken }`. Access token expires in 15m; refresh token is a 64-byte random hex string.
    - Hashes refresh token with SHA-256 before saving to `AuthToken` collection.
    - Sets refresh token into an `httpOnly`, `secure` (in production), `sameSite: 'strict'` cookie named `skillgraph_rf`.
    - `rotateRefreshToken(oldToken, ip, userAgent)`: Verifies hash in database, invalidates old token, issues new pair (Re-use detection: if an already-revoked token is presented, revoke all sessions for that user as a compromise mitigation).
    - `forgotPassword(email)`: Generates crypto random token, hashes it, stores in user record with 1-hour expiry, logs reset URL.
    - `resetPassword(token, newPassword)`: Hashes input token, matches against unexpired user, updates password hash, clears reset fields.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/change-password`.
- **TO BE IMPLEMENTED**:
  - `POST /api/auth/refresh`: Reads `skillgraph_rf` cookie, rotates token, returns `{ accessToken, user }`.
  - `POST /api/auth/logout`: Revokes refresh token in `AuthToken` collection, clears `skillgraph_rf` cookie.
  - `POST /api/auth/forgot-password`: Body `{ email }`. Returns `{ success: true, message: "If an account exists, a reset link has been dispatched." }`.
  - `POST /api/auth/reset-password/:token`: Body `{ password }`. Resets password and revokes existing sessions.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: Token saved in `localStorage`.
- **TO BE IMPLEMENTED**:
  - In `Frontend/src/services/api.js`:
    - Track `isRefreshing` state and `failedQueue`.
    - On HTTP 401 error, if not already refreshing, call `POST /api/auth/refresh` with `withCredentials: true`.
    - Once refreshed, update Authorization header and replay failed queued requests seamlessly.
  - In `Frontend/src/pages/Register.jsx`:
    - Role picker card: "Student / Academic Learner" (`student`) vs "Industry Engineer" (`employee`).
  - In `Frontend/src/pages/Login.jsx`:
    - "Forgot Password" modal triggering `authApi.forgotPassword`.
  - Create `Frontend/src/pages/ResetPassword.jsx`:
    - Dedicated view parsing token from route URL and accepting new password.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Coarse role checks.
- **TO BE IMPLEMENTED**:
  - Route permissions:
    - `student` and `employee`: Access personal skills, recommendations, job matches, AI coach, learning checklists.
    - `manager` and `admin`: Access team analytics (`/api/team/*`), catalog management.
    - `admin`: User administration, graph synchronization.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: Basic controller checks.
- **TO BE IMPLEMENTED**:
  - Password strength validation: minimum 8 characters, at least one letter and one number.
  - Refresh token cookie validation: rejection if cookie is missing or malformed.
  - Reset token validation: length and expiry check.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: `errorMiddleware.js`.
- **TO BE IMPLEMENTED**:
  - Invalid refresh token returns HTTP 401 with code `'TOKEN_REVOKED'`, prompting frontend to clear state and redirect to `/login`.
  - Expired reset token returns HTTP 400 ("Password reset token has expired or is invalid").

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: Basic login test in `Backend/tests/api.test.js`.
- **TO BE IMPLEMENTED**:
  - Integration tests in `Backend/tests/auth.test.js`:
    - Test 1: User registration with role `'student'` succeeds and assigns academic fields.
    - Test 2: Login returns 15m access token in JSON and sets `skillgraph_rf` HTTP-only cookie.
    - Test 3: Calling `/api/auth/refresh` rotates refresh token and returns new access token.
    - Test 4: Token re-use detection revokes all user sessions when an old token is presented.
    - Test 5: Forgot password generates valid reset token; invalid/expired token is rejected.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: `jsonwebtoken`, `bcryptjs`.
- **TO BE IMPLEMENTED**: `cookie-parser` (installed in Module 01), native Node `crypto` module.

---

## 15. Implementation Order
1. Update `User.js` schema with reset token fields and `'student'` role.
2. Implement token rotation logic in `authService.js`.
3. Add `/refresh`, `/forgot-password`, `/reset-password/:token`, and `/logout` in `authController.js` and `authRoutes.js`.
4. Update `api.js` Axios interceptors on frontend to support silent refresh.
5. Add role selection to `Register.jsx` and forgot-password modal to `Login.jsx`.
6. Run `auth.test.js` test suite.

---

## 16. Acceptance Criteria
- **AC-01**: Access token expires after 15 minutes; active browser session continues uninterrupted due to transparent silent refresh.
- **AC-02**: Stolen/reused refresh token triggers automatic invalidation of all sessions for that user.
- **AC-03**: A user can register explicitly as a Student, receiving the `'student'` role.
- **AC-04**: A user can complete the password reset flow using a valid reset token.

---

## 17. Risks
- **Risk 1 (CORS Cookie Blocking)**: Cross-origin cookies blocked if Vite frontend runs on `localhost:5173` and backend runs on `localhost:5000`.
  - *Mitigation*: Ensure `cors()` sets `credentials: true` and `origin: 'http://localhost:5173'`. In development, configure `sameSite: 'lax'`.
- **Risk 2 (Refresh Loop Lockout)**: If `/refresh` itself fails with 401, it must not trigger an infinite refresh loop.
  - *Mitigation*: Interceptor must explicitly bypass the refresh pipeline if the failing request is itself `/api/auth/refresh`.

---

## 18. Rollback Considerations
- If cookie parsing causes client session issues in development, retain the legacy Authorization header fallback while diagnosing.
- The `User.accountRole` enum maintains backward compatibility with existing accounts.
