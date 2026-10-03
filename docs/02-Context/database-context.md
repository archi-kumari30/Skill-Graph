# SkillGraph: Database & Storage Engine Context

## 1. Module Name
**SkillGraph Database & Data Storage Engine** (MongoDB Mongoose ODM & CognoDB Neo4j Dual-Engine)

---

## 2. Purpose
The Database module provides persistent data storage and graph traversal capabilities for the SkillGraph platform. It utilizes a hybrid dual-engine architecture:
1. **Primary Document Store (MongoDB via Mongoose)**: Manages transactional records, user credentials, relational joins, academic profiles, learning progress, job listings, and company directories.
2. **Secondary Graph Database (CognoDB / Neo4j via official neo4j-driver)**: Models skills, careers, users, learning materials, and companies as interconnected graph nodes and edges for high-performance topological sorting, prerequisite pathfinding, and transitive closure queries.

---

## 3. Current Functionality
- **Mongoose ODM Integration**: Connects to MongoDB with connection pooling, automatic index creation, schema type casting, and schema-level validation.
- **CognoDB / Neo4j Graph Engine**: Connects via Bolt protocol (`COGNODB_URI`) when `USE_GRAPH_DB === 'true'`.
- **Automatic Fallback Architecture**: If `USE_GRAPH_DB` is disabled or fails to initialize, all graph querying APIs in `graphService.js` and `skillGraphService.js` transparently fall back to MongoDB aggregation pipelines.
- **Bi-Directional Graph Syncing**: `graphService.js` implements `syncMongoToGraph()` to export all MongoDB collections into Neo4j nodes and edges.
- **Startup Sync Verification**: During boot in `server.js`, the server compares Neo4j node and relationship counts against MongoDB; if counts differ, it automatically synchronizes the graph.
- **Catalog Seeding**: `seedCatalog.js` runs automatically on server start, populating standard skills, categories, relationships, careers, companies, jobs, and learning resources if the database is unpopulated.

---

## 4. Frontend Files Involved
The Frontend does not access the database directly; it accesses database data via REST endpoints.
- `Frontend/src/services/api.js`: Dispatches HTTP calls to database-backed controllers.
- `Frontend/src/pages/SkillGraph.jsx`: Consumes raw graph nodes and edges returned from `/api/skill-graph/data` to render an interactive HTML5 canvas.

---

## 5. Backend Files Involved
- `Backend/src/config/db.js`: Mongoose connection manager with reconnection handlers.
- `Backend/src/config/cognodb.js`: Neo4j driver instantiation and connection verification.
- `Backend/src/config/config.js`: Parses and validates database URIs and credentials.
- `Backend/src/services/graphService.js`: Comprehensive 1100+ line dual-engine service handling Cypher queries and MongoDB fallback aggregations.
- `Backend/src/seed/seedCatalog.js`: Automatic idempotent seed catalog for core domain data.
- `Backend/src/seed/seed.js`: Standalone manual seed script.
- `Backend/src/seed/seedGraph.js`: Standalone graph database seeder.
- Mongoose Models:
  - `Backend/src/models/User.js`
  - `Backend/src/models/Skill.js`
  - `Backend/src/models/SkillRelationship.js`
  - `Backend/src/models/UserSkill.js`
  - `Backend/src/models/Role.js`
  - `Backend/src/models/RoleSkill.js`
  - `Backend/src/models/Company.js`
  - `Backend/src/models/Job.js`
  - `Backend/src/models/LearningResource.js`
  - `Backend/src/models/LearningProgress.js`
  - `Backend/src/models/UserTopicProgress.js`

---

## 6. APIs Involved
While all backend APIs interact with the database tier, the following endpoints specifically query or manage the graph database engine:
- `GET /api/skill-graph/data`: Returns full graph payload (`nodes` and `edges`) for visualization.
- `GET /api/skill-graph/node/:id`: Fetches a single node with adjacent incoming and outgoing edges.
- `GET /api/skill-graph/paths`: Computes shortest dependency paths between two skills (`fromSkillId`, `toSkillId`).
- `GET /api/skill-graph/stats`: Returns database graph metrics (total nodes, edges, density, components).
- `GET /api/skill-graph/career-path/:careerId`: Returns topological learning sequence for a target career role.
- `GET /api/skill-graph/learning-path/:skillId`: Traverses prerequisite chains leading up to a specific skill.
- `POST /api/skill-graph/sync`: Restricted to `admin`; triggers on-demand MongoDB-to-Neo4j data synchronization.

---

## 7. Database Models Involved

### 1. `User` (`Backend/src/models/User.js`)
- `name` (String, required, trim)
- `email` (String, required, unique, lowercase, trim)
- `password` (String, required, select: false)
- `accountRole` (String, enum: `['admin', 'manager', 'employee']`, default: `'employee'`)
- `targetRoleId` (ObjectId, ref: `'Role'`, default: `null`)
- `department` (String, default: `'Engineering'`)
- `branch` (String, trim, default: `''`) - Academic branch for student identity
- `college` (String, trim, default: `''`) - Academic institution
- `yearOfStudy` (String, trim, default: `''`) - Current academic year
- `bio` (String, default: `''`)
- `avatar` (String, default: `''`)
- `timestamps` (true: `createdAt`, `updatedAt`)

