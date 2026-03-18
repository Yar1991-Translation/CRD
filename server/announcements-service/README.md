# CRD Announcements Service

This service powers the CRD announcement backend.

## What It Provides

- `GET /api/announcements`
- `GET /api/health`
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/session`
- `GET /api/admin/announcements`
- `POST /api/admin/announcements`
- `PATCH /api/admin/announcements`
- `GET /api/admin/announcements/:id`
- `POST /api/admin/announcements/:id/submit-review`
- `POST /api/admin/announcements/:id/publish`
- `POST /api/admin/announcements/:id/archive`
- `POST /api/admin/announcements/:id/restore`
- `POST /api/admin/platform-resolve`
- `GET /api/admin/users`
- `PATCH /api/admin/users`
- `GET /api/admin/settings`
- `PATCH /api/admin/settings`

## Storage Layout

Runtime data is generated under `server/announcements-service/data/`.

- `announcements/*.json`
- `published.json`
- `users.json`
- `settings.json`
- `platform-cache.json`
- `audit-log.ndjson`

The folder is intentionally gitignored. On first boot the service seeds:

- one published demo announcement
- one draft demo announcement
- three bootstrap users: `owner`, `editor`, `reviewer`

## Bootstrap Credentials

Default passwords are controlled by environment variables. If not provided, the service falls back to:

- `owner / ChangeMe-2026!`
- `editor / ChangeMe-2026!`
- `reviewer / ChangeMe-2026!`

Change them immediately after first deployment.

You can override them with:

- `CRD_ADMIN_OWNER_USERNAME`
- `CRD_ADMIN_OWNER_PASSWORD`
- `CRD_ADMIN_EDITOR_USERNAME`
- `CRD_ADMIN_EDITOR_PASSWORD`
- `CRD_ADMIN_REVIEWER_USERNAME`
- `CRD_ADMIN_REVIEWER_PASSWORD`

## Local Run

```bash
npm run service:announcements
```

Import the existing public JSON into the structured admin store:

```bash
node server/announcements-service/import-public-json.mjs public/announcements.json --replace
```

Optional host and port:

```bash
CRD_ANNOUNCEMENTS_HOST=127.0.0.1
CRD_ANNOUNCEMENTS_PORT=3001
```

## Deploy Shape

- Static frontend: serve `dist/`
- Admin page: serve `dist/admin/index.html` at `/admin/`
- API service: run `server.mjs` behind Nginx
- Proxy `/api/announcements` and `/api/admin/*` to the Node process

## Notes

- Sessions are memory-backed and use an HTTP-only cookie.
- All write requests require the CSRF token returned by `GET /api/admin/session` or the login response.
- Public announcements are regenerated from published records whenever the service mutates data.
