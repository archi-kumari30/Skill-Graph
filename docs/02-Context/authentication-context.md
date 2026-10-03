# SkillGraph: Authentication & Authorization Context

## 1. Module Name
**Authentication & Role-Based Access Control (RBAC) Module**

---

## 2. Purpose
The Authentication and Authorization module manages user identity verification, credential hashing, stateless JWT session issuance, user account registration, password updates, and role-based access control (RBAC). It guarantees secure resource boundaries between system superusers (`admin`), organizational managers (`manager`), and individual practitioners/students (`employee`).

---

## 3. Current Functionality
- **User Registration (`POST /api/auth/register`)**: Creates a user account with name, email, password, and optional fields (`department`, `accountRole`, `branch`, `college`, `yearOfStudy`). Passwords are automatically hashed via bcrypt.
- **User Login (`POST /api/auth/login`)**: Validates email and plaintext password against the stored bcrypt hash, generates a signed JWT token, and returns the token along with safe user metadata.
- **Session Identification (`GET /api/auth/me`)**: Resolves the user record from the decoded JWT payload and populates the linked `targetRoleId` details.
- **Profile Updates (`PUT /api/auth/me`)**: Allows users to update their profile attributes including `name`, `bio`, `department`, `targetRoleId`, `branch`, `college`, and `yearOfStudy`.
- **Password Updates (`PUT /api/auth/change-password`)**: Validates the current password before hashing and saving the replacement password.
- **Stateless Client Logout**: Performed client-side by clearing the JWT from `localStorage` and resetting React context state.
- **Role Enforcement**:
  - `admin`: Superuser role with full rights to delete users, roles, and skills, and trigger graph sync.
  - `manager`: Access to organizational team analytics (`/api/team/*`) and skill/role definitions.
  - `employee`: Standard role assigned to learners and students for managing their own skills, topic completions, and viewing personal recommendations.
- **Client Route Guards**:
  - `PrivateRoute`: Blocks unauthenticated visitors from protected pages and redirects them to `/login`.
  - `PublicRoute`: Prevents authenticated users from seeing `/login` or `/register`, redirecting them to `/dashboard`.
  - `RoleRoute`: Restricts page access (such as `/team` for managers/admins) based on `user.accountRole`, redirecting unauthorized users to `/dashboard`.

---

## 4. Frontend Files Involved
- `Frontend/src/context/AuthContext.jsx`: React Context provider holding `user`, `token`, `loading`, and dispatching `login`, `register`, `logout`, and `updateProfile`.
- `Frontend/src/pages/Login.jsx`: Login form with email/password inputs, validation, and error alert rendering.
- `Frontend/src/pages/Register.jsx`: Multi-field registration form capturing name, email, password, role, college, branch, and year of study.
- `Frontend/src/App.jsx`: Declares route guards (`PrivateRoute`, `PublicRoute`, `RoleRoute`) and application route definitions.
- `Frontend/src/services/api.js`: Axios client configuring request interceptors that attach `Authorization: Bearer <token>` and response interceptors redirecting on HTTP 401.
- `Frontend/src/layouts/DashboardLayout.jsx`: Displays user initial avatar badge, name, role indicator, and sign-out action button.

---

## 5. Backend Files Involved
- `Backend/src/routes/authRoutes.js`: Declares auth route endpoints and maps them to controller methods.
- `Backend/src/controllers/authController.js`: Extracts request parameters, delegates to `authService.js`, and structures HTTP responses.
- `Backend/src/services/authService.js`: Implements core authentication business logic, password verification, token signing, and profile updates.
- `Backend/src/middleware/authMiddleware.js`: Houses `authenticate` (JWT extraction & verification) and `authorize` (RBAC role verification) middlewares.
- `Backend/src/models/User.js`: Mongoose user schema defining field constraints, default values, and password selection rules.
- `Backend/src/config/config.js`: Centralizes `JWT_SECRET` and `JWT_EXPIRES_IN`.
- `Backend/src/utils/customErrors.js`: Supplies `UnauthorizedError`, `ConflictError`, `ValidationError`, and `ForbiddenError`.

---

## 6. APIs Involved
- `POST /api/auth/register`: Public endpoint registering a new user account.
  - Body: `{ name, email, password, department?, accountRole?, branch?, college?, yearOfStudy? }`
  - Response: `{ success: true, message: "Registration successful", data: { user, token } }`
- `POST /api/auth/login`: Public endpoint authenticating an existing user.
  - Body: `{ email, password }`
  - Response: `{ success: true, message: "Login successful", data: { user, token } }`
- `GET /api/auth/me`: Authenticated endpoint returning active session user profile with populated `targetRoleId`.
  - Header: `Authorization: Bearer <token>`
  - Response: `{ success: true, data: { user } }`
- `PUT /api/auth/me`: Authenticated endpoint updating user profile fields.
  - Header: `Authorization: Bearer <token>`
  - Body: `{ name?, bio?, department?, targetRoleId?, branch?, college?, yearOfStudy? }`
  - Response: `{ success: true, message: "Profile updated successfully", data: { user } }`
- `PUT /api/auth/change-password`: Authenticated endpoint to change password.
  - Header: `Authorization: Bearer <token>`
  - Body: `{ currentPassword, newPassword }`
  - Response: `{ success: true, message: "Password updated successfully" }`

---

