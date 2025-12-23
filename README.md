## Frontend Template

This repository provides a minimal Next.js template for new frontends with:

- MSAL (Azure AD) authentication with server-side validation
- API proxy to a FastAPI backend using an API key stored on the server
- Generated OpenAPI client (`src/backend-client/types.gen.ts`) and a small demo calling `/api/v2/openai/extract`
- A tiny UI component library and a components gallery page

### How it works

- Auth flow:
  - `src/auth/msal.ts` configures MSAL using environment variables.
  - `src/app/api/auth/login`, `callback`, and `logout` defer to `src/auth/routes/*` helpers; the callback sets an `id_token` httpOnly cookie.
  - `src/auth/tokens.ts` validates `id_token` on the server using the tenant JWKS.
  - `src/proxy.ts` re-exports the guard defined in `src/auth/proxy.ts`, protecting non-public routes and redirecting to login when needed.

- Backend proxy:
  - `src/app/api/[...path]/route.ts` forwards any `/api/*` request to `BACKEND_API_URL` with `x-api-key` set from `BACKEND_API_KEY`.
  - The client never sees the API key; calls use the browser path `/api/*`.

- OpenAPI client:
  - `scripts/update-api-types.js` pulls `<BACKEND_API_URL>/openapi.json` and regenerates both `src/backend-client/types.gen.ts` (raw schema types) and `src/backend-client/sdk/**` (typed endpoint helpers) in one go.
  - `src/backend-client/sdkClient.ts` seeds the generated SDK (`openapi-typescript-codegen`) with `baseUrl: "/api"` so each helper hits the proxy and inherits the `x-api-key` injection. Do **not** call `BACKEND_API_URL` directly from the browser—every request must go through `/api`.
  - `src/backend-client/client.ts` still exposes the low-level `openapi-fetch` client for bespoke calls, but prefer the generated SDK for new endpoints (and still point it at `/api`).

- UI + Pages:
  - `src/components/ui/` contains a minimal set of components (`Button`, `Input`, `Textarea`, `Card`, `Badge`).
  - `src/app/page.tsx` home with login, logout, and links when authenticated.
  - `src/app/components/page.tsx` components gallery (protected).
  - `src/app/extract/page.tsx` extraction demo (protected): upload a PDF, set preprocessing and schema, call `/api/v2/openai/extract`, and display results.

### Authentication System

- **Key components**
  - `src/auth/msal.ts` builds the MSAL confidential client with tenant, client ID, and redirect URIs.
  - `src/app/api/auth/login/route.ts`, `callback/route.ts`, and `logout/route.ts` call into `src/auth/routes/*` for shared logic; the callback sets the `id_token` cookie and handles popup flows.
  - `src/auth/tokens.ts` pulls the Azure JWKS and verifies the `id_token` signature, issuer, audience, and expiry on the server.
  - `src/auth/session.ts` exposes `getSessionOrNull` (read-only access to the decoded token) and `requireSession` (redirects to login when unauthenticated).
  - `src/auth/proxy.ts` is exported via `src/proxy.ts`; it skips public routes (`/`, `/api/auth/*`, static assets) and verifies the `id_token` cookie for everything else.
  - `src/app/(private)/layout.tsx` runs on every protected page request and calls `requireSession()` before rendering the header and page content.

- **Request flow**
  - Browser requests a protected resource → the proxy checks for a valid `id_token` cookie → unauthenticated requests are redirected to `/api/auth/login?next=<original-path>`.
  - Once the callback sets the cookie, the browser is sent back to the original path (or the popup posts a success message and closes).
  - The private layout calls `requireSession()` so protected pages never execute without a verified user; pages that need user details can call `requireSession()` again to access the decoded token.
  - Client components (e.g. the login button) rely on the popup flow and a `postMessage` to refresh once the cookie is set.

- **Protected surface area**
  - All app routes except `/` and the auth API endpoints require login because of the proxy matcher (`/((?!api/auth|_next/static|_next/image|favicon.ico|.*\..*).*)`).
  - Everything under `src/app/(private)/*` goes through the private layout, so the redirect happens server-side even if the matcher changes.
  - API proxy routes under `/api/[...path]` also pass through the proxy layer, so backend calls inherit the same access control.

