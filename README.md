# Team Task Manager — MERN Build Roadmap

A phase-by-phase plan for building a full team task manager (like a mini Jira/Asana), mapped to your M1/M2 curriculum. Check items off as you complete them.

**Stack:** MongoDB, Express.js, React.js, Node.js (MERN)

---

## Phase 0 — Planning
- [ ] Define core entities: User, Project, Task, Comment
- [ ] Sketch relationships (User↔Project, Project↔Task, Task↔Comment)
- [ ] List MVP features vs "later" features
- [ ] Choose repo strategy: monorepo vs separate frontend/backend repos (M2.5)
- [ ] Wireframe key screens (dashboard, project view, task board)

## Phase 1 — Project Setup
- [ ] Initialize backend with `npm init`, folder structure (M1.2)
- [ ] Install core deps: express, mongoose, dotenv, cors, helmet
- [ ] Set up `.env` + `dotenv` config (M1.2)
- [ ] Configure nodemon for dev (M1.2)
- [ ] Git init, `.gitignore`, initial commit

## Phase 2 — Backend Foundation
- [ ] Build Express app skeleton, middleware pipeline (M1.3)
- [ ] Standard API response format + global error handler (M1.3)
- [ ] CORS + helmet.js security basics (M1.3)
- [ ] Request logging middleware (M1.2)
- [ ] Health-check route

## Phase 3 — Database
- [ ] MongoDB Atlas cluster + connection string (M1.4)
- [ ] Mongoose connection setup with retry/error handling
- [ ] Define Schemas: User, Project, Task, Comment (M1.4)
- [ ] Embedded docs vs references — decide per relationship (M1.4)
- [ ] Indexes: unique email, text index on task titles (M1.4)

## Phase 4 — Authentication
- [ ] Password hashing with bcrypt (M2.4)
- [ ] Register/Login endpoints
- [ ] JWT signing + verification, access vs refresh tokens (M2.4)
- [ ] httpOnly cookie vs localStorage decision (M2.4)
- [ ] Auth middleware to protect routes (M2.4)

## Phase 5 — User Management
- [ ] Get/update profile endpoints
- [ ] Role-based access control (admin/member) (M2.4)
- [ ] Invite teammates flow
- [ ] Avatar upload (ties into Phase 9)

## Phase 6 — Project Management
- [ ] CRUD for Projects (REST conventions) (M1.3)
- [ ] Add/remove project members
- [ ] Project-level permissions (owner vs member)

## Phase 7 — Task Management
- [ ] CRUD for Tasks, nested under Projects
- [ ] Status/priority fields, assignees
- [ ] Aggregation pipeline for task stats per project (M1.4)
- [ ] Filtering, sorting, pagination (M1.4)

## Phase 8 — Comments
- [ ] CRUD for Comments on Tasks
- [ ] Nested replies (optional, embedded vs referenced) (M1.4)

## Phase 9 — File Uploads
- [ ] Multer setup on backend (M2.5)
- [ ] Cloudinary or S3 integration (M2.5)
- [ ] Attach files to tasks/comments

## Phase 10 — Frontend Foundation
- [ ] Vite + React setup, folder structure (M2.1)
- [ ] Routing skeleton with React Router v6 (M2.2)
- [ ] Axios instance + interceptors (M2.3)

## Phase 11 — Authentication UI
- [ ] Login/Register forms (controlled components) (M2.1)
- [ ] Auth context with useContext (M2.2)
- [ ] PrivateRoute pattern (M2.4)

## Phase 12 — Dashboard
- [ ] Overview stats, recent activity
- [ ] Global state (Zustand/Redux Toolkit) for user/session (M2.3)

## Phase 13 — Project Pages
- [ ] Project list + detail views
- [ ] Member management UI

## Phase 14 — Task Pages
- [ ] Task board (kanban-style) or list view
- [ ] Task detail modal/page, comments thread

## Phase 15 — API Integration
- [ ] React Query for data fetching/caching (M2.3)
- [ ] Loading/error/success UI states
- [ ] Optimistic updates for task status changes (M2.3)

## Phase 16 — Search & Pagination
- [ ] Debounced search input (M2.3)
- [ ] Infinite scroll or paged task lists (M2.3)

## Phase 17 — Real-Time Features
- [ ] Socket.io server setup (M2.5)
- [ ] Live task updates, presence indicators

