# Vercel deployment

Live URL: https://coredesk-admin.vercel.app

Frontend: Angular static build. API: Vercel Node.js Function at api/index.mjs. Persistent data and refresh sessions: Neon PostgreSQL. The browser uses same-origin /api requests; refresh cookies remain HttpOnly, Secure and SameSite=Strict.

## Configuration

- Node: 24.x
- Install: npm ci
- Build: npm run build
- Output: dist/coredesk-admin/browser
- Required environment variables: DATABASE_URL and COREDESK_JWT_SECRET (random, at least 32 characters).
- Never commit real environment values. .env.example contains placeholders only.

vercel.json routes /api requests to the function and other unmatched paths to Angular index.html, allowing deep-link refreshes. PostgreSQL migrations and initial demo records are initialized once using a transaction and advisory lock. Users have a unique email constraint. Refresh rotation uses an atomic compare-and-update query. Tokens and sessions work across function instances with the stable signing secret.

Local development without DATABASE_URL retains the JSON repository and in-memory sessions. Hosted deployments refuse to fall back to local filesystem storage.

## Deployment and future updates

The initial release was uploaded directly through the Vercel API because Vercel could not import the GitHub repository through its current Git provider permission. It is a production deployment, not a temporary preview link.

GitHub source updates do not automatically deploy until the repository is connected under Vercel project Settings > Git. Connect Samiksha530/coredesk-admin and select main as the production branch. Authorize Vercel access to that repository when prompted. Do not create another project.

## Verification

Local API/JWT and serverless-route tests pass. A real PostgreSQL smoke test checked durable users and sessions through independent repository connections, CRUD cleanup, rotating refresh tokens and logout revocation. The public URL returned 200 for /login and /dashboard. Public login and user listing worked, and browser login, reload restoration and user management were verified.

These are public demo identities with shared demo records. Do not put client or personal data in the demo. No paid plan was selected by this task.
