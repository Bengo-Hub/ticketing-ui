# ticketing-ui

Help desk front end for the Codevertex platform: customer portal, agent workspace, admin console, knowledge base and public support pages. Next.js 16 App Router, React 19, Tailwind CSS 4 and `@bengo-hub/shared-ui-lib` v0.1.146, talking to ticketing-api and auth-api.

## Running locally

```sh
pnpm install
pnpm dev
```

The app serves on port 3000. `NEXT_PUBLIC_API_URL` points at ticketing-api and `NEXT_PUBLIC_SSO_URL` at SSO; both default to the production hosts.

Checks: `pnpm typecheck`, `pnpm lint` and `pnpm build`. On Windows, Turbopack refuses the shared-ui-lib `@source` path through the pnpm junction, so local builds use `pnpm next build --webpack`. CI builds with Turbopack on Linux.

## Docker

The `Dockerfile` builds standalone output (`NEXT_STANDALONE=true`) on Node 20 and runs `node server.js` on port 3000.

## Docs

- [Plan, Find Flip Fix, sprint status and known issues](docs/plan.md)
- [Sprints](docs/sprints/)
- [ticketing-api docs](../ticketing-api/docs/plan.md)
