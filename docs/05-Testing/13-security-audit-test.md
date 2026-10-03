# Module 13: Security Hardening & Audit Logging Test Report

## 1. Executive Summary
- **Module Under Test**: `Module 13 — Security Hardening, Multi-Tenant Isolation, RBAC & Audit Trail Logging`
- **Execution Date**: 2026-10-04
- **Test Runner**: Jest v29 + Supertest
- **Test File**: `Backend/tests/securityAudit.test.js`
- **Result**: **8 passed, 0 failed (100% Pass Rate)**

---

## 2. Test Execution Breakdown

| # | Test Case Description | Category | Expected Result | Actual Result | Status |
| :-: | :--- | :--- | :--- | :--- | :-: |
| 1 | Create AuditLog entry on skill verification review | Audit Compliance | HTTP 200, creates `AuditLog` document with actorId, targetId, decision | HTTP 200, logged in DB | **PASS** |
| 2 | Create AuditLog entry on candidate application status update | Audit Compliance | HTTP 200, creates `AuditLog` document recording oldStatus $\to$ newStatus | HTTP 200, logged in DB | **PASS** |
| 3 | Redact sensitive keys (`password`, `token`, `apiKey`) | Data Privacy | Sanitizer replaces sensitive keys with `'[REDACTED]'` | Redacted properly | **PASS** |
| 4 | Block student from reviewing skill verification | RBAC Authorization | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| 5 | Block student from updating application status to non-withdrawn | RBAC Authorization | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| 6 | Multi-tenant isolation: prevent cross-student skill mutation | User Data Isolation | HTTP 403/404, target user's skill remains intact in DB | HTTP 403/404, skill unmodified | **PASS** |
| 7 | Ensure password hash is never exposed in user queries | Credential Security | `select: false` on password; `data.user.password` is undefined | Password undefined | **PASS** |
| 8 | Reject forged / malformed JWT with 401 Unauthorized | JWT Token Integrity | HTTP 401 Unauthorized with standardized error message | HTTP 401 Unauthorized | **PASS** |

---

## 3. Security Architecture & Audit Trail System
1. **Administrative Operation Audit Trail**:
   - Implemented `auditService.js` connecting high-impact actions (verification reviews, job application lifecycle changes) to the MongoDB `AuditLog` collection.
   - Captures `actorId`, `action`, `targetEntity`, `targetId`, `changes`, and IP address (`x-forwarded-for` / `req.ip`).
   - Non-blocking design: failure to persist an audit record logs an error without rolling back or crashing the user's primary transaction.
2. **Sensitive Data Redaction**:
   - `sanitizeChanges(data)` recursively traverses changes payloads and replaces keys matching `password`, `token`, `accessToken`, `refreshToken`, `secret`, `apiKey`, or `cookie` with `[REDACTED]`.
3. **Multi-Tenant Student Isolation**:
   - Profile mutations and skill deletions enforce `{ userId: req.user._id }`, preventing horizontal privilege escalation between students.
4. **Token Security & Revocation**:
   - Refresh token reuse detection revokes all tokens for a compromised session family.
   - Password reset tokens hashed with `sha256` and expired after 1 hour.