## Phase 18 — Optimization
- [ ] useMemo/useCallback where it matters (M2.2)
- [ ] Code splitting with React.lazy/Suspense (M2.2)
- [ ] Backend query optimization, indexing review

## Phase 19 — Deployment
- [x] Environment configs: dev/staging/prod (M2.5)
- [ ] Deploy backend (Render/Railway) + frontend (Vercel/Netlify)
- [ ] MongoDB Atlas production cluster + network access rules

---

# Deployment Guide

Architecture: **Client** (React/Vite) on **Vercel**, **Server** (Express) on **Render**, database on **MongoDB Atlas**, files on **Cloudinary**. Frontend and backend live on different domains, so the client talks to the API over `VITE_API_URL` instead of same-origin requests — see `Client/src/api/axios.js` and `Client/src/services/socket.js`.

## Prerequisites

- This repo pushed to GitHub (Render and Vercel both deploy from a connected repo)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (free tier is fine) — create a database user and, under Network Access, allow `0.0.0.0/0` (Render's outbound IPs aren't static on the free plan)
- A [Cloudinary](https://cloudinary.com/) account (cloud name, API key, API secret — already used in dev)
- [Render](https://render.com/) and [Vercel](https://vercel.com/) accounts (both have a free tier and sign in with GitHub)

## 1. Backend on Render

A `render.yaml` blueprint is included at the repo root — Render can read it directly:

1. Render dashboard → **New** → **Blueprint** → connect this repo → Render detects `render.yaml` and proposes a `team-task-manager-api` web service (root dir `Server`, build `npm install`, start `npm start`).
2. It will prompt for the vars marked `sync: false` in the blueprint — fill in the table below. `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` are auto-generated.
3. Deploy. Render assigns a URL like `https://team-task-manager-api.onrender.com` — you'll need it for the frontend's `VITE_API_URL` in step 2, and note it now for `CLIENT_URL` circularity below.

No blueprint? Create the service manually instead: **New → Web Service**, root directory `Server`, build command `npm install`, start command `npm start`, then add the same env vars by hand.

### Server environment variables

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Render sets this automatically — the app already reads `process.env.PORT` |
| `MONGO_URI` | Your Atlas connection string (`mongodb+srv://...`) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Long random strings, unique per environment — never reuse the dev `.env` values |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | `15m` / `7d` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | From your Cloudinary dashboard |
| `GOOGLE_CLIENT_ID` | Optional — omit to disable Google sign-in |
| `CLIENT_URL` | Your Vercel URL, e.g. `https://team-task-manager.vercel.app` — no trailing slash. You'll only know this after step 2, so deploy the backend once, do the frontend, then come back and set this (Render redeploys automatically on env var changes). |

## 2. Frontend on Vercel

1. Vercel dashboard → **Add New → Project** → import this repo.
2. Set **Root Directory** to `Client`. Vercel auto-detects the Vite framework preset (build command `vite build`, output directory `dist`).
3. Add the environment variable below, then deploy.
4. A `vercel.json` in `Client/` rewrites all paths to `index.html` — without it, refreshing a deep link like `/projects/<id>` would 404, since React Router handles that route client-side.

### Client environment variables

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL from step 1, e.g. `https://team-task-manager-api.onrender.com` — no trailing slash, no `/api/v1` suffix |

After the first deploy, go back to Render and set `CLIENT_URL` to this Vercel URL so CORS and the cross-origin cookie (see `authController.js`) accept requests from it.

## 3. Production build

`Client`'s `npm run build` (what Vercel runs) has been verified locally — it produces a `dist/` bundle with no errors. `Server` has no separate build step; `npm start` runs `src/server.js` directly under Node's native ESM support.

## 4. API documentation

See [`API_ENDPOINTS.md`](API_ENDPOINTS.md) for the full route reference (auth, users, projects, tasks) including auth requirements and request bodies.

## 5. Screenshots

_Add screenshots of the running app here once deployed (or running locally) — e.g. Dashboard, Projects board, Task detail. Not included in this pass: this environment has no display and no local MongoDB to run the full stack against._

## Checkpoint

Once both services are deployed and `CLIENT_URL`/`VITE_API_URL` point at each other: register an account at the Vercel URL, confirm login persists across a refresh (tests the cross-origin refresh cookie), create a project and task, and confirm the notification bell and live updates work (tests the Socket.io connection across origins).

