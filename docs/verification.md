# Verification record

- 12 Angular components: every one has TypeScript, HTML, CSS and spec files.
- Strict TypeScript and Angular strictTemplates compile successfully.
- 38 Angular tests across 18 spec files passed.
- 10 Node API/JWT/serverless tests passed, with isolated test data.
- Formatting check passed.
- Production build passed. Two component styles were just above the scaffold 4 kB warning budget, below the 8 kB failure budget; initial JS/CSS transfer estimate is about 84 kB.
- Browser checked: login, cookie-based restoration after reload, logout, viewer action restrictions, user list, native delete dialog/cancel, desktop layout and 390px mobile sidebar.
- On a 390x844 mobile viewport, the sign-out control was inside the viewport (top 764, bottom 830).
- Screenshots are in docs/screenshots.

Public hosting verified at https://coredesk-admin.vercel.app. Real PostgreSQL smoke tests verified persistent users/sessions and refresh/logout across independent repository connections. Local development retains JSON storage. No external identity-provider integration is claimed. See vercel-deployment.md for deployment details.
