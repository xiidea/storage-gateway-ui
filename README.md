# Storage Gateway UI

A browser-based admin console for [storage-gateway](https://github.com/ronisaha/storage-gateway) — a multi-tenant S3-compatible object storage proxy.

Built with Angular 21, zoneless change detection, and signals. No external UI framework dependencies.

---

## Features

- **Dashboard** — live tenant, store, and access key counts pulled from the API; dependency health (database, Redis)
- **Tenant management** — create tenants; per-tenant page with access key generation/revocation and storage backend configuration
- **Storage backends** — add S3, GCS, R2, Azure Blob, or local filesystem stores per tenant; manage bucket mappings and rotate credentials
- **Settings** — configure the Admin API URL and bearer token (persisted in `localStorage`)
- **Live API status** — sidebar indicator probes `/healthz` every 30 s

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22+ |
| npm | 10+ |
| storage-gateway | running on port `9001` (admin API) |

The gateway must have CORS enabled so the browser can reach the admin API directly. Set the `CORS_ALLOWED_ORIGINS` (or equivalent) config on the server to include your UI origin.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200).

### 3. Configure the connection

Go to **Settings** and set:

- **Admin API URL** — base URL of the running gateway admin API (default: `http://localhost:9001`)
- **Admin Token** — the value of the `ADMIN_TOKEN` environment variable set on the gateway

These are saved to `localStorage` and persist across page reloads.

---

## Docker

### Build the image

```bash
docker build -t storage-gateway-ui .
```

### Run the container

```bash
docker run -p 8080:80 storage-gateway-ui
```

Open [http://localhost:8080](http://localhost:8080), then go to **Settings** to point the UI at your gateway instance.

### Pre-built image

Images are published to the GitHub Container Registry on every push to `main` and on version tags:

```bash
# latest build from main
docker pull ghcr.io/your-org/storage-gateway-ui:latest

# specific release
docker pull ghcr.io/your-org/storage-gateway-ui:1.2.3
```

---

## Project structure

```
src/
  app/
    core/
      interceptors/   # auth bearer token injector
      models/         # TypeScript interfaces (Tenant, Store, AccessKey, …)
      services/       # ApiService, ConfigService, ToastService
    features/
      dashboard/      # overview with live stats
      tenants/        # tenant list + per-tenant detail (keys & stores)
      settings/       # API URL & token configuration
    layout/
      sidebar.ts      # nav + live API status indicator
    shared/
      components/     # ConfirmDialog, Toast
```

---

## Build for production

```bash
npm run build
```

Output is written to `dist/storage-gateway-ui/browser/`. The included `Dockerfile` handles this automatically.

---

## CI / CD

The GitHub Actions workflow at `.github/workflows/docker-publish.yml` builds and pushes the Docker image to `ghcr.io` automatically:

| Trigger | Tags applied |
|---------|-------------|
| Push to `main` | `latest`, `sha-<short>` |
| Push of `v1.2.3` tag | `1.2.3`, `1.2`, `sha-<short>` |

No extra secrets are required — the workflow uses the built-in `GITHUB_TOKEN`.
