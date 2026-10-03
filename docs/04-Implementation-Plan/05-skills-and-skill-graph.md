# SkillGraph Implementation Plan: Module 05 — Skills Taxonomy & Graph Engine

## 1. Module
**05 — Skills Taxonomy, Directed Graph Engine & Canvas Stabilization**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - `Skill` catalog supporting 9 categories, difficulty tiers, aliases, and text search.
  - `SkillRelationship` edges: `prerequisite`, `related`, `specialization` with weights 0.1 to 1.0.
  - Basic validation checks `fromSkillId !== toSkillId` and compound unique index.
  - Neo4j Cypher queries in `graphService.js` with fallback to MongoDB.
  - HTML5 2D Canvas visualizer in `Frontend/src/pages/SkillGraph.jsx`.
- **TO BE IMPLEMENTED**:
  - Algorithmic DAG (Directed Acyclic Graph) cycle detection preventing circular prerequisites (e.g. A $\to$ B $\to$ C $\to$ A).
  - Real-time dual-write synchronization from `skillService.js` to `graphService.js` (instant Neo4j updates on CRUD).
  - Physics simulation stabilization in `SkillGraph.jsx`: halts `requestAnimationFrame` loop when kinetic energy reaches equilibrium to eliminate CPU/GPU drain.
  - Cascading cleanup: deleting a skill safely deletes attached relationships, role skills, and resource mappings.

---

## 3. Objective
Harden the skill graph data structures by enforcing strict mathematical DAG integrity on prerequisite chains, establishing real-time graph synchronization, and optimizing client-side canvas rendering performance.

---

## 4. Existing Files
- `Backend/src/models/Skill.js`: Skill schema.
- `Backend/src/models/SkillRelationship.js`: Relationship schema.
- `Backend/src/routes/skillRoutes.js`: Skills REST routes.
- `Backend/src/controllers/skillController.js`: Skill controller.
- `Backend/src/services/skillService.js`: Skill business logic.
- `Backend/src/routes/skillGraphRoutes.js`: Graph endpoints.
- `Backend/src/services/skillGraphService.js`: Graph payload generation.
- `Backend/src/services/graphService.js`: Dual-engine Neo4j/MongoDB query service.
- `Frontend/src/pages/SkillGraph.jsx`: Canvas visualizer component.
- `Frontend/src/pages/SkillDetail.jsx`: Single skill details page.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - Create `Backend/src/utils/graphValidation.js`: Cycle-detection graph traversal utility.
  - Modify `Backend/src/services/skillService.js`:
    - Inject `detectCycle()` into `createRelationship()`.
    - Call `graphService.upsertSkillNode()`, `graphService.removeSkillNode()`, `graphService.upsertRelationshipEdge()`, and `graphService.removeRelationshipEdge()` on mutations.
    - Implement cascading cleanup in `deleteSkill()`.
  - Modify `Frontend/src/pages/SkillGraph.jsx`:
    - Implement kinetic energy calculation and simulation sleep/wake mechanism.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: `Skill` and `SkillRelationship` schemas.
- **TO BE IMPLEMENTED**:
  - None (schemas already support required fields; changes are operational and algorithmic).

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: `createRelationship()` creates edges without cycle inspection.
- **TO BE IMPLEMENTED**:
  - Create `Backend/src/utils/graphValidation.js`:
    - `wouldCreateCycle(fromSkillId, toSkillId)`: Uses Depth-First Search (DFS) over all existing `prerequisite` edges in MongoDB or Neo4j to check if a path already exists from `toSkillId` to `fromSkillId`.
    - If a path exists, adding `fromSkillId -> toSkillId` would close a directed cycle.
  - In `Backend/src/services/skillService.js`:
    - In `createRelationship(data)`:
      - If `data.relationType === 'prerequisite'`, await `wouldCreateCycle(data.fromSkillId, data.toSkillId)`.
      - If true, throw `ValidationError("Cannot create prerequisite relationship: would create a circular dependency cycle.")`.
    - When `Skill.create()` succeeds, trigger `graphService.upsertSkillNode(skill)`.
    - When `SkillRelationship.create()` succeeds, trigger `graphService.upsertRelationshipEdge(rel)`.
    - In `deleteSkill(id)`: cascade-delete records from `SkillRelationship`, `RoleSkill`, `LearningResource`, `UserSkill`, and call `graphService.removeSkillNode(id)`.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**:
  - `POST /api/skills/relationships`: Creates edge.
  - `DELETE /api/skills/relationships/:id`: Deletes edge.
  - `GET /api/skill-graph/data`: Returns nodes and edges.
  - `GET /api/skill-graph/paths`: Shortest path calculation.
