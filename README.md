# CoreDesk – Enterprise Management Platform

Manage teams, streamline operations, and track performance.

Angular 22, TypeScript & REST API Integration. A portfolio project for freelance client demonstrations.

## Run locally

Requires Node 24.15+ and npm. Open this folder in VS Code.

Terminal 1:
```powershell
npm ci
npm run api
```
Terminal 2:
```powershell
npm start -- --open
```
Visit http://localhost:4200. Accounts: `admin@coredesk.demo`, `manager@coredesk.demo`, `viewer@coredesk.demo`. Password: `Demo@123`.

## Working features

Responsive dashboard, period selection, SVG revenue chart, customer segmentation, CSV export, dark mode, user CRUD, search, filters, sorting, pagination, reactive validation, duplicate email detection, delete confirmation, activity history and local preferences.

Standalone components, lazy routes, signals, computed state, OnPush, typed HttpClient services, functional guards and scoped bearer interceptor. API enforces Admin/Manager/Viewer permissions.

## Structure

- src/app/core: typed models, API/auth service, guards, interceptor and tests
- src/app/layout: responsive shell and navigation
- src/app/features: login, dashboard, users, roles, activity and settings
- server: mock REST API, integration tests, ignored local data

## Checks

```powershell
npm run build
npm run test:ci
npm run test:api
```

## REST API

POST /api/auth/login; GET /api/analytics?period=30|90|365; GET/POST /api/users; PUT/DELETE /api/users/:id; GET /api/audit.

The dev proxy forwards /api to 127.0.0.1:3001. Data persists in server/data/db.json. Sessions expire after eight hours and reset on API restart; sign out and sign in again after restarting. Business analytics are seeded demo values; preferences are browser-local.

## Production boundary

This portfolio demo uses fixed demo credentials and opaque in-memory sessions, not JWT/refresh tokens. For real clients, integrate an identity provider, secure HttpOnly cookies, refresh/revocation, rate limiting, HTTPS, transactional database, monitoring and durable audit storage. Demo account roles are fixed and are independent of editable directory members. Do not enter real personal or client data.

## Presenting to clients

Title: CoreDesk – Enterprise Management Platform.

Show analytics, add a member, search/filter, edit status, view the audit entry, then sign in as Viewer to demonstrate access control. Explain lazy feature boundaries, signals, reactive validation, API authorization and production tradeoffs. Present this as a portfolio project; it does not establish years of professional experience.

Suggested repository: coredesk-admin. GitHub repository and public deployment have not been created.
