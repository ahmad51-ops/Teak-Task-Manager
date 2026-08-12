# API Endpoints Reference — Team Task Manager

Base URL: `http://localhost:5000`
All routes below are prefixed with `/api/v1`.

**Auth header format** (for any route marked 🔒): `Authorization: Bearer <accessToken>`

---

## Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/health` | — | Server + uptime check |

---

## Auth (`/api/v1/auth`)

| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | `{ name, email, password }` |
| POST | `/api/v1/auth/login` | — | `{ email, password }` |
| POST | `/api/v1/auth/refresh-token` | — (uses `refreshToken` cookie automatically) | none |
| POST | `/api/v1/auth/logout` | — | none |
| GET | `/api/v1/auth/me` | 🔒 | none |

**Notes:**
- `register`/`login` set an httpOnly `refreshToken` cookie and return `accessToken` in the response body.
- Postman auto-sends cookies from the same domain, so `refresh-token` needs no manual setup after login.

---

## Users (`/api/v1/users`)

All routes below require 🔒.

| Method | Endpoint | Role required | Body |
|---|---|---|---|
| GET | `/api/v1/users/profile` | any logged-in user | none |
| PATCH | `/api/v1/users/profile` | any logged-in user | `{ name }` |
| PATCH | `/api/v1/users/change-password` | any logged-in user | `{ currentPassword, newPassword }` |
| POST | `/api/v1/users/avatar` | any logged-in user | form-data, key `avatar`, value: image file |
| GET | `/api/v1/users` | admin, manager | query: `?page=1&limit=20&search=` |
| PATCH | `/api/v1/users/:id/role` | admin only | `{ role: "admin" \| "manager" \| "member" }` |
| PATCH | `/api/v1/users/:id/deactivate` | admin only | none |

---

## Projects (`/api/v1/projects`)

All routes below require 🔒 (logged in). Finer permission checks (owner / project-admin / member) happen per-endpoint inside the service layer.

| Method | Endpoint | Who can call it | Body |
|---|---|---|---|
| POST | `/api/v1/projects` | any logged-in user | `{ name, description }` |
| GET | `/api/v1/projects` | any logged-in user (returns only projects you own or belong to) | query: `?page=1&limit=10` |
| GET | `/api/v1/projects/:id` | project members only | none |
| PATCH | `/api/v1/projects/:id` | project owner or project-admin | `{ name?, description? }` |
| DELETE | `/api/v1/projects/:id` | project owner (or global admin) only | none |
| PATCH | `/api/v1/projects/:id/archive` | project owner or project-admin | none |
| PATCH | `/api/v1/projects/:id/restore` | project owner or project-admin | none |
| POST | `/api/v1/projects/:id/members` | project owner or project-admin | `{ email, role?: "admin" \| "member" }` |
| DELETE | `/api/v1/projects/:id/members/:userId` | project owner or project-admin | none |
| PATCH | `/api/v1/projects/:id/members/:userId/role` | project owner (or global admin) only | `{ role: "admin" \| "member" }` |

---

## Dev-only test routes (`/api/v1/dev`) — TEMPORARY, Phase 3 scaffolding

Only mounted when `NODE_ENV=development`. No auth required — these bypass real validation/business logic and exist purely to poke raw models. Delete `devTestRoutes.js` once `taskRoutes`/`commentRoutes`/`notificationRoutes` exist for real (Phase 7/8).

| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/v1/dev/users` | raw `User` fields |
| GET | `/api/v1/dev/users` | — |
| POST | `/api/v1/dev/projects` | raw `Project` fields |
| GET | `/api/v1/dev/projects` | — |
| POST | `/api/v1/dev/tasks` | raw `Task` fields |
| GET | `/api/v1/dev/tasks` | — |
| POST | `/api/v1/dev/comments` | raw `Comment` fields |
| POST | `/api/v1/dev/notifications` | raw `Notification` fields |

> ⚠️ `/api/v1/dev/users` is now redundant — use `/api/v1/auth/register` instead, since it properly hashes passwords and returns tokens.

---

## Coming in future phases
- `/api/v1/tasks` — Phase 7
- `/api/v1/tasks/:id/comments` (or `/api/v1/comments`) — Phase 8
- `/api/v1/uploads` — Phase 9 (task attachments; avatar upload already live above)
- Real-time socket events — Phase 17