### 2. `Skill` (`Backend/src/models/Skill.js`)
- `name` (String, required, trim)
- `slug` (String, required, unique, lowercase, trim)
- `description` (String, default: `''`)
- `category` (String, required, enum: `['frontend', 'backend', 'devops', 'database', 'mobile', 'ai-ml', 'cloud', 'security', 'other']`, default: `'other'`)
- `difficulty` (String, enum: `['beginner', 'intermediate', 'advanced']`, default: `'intermediate'`)
- `aliases` ([String], default: `[]`)
- `isPersonal` (Boolean, default: `false`) - True if created by an individual user
- `createdBy` (ObjectId, ref: `'User'`, default: `null`)
- `timestamps` (true: `createdAt`, `updatedAt`)
- *Index*: `{ name: 'text', description: 'text', aliases: 'text' }`

### 3. `SkillRelationship` (`Backend/src/models/SkillRelationship.js`)
- `fromSkillId` (ObjectId, ref: `'Skill'`, required)
- `toSkillId` (ObjectId, ref: `'Skill'`, required)
- `relationType` (String, required, enum: `['prerequisite', 'related', 'specialization']`)
- `strength` (Number, default: `1.0`, min: `0.1`, max: `1.0`)
- `timestamps` (true)
- *Compound Unique Index*: `{ fromSkillId: 1, toSkillId: 1, relationType: 1 }`

### 4. `UserSkill` (`Backend/src/models/UserSkill.js`)
- `userId` (ObjectId, ref: `'User'`, required)
- `skillId` (ObjectId, ref: `'Skill'`, required)
- `proficiency` (Number, required, min: `1`, max: `5`)
- `verified` (Boolean, default: `false`)
- `timestamps` (true)
- *Compound Unique Index*: `{ userId: 1, skillId: 1 }`

### 5. `Role` (`Backend/src/models/Role.js`)
- `name` (String, required, trim)
- `slug` (String, required, unique, lowercase, trim)
- `description` (String, default: `''`)
- `department` (String, default: `'Engineering'`)
- `timestamps` (true)
- *Index*: `{ name: 'text', description: 'text' }`

### 6. `RoleSkill` (`Backend/src/models/RoleSkill.js`)
- `roleId` (ObjectId, ref: `'Role'`, required)
- `skillId` (ObjectId, ref: `'Skill'`, required)
- `expectedProficiency` (Number, required, min: `1`, max: `5`)
- `importance` (String, required, enum: `['required', 'important', 'nice_to_have']`, default: `'required'`)
- `timestamps` (true)
- *Compound Unique Index*: `{ roleId: 1, skillId: 1 }`

### 7. `Company` (`Backend/src/models/Company.js`)
- `name` (String, required, trim, unique)
- `slug` (String, required, unique, lowercase, trim)
- `logo` (String, default: `''`)
- `industry` (String, default: `'Technology'`)
- `website` (String, default: `''`)
- `description` (String, default: `''`)
- `timestamps` (true)

### 8. `Job` (`Backend/src/models/Job.js`)
- `title` (String, required, trim)
- `companyId` (ObjectId, ref: `'Company'`, required)
- `description` (String, default: `''`)
- `location` (String, default: `'Remote'`)
- `jobType` (String, enum: `['Full-time', 'Part-time', 'Contract', 'Internship']`, default: `'Full-time'`)
- `salary` (String, default: `''`)
- `requiredSkills` ([ObjectId], ref: `'Skill'`, default: `[]`)
- `applyUrl` (String, default: `''`)
- `timestamps` (true)

### 9. `LearningResource` (`Backend/src/models/LearningResource.js`)
- `title` (String, required, trim)
- `url` (String, required, trim)
- `type` (String, enum: `['course', 'video', 'article', 'book', 'documentation']`, default: `'course'`)
- `provider` (String, default: `''`)
- `skillId` (ObjectId, ref: `'Skill'`, required)
- `durationHours` (Number, default: `0`)
- `difficulty` (String, enum: `['beginner', 'intermediate', 'advanced']`, default: `'beginner'`)
- `isFree` (Boolean, default: `true`)
- `timestamps` (true)

### 10. `LearningProgress` (`Backend/src/models/LearningProgress.js`)
- `userId` (ObjectId, ref: `'User'`, required)
- `resourceId` (ObjectId, ref: `'LearningResource'`, required)
- `status` (String, enum: `['not_started', 'in_progress', 'completed']`, default: `'in_progress'`)
- `progressPercent` (Number, min: `0`, max: `100`, default: `0`)
- `startedAt` (Date, default: `Date.now`)
- `completedAt` (Date, default: `null`)
- `timestamps` (true)
- *Compound Unique Index*: `{ userId: 1, resourceId: 1 }`

