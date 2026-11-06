# Nicelist 2026

Nicelist is a place for people to keep Christmas wishlists and shop for each other without spoiling surprises. See [`docs/requirements.md`](docs/requirements.md) for the trial specification.

## Monorepo packages

- **`apps/frontend`** (`@nicelist/frontend`) — Next.js 16 static export (`output: "export"`), StyleX, Radix primitives (`radix-ui`), AWS Amplify in the browser, WebMCP tool registration, and Storybook.
- **`apps/extension`** (`@nicelist/extension`) — Chrome Manifest V3 extension that reads the product page the owner is viewing and adds the gift (title, exact URL, price, and selected size/color/variant in the note) via the same Cognito and AppSync API.
- **`infra`** (`@nicelist/infra`) — Terraform in `us-east-1` for Cognito (Lite, SRP + Google), AppSync GraphQL (`infra/schema.graphql` and hand-written JavaScript resolvers in `infra/resolver-src`), on-demand DynamoDB tables with PITR and deletion protection, the Bedrock gift-ideas Lambda, SES identity, and private S3 + CloudFront hosting at `https://nicelist.co`.

## Developer commands

```bash
pnpm install

# Resolver unit tests (Node test runner) and resolver bundling
node --test infra/domain/rules.test.mjs
node infra/scripts/bundle-resolvers.mjs

# Keep generated frontend GraphQL types in sync with infra/schema.graphql
pnpm codegen
node infra/scripts/generate-types.mjs --check

# Typecheck and lint
pnpm --filter @nicelist/frontend exec tsc --noEmit
pnpm --filter @nicelist/frontend lint
pnpm --filter @nicelist/extension lint

# Unit tests (Vitest + React Testing Library in jsdom, plus extension reader tests)
pnpm test:unit

# Build the Chrome extension (output in apps/extension/dist)
pnpm --filter @nicelist/extension build

# Playwright component tests (mounts Storybook composites in Chromium)
pnpm test:ct

# Playwright integration tests (full trial journeys against vendor fixtures)
pnpm test:e2e

# Storybook
pnpm storybook
```

## Terraform and workspaces

Terraform uses the encrypted, versioned S3 backend with a DynamoDB lock table. Copy `infra/backend.hcl.example` to `infra/backend.hcl` (gitignored) and initialize:

```bash
terraform -chdir=infra init -backend-config=backend.hcl
terraform -chdir=infra validate

# Dev stack (API-only: Cognito, AppSync, DynamoDB, ideas Lambda)
terraform -chdir=infra workspace select dev
terraform -chdir=infra plan
node infra/scripts/write-env.mjs   # writes apps/frontend/.env.local from the active workspace

# Production stack (default workspace)
terraform -chdir=infra workspace select default
terraform -chdir=infra plan
```

## Analytics (Google Tag Manager & GA4)

`NEXT_PUBLIC_GTM_ID` is the only analytics build variable. GA4 is configured as a tag inside the GTM container, and the GA4 tag in GTM should read `page_location` from the data layer so share tokens (`?t=`) and list ids (`?id=`) stay scrubbed. When `NEXT_PUBLIC_GTM_ID` is unset, the page loads no container and sends nothing.

## Post-deploy smoke test

```bash
SMOKE_BASE_URL=https://nicelist.co \
SMOKE_LIST_TOKEN=<public-share-token> \
SMOKE_EMAIL=<smoke-user-email> \
SMOKE_PASSWORD=<smoke-user-password> \
pnpm test:smoke
```
