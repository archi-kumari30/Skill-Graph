# SkillGraph Implementation Plan: Module 12 — API Architecture & Validation

## 1. Module
**12 — API Standardization, Declarative Validation & OpenAPI Documentation**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - 13 REST route namespaces mounted in `Backend/src/app.js`.
  - Manual, imperative validation checks scattered across controllers (`if (!email || !password) throw new ValidationError(...)`).
  - Inconsistent pagination responses across services.
  - No interactive API documentation or OpenAPI specification.
- **TO BE IMPLEMENTED**:
  - Reusable declarative validation middleware (`Backend/src/middleware/validate.js`) executing prior to controller handlers.
  - Standardized pagination response utility across all listing endpoints.
  - Interactive Swagger / OpenAPI documentation mounted at `/api/docs` using `swagger-ui-express` and JSDoc annotations.

---

## 3. Objective
Harden and standardize the backend API tier by establishing declarative request validation, uniform pagination contracts, and interactive OpenAPI documentation.

---

## 4. Existing Files
- `Backend/src/app.js`: Express app.
- `Backend/src/utils/helpers.js`: Helper functions.
- `Backend/src/middleware/errorMiddleware.js`: Error middleware.
- `Backend/src/routes/`: All route files.
- `Backend/src/controllers/`: All controller files.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - Create `Backend/src/middleware/validate.js`: Validation middleware wrapper.
  - Create `Backend/src/config/swagger.js`: OpenAPI / Swagger definition and JSDoc reader.
  - Modify `Backend/src/utils/helpers.js`: Standardize `formatPaginatedResponse()`.
  - Modify `Backend/src/app.js`: Mount `/api/docs` route serving Swagger UI.
  - Modify `Backend/src/routes/authRoutes.js`, `skillRoutes.js`, `jobRoutes.js`: Add schema validation middleware.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**: None.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: Ad-hoc validation in controller methods.
- **TO BE IMPLEMENTED**:
  - Create `Backend/src/middleware/validate.js`:
    - Accepts validation rules object `{ body, query, params }`.
    - Validates presence, types, string patterns (regex, email, URL), and value bounds.
    - If validation fails, immediately invokes next with `ValidationError` detailing which fields failed.
  - In `Backend/src/utils/helpers.js`:
    - Standardize pagination format:
      ```javascript
      const formatPaginatedResponse = (items, total, page, limit) => {
        const totalPages = Math.ceil(total / limit) || 1;
        return {
          items,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        };
      };
      ```
  - Create `Backend/src/config/swagger.js`:
    - Defines OpenAPI 3.0 specification metadata, JWT Bearer security scheme, and scans `Backend/src/routes/*.js` for JSDoc documentation tags.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: 13 route namespaces.
- **TO BE IMPLEMENTED**:
  - New Endpoint: `GET /api/docs` (interactive Swagger UI) and `GET /api/docs.json` (raw OpenAPI spec).
  - All paginated endpoints (`GET /api/skills`, `GET /api/jobs`, `GET /api/learning/resources`) return identical pagination JSON structure.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: Custom pagination handling per view.
- **TO BE IMPLEMENTED**:
  - Centralize frontend pagination parsing in `Frontend/src/services/api.js` to read standard `response.data.pagination`.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Secured routes.
- **TO BE IMPLEMENTED**:
  - Swagger UI documents security schemes so users can test authenticated endpoints by pasting their JWT directly into the "Authorize" dialog.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: Scattered manual checks.
- **TO BE IMPLEMENTED**:
  - Centralized schemas for:
    - Auth: `registerSchema` (name, email, password, role), `loginSchema` (email, password).
    - Skills: `createSkillSchema` (name, category, difficulty).
    - Jobs: `createJobSchema` (title, companyId, jobType, requiredSkills).
    - Verifications: `verifySkillSchema` (proofUrl).

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: Standard 400 response.
- **TO BE IMPLEMENTED**:
  - Validation errors return structured details array:
    `{ success: false, message: "Validation failed", errors: [{ field: "email", message: "Invalid email format" }] }`.

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Integration tests in `Backend/tests/validation.test.js`:
    - Test 1: Sending empty body to `/api/auth/login` returns 400 with field-level errors.
    - Test 2: Paginated endpoints conform to the uniform pagination schema.
    - Test 3: `/api/docs` returns HTTP 200 with HTML Swagger document.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: `express`.
- **TO BE IMPLEMENTED**: `swagger-ui-express`, `swagger-jsdoc` (installed in Module 01).

---

## 15. Implementation Order
1. Implement `formatPaginatedResponse()` in `Backend/src/utils/helpers.js`.
2. Implement declarative validation middleware in `Backend/src/middleware/validate.js`.
3. Configure Swagger definition in `Backend/src/config/swagger.js`.
4. Mount Swagger route in `Backend/src/app.js`.
5. Attach validation schemas to route files.
6. Run `validation.test.js`.

---

## 16. Acceptance Criteria
- **AC-01**: Opening `http://localhost:5000/api/docs` renders an interactive Swagger interface displaying all endpoints.
- **AC-02**: Invalid request payloads receive immediate 400 responses with exact field error lists before reaching the controller.
- **AC-03**: All paginated API endpoints return the standardized pagination envelope.

---

## 17. Risks
- **Risk 1 (JSDoc Maintenance Overhead)**: Annotating every endpoint with OpenAPI JSDoc comments can be verbose.
  - *Mitigation*: Start with high-impact routes (Auth, Skills, Roles, Jobs, AI) and expand incrementally.

---

## 18. Rollback Considerations
- If Swagger causes startup delays, simply comment out the `/api/docs` route mount in `app.js`.
