# SkillGraph Implementation Plan: Module 02 — Database & CognoDB Dual-Engine

## 1. Module
**02 — Database Layer, Schemas & CognoDB (Neo4j) Dual-Engine Synchronization**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - 11 Mongoose models in `Backend/src/models/`: `User`, `Skill`, `SkillRelationship`, `UserSkill`, `Role`, `RoleSkill`, `Company`, `Job`, `LearningResource`, `LearningProgress`, `UserTopicProgress`.
  - CognoDB (Neo4j Bolt driver) initialized in `Backend/src/config/cognodb.js`.
  - `Backend/src/services/graphService.js` provides full export `syncMongoToGraph()` executed on boot if node/edge counts differ.
- **TO BE IMPLEMENTED**:
  - Incremental, real-time dual-write synchronization: mutating a skill or relationship in MongoDB immediately propagates to Neo4j.
  - Five new Mongoose models:
    - `Topic.js`: Replaces hardcoded topic arrays in `scoring.js` and `Progress.jsx`.
    - `AuthToken.js`: Manages cryptographically hashed refresh tokens and revocation states.
    - `JobApplication.js`: Manages in-app job candidate application states.
    - `ChatMessage.js`: Stores user chat turns with the AI assistant.
    - `AuditLog.js`: Tracks administrative mutations for audit compliance.
  - Schema updates on existing models:
    - `User`: Add `'student'` to `accountRole` enum, add `resetPasswordToken` and `resetPasswordExpires`.
    - `UserSkill`: Add `proofUrl`, `verifiedAt`, `verifiedBy` for skill verification.
    - `Job`: Add structured numeric fields `salaryMin`, `salaryMax`, `salaryCurrency`.
    - `Role`: Add `level: ['junior', 'mid', 'senior', 'all']`.
    - `LearningProgress`: Add `proofUrl`.
  - Cascading cleanup utility preventing dangling ObjectIds upon deletions.

---

## 3. Objective
Upgrade the data tier to support upcoming capabilities, eliminate hardcoded topic dictionaries, establish real-time dual-write graph consistency between MongoDB and CognoDB/Neo4j, and ensure relational integrity through cascading deletion guards.

---

## 4. Existing Files
- `Backend/src/config/db.js`: MongoDB connection manager.
- `Backend/src/config/cognodb.js`: Neo4j driver manager.
- `Backend/src/services/graphService.js`: Dual-engine query executor and sync logic.
- `Backend/src/seed/seedCatalog.js`: Startup catalog seeder.
- All 11 models in `Backend/src/models/`.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - *New Models*:
    - `Backend/src/models/Topic.js`
    - `Backend/src/models/AuthToken.js`
    - `Backend/src/models/JobApplication.js`
    - `Backend/src/models/ChatMessage.js`
    - `Backend/src/models/AuditLog.js`
  - *Modified Models*:
    - `Backend/src/models/User.js`: Add `'student'` enum and password reset fields.
    - `Backend/src/models/UserSkill.js`: Add verification attributes.
    - `Backend/src/models/Job.js`: Add structured salary fields.
    - `Backend/src/models/Role.js`: Add role seniority level.
    - `Backend/src/models/LearningProgress.js`: Add proof URL.
  - *Modified Services & Seeders*:
    - `Backend/src/services/graphService.js`: Add real-time mutating Cypher helper functions (`createGraphSkill`, `deleteGraphSkill`, `createGraphRelationship`, `deleteGraphRelationship`).
    - `Backend/src/seed/seedCatalog.js`: Seed standard topics into the `Topic` collection.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: 11 collections with compound unique indexes.
- **TO BE IMPLEMENTED**:
  1. **`Topic` Schema**:
     - `skillId`: ObjectId, ref: `'Skill'`, required, indexed.
     - `title`: String, required, trim.
     - `slug`: String, required, lowercase, trim.
     - `order`: Number, default: 0.
     - `summary`: String, default: `''`.
     - *Compound Index*: `{ skillId: 1, slug: 1 }` (unique).
  2. **`AuthToken` Schema**:
     - `userId`: ObjectId, ref: `'User'`, required, indexed.
     - `tokenHash`: String, required.
     - `expiresAt`: Date, required, indexed (TTL index for automatic purge).
     - `revoked`: Boolean, default: false.
     - `ipAddress`: String, default: `''`.
     - `userAgent`: String, default: `''`.
  3. **`JobApplication` Schema**:
     - `userId`: ObjectId, ref: `'User'`, required, indexed.
     - `jobId`: ObjectId, ref: `'Job'`, required, indexed.
     - `status`: String, enum: `['applied', 'reviewing', 'interviewing', 'rejected', 'offered']`, default: `'applied'`.
     - `resumeUrl`: String, default: `''`.
     - `notes`: String, default: `''`.
     - `appliedAt`: Date, default: `Date.now`.
     - *Compound Index*: `{ userId: 1, jobId: 1 }` (unique).
  4. **`ChatMessage` Schema**:
     - `userId`: ObjectId, ref: `'User'`, required, indexed.
     - `role`: String, enum: `['user', 'assistant']`, required.
     - `content`: String, required.
     - `isFallback`: Boolean, default: false.
     - `createdAt`: Date, default: `Date.now`, indexed.
  5. **`AuditLog` Schema**:
     - `actorId`: ObjectId, ref: `'User'`, required.
     - `action`: String, required.
     - `targetEntity`: String, required.
     - `targetId`: String, required.
     - `changes`: Object, default: `{}`.
     - `ipAddress`: String, default: `''`.
     - `createdAt`: Date, default: `Date.now`.
  6. **Existing Schema Updates**:
     - `User.accountRole`: `enum: ['admin', 'manager', 'employee', 'student']`.
     - `User.resetPasswordToken`: `String`, `User.resetPasswordExpires`: `Date`.
     - `UserSkill`: `proofUrl: String`, `verifiedAt: Date`, `verifiedBy: ObjectId (ref User)`.
     - `Job`: `salaryMin: Number`, `salaryMax: Number`, `salaryCurrency: { type: String, default: 'USD' }`.
     - `Role`: `level: { type: String, enum: ['junior', 'mid', 'senior', 'all'], default: 'all' }`.
     - `LearningProgress`: `proofUrl: String`.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: Boot-only graph synchronization.
