# nicelist-2026

A Turborepo monorepo containing:

- **apps/frontend** – Next.js application (static export)
- **infra** – Terraform infrastructure (Cognito, DynamoDB, AppSync, Lambda)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 9+
- [Terraform](https://www.terraform.io/) 1.0+ (for infrastructure)

## Setup

```bash
# Install all dependencies (from repo root)
pnpm install

# Initialize Terraform (optional, for infrastructure)
cd infra && pnpm run validate
```

## Development

```bash
# Run all apps in dev mode
pnpm dev

# Or run individually:
pnpm --filter @nicelist/frontend dev   # Frontend on http://localhost:3000
```

## Build

```bash
pnpm build
```

## Infrastructure (Terraform)

```bash
cd infra

# Validate configuration
pnpm run validate

# Plan changes
pnpm run plan

# Apply changes (requires Terraform state backend configured)
pnpm run apply
```

Add your cloud provider (AWS, GCP, etc.) to `infra/versions.tf` and define resources in `infra/*.tf`. Server-side logic is handled by Lambda functions (e.g. as AppSync resolvers).
