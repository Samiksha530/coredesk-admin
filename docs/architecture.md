# Architecture

CoreDesk is a standalone Angular 22 application with a separate Node demo API. The code is organized by responsibility and business feature rather than putting every service or interface in one global folder.

```text
src/app/
  app.component.{ts,html,css,spec.ts}
  app.config.ts
  app.routes.ts
  core/
    auth/
      models/         # Session, credentials, roles
      services/       # In-memory access token and cookie-based session restoration
      guards/         # Signed-in routes and admin-only routes
      interceptors/   # Scoped bearer header, single-flight refresh, retry
    http/             # Injectable API base URL
    theme/            # Theme persistence and document-level theme application
  shared/
    components/       # Status badge, async state panel, confirmation dialog
    validators/       # Whitespace validation
    utils/            # Error response normalization
  layout/shell/       # App frame, responsive navigation, current breadcrumb, sign out
  features/
    login/pages/login/
    dashboard/
      pages/dashboard/
      components/revenue-chart/
      models/
      services/
      utils/          # CSV report export
    users/{pages/users,models,services}/
    roles/pages/roles/
    activity/{pages/activity,models,services}/
    settings/{pages/settings,models,services}/
src/styles/           # Global design tokens and shared primitives
src/testing/          # Test-only auth fixtures
server/
  auth/               # HS256 JWT signing/verification and rotating refresh sessions
  server.mjs          # REST routes and local JSON persistence
scripts/dev.mjs       # API + Angular lifecycle in one command
```

Every Angular component has a neighboring TypeScript class, HTML template, CSS stylesheet, and spec file. There are no inline component templates. New components inherit CSS and test-file defaults from Angular CLI configuration.

## Boundaries

Components own presentation, form state, and user actions. Feature services own HTTP endpoints and return typed observables. Domain models live with their feature; authentication models live with authentication. Shared UI does not import business features. The root API base token allows API configuration without hardcoding ports in every service.

Signals hold synchronous view state. Computed signals derive filtering, pagination, SVG paths and access decisions. RxJS handles HTTP work and cancellation. Reporting-period changes use switchMap to prevent a slow earlier response from overwriting the latest selection. Subscriptions tied to pages use takeUntilDestroyed. Components use OnPush and tracked @for loops.

## Styling

Component CSS owns page layout and media queries. Global SCSS is limited to theme tokens and shared primitives such as buttons, typography and tables. No network download is required to compile styles. Browser typography uses the configured font stack and system fallbacks.

## Authentication

Login returns a signed HS256 access JWT with issuer, audience, expiry and session ID. It remains in memory. An eight-hour HttpOnly, SameSite=Strict refresh cookie restores the session after reload and rotates on each refresh. The interceptor refreshes once on 401 and retries the original request; concurrent refreshes share one request. Logout revokes the server session and clears the cookie. Guards control navigation, while the API independently enforces mutation permissions.

The API uses three fixed demo identities. Editable directory records do not provision or modify those identities. This is intentional for a resettable portfolio demo. A real client application should connect an identity provider and a transactional database rather than reuse demo credentials or JSON storage.

## Tradeoffs

- No global state library: this application has a small number of independent feature states.
- Client-side filtering suits 24 seeded users; large datasets need server-side filtering and pagination.
- Seeded analytics demonstrate rendering and reporting, not a real billing integration.
- Native dialog provides focus containment and Escape semantics for delete confirmation.
- API tests run against a temporary directory and do not edit development records.
- Session state is in memory on the API; restarting the server signs everyone out.

## Verification

Unit and component tests cover form validation, filters/pagination, role visibility, HTTP failures, stale-request cancellation, guards, token scoping, refresh/retry, dialogs, preferences and CSV output. API tests cover permissions, CRUD conflicts, JWT tampering/expiry, refresh rotation and logout revocation. CI runs formatting, Angular tests, API tests and production build on Node 24.
