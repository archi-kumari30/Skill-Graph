# SkillGraph: Skills Catalog & Skill Graph Context

## 1. Module Name
**Skills Catalog & Graph Visualization Module**

---

## 2. Purpose
The Skills Catalog & Graph Visualization module defines the core domain taxonomy for SkillGraph. It manages technical competencies, classifications, difficulty levels, aliases, and directional relationships (prerequisites, related skills, specializations). Furthermore, it powers the interactive 2D HTML5 canvas visualizer, prerequisite pathfinding engine, and graph topological queries.

---

## 3. Current Functionality
- **Skill Catalog Management**:
  - Distinguishes between canonical global skills (`isPersonal: false`) and user-created custom skills (`isPersonal: true`, `createdBy: userId`).
  - Categorization into 9 technical domains: `frontend`, `backend`, `devops`, `database`, `mobile`, `ai-ml`, `cloud`, `security`, and `other`.
  - Difficulty grading: `beginner`, `intermediate`, `advanced`.
  - Keyword and synonym indexing via `aliases` (e.g., `['js', 'es6', 'ecmascript']` for JavaScript) and MongoDB full-text index.
- **Skill Relationship Graph**:
  - Directional edges stored in `SkillRelationship`:
    - `prerequisite`: Skill A must be learned before Skill B.
    - `related`: Skill A is conceptually or technologically adjacent to Skill B.
    - `specialization`: Skill B represents an advanced sub-discipline of Skill A.
  - Edge weight / `strength` field (0.1 to 1.0).
- **Dual-Engine Graph Engine (`graphService.js` & `skillGraphService.js`)**:
  - Traverses relationships using Neo4j Cypher queries when `USE_GRAPH_DB === 'true'`, with automated fallback to MongoDB aggregation pipelines.
  - Pathfinding: Computes shortest dependency chains between any two skills.
  - Topological Prerequisite Sorting: Returns recursive prerequisite hierarchies for learning pathways.
- **Interactive Visual Canvas (`SkillGraph.jsx`)**:
  - Custom HTML5 2D Canvas rendering engine with interactive physics simulation (node repulsion, spring tension, velocity damping).
  - Panning, pinch-to-zoom, node dragging, category color-coding, and edge highlighting.
  - Real-time search and category filtering directly within the canvas viewport.
- **Skill Detail View (`SkillDetail.jsx`)**:
  - Displays skill description, category, difficulty badge, direct prerequisites, downstream unlocked competencies, associated learning courses, and career roles requiring the skill.

---

## 4. Frontend Files Involved
- `Frontend/src/pages/SkillGraph.jsx`: Interactive Canvas-based graph visualizer featuring force simulation, node inspector, search, and category filters.
- `Frontend/src/pages/SkillDetail.jsx`: Comprehensive view for a single skill showing dependencies, unlocks, courses, and job demand.
- `Frontend/src/pages/MySkills.jsx`: User inventory page allowing skill searching, logging, and custom personal skill creation.
- `Frontend/src/services/api.js`: Exports `skillApi` (catalog CRUD) and `skillGraphApi` (graph data, paths, stats, sync).

---

## 5. Backend Files Involved
- `Backend/src/routes/skillRoutes.js`: REST endpoints for skills catalog and relationships.
- `Backend/src/controllers/skillController.js`: Request handling for skill CRUD, personal skills, and relationship management.
- `Backend/src/services/skillService.js`: Catalog queries, text search, slug generation, and relationship creation logic.
- `Backend/src/routes/skillGraphRoutes.js`: Endpoints for graph visualization data, pathfinding, and topology metrics.
- `Backend/src/controllers/skillGraphController.js`: Delegates graph queries to graph services.
- `Backend/src/services/skillGraphService.js`: Graph payload generation and formatting for frontend visualizers.
- `Backend/src/services/graphService.js`: Dual-engine Neo4j / MongoDB query executor and data synchronizer.
- `Backend/src/models/Skill.js`: Mongoose model for skills.
- `Backend/src/models/SkillRelationship.js`: Mongoose model for graph edges.
- `Backend/src/models/UserSkill.js`: Mongoose model linking users to skills.
- `Backend/src/seed/seedCatalog.js`: Standard seed catalog initializing 30 foundational skills and 8 prerequisite relationships.

