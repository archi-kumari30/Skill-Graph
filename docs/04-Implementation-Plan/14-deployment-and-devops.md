# SkillGraph Implementation Plan: Module 14 — Deployment & DevOps

## 1. Module
**14 — Containerization (Docker), Multi-Service Orchestration & CI/CD Pipelines**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - `vercel.json` SPA rewrite configurations at root and in `Frontend/`.
  - Manual local execution via npm scripts (`npm run dev`).
  - Zero containerization artifacts (`Dockerfile`, `docker-compose.yml` absent).
  - Zero continuous integration workflows (no `.github/workflows/` directory).
- **TO BE IMPLEMENTED**:
  - Production-ready `Dockerfile` for `Backend/` (Node.js 18-alpine).
  - Multi-stage `Dockerfile` and `nginx.conf` for `Frontend/` (Vite build + Nginx static server).
  - Root `docker-compose.yml` orchestrating all 4 stack services: `mongodb`, `neo4j`, `backend`, and `frontend`.
  - GitHub Actions automated CI workflow (`.github/workflows/ci.yml`) running automated linter and test suites on push and pull requests.

---

## 3. Objective
Package SkillGraph into a reproducible, one-command containerized stack (`docker-compose up`) and establish an automated CI/CD pipeline, demonstrating DevOps maturity and eliminating setup friction for external reviewers.

---

## 4. Existing Files
- `vercel.json`: Root Vercel SPA routing.
- `Frontend/vercel.json`: Frontend Vercel SPA routing.
- `Backend/package.json`: Backend scripts.
- `Frontend/package.json`: Frontend scripts.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - Create `Backend/Dockerfile`: Backend image specification.
  - Create `Backend/.dockerignore`: Exclude `node_modules` and `.env`.
  - Create `Frontend/Dockerfile`: Multi-stage frontend image.
  - Create `Frontend/nginx.conf`: Nginx configuration with SPA fallback and API proxying.
  - Create `Frontend/.dockerignore`: Exclude `node_modules` and `dist`.
  - Create `docker-compose.yml`: Root multi-container orchestration.
  - Create `.github/workflows/ci.yml`: Automated testing and build validation pipeline.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Persistent named volumes in `docker-compose.yml`: `mongo_data` for MongoDB persistence and `neo4j_data` for graph persistence.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: Local process execution.
- **TO BE IMPLEMENTED**:
  - Create `Backend/Dockerfile`:
    ```dockerfile
    FROM node:18-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --only=production
    COPY . .
    EXPOSE 5000
    USER node
    CMD ["node", "src/server.js"]
    ```

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**: None.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: Vite development server.
- **TO BE IMPLEMENTED**:
  - Create `Frontend/nginx.conf`:
    - Configures port 80 listening.
    - Directs `location /` to `/usr/share/nginx/html` with `try_files $uri $uri/ /index.html;`.
    - Directs `location /api/` to `http://backend:5000/api/` for seamless containerized reverse proxying.
  - Create `Frontend/Dockerfile`:
    - Stage 1 (`build`): Node 18 builds static assets via `npm run build`.
    - Stage 2 (`production`): Nginx Alpine serves static files from `/dist` and applies `nginx.conf`.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Environment credentials.
- **TO BE IMPLEMENTED**:
  - Docker Compose injects development credentials securely using environment blocks with sensible container network hostnames (`mongodb://mongodb:27017/skillgraph`, `bolt://neo4j:7687`).

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Health check directives in `docker-compose.yml`:
    - MongoDB healthcheck using `mongosh --eval "db.adminCommand('ping')"`.
    - Backend healthcheck using `wget -qO- http://localhost:5000/api/health || exit 1`.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - `restart: unless-stopped` policies configured across containers to ensure resilient recovery upon crashes.

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - CI Workflow `.github/workflows/ci.yml`:
    - Step 1: Checkout repository.
    - Step 2: Setup Node.js 18.
    - Step 3: Install backend dependencies and run `npm test`.
    - Step 4: Install frontend dependencies and run `npm test`.
    - Step 5: Validate `docker compose config` syntax.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: Node.js runtimes.
- **TO BE IMPLEMENTED**: Docker Engine (v24+), Docker Compose (v2+).

---

## 15. Implementation Order
1. Create `.dockerignore` files in `Backend/` and `Frontend/`.
2. Create `Backend/Dockerfile`.
3. Create `Frontend/nginx.conf` and `Frontend/Dockerfile`.
4. Create root `docker-compose.yml`.
5. Create `.github/workflows/ci.yml`.
6. Test multi-container startup locally via `docker compose up --build`.

---

## 16. Acceptance Criteria
- **AC-01**: Running `docker compose up --build` boots all 4 services (`mongodb`, `neo4j`, `backend`, `frontend`) without errors.
- **AC-02**: Accessing `http://localhost` renders the SkillGraph frontend, communicates with backend `/api`, and seeds the catalog automatically.
- **AC-03**: Pushing a commit to GitHub triggers the GitHub Actions CI workflow and passes all test suites.
- **AC-04**: Vercel SPA deployment remains fully functional and unaffected by Docker artifacts.

---

## 17. Risks
- **Risk 1 (Neo4j Initial Memory Consumption)**: Neo4j default Java heap allocation can consume 1GB+ RAM in Docker.
  - *Mitigation*: Limit Neo4j memory in `docker-compose.yml` environment: `NEO4J_server_memory_heap_initial__size: 256m` and `NEO4J_server_memory_heap_max__size: 512m`.

---

## 18. Rollback Considerations
- Docker artifacts reside in isolated files (`Dockerfile`, `docker-compose.yml`, `.github/`) and do not modify application runtime code, ensuring zero risk to standard local Node.js development.
