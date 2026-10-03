# SkillGraph Implementation Plan: Module 01 — Project Setup & Environment

## 1. Module
**01 — Project Environment, Dependencies & Configuration Pipeline**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - `Backend/package.json` contains dependencies: `bcryptjs`, `cors`, `dotenv`, `express`, `express-rate-limit`, `helmet`, `jsonwebtoken`, `mongoose`, `morgan`, `neo4j-driver`.
  - `Frontend/package.json` contains: `react`, `react-dom`, `react-router-dom`, `axios`, `lucide-react`, `recharts`, `tailwindcss`, `vite`.
  - `Backend/src/config/config.js` loads environment variables via `dotenv` with fallback strings.
  - `Backend/src/app.js` initializes `helmet()`, `cors()`, `express.json()`, and `morgan('dev')`.
- **TO BE IMPLEMENTED**:
  - Installation of critical production packages: `cookie-parser` (for secure refresh tokens), `express-mongo-sanitize` (for NoSQL injection defense), `@google/genai` (official Gemini SDK), and `swagger-ui-express` + `swagger-jsdoc` (OpenAPI documentation).
  - Installation of UI toast notifications in frontend: `react-hot-toast`.
  - Strict environment variable schema validation preventing server startup when critical security parameters are omitted.

---

## 3. Objective
Upgrade the underlying runtime foundation by installing required dependencies, configuring security middleware (cookie parsing, request sanitization), establishing environment schema validation, and providing non-breaking defaults for local development.

---

## 4. Existing Files
- `Backend/package.json`: Backend dependencies.
- `Frontend/package.json`: Frontend dependencies.
- `Backend/src/config/config.js`: Central configuration file.
- `Backend/src/app.js`: Express application configuration.
- `Backend/src/server.js`: Server entry point.
- `Backend/.env.example`: Environment template.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - `Backend/package.json`: Add `cookie-parser`, `express-mongo-sanitize`, `@google/genai`, `swagger-ui-express`, `swagger-jsdoc`.
  - `Frontend/package.json`: Add `react-hot-toast`.
  - `Backend/.env.example`: Add `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`, `COOKIE_SECRET`, `GEMINI_MODEL`.
  - `Backend/src/config/config.js`: Add schema checks and defaults for refresh tokens and cookie configuration.
  - `Backend/src/app.js`: Mount `cookieParser()` and `mongoSanitize()` in middleware pipeline.
  - `Frontend/src/App.jsx`: Mount `<Toaster position="top-right" />` context provider.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: No database schema changes in this setup module.
- **TO BE IMPLEMENTED**: None.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: Standard JSON body parsing and Helmet security headers.
- **TO BE IMPLEMENTED**:
  - Import and mount `cookieParser(config.cookieSecret)` before route mounting in `app.js`.
  - Import and mount `mongoSanitize()` to sanitize request bodies and query parameters against `$` operator injection.
  - Enhance `config.js` to log a formatted boot status banner showing active database engines and environment mode.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: All existing `/api/*` routes.
- **TO BE IMPLEMENTED**:
  - New route: `GET /api/health` enhanced to return active database engine statuses (MongoDB status, Neo4j status).

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: Application renders inside `App.jsx` wrapped in `AuthProvider` and `BrowserRouter`.
- **TO BE IMPLEMENTED**:
  - Import `Toaster` from `react-hot-toast` and embed it in `App.jsx` to enable accessible, animated toast alerts across all child pages.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Stateless Bearer tokens.
- **TO BE IMPLEMENTED**:
  - Configure `cookieSecret` in `config.js` to enable signed HTTP-only cookies for subsequent refresh token implementation.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: Informal fallback strings in `config.js`.
- **TO BE IMPLEMENTED**:
  - Programmatic environment validation function `validateConfig()` in `config.js` that checks for `JWT_SECRET` strength (minimum 16 characters in production) and warns if running with default development secrets.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: Centralized `errorMiddleware.js`.
- **TO BE IMPLEMENTED**:
  - Unhandled promise rejection and uncaught exception handlers in `server.js` enhanced to log structured error details before graceful termination.

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: No config tests exist.
- **TO BE IMPLEMENTED**:
  - Unit test `Backend/tests/config.test.js`:
    - Test 1: Verifies `config.js` supplies safe default values when `.env` is absent.
    - Test 2: Verifies `validateConfig()` warns or exits when production environment lacks `JWT_SECRET`.
    - Test 3: Verifies `mongoSanitize` strips malicious `{"$gt": ""}` keys from request bodies.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**:
  - `Backend`: `express`, `mongoose`, `neo4j-driver`, `jsonwebtoken`, `bcryptjs`, `cors`, `helmet`, `express-rate-limit`, `dotenv`, `morgan`.
  - `Frontend`: `react`, `react-dom`, `react-router-dom`, `axios`, `lucide-react`, `recharts`, `tailwindcss`, `vite`.
- **TO BE IMPLEMENTED**:
  - Backend: `cookie-parser` (^1.4.6), `express-mongo-sanitize` (^2.2.0), `@google/genai` (^0.1.1), `swagger-ui-express` (^5.0.0), `swagger-jsdoc` (^6.2.8).
  - Frontend: `react-hot-toast` (^2.4.1).

---

## 15. Implementation Order
1. Install new npm packages in `Backend/` and `Frontend/`.
2. Update `Backend/.env.example` with refresh token and cookie configuration parameters.
3. Enhance `Backend/src/config/config.js` with validated configuration keys.
4. Mount `cookieParser` and `mongoSanitize` in `Backend/src/app.js`.
5. Mount `<Toaster />` in `Frontend/src/App.jsx`.
6. Run `npm run dev` in both directories to verify zero startup errors.

---

## 16. Acceptance Criteria
- **AC-01**: `npm start` in `Backend/` initializes cleanly without missing module errors.
- **AC-02**: Sending a payload with `{"$gt": ""}` to any test endpoint results in sanitized data without throwing unhandled exceptions.
- **AC-03**: Invoking `toast.success("Ready")` renders an accessible UI toast on the frontend.
- **AC-04**: Configuration validation executes during boot and prints clear logging.

---

## 17. Risks
- **Risk 1 (Cookie Parsing Conflicts)**: Enabling signed cookies might alter existing request headers if CORS is misconfigured.
  - *Mitigation*: Ensure `cors()` configuration in `app.js` explicitly sets `credentials: true` and mirrors `CLIENT_URL`.
- **Risk 2 (Dependency Version Drift)**: Incompatible transitive dependencies between Mongoose 8.3 and sanitizers.
  - *Mitigation*: Pin exact major versions in `package.json`.

---

## 18. Rollback Considerations
- If new packages fail to build on Node 18+, revert `package.json` and `package-lock.json` via `git checkout HEAD -- Backend/package.json Frontend/package.json`.
- Keep `mongoSanitize` disabled until confirmed passing in local test suite.
