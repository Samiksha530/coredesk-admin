# Client demo walkthrough

Portfolio title: **CoreDesk – Enterprise Management Platform**.
Tagline: **Manage teams, streamline operations, and track performance.**

1. Sign in as Admin and explain that all data is seeded demo data.
2. Change the reporting period, inspect charts, and export a CSV report.
3. Add a member with a validated form, then search, filter, sort and paginate.
4. Edit the member and inspect the audit log.
5. Show the delete confirmation and cancel, or remove only your demo record.
6. Sign in as Manager: Admin records cannot be edited and delete actions are unavailable.
7. Sign in as Viewer: browsing is available but mutation actions are hidden; the API rejects forged mutation requests as well.
8. Open code: one component's four files, its service/models, auth guards/interceptor, and tests.
9. Explain access-token expiry, refresh rotation, session restoration, and production limitations.

## Readiness

Implemented: role-based access, signed JWT and refresh, REST CRUD, search/sort/filter/pagination, reactive validation, loading/empty/error panels, Signals/OnPush, responsive styles, colocated component tests, architecture documentation and CI configuration.

Local demo: npm start; http://127.0.0.1:4200.

Release work still required: verify the CI workflow after pushing to GitHub, create the GitHub repository, and configure a public full-stack host. A localhost URL is not a public live demo. A static-only host cannot run the Node API without a separate backend. Public deployment must use HTTPS, a persistent database, a stable signing secret and a production identity policy.