- **What a new contributor should know**
  - The only session signal is the HTTP-only `id_token` cookie; there is no server-side session store.
  - To bypass auth locally, temporarily comment out the `redirect` inside `requireSession()` or the proxy verification (document the change during debugging).
  - When adding a new public page, either add an exception to `proxy.ts` or place it inside `src/app/(public)`.
  - When adding a new protected page, create it under `src/app/(private)` so the layout enforces the session before rendering.

### Project structure

```
src/
  auth/
    config.ts              # Shared env helpers and constants (cookie name, redirects)
    proxy.ts               # Auth proxy exported through src/proxy.ts
    msal.ts                # Server MSAL client configuration
    routes/
      login.ts             # Start MSAL login
      callback.ts          # Handle callback, set id_token cookie
      logout.ts            # Logout, clear cookie
    session.ts             # Server helpers: getSessionOrNull / requireSession
    tokens.ts              # Verify id_token using JWKS
    ui/
      LoginButton.tsx      # Popup-based login trigger
  backend-client/
    client.ts              # Low-level OpenAPI client (baseUrl=/api)
    sdkClient.ts           # Generated SDK entry that pins baseUrl to /api
    types.gen.ts           # Generated types from FastAPI OpenAPI
    sdk/                   # Typed endpoint helpers (auto-generated)
  app/
    (public)/
      page.tsx             # Landing page with login prompt
    (private)/
      layout.tsx           # Authenticated shell (ensures session + header)
      components/page.tsx  # Components gallery (protected)
      consumptions/page.tsx # Consumptions dashboard (protected)
      evaluate/
        classify/page.tsx  # Evaluate classify flow
        extract/page.tsx   # Evaluate extract flow
      extract/
        page.tsx           # Extract demo (protected)
      classify/
        page.tsx           # Classify demo (protected)
    api/
      [...path]/route.ts   # API proxy to FastAPI, injects x-api-key
      auth/
        login/route.ts     # Start MSAL login
        callback/route.ts  # Handle callback, set id_token cookie
        logout/route.ts    # Logout, clear cookie
    globals.css             # Tailwind v4 styles
  components/
    ui/index.tsx           # Minimal UI kit
    ...
proxy.ts                   # Re-exported auth proxy matcher
```

### Environment variables

Set these in your `.env.local` (never commit secrets):

```
AZURE_AD_TENANT_ID=...
AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_AUTHORITY=https://login.microsoftonline.com/<tenantId>
AZURE_AD_REDIRECT_URI=http://localhost:3000/api/auth/callback
AZURE_AD_SCOPES=openid profile offline_access

BACKEND_API_URL=http://localhost:8000
BACKEND_API_KEY=dev-secret

AZURE_AD_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/
```

### Develop

> [!IMPORTANT]
> This project is pinned to `pnpm@9` through the `packageManager` field. Always manage dependencies with `pnpm` to keep lockfiles and CI in sync.

1. Generate API types from your FastAPI instance (set `BACKEND_API_URL` first so the script knows which `/openapi.json` to fetch):
   - `pnpm update-api-types`
   - This runs the `update-api-types` package script, which executes `scripts/update-api-types.js` to download the OpenAPI schema from `<BACKEND_API_URL>/openapi.json`, regenerate `src/backend-client/types.gen.ts`, and rebuild the typed SDK in `src/backend-client/sdk/**` using `openapi-typescript-codegen`. Import helpers from `src/backend-client/sdkClient` to call endpoints without hand-written wrappers.
2. Run lint to catch React Compiler issues (required before opening a PR):
   - `pnpm lint`