---

## 6. APIs Involved
- `GET /api/skills`: Returns skills catalog with query filtering (`category`, `difficulty`, `search`, `page`, `limit`).
- `GET /api/skills/:id`: Returns single skill record by ID or slug.
- `POST /api/skills`: Creates a new skill. Admin/manager creates global skills; standard users create personal skills.
- `PUT /api/skills/:id`: Updates an existing skill (Admin/Manager, or creator if personal).
- `DELETE /api/skills/:id`: Deletes a skill and cleans up associated relationships and user skills.
- `GET /api/skills/categories`: Returns list of valid category enum values.
- `GET /api/skills/:id/prerequisites`: Returns immediate and ancestral prerequisites for a skill.
- `GET /api/skills/:id/related`: Returns adjacent related and specialization skills.
- `POST /api/skills/relationships`: Creates an edge between two skills (`fromSkillId`, `toSkillId`, `relationType`, `strength`). Requires Admin/Manager.
- `DELETE /api/skills/relationships/:id`: Deletes a skill relationship edge. Requires Admin/Manager.
- `GET /api/skill-graph/data`: Returns full graph structure (`{ nodes: [...], edges: [...] }`) with category colors and user logged status.
- `GET /api/skill-graph/node/:id`: Returns local neighborhood for a specific node.
- `GET /api/skill-graph/paths`: Computes shortest path between query params `fromSkillId` and `toSkillId`.
- `GET /api/skill-graph/stats`: Returns graph statistics (total nodes, edges, density, components).
- `GET /api/skill-graph/learning-path/:skillId`: Returns prerequisite chain leading to a skill.
- `POST /api/skill-graph/sync`: Admin-only endpoint to sync MongoDB data into Neo4j.

---

## 7. Database Models Involved
- `Skill` (`Backend/src/models/Skill.js`):
  - Fields: `name`, `slug` (unique), `description`, `category` (enum), `difficulty` (enum), `aliases` ([String]), `isPersonal` (Boolean), `createdBy` (ObjectId ref User).
- `SkillRelationship` (`Backend/src/models/SkillRelationship.js`):
  - Fields: `fromSkillId` (ref Skill), `toSkillId` (ref Skill), `relationType` (`prerequisite`, `related`, `specialization`), `strength` (Number 0.1 to 1.0).
  - Compound Unique Index: `{ fromSkillId: 1, toSkillId: 1, relationType: 1 }`.
- `UserSkill` (`Backend/src/models/UserSkill.js`):
  - Used by `/api/skill-graph/data` to flag whether the authenticated user has already acquired a node.

---

## 8. Authentication / Authorization
- Catalog browsing (`GET /api/skills`, `GET /api/skill-graph/data`) is open to all authenticated users.
- Creating or editing canonical global skills (`isPersonal: false`) and relationships requires `authorize('admin', 'manager')`.
- Creating custom personal skills (`isPersonal: true`) is open to any authenticated user (`accountRole: 'employee'`).
- Modifying personal skills is restricted to the user who created them (`skill.createdBy.equals(req.user._id)`).
- Graph database synchronization (`POST /api/skill-graph/sync`) requires `authorize('admin')`.

---

## 9. Dependencies
- `mongoose` (^8.3.4): Schema validation, text search queries, and population.
- `neo4j-driver` (^6.2.0): Executes Cypher queries for graph pathfinding and traversal.
- `react` (^18.2.0): Component rendering and Canvas lifecycle management.
- `lucide-react` (^0.378.0): Domain icons across skill cards and visual controls.

