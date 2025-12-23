# Cursor Agent Guidelines

These rules describe how code in this repository is organized and how contributions should be made. Follow them whenever you edit or add files.

## Project Overview
- Once a set of changes is verified locally, remind the user to create a commit for the touched files with a descriptive title and body so the history stays meaningful; immediately propose a specific commit subject/body and ask, “Should I create a commit with this message?”—only run `git add`/`git commit` after the user explicitly agrees.
- The project is a Next.js application that uses the App Router located under `src/app`.
- Reusable UI building blocks live under `src/components`; pages and feature modules compose these pieces instead of duplicating markup or logic.
- Shared utilities such as formatting helpers and custom hooks live under `src/lib`.
- API-related code lives under `src/backend-client`, which contains the generated type definitions (`types.gen.ts`), the SDK entry (`sdkClient.ts`), and the low-level client wrapper (`client.ts`).
- Refer to the `Project structure` section of `README.md` for the authoritative directory layout before creating files; mirrors there show where new routes, layout shells, and service files belong.
- Whenever you change architecture, tooling, or workflows, update both `README.md` and this `AGENT.md` in the same PR so contributors never have to guess which source is current.

## Tooling & Package Management
- The repo is pinned to `pnpm@9` via the `packageManager` field in `package.json`. Run `corepack enable pnpm` once and use `pnpm` for every install, script, or dependency change so lockfiles stay deterministic with CI.
- Do **not** run `npm install` or add a `package-lock.json`; if one appears, delete it and reinstall with `pnpm install`.
- Common commands (e.g., `pnpm dev`, `pnpm update-api-types`) must remain defined in `package.json` scripts so local dev, CI, and docs stay aligned; `pnpm update-api-types` regenerates both `src/backend-client/types.gen.ts` and the service SDK in `src/backend-client/sdk/**`.

## Environment Variables
- Local development relies on `.env.local` with the values listed under `Environment variables` in `README.md`. At minimum configure MSAL (`AZURE_AD_*` keys) plus the backend proxy (`BACKEND_API_URL`, `BACKEND_API_KEY`).
- Typical values you must document when creating new features: `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_REDIRECT_URI`, `AZURE_AD_SCOPES`, `AZURE_AD_POST_LOGOUT_REDIRECT_URI`, `BACKEND_API_URL`, `BACKEND_API_KEY`, and `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`.
- Push notifications require `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`; make sure new features reference this helper instead of duplicating env lookups.
- Avoid reading secrets client-side— proxy credentials stay on the server (`/api/[...path]`). Document any new env var in both the README and `.env.example` (if introduced).

## File Placement Rules
- **Pages and route handlers** belong in `src/app/<route>` using the App Router conventions.
- **Reusable React components** go into `src/components`. Prefer colocating subcomponents within a directory module (e.g., `src/components/Table/*`) instead of scattering files across feature folders.
- **Feature-specific compositions** (page-level orchestration) should stay under the relevant route directory in `src/app` and import lower-level pieces from `src/components`.
- **Utility functions, hooks, and constants** that are shared across the app belong in `src/lib`. Keep feature-specific helpers colocated with their feature when they are not widely shared.
- **Assets** (images, icons, PDFs) should be placed in `public` unless they are dynamically generated.

## Component Reuse Expectations
- Before introducing a new component, search `src/components` to verify a suitable primitive already exists; extend it via props rather than duplicating markup.
- If a new reusable building block is needed, add it to `src/components` with a clear, documented API so future features can adopt it.
- When wiring feature pages, compose existing components from `src/components` and do not define React components inline in `src/app` files unless they are trivial wrappers.

## API Integration Rules
- All calls to the backend at `BACKEND_API_URL` must:
  1. Reference the generated types in `src/backend-client/types.gen.ts` to ensure request and response payloads stay in sync with the backend schema.
  2. Go through the `/api` proxy—never call `BACKEND_API_URL` directly from browser/server code in this repo.
  3. Keep API-layer logic (query building, mutations) centralized under `src/backend-client` and expose typed helpers that the rest of the app consumes.
- When creating a new endpoint helper, add or update accompanying types within `types.gen.ts` (regenerate if tooling exists) and ensure the client wrapper returns typed results.
- Prefer the auto-generated services in `src/backend-client/sdkClient` (powered by `openapi-typescript-codegen`) before adding new hand-written wrappers under `src/lib`. They call the proxy (`/api`) and inherit the `x-api-key` injection automatically.
- Use `pnpm update-api-types` whenever backend schema changes; this script runs `scripts/update-api-types.js`, which fetches `<BACKEND_API_URL>/openapi.json`, rebuilds `src/backend-client/types.gen.ts`, and regenerates `src/backend-client/sdk/**`. Never edit generated files by hand—re-run the script instead.

## PWA & Notifications
- The app ships as a PWA. Keep `src/app/manifest.ts`, `src/app/layout.tsx` metadata, and `public/sw.js` in sync when changing icons, colors, or shell behavior. Any new assets referenced in the manifest must exist under `public`.
- Push registration lives in `src/lib/push-notifications.ts` and surfaces through `src/components/NotificationSettingsDialog.tsx`; reuse these helpers when adding notification entry points instead of duplicating service-worker logic.

## State, Data, and Side Effects
- Fetching occurs in `src/backend-client` or server components; client components should depend on typed hooks or helpers rather than calling the API directly.
- Shared state hooks or context providers belong under `src/lib` or `src/components` (for UI-specific state) and should be made reusable across pages.

## Working Pipeline
- When a user makes a request, implement the required changes first before doing any verification.
- Run `pnpm lint` and `pnpm build` with safe mock environment variables so the commands mimic CI without leaking secrets; document whichever placeholders you needed.
- If lint or build fails, fix the issues and re-run the commands until both succeed locally.
- Once lint and build pass, propose a commit subject and body that summarize the change set, and explicitly ask the user to confirm.
- After the user approves the message, stage the touched files (`git add …`) and create the commit with that subject/body.
- When `pnpm build` fails with Turbopack’s `Failed to write page endpoint /_error` port-binding error, stop and ask the user to switch the agent to full-access mode (so Turbopack can bind its worker port) before retrying rather than masking the failure with a different build command.