- **TO BE IMPLEMENTED**:
  - Implement granular graph mutating methods in `Backend/src/services/graphService.js`:
    - `upsertSkillNode(skillDoc)`: Runs Cypher `MERGE (s:Skill {id: $id}) SET s.name = $name, s.category = $category`.
    - `removeSkillNode(skillId)`: Runs Cypher `MATCH (s:Skill {id: $id}) DETACH DELETE s`.
    - `upsertRelationshipEdge(relDoc)`: Runs Cypher `MATCH (a:Skill {id: $fromId}), (b:Skill {id: $toId}) MERGE (a)-[r:RELATION {type: $relType}]->(b)`.
    - `removeRelationshipEdge(fromId, toId, relType)`: Runs Cypher `MATCH (a:Skill {id: $fromId})-[r]->(b:Skill {id: $toId}) WHERE type(r) = $relType DELETE r`.
  - Create cascading deletion helper in `Backend/src/utils/cascadeHelper.js` to remove dependent documents across collections when a root entity is deleted.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: `/api/skill-graph/sync` (admin bulk sync).
- **TO BE IMPLEMENTED**:
  - Existing endpoints seamlessly gain real-time Neo4j synchronization without signature changes.
  - New internal database query helpers for upcoming modules.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: No direct frontend changes (data tier).
- **TO BE IMPLEMENTED**: None.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Role checks.
- **TO BE IMPLEMENTED**:
  - `'student'` recognized as a first-class role across all Mongoose queries and route middleware.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: Schema validations.
- **TO BE IMPLEMENTED**:
  - Schema validations on new models: `Topic.slug` regex `^[a-z0-9-]+$`, `JobApplication.status` enum, `Job.salaryMin <= Job.salaryMax`.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: MongoDB duplicate key code `11000` mapping.
- **TO BE IMPLEMENTED**:
  - Real-time graph sync failures logged as non-fatal warnings: if Neo4j is temporarily disconnected during a skill write, MongoDB transaction completes, and an alert is logged to trigger a background resync.

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: Basic health check.
- **TO BE IMPLEMENTED**:
  - Integration tests in `Backend/tests/database.test.js`:
    - Test 1: Verifies new schemas (`Topic`, `JobApplication`, `ChatMessage`) can be instantiated and persisted.
    - Test 2: Verifies unique compound indexes prevent duplicate entries.
    - Test 3: Verifies TTL index on `AuthToken` automatically expires documents.
    - Test 4: Verifies `upsertSkillNode` executes clean Cypher queries without syntax errors.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: `mongoose`, `neo4j-driver`.
- **TO BE IMPLEMENTED**: None additional.

---

## 15. Implementation Order
1. Create new schema files in `Backend/src/models/` (`Topic.js`, `AuthToken.js`, `JobApplication.js`, `ChatMessage.js`, `AuditLog.js`).
2. Update existing schema files (`User.js`, `UserSkill.js`, `Job.js`, `Role.js`, `LearningProgress.js`).
3. Add real-time Cypher mutation helpers in `Backend/src/services/graphService.js`.
4. Update `Backend/src/seed/seedCatalog.js` to seed initial topics for foundational skills.
5. Create `Backend/src/utils/cascadeHelper.js`.
6. Run database test suite to verify schema definitions and indexes.

---

## 16. Acceptance Criteria
- **AC-01**: All 16 Mongoose models load without schema compilation errors.
- **AC-02**: Adding a skill to MongoDB also creates a corresponding node in Neo4j if `USE_GRAPH_DB='true'`.
- **AC-03**: Running `seedCatalog.js` populates the `Topic` collection with sub-topics for HTML, CSS, JavaScript, React, Node.js, Express, and MongoDB.
- **AC-04**: Compound unique indexes are active on all new models.

---

## 17. Risks
- **Risk 1 (Schema Migration Collisions)**: Changing `accountRole` enum might cause Mongoose validation errors on legacy documents if not handled cleanly.
  - *Mitigation*: Enum addition is strictly additive (`['admin', 'manager', 'employee', 'student']`), ensuring all existing documents remain 100% valid.
- **Risk 2 (Dual-Write Latency)**: Waiting for Neo4j Cypher execution on every skill update could slow down API response times.
  - *Mitigation*: Execute Neo4j sync asynchronously or with non-blocking promises so the HTTP response returns immediately after MongoDB confirms write.

---

## 18. Rollback Considerations
- If new schemas fail to register, revert model files.
- Old database records remain compatible because all schema additions utilize default values (`default: ''` or `default: null`).