## 7. Database Models Involved
- `User` (`Backend/src/models/User.js`):
  - Primary collection storing credentials and identity:
    - `name`, `email` (unique, lowercase), `password` (`select: false`), `accountRole` (`admin`, `manager`, `employee`), `targetRoleId` (references `Role`), `department`, `branch`, `college`, `yearOfStudy`, `bio`, `avatar`.
- `Role` (`Backend/src/models/Role.js`):
  - Populated when fetching user session via `targetRoleId`.

---

## 8. Authentication / Authorization
- **Token Mechanism**: Standard JSON Web Token (JWT) created via `jwt.sign({ id: user._id, role: user.accountRole }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })`.
- **Token Expiry**: Configured via `JWT_EXPIRES_IN` environment variable (defaults to `'24h'`).
- **Transport**: Transmitted via HTTP header `Authorization: Bearer <token>`.
- **Password Security**: Passwords are hashed using bcrypt with 12 salt rounds before persisting to MongoDB.
- **Credential Masking**: The `password` field in `User.js` is defined with `select: false`. It is never returned in standard queries unless explicitly requested via `.select('+password')` during login or password updates.
- **RBAC Enforcement**:
  - `authenticate` middleware verifies token presence and validity, attaching the populated Mongoose user document to `req.user`.
  - `authorize(...roles)` checks if `roles.includes(req.user.accountRole)`. If not, raises `ForbiddenError` (HTTP 403).

---

## 9. Dependencies
- `jsonwebtoken` (^9.0.2): Signs and verifies JWT tokens.
- `bcryptjs` (^2.4.3): Performs salt generation and password hashing.
- `express` (^4.19.2): Route handling and middleware integration.
- `react` (^18.2.0): State management for auth context.
- `react-router-dom` (^6.23.0): Route protection and redirection.
- `axios` (^1.6.8): HTTP requests with Authorization headers.

---

## 10. Current Workflow
1. **User Sign-Up / Sign-In**:
   - User inputs credentials on `Register.jsx` or `Login.jsx`.
   - `api.post('/auth/register')` or `api.post('/auth/login')` is called.
2. **Credential Processing**:
   - `authService.js` validates email uniqueness (registration) or matches bcrypt hash via `bcrypt.compare` (login).
   - Generates JWT containing `id` and `role`.
3. **Session Establishment**:
   - Frontend receives token and user object, stores token in `localStorage.setItem('skillgraph_token', token)`.
   - `AuthContext` updates its internal `user` state and configures Axios headers.
   - User is redirected to `/dashboard`.
4. **Subsequent API Requests**:
   - Axios request interceptor reads token from `localStorage` and attaches `Authorization: Bearer <token>`.
   - `authMiddleware.authenticate` decodes token and sets `req.user`.
   - If token is expired or invalid, server returns 401, triggering Axios response interceptor to remove token and redirect user to `/login`.

---

## 11. Current Limitations
- **Refresh Token Rotation**: Not currently implemented. Only a single access token is issued; when it expires, the user must log in again.
- **Server-Side Token Revocation / Blacklist**: Not currently implemented. Tokens cannot be invalidated on the server prior to expiration.
- **Email Verification**: Not currently implemented. Users can register with unverified email addresses without email confirmation links or OTPs.
- **Password Reset / "Forgot Password"**: Not currently implemented. No automated self-service password reset workflow exists; changes require knowing the current password.
- **Multi-Factor Authentication (MFA / 2FA)**: Not currently implemented.
- **Social / OAuth Login**: Not currently implemented. Third-party login (Google, GitHub, LinkedIn) is absent.
- **Session Limiting**: Not currently implemented. Multiple concurrent logins with the same credentials are not tracked or restricted.

---

## 12. Existing Validation
- **Required Fields**: Controller asserts presence of `email` and `password`.
- **Email Format**: Mongoose regex validation enforces standard email address patterns.
- **Password Length**: `User.js` model schema enforces a minimum of 6 characters (`minlength: 6`).
- **Email Uniqueness**: Enforced via Mongoose schema unique index and explicit pre-check in `authService.register`.
- **Target Role Validation**: In `updateProfile`, if `targetRoleId` is supplied, `authService.js` validates that the referenced `Role` exists in the database.

---

## 13. Existing Error Handling
- **Missing Credentials**: Throws `ValidationError` ("Email and password are required") -> HTTP 400.
- **Invalid Credentials**: Throws `UnauthorizedError` ("Invalid email or password") -> HTTP 401.
- **Duplicate Registration**: Throws `ConflictError` ("Email already registered") -> HTTP 409.
- **Missing Token**: Throws `UnauthorizedError` ("Authentication token required") -> HTTP 401.
- **Corrupted / Expired Token**: Trapped by `errorMiddleware.js`, mapping `JsonWebTokenError` and `TokenExpiredError` to HTTP 401 ("Invalid token" / "Token expired").
- **Unauthorized Role**: Throws `ForbiddenError` ("You do not have permission to perform this action") -> HTTP 403.
- **UI Error Feedback**: `Login.jsx` and `Register.jsx` catch API errors and display red banner notices with the server message.

---

## 14. Important Relationships with Other Modules
- **All Protected Modules**: Injects `req.user` into every authenticated request across Skills, Careers, Learning, Team, and AI modules.
- **Student Profile**: Powers `/api/users/profile` and `/api/auth/me` endpoints that populate academic background and target role.
- **Team Analysis**: Uses `accountRole` to restrict organizational skill matrices strictly to `manager` and `admin` accounts.
- **AI Assistant**: Supplies user identity, role, and target role to the AI prompt generation engine.
