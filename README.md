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
- [ ] Environment configs: dev/staging/prod (M2.5)
- [ ] Deploy backend (Render/Railway) + frontend (Vercel/Netlify)
- [ ] MongoDB Atlas production cluster + network access rules

---