### 11. `UserTopicProgress` (`Backend/src/models/UserTopicProgress.js`)
- `userId` (ObjectId, ref: `'User'`, required)
- `skillId` (ObjectId, ref: `'Skill'`, required)
- `topicId` (String, required) - e.g. `'html-basics'`, `'css-flexbox'`
- `topicTitle` (String, required)
- `isCompleted` (Boolean, default: `false`)
- `completedAt` (Date, default: `null`)
- `timestamps` (true)
- *Compound Unique Index*: `{ userId: 1, skillId: 1, topicId: 1 }`

---

## 8. Authentication / Authorization
- MongoDB access requires a valid connection string (`MONGODB_URI`), optionally authenticated via username/password credentials.
- Neo4j / CognoDB access requires valid `COGNODB_URI`, `COGNODB_USERNAME`, and `COGNODB_PASSWORD`.
- Schema-level security enforces `select: false` on the `User.password` attribute, preventing credential leakage in standard queries unless explicitly requested using `.select('+password')`.
- Graph administration endpoints (e.g., `/api/skill-graph/sync`) require `authenticate` and `authorize('admin')`.

---

## 9. Dependencies
- `mongoose` (^8.3.4): Connection pooling, schema definitions, query middleware, and schema validation.
- `neo4j-driver` (^6.2.0): Official Bolt protocol driver for Neo4j and CognoDB instances.

---

## 10. Current Workflow
1. **Connection Initialization**:
   - `server.js` calls `connectDB()` in `db.js`.
   - If `USE_GRAPH_DB === 'true'`, it calls `initGraphDriver()` in `cognodb.js` and `verifyGraphConnection()`.
2. **Catalog Verification & Seeding**:
   - `server.js` triggers `seedCatalog()`.
   - If collections are empty, seed catalog inserts 30 skills, 8 skill relationships, 10 roles, associated role skills, 10 companies, 20 jobs, and 30 learning resources.
3. **Graph Sync Check**:
   - `server.js` queries `graphService.getGraphStats()`.
   - Compares node and edge counts in Neo4j against MongoDB counts.
   - If counts mismatch or the graph is unpopulated, executes `graphService.syncMongoToGraph()`.
4. **Runtime Operations**:
   - Controllers execute standard Mongoose CRUD queries.
   - Graph-intensive queries (paths, role sequences) invoke `graphService.js`, which runs Cypher queries against Neo4j or falls back to MongoDB aggregation pipelines.

---

## 11. Current Limitations
- **Dual-Write Consistency**: Real-time two-phase commits across MongoDB and Neo4j are Not currently implemented. Writes directly update MongoDB; Neo4j is only synchronized at startup or via manual `/api/skill-graph/sync` execution.
- **Transaction Support**: Multi-document ACID transactions via MongoDB replica set sessions are Not currently implemented in services.
- **Migration Framework**: Database schema migrations (e.g., `migrate-mongo`) are Not currently implemented; changes rely on Mongoose schema synchronizations on boot.
- **Soft Deletes**: Soft delete patterns (`deletedAt`, `isDeleted`) are Not currently implemented; deletions perform physical Mongoose `findByIdAndDelete` removals.
- **Connection Failure Resilience**: If Neo4j disconnects during runtime, subsequent graph queries fall back to MongoDB, but automatic driver reconnection retry loops for Neo4j are Not currently implemented.

---

## 12. Existing Validation
- **Schema-Level Constraints**: String trimming, lowercase transformation for slugs and emails, required field assertions, enum definitions.
- **Proficiency Bounds**: `min: 1, max: 5` enforced on `UserSkill.proficiency` and `RoleSkill.expectedProficiency`.
- **Strength Bounds**: `min: 0.1, max: 1.0` enforced on `SkillRelationship.strength`.
- **Compound Indexes**: Unique compound indexes prevent duplicate entries at the database level (`userId + skillId`, `userId + resourceId`, `userId + skillId + topicId`, `roleId + skillId`, `fromSkillId + toSkillId + relationType`).

---

## 13. Existing Error Handling
- **Mongoose Connection Failures**: `db.js` logs connection errors and gracefully terminates the process with `process.exit(1)` if initial connection fails.
- **Duplicate Key Errors**: Code `11000` is trapped by `errorMiddleware.js` and converted into a clean `409 Conflict` HTTP response.
- **Invalid ObjectIds**: Mongoose `CastError` exceptions are trapped by `errorMiddleware.js` and converted into `400 Bad Request` ("Invalid <field>: <value>").
- **Neo4j Query Guarding**: All Cypher sessions in `graphService.js` are wrapped in `try...finally { await session.close(); }` blocks to prevent driver connection leaks.

---

## 14. Important Relationships with Other Modules
- **Authentication**: Stores hashed credentials and session-identifying user documents (`User`).
- **Student Profile**: Persists student academic attributes (`college`, `branch`, `yearOfStudy`) and target career bindings (`targetRoleId`).
- **Skills Catalog**: Persists canonical skills (`Skill`), user inventories (`UserSkill`), and visual edges (`SkillRelationship`).
- **Career Roles**: Stores role templates (`Role`) and requirement benchmarks (`RoleSkill`).
- **Learning & Progress**: Stores learning catalog (`LearningResource`), topic checklists (`UserTopicProgress`), and course enrollments (`LearningProgress`).
- **Job Matching**: Stores corporate records (`Company`) and positions (`Job`).
