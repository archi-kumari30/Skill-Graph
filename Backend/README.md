# SkillGraph Backend

SkillGraph is an intelligent skill-gap analysis, career mapping, and team talent capability visualization platform. It models users, skills, roles, prerequisite hierarchies, learning resources, and maps individuals and teams to target positions deterministically.

---

## 1. Project Overview & Problem Solved
In modern organizations, understanding "who knows what" and "what needs to be learned" is a highly unstructured problem. Skill databases are often static Excel sheets, failing to account for:
- How skills are related to each other (e.g. JavaScript is a prerequisite for React, which in turn is a prerequisite for Next.js).
- The relative importance of skills for target roles.
- Deterministic recommendations for learning paths that resolve prerequisites before suggesting advanced concepts.
- Collective team readiness (combining individual skill sets to assess if a group can fulfill a project or role).

SkillGraph addresses this by implementing a graph-structured capability database using Node.js, Express, and MongoDB/Mongoose.

---

## 2. Technology Stack
- **Node.js**: Server-side runtime.
- **Express.js**: Web framework for building the REST API.
- **MongoDB & Mongoose**: Database and ODM modeling graph-like relationships (UserSkills, SkillRelationships, RoleSkills).
- **JWT (JsonWebTokens)**: Stateless authorization.
- **BcryptJS**: Secure salted password hashing.
- **Helmet, CORS, Express-Rate-Limit**: Backend security, protection against common web vulnerabilities, and request throttling.
- **Morgan**: Detailed HTTP request logging.
- **Jest & Supertest**: End-to-end API integration testing.

---