- **TO BE IMPLEMENTED**:
  - `POST /api/skills/relationships` returns HTTP 400 with structured cycle path if a circular prerequisite is attempted.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: Canvas runs infinite animation loop.
- **TO BE IMPLEMENTED**:
  - In `Frontend/src/pages/SkillGraph.jsx`:
    - Compute `const totalVelocity = nodes.reduce((sum, n) => sum + Math.abs(n.vx) + Math.abs(n.vy), 0)`.
    - If `totalVelocity < 0.05`, set `simulationRunning = false` and cancel `requestAnimationFrame`.
    - Wake simulation (`simulationRunning = true`) whenever the user interacts (mouse drag, zoom wheel, search input, or category filter click).
    - Add visual indicator: "Graph settled" / "Interactive physics paused" badge.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Admin/Manager can manage global skills and relationships.
- **TO BE IMPLEMENTED**:
  - Maintain existing RBAC boundaries while ensuring personal skills (`isPersonal: true`) are validated against the same DAG integrity rules.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: Self-referencing check (`from !== to`).
- **TO BE IMPLEMENTED**:
  - Multi-hop DAG cycle validation traversing arbitrary depths of prerequisite chains.
  - Validation error payload: `{ success: false, message: "Circular dependency detected", cycle: ["A", "B", "C", "A"] }`.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: Generic `AppError`.
- **TO BE IMPLEMENTED**:
  - Specific `CyclicDependencyError` (subclass of `AppError` with status code 400).

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Unit tests in `Backend/tests/graphValidation.test.js`:
    - Test 1: Direct cycle: A -> B, then attempting B -> A is rejected.
    - Test 2: Multi-hop cycle: A -> B -> C -> D, then attempting D -> A is rejected.
    - Test 3: Valid branching: A -> B and A -> C, then D -> B is permitted (diamond DAG).
    - Test 4: Real-time Neo4j sync helper runs cleanly when Neo4j is available.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: `mongoose`, `neo4j-driver`.
- **TO BE IMPLEMENTED**: None additional.

---

## 15. Implementation Order
1. Implement `wouldCreateCycle()` in `Backend/src/utils/graphValidation.js`.
2. Integrate cycle detection into `skillService.js` in `createRelationship()`.
3. Hook real-time Neo4j mutation helpers in `skillService.js`.
4. Implement cascading cleanup in `deleteSkill()`.
5. Update `SkillGraph.jsx` with velocity threshold and simulation sleep.
6. Run `graphValidation.test.js`.

---

## 16. Acceptance Criteria
- **AC-01**: Attempting to create a circular prerequisite chain via API returns HTTP 400 with a clear circular dependency error.
- **AC-02**: Valid complex acyclic dependencies (diamond and tree structures) are created without false positives.
- **AC-03**: Deleting a skill cleans up all associated edges and removes the node from Neo4j.
- **AC-04**: The canvas visualizer halts its animation loop after nodes settle, reducing CPU utilization to near 0% when idle.

---

## 17. Risks
- **Risk 1 (Performance of Deep DFS)**: Large graphs with thousands of edges might take milliseconds to check cycles.
  - *Mitigation*: The current catalog contains ~30-100 skills. Limit DFS depth to 20 levels or use visited sets to guarantee $O(V + E)$ linear traversal time.

---

## 18. Rollback Considerations
- If cycle validation causes unexpected rejections on legacy test data, add a feature flag `ENABLE_CYCLE_DETECTION=true` in `config.js` to allow bypass if necessary during staging tests.