---

## 10. Current Workflow
1. **Catalog Exploration**:
   - Learner visits `SkillGraph.jsx` or searches skills in `MySkills.jsx`.
   - The frontend requests `GET /api/skill-graph/data` and receives all nodes and edges.
2. **Physics Graph Visualization**:
   - The canvas renders nodes positioned by a continuous spring-physics loop.
   - User drags nodes, zooms in/out with the mouse wheel, or filters by category (e.g., "Frontend").
3. **Inspecting Dependencies**:
   - User clicks a node to view its incoming prerequisites and outgoing unlocks in the side panel.
   - User navigates to `SkillDetail.jsx` via `/skills/:id` to inspect full syllabus details and related learning courses.
4. **Logging / Creating Skills**:
   - User logs catalog skills into their profile with proficiency 1-5.
   - If a skill is not found in the global catalog, the user can create a custom personal skill, which is flagged `isPersonal: true` and linked to their profile.

---

## 11. Current Limitations
- **Canvas Rendering Scalability**: The visual graph is implemented imperatively on HTML5 2D Canvas with custom JavaScript spring calculations. It lacks WebGL acceleration, spatial partitioning (quadtrees), or worker-thread physics, causing performance degradation when node counts exceed several hundred.
- **Cycle Detection in Prerequisite Edges**: Graph cycle prevention (ensuring directed acyclic graph properties on `prerequisite` edges) is Not currently implemented; circular dependencies can be created if not prevented manually.
- **Automated Skill Extraction**: Parsing skills automatically from job descriptions or syllabi using NLP is Not currently implemented.
- **Skill Versioning**: Skill versioning (e.g., Python 2 vs Python 3, React 17 vs React 18) is Not currently implemented; skills exist as single unversioned entities.
- **Community Clustering**: Automatic graph community detection (e.g., Louvain modularity clustering) is Not currently implemented.

---

## 12. Existing Validation
- **Category Validation**: Enforced via Mongoose enum: `['frontend', 'backend', 'devops', 'database', 'mobile', 'ai-ml', 'cloud', 'security', 'other']`.
- **Difficulty Validation**: Enforced via Mongoose enum: `['beginner', 'intermediate', 'advanced']`.
- **Relationship Type Validation**: Enforced via Mongoose enum: `['prerequisite', 'related', 'specialization']`.
- **Self-Relationship Prohibition**: Backend validates that `fromSkillId.toString() !== toSkillId.toString()`.
- **Duplicate Edge Prevention**: MongoDB compound index `{ fromSkillId: 1, toSkillId: 1, relationType: 1 }` prevents redundant identical relationships.

---

## 13. Existing Error Handling
- **Skill Not Found**: Throws `NotFoundError` ("Skill not found") -> HTTP 404.
- **Duplicate Skill Slug**: Traps unique index violation and throws `ConflictError` ("Skill already exists with this name/slug") -> HTTP 409.
- **Self-Referential Edge**: Throws `ValidationError` ("A skill cannot have a relationship with itself") -> HTTP 400.
- **Duplicate Relationship**: Throws `ConflictError` ("Relationship already exists") -> HTTP 409.
- **Graph Connection Failure**: Catches Neo4j driver connection errors and seamlessly falls back to MongoDB aggregation queries in `graphService.js`.

---

## 14. Important Relationships with Other Modules
- **Career Roles (`RoleSkill`)**: Roles define requirements by referencing canonical `Skill` IDs.
- **Skill Gap Analysis**: Prerequisite edges from `SkillRelationship` dictate whether a missing skill is immediately actionable or blocked by missing prerequisites.
- **Learning Resources**: Each `LearningResource` points to a specific `skillId`.
- **Job Matching**: Jobs define required competencies using arrays of `Skill` ObjectIds.
- **AI Assistant**: Ingests the user's logged skills and relationship graph to formulate learning roadmaps.
