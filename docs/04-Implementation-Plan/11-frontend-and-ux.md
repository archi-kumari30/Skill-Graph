# SkillGraph Implementation Plan: Module 11 — Frontend & User Experience

## 1. Module
**11 — Frontend Core, Client Caching & User Experience Polish**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - React 18 Single Page Application with React Router DOM 6.23 and Tailwind CSS.
  - 14 page views in `Frontend/src/pages/`.
  - Shared components: `LoadingSpinner`, `ErrorState`, `EmptyState`, `ProgressBar`, `AIAssistant`.
  - Axios client in `Frontend/src/services/api.js`.
  - Ad-hoc data fetching with raw `useEffect` in every component.
  - Reliance on native browser `alert()` popups in certain failure/success branches.
- **TO BE IMPLEMENTED**:
  - Non-blocking, accessible Toast notification system (`react-hot-toast`) replacing all browser `alert()` calls.
  - Lightweight in-memory GET request caching layer in `Frontend/src/services/api.js` to eliminate redundant network roundtrips during tab switching.
  - Reusable `LoadingSkeleton.jsx` component for polished card-level loading states.
  - Consistent UI indicators for verified skills, seniority tiers, and application statuses.

---

## 3. Objective
Elevate the frontend user experience to production standards by eliminating jarring full-page reload spinners, removing synchronous `alert()` dialogs, and adding responsive, accessible visual feedback.

---

## 4. Existing Files
- `Frontend/src/App.jsx`: Main routing.
- `Frontend/src/services/api.js`: API client.
- `Frontend/src/layouts/DashboardLayout.jsx`: Application shell.
- `Frontend/src/components/ProgressBar.jsx`: Progress bar.
- `Frontend/src/components/LoadingSpinner.jsx`: Full-page spinner.
- `Frontend/src/components/ErrorState.jsx`: Error boundary display.
- `Frontend/src/pages/MySkills.jsx`, `Frontend/src/pages/Profile.jsx`, `Frontend/src/pages/Jobs.jsx`.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - `Frontend/src/components/LoadingSkeleton.jsx`: New component rendering animated gray shimmer placeholders.
  - `Frontend/src/services/api.js`: Implement in-memory cache map with TTL for GET requests; clear relevant cache keys on POST/PUT/DELETE mutations.
  - `Frontend/src/pages/MySkills.jsx`: Replace all `alert()` calls with `toast.success()` and `toast.error()`.
  - `Frontend/src/pages/Profile.jsx`: Replace `alert()` with `toast`.
  - `Frontend/src/pages/Progress.jsx`: Replace `alert()` with `toast`.
  - `Frontend/src/pages/Recommendations.jsx`: Add toast on course enrollment.
  - `Frontend/src/pages/Jobs.jsx`: Add toast on application submission.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: None (Frontend module).
- **TO BE IMPLEMENTED**: None.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**: None.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**: None.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: Page transitions trigger immediate empty states followed by spinners.
- **TO BE IMPLEMENTED**:
  - Create `Frontend/src/components/LoadingSkeleton.jsx`:
    - Variants: `card`, `table-row`, `text`, `avatar`.
    - Uses Tailwind's `animate-pulse` utility.
  - In `Frontend/src/services/api.js`:
    - Add a simple Map cache:
      ```javascript
      const cache = new Map();
      const CACHE_TTL_MS = 30000; // 30 seconds
      ```
    - In request interceptor: if `config.method === 'get'` and cache entry is fresh, return cached promise.
    - In response interceptor: cache successful GET responses; on any mutating request (POST, PUT, DELETE), clear related cached keys (e.g. mutating `/api/skills` invalidates `/api/skills` and `/api/dashboard` caches).
  - Refactor all `alert()` calls across `MySkills.jsx`, `Profile.jsx`, `Progress.jsx`, `Recommendations.jsx` to use `toast.success(...)` and `toast.error(...)`.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Route guards in `App.jsx`.
- **TO BE IMPLEMENTED**:
  - Add toast feedback when an unauthorized route redirect occurs: "Access restricted: requires Manager role".

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: Basic HTML input validation.
- **TO BE IMPLEMENTED**:
  - Instant client-side validation on URL fields before submitting verification proof or resume links.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: `ErrorState.jsx`.
- **TO BE IMPLEMENTED**:
  - Enhance Axios error interceptor to automatically display a toast on network disconnects: "Network error: check your connection".

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Frontend component smoke tests with Vitest (configured in Module 13):
    - Test 1: Skeleton renders when `loading === true`.
    - Test 2: In-memory cache returns cached response without dispatching second network request within TTL.
    - Test 3: Toast displays with expected message on action dispatch.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: `react`, `react-dom`, `lucide-react`, `recharts`, `tailwindcss`.
- **TO BE IMPLEMENTED**: `react-hot-toast` (installed in Module 01).

---

## 15. Implementation Order
1. Create `LoadingSkeleton.jsx` in `Frontend/src/components/`.
2. Add in-memory caching logic in `Frontend/src/services/api.js`.
3. Replace `alert()` calls across all pages with `toast`.
4. Integrate skeletons into `Dashboard.jsx`, `MySkills.jsx`, and `Jobs.jsx`.
5. Verify responsive drawer and mobile sidebar behavior.

---

## 16. Acceptance Criteria
- **AC-01**: Navigating between "Dashboard" and "My Skills" within 30 seconds feels instantaneous with zero full-page layout jumps.
- **AC-02**: Adding, editing, or deleting a skill produces an animated green toast notification.
- **AC-03**: Network errors produce an informative red toast rather than freezing the interface.
- **AC-04**: No native browser `alert()` popups remain in the codebase.

---

## 17. Risks
- **Risk 1 (Stale Cache on Mutations)**: User updates a skill, but cached dashboard still shows old count.
  - *Mitigation*: Ensure the cache invalidator pattern strictly clears all `/dashboard` and `/skills` entries whenever a `POST`, `PUT`, or `DELETE` executes.

---

## 18. Rollback Considerations
- The caching layer can be bypassed instantly by passing `{ skipCache: true }` in Axios config or setting `CACHE_TTL_MS = 0`.