## 3. Folder Structure
```
Backend/
├── src/
│   ├── config/
│   │   ├── config.js          # Environment config loader
│   │   └── db.js              # Mongoose DB connection pool
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── matchingController.js
│   │   ├── roleController.js
│   │   ├── recommendationController.js
│   │   ├── skillController.js
│   │   ├── skillGapController.js
│   │   ├── skillGraphController.js
│   │   └── teamController.js
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT validation & role-based access checks (RBAC)
│   │   └── errorMiddleware.js # Centralized Mongoose and HTTP error parser
│   ├── models/
│   │   ├── LearningResource.js
│   │   ├── Role.js
│   │   ├── RoleSkill.js
│   │   ├── Skill.js
│   │   ├── SkillRelationship.js
│   │   ├── User.js
│   │   └── UserSkill.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── matchingRoutes.js
│   │   ├── roleRoutes.js
│   │   ├── recommendationRoutes.js
│   │   ├── skillRoutes.js
│   │   ├── skillGapRoutes.js
│   │   ├── skillGraphRoutes.js
│   │   └── teamRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── dashboardService.js
│   │   ├── matchingService.js
│   │   ├── roleService.js
│   │   ├── recommendationService.js
│   │   ├── skillService.js
│   │   ├── skillGapService.js
│   │   ├── skillGraphService.js
│   │   └── teamService.js
│   ├── utils/
│   │   ├── customErrors.js    # Custom HTTP error status extensions
│   │   └── helpers.js         # catchAsync controller wrapper
│   ├── seed/
│   │   └── seed.js            # Mock dataset seeder
│   └── app.js                 # Express application configurations
│   └── server.js              # Port listener and db bootstrapping
├── tests/
│   ├── api.test.js            # Integration tests
│   └── setup.js               # Jest database hooks
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 4. Key Algorithms

### A. Skill-Gap Analysis & Readiness Score
Determining a user's readiness for a role is calculated using a **weighted importance sum**:
1. Every skill required by a role has an **Importance Level** mapped to a numeric weight:
   - `required` = weight `3`
   - `important` = weight `2`
   - `nice_to_have` = weight `1`
2. **Readiness Score Formula**:
   \[
   \text{Readiness Score (\%)} = \left( \frac{\sum_{i} \text{Weight}_i \times \min(\text{CurrentProficiency}_i, \text{RequiredProficiency}_i)}{\sum_{i} \text{Weight}_i \times \text{RequiredProficiency}_i} \right) \times 100
   \]
3. Standardizes a user's gap status per skill:
   - `mastered` if current proficiency $\ge$ required.
   - `needs_improvement` if current proficiency is $>0$ but $<$ required.
   - `missing` if current proficiency is $0$.

### B. Prerequisite-Aware Recommendation Engine
Recommends which skill to learn next. Instead of just ranking by gap size, it uses relationship modeling:
- **Prerequisite Check**: For any skill $S$ with a gap, the algorithm checks its prerequisites. If a prerequisite skill $P$ is also missing (user proficiency is below required or basic level 2), then $P$ is flagged as **unsatisfied**.
- **Score Calculation (0-100)**:
  - Base points by role importance: `required` = 50, `important` = 30, `nice_to_have` = 10.
  - Gap size bonus: $\text{gap} \times 8$.
  - Prerequisite modifier: $+15$ if all prerequisites are satisfied; $-30$ if there are unsatisfied prerequisites.
  - Unlock potential: $+15$ if learning this skill unlocks other skills with gaps in the role.
- Consequently, if a user has gaps in both `React` and `Next.js` and `React` is a prerequisite, `React` will have a high score (satisfied prereqs, unlocks next) while `Next.js` will be heavily penalized (unsatisfied prereqs), recommending `React` first.

### C. Team Capability Analysis & Collective Readiness
1. **Org-wide gaps**: Identifies skills required by company roles that no employee currently possesses, or areas with low average proficiency.
2. **Collective Team Readiness**: Evaluates the team as a single organism for a target role by computing:
   - The maximum proficiency of any team member for each required skill (`teamMaxProficiency`).
   - Identifies the "Lead" (the team member with the highest proficiency).
   - Computes a collective readiness score utilizing the readiness score formula with these maximums.

---

## 5. Environment Variables
Create a `.env` file in the root of the project with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skillgraph
JWT_SECRET=super_secret_skill_graph_jwt_key_12345
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

---

## 6. Installation & Execution

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017)

### Installation
Run the following in the `Backend` directory:
```bash
npm install
```

### Seeding Database
To clear the database and populate it with default programming skills, dependencies, roles, and dummy users:
```bash
npm run seed
```

### Running the Server
```bash
# Production/Development Startup
npm start
```

### Running Tests
To execute Jest and Supertest integration tests against a mock database:
```bash
npm test
```

---

## 7. API Endpoints Documentation

### A. Authentication
- `POST /api/auth/register` - Create user. Excludes password from response. Returns `{ success: true, data: { user, token } }`.
- `POST /api/auth/login` - Login with email and password. Returns token.
- `GET /api/auth/me` - Retrieve current user profile details. (Requires Authorization header).

### B. Users & Profiles
- `GET /api/users` - Retrieve all users. (Admin/Manager only).
- `GET /api/users/:id` - Retrieve user profile. (Owner, Admin, or Manager only).
- `PUT /api/users/:id` - Update user details. (Owner, Admin, Manager only).
- `DELETE /api/users/:id` - Delete user. (Admin only).
- `GET /api/users/:userId/skills` - List user's skills.
- `POST /api/users/:userId/skills` - Assign skill to profile. `{ skillId, proficiency (1-5), yearsOfExperience, source }`.
- `PUT /api/users/:userId/skills/:skillId` - Update user skill level.
- `DELETE /api/users/:userId/skills/:skillId` - Delete skill from user.

### C. Skills & Graph
- `GET /api/skills?search=react&category=frontend` - Get skills with text/category filters.
- `POST /api/skills` - Create skill. (Admin/Manager).
- `GET /api/skill-graph` - Return graph-friendly `{ nodes: [...], edges: [...] }` payload.
- `POST /api/skill-graph/relationships` - Link skills `{ sourceSkillId, targetSkillId, relationshipType, strength }`.

### D. Career Roles
- `GET /api/roles` - List roles.
- `POST /api/roles/:roleId/skills` - Require skill for role `{ skillId, requiredProficiency (1-5), importance }`.

### E. Analysis & Engine
- `GET /api/skill-gap/users/:userId/roles/:roleId` - Perform gap analysis and return readiness score.
- `GET /api/recommendations/users/:userId/roles/:roleId` - Return sorted skill recommendations, satisfied prerequisite checks, and attached learning resources.
- `GET /api/matching/users/:userId/roles` - Rank roles by match score.
- `GET /api/team/skill-analysis` - Return organizational skill aggregates, coverage, and missing skills.
- `GET /api/team/role-readiness/:roleId` - Collective team score and skill leads.
- `GET /api/dashboard/summary` - Central KPIs.

---

## 8. Example Request & Response

### Request: Gap Analysis
`GET /api/skill-gap/users/65c82fb61a34a5d098eef641/roles/65c82fb61a34a5d098eef655`
Header: `Authorization: Bearer <token>`

### Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "65c82fb61a34a5d098eef641",
      "name": "Alice Smith",
      "email": "alice@skillgraph.com"
    },
    "role": {
      "id": "65c82fb61a34a5d098eef655",
      "name": "Frontend Developer",
      "department": "Engineering"
    },
    "readinessScore": 68,
    "matchedSkills": 4,
    "missingSkills": 1,
    "skillsToImprove": 1,
    "skills": [
      {
        "skill": {
          "id": "65c82fb61a34a5d098eef601",
          "name": "JavaScript",
          "category": "Programming"
        },
        "currentProficiency": 3,
        "requiredProficiency": 3,
        "gap": 0,
        "importance": "required",
        "status": "mastered"
      },
      {
        "skill": {
          "id": "65c82fb61a34a5d098eef604",
          "name": "React",
          "category": "Frontend"
        },
        "currentProficiency": 1,
        "requiredProficiency": 4,
        "gap": 3,
        "importance": "required",
        "status": "needs_improvement"
      }
    ]
  }
}
```
