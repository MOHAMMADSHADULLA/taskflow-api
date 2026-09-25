# TaskFlow API

A JWT-authenticated REST API for managing projects and tasks, built with
Node.js + Express. Written as a production-style backend rather than a
tutorial project: token rotation, ownership-based authorization, rate
limiting, centralized error handling, structured logging, and a real
test suite are all in place, not bolted on.

## Why it's built this way

- **JWT access + refresh tokens, with rotation.** Access tokens are
  short-lived (15 min). Refresh tokens are long-lived but stored *hashed*
  in the database (never plaintext) and rotated on every use — using an
  old refresh token after it's been refreshed once fails, which limits
  the damage window if one leaks.
- **Ownership-based authorization, not just authentication.** Every
  project/task route checks `resource.ownerId === req.user.id` before
  returning data — a logged-in user can't read or modify another user's
  projects just by guessing an ID. Covered by tests, not just asserted.
- **SQLite for tests, Postgres for everything else.** The whole test
  suite runs against an in-memory SQLite database (`NODE_ENV=test`), so
  CI needs no database container and tests run in ~5 seconds. Set
  `DATABASE_URL` to a real Postgres connection string for local dev,
  staging, or production — `src/config/database.js` is the only file
  that knows the difference.
- **Centralized, typed error handling.** Every route throws `AppError`
  (or lets an unexpected error bubble up); one middleware turns that into
  a consistent JSON response and logs anything unexpected, so no route
  hand-rolls its own error JSON shape.

## Project layout

```
src/
  config/        env.js, database.js
  middleware/     auth.js, validate.js, rateLimiter.js, errorHandler.js
  models/        User, Project, Task, RefreshToken (Sequelize)
  controllers/   auth, project, task
  routes/        auth, project, task (nested + direct)
  utils/         jwt.js, hash.js, logger.js, AppError.js, catchAsync.js
  app.js         Express app assembly
  server.js       DB connect + listen
tests/            25 Jest + Supertest tests
.github/workflows/ci.yml
Dockerfile
docker-compose.yml   # API + real Postgres, for local dev
```

## API overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create an account, returns token pair |
| POST | `/api/auth/login` | — | Returns token pair |
| POST | `/api/auth/refresh` | — | Rotates refresh token, returns new pair |
| POST | `/api/auth/logout` | — | Revokes a refresh token |
| GET | `/api/projects` | ✅ | List the caller's projects |
| POST | `/api/projects` | ✅ | Create a project |
| GET/PUT/DELETE | `/api/projects/:id` | ✅ (owner only) | Read/update/delete |
| GET | `/api/projects/:id/tasks` | ✅ (owner only) | List tasks in a project |
| POST | `/api/projects/:id/tasks` | ✅ (owner only) | Create a task |
| GET/PUT/DELETE | `/api/tasks/:id` | ✅ (owner only) | Read/update/delete a task |
| GET | `/health` | — | Liveness check |

## Running locally

**Option A — SQLite, zero setup:**
```bash
npm install
cp .env.example .env    # remove/leave DATABASE_URL blank to use SQLite
npm run dev
```

**Option B — real Postgres via Docker:**
```bash
docker compose up --build
```

## Tests

```bash
npm test
```
25 tests: full auth flow (including refresh-token rotation and reuse
rejection), project CRUD, task CRUD, cross-user authorization checks, and
the health endpoint. All run against in-memory SQLite — no external
services required.

## Deploying to AWS (ECS Fargate)

1. **Push the image to ECR**
   ```bash
   aws ecr create-repository --repository-name taskflow-api
   docker build -t taskflow-api .
   docker tag taskflow-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/taskflow-api:latest
   aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/taskflow-api:latest
   ```

2. **Provision Postgres** — Amazon RDS (Postgres, smallest instance is fine
   for a demo) in the same VPC as your ECS service. Note the connection
   string for `DATABASE_URL`.

3. **Store secrets in AWS Secrets Manager or SSM Parameter Store** —
   `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. Don't put
   these in plaintext in the task definition.

4. **Create an ECS Fargate service** pointing at the pushed image, with:
   - Container port `3000` mapped through an Application Load Balancer
   - Health check path `/health`
   - Secrets injected as environment variables from step 3
   - `NODE_ENV=production`

5. **Point a domain at the ALB** (Route 53 + ACM for TLS) if you want a
   real URL to put on your resume/LinkedIn instead of the raw ALB DNS name.

Simpler alternative for a portfolio demo: run the same Docker image on a
single EC2 instance behind an ALB, or skip AWS entirely for the always-on
demo and use Render/Railway (point at the Dockerfile, add a managed
Postgres add-on, set the same env vars) — then do a one-time AWS Fargate
deploy you can screenshot/document for the resume line, if the cost of
keeping it always-on isn't worth it for a demo project.

## Possible extensions

- Add team/collaborator sharing on projects (currently strictly single-owner)
- Swap `sequelize.sync()` for versioned `sequelize-cli` migrations
- Add pagination and filtering (`?status=todo&priority=high`) to task listing
- OpenAPI/Swagger spec generated from the route + validator definitions
