# Local dev environment

Type: task
Status: resolved
Blocked by: none
Map: ../map.md

## Question

Nothing in the repo says how MongoDB, Appwrite and Cerbos run locally, and the Appwrite research and the whole build depend on it. Produce the dev environment so that one command starts the three services and a second verifies them.

Agent part (AFK):

- `docker-compose.yml` (or `compose.yaml`) at the repo root with MongoDB, self-hosted Appwrite (pinned version), and Cerbos loading `cerbos/policies/`; a mail catcher for Appwrite's SMTP so invitation and verification emails are visible locally.
- `.env.example` naming every variable the two apps will need (Appwrite endpoint, project id, API key, Mongo URI, Cerbos address, engine signing key path) without values.
- A `bun run dev:infra` script and a smoke check that the three services answer.
- A short `docs/dev-environment.md`: start, stop, reset, where data lives.

Human part (HITL): a precise checklist for what only the console can do: create the Appwrite project, create the API key with the scopes the adapter needs (teams, users, databases, sessions), point SMTP at the mail catcher, create the two tables, note the project id and key into `.env`. Write the checklist into this issue and walk it with the user.

Resolved when the smoke check passes on the user's machine. The answer records service versions, ports, and where credentials live; later tickets and the build depend on them.

## Answer

### Infra (agent)

- Root `compose.yaml` includes `docker/appwrite/docker-compose.yml` (Appwrite **2.5.0**) plus `attesta-mongodb`, `cerbos`, `mailpit`.
- Scripts: `bun run dev:infra`, `dev:infra:smoke`, `dev:infra:down`, `dev:infra:reset`.
- Docs: `docs/dev-environment.md`. App vars: `.env.example`.

### Versions and ports

| Service | Version | Host ports |
| --- | --- | --- |
| Appwrite | 2.5.0 | 8080 (API/console), 8443 (HTTPS) |
| Attesta MongoDB | 7.0 | 27018 |
| Cerbos | 0.44.0 | 3592 HTTP, 3593 gRPC |
| Mailpit | 1.21 | 8025 UI, 1025 SMTP |

### Credentials

- Appwrite internal DB/redis secrets: `docker/appwrite/.env` (local dev placeholders).
- Project id, API key, TablesDB ids: developer `.env` from `.env.example` after console steps below.
- Engine notary + identity JWT key paths: `.env` only; files under a local `secrets/` (not committed).

### HITL — Appwrite console checklist

1. Open http://localhost:8080 — register first admin if the install wizard appears.
2. Create project **Attesta** (or your chosen name). Copy project ID → `ATTESTA_APPWRITE_PROJECT_ID`.
3. Create API key with scopes: **users.read**, **users.write** (as needed), **teams.read**, **teams.write**, **sessions.write**, **databases.read**, **databases.write** (TablesDB). Copy secret → `ATTESTA_APPWRITE_API_KEY`.
4. **Settings → SMTP**: server `mailpit`, port `1025`, encryption none, no credentials. Confirm mail in Mailpit at http://localhost:8025.
5. **TablesDB**: create database; create tables for Join requests and Organization creation requests; enable row security per ADR-0007. Copy ids → `ATTESTA_APPWRITE_DATABASE_ID`, `ATTESTA_APPWRITE_TABLE_JOIN_REQUESTS`, `ATTESTA_APPWRITE_TABLE_ORG_CREATION_REQUESTS`.
6. Copy `.env.example` → `.env` and fill the `ATTESTA_*` values. Generate Ed25519 key material for `ATTESTA_IDENTITY_JWT_*` and `ATTESTA_NOTARY_*` when implementing apps.

Smoke (`bun run dev:infra:smoke`) validates Mongo TCP, Appwrite `/v1/health/version`, Cerbos health, and Mailpit — not project/API key auth. Use `ATTESTA_APPWRITE_ENDPOINT=http://localhost:8080/v1` (not `127.0.0.1`) so Traefik Host routing matches `_APP_DOMAIN=localhost`.

**Smoke on this machine (2026-10-14):** passed after `bun run dev:infra` — Mongo **27018**, Appwrite **2.5.0** on **8080**, Cerbos **3592**, Mailpit **8025**. If ports are already taken by an older `attesta-*` compose project, stop that stack or remap host ports before starting.

## Comments