3. Run the app:
   - `pnpm dev` (uses the standard Next.js dev server to avoid Turbopack's current HMR bug after login)
4. Open `http://localhost:3000`.
5. Before pushing sizable changes, run `pnpm build` to ensure the Turbopack production bundle succeeds.

### Deploying to Azure Web Apps

- The GitHub Actions workflows (`.github/workflows/ci.*.yaml`) upload the `.next/standalone` output without `node_modules`. Configure your Web App (Portal → Configuration) with:
  - `SCM_DO_BUILD_DURING_DEPLOYMENT = true`
  - `ENABLE_PNPM = true`
  - `WEBSITE_NODE_DEFAULT_VERSION = ~20`
- With those settings Oryx runs `pnpm install --prod` on the server during deployment, so the app boots via `npm start` (`node server.js`) without shipping a pnpm symlink tree in the artifact.

### Package management

- Run `corepack enable pnpm && pnpm install` the first time you clone the repo (the devcontainer executes this automatically).  
- CI workflows and the deployment packaging step also activate pnpm via Corepack, so local installs share the identical pnpm 9 toolchain and `pnpm-lock.yaml`.
- We intentionally removed `package-lock.json`—if an `npm install` sneaks in and reintroduces it, delete the file and reinstall with pnpm so the workspace stays consistent.

### Generated API SDK

- `src/backend-client/sdk/**` and `src/backend-client/sdkClient.ts` are auto-generated; never edit them manually. Run `pnpm update-api-types` after backend schema changes.
- Import services from `src/backend-client/sdkClient` to get one function per endpoint:

  ```ts
  import { OpenaiService } from "@/backend-client/sdkClient";

  const extract = await OpenaiService.openaiExtractApiV2OpenaiExtractPost({
    payload: /* typed body */,
  });
  ```

- `sdkClient` pins the generated `OpenAPI` config to `baseUrl: "/api"` so every request routes through the Next.js proxy. The proxy adds `x-api-key` with `BACKEND_API_KEY`, so the browser never sees the credential.
- Prefer these helpers over hand-written wrappers in `src/lib` when adding new features and **never** bypass the proxy with a direct fetch to `BACKEND_API_URL`.

### Notes

- The API key is only read on the server in the proxy route; do not expose it client-side.
- MSAL tokens are not forwarded to FastAPI. Auth to the proxy is via a validated `id_token` cookie.
- The component library is intentionally minimal; expand in `src/components/ui/` and showcase in `/components`.
- The app ships as a Progressive Web App (PWA) so users can install it and receive push notifications (details below).

### Progressive Web App & Notifications

The installable shell lives entirely inside this repo so no extra build steps are required:

- `src/app/manifest.ts` exposes `/manifest.webmanifest` with name, icons, start URL, and `"standalone"` display.
- `src/app/layout.tsx` exports `generateMetadata` and `viewport` definitions so browsers have the correct Apple touch icons and theme colors, and it renders `ServiceWorkerRegistrar` to register the worker on the client.
- `public/sw.js` is a plain service worker that precaches the shell, keeps a single app window focused, and renders push notifications (including local previews).

Push registration and UI are encapsulated to keep pages simple:

- `src/lib/push-notifications.ts` hides the service-worker registration, VAPID subscription flow, server sync helpers (`/api/notifications/subscriptions`), and a `previewLocalNotification` helper used for instant feedback.
- `src/components/NotificationSettingsDialog.tsx` surfaces enable/disable/test actions, prompt text, and device labeling. The header imports this dialog so every authenticated user can opt in.

To enable push in a new environment:

1. Generate a VAPID key pair (e.g. with `web-push`) and expose the public portion via `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`.
2. Implement `/api/notifications/subscriptions` on your backend so POST saves a subscription (with the metadata we send) and DELETE removes it.
3. Restart the app (or redeploy) so the env var is available; users can then open the notification dialog and subscribe.

## Environment variables

Set these in your shell/hosting environment (no .env files required):

Required for backend proxy and OpenAPI generation:
- `BACKEND_API_URL`: Base URL of FastAPI backend (e.g. `https://api.example.com`)

Required for MSAL auth:
- `AZURE_AD_CLIENT_ID`
- `AZURE_AD_CLIENT_SECRET`
- `AZURE_AD_TENANT_ID` (or set `AZURE_AD_AUTHORITY`)
- `AZURE_AD_REDIRECT_URI` (e.g. `https://yourapp.com/api/auth/callback`)
- `AZURE_AD_SCOPES` (space/comma separated; added to `openid profile offline_access`)

Optional:
- `AZURE_AD_POST_LOGOUT_REDIRECT_URI` (default: `/`)
- `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`: Base64 URL-safe VAPID public key so browsers can create push subscriptions.

### Local dev examples
```
BACKEND_API_URL=http://localhost:8000 \
AZURE_AD_CLIENT_ID=... \
AZURE_AD_CLIENT_SECRET=... \
AZURE_AD_TENANT_ID=... \
AZURE_AD_REDIRECT_URI=http://localhost:3000/api/auth/callback \
pnpm dev
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
corepack enable pnpm
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
