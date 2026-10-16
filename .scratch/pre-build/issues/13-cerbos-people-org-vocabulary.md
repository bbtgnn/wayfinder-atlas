# Cerbos policies for people/organization actions

Type: task
Status: resolved
Blocked by: 01
Map: ../map.md

## Question

Keeping Cerbos for SvelteKit people/organization actions is decided (map Notes). Appwrite research pinned Teams + TablesDB + session/admin clients. Define the action and attribute vocabulary for the four ported policies (`catalog`, `org_admin_console`, `platform_admin_console`, `stream`) against the Appwrite-backed identity adapter so build work can re-base those policies without inventing names mid-flight.

1. Resource kinds and ids (Organization slug = Appwrite team id; Stream; Join request; Organization creation request; Invitation; Role catalog).
2. Principal attributes available from the identity adapter after SSR session resolution (user id, emailVerification, team memberships + roles, Org admin / platform admin standing, labels).
3. Actions per policy file, in GLOSSARY.md vocabulary.
4. Failure mode when Cerbos is unreachable from `apps/web` (deny vs fail-open — pick one).

Record the vocabulary as the answer; amendment/build ports the YAML.

## Answer

Cerbos vocabulary for `apps/web` people/Organization routes matches the engine spike (`spikes/10-engine-surface-outline/types/cerbos.ts`): same principal shape, **deny** when the PDP is unreachable (`cerbos-unavailable` / no fail-open). Unverified sessions do not reach Cerbos-backed handlers (Verification waiting path only, ADR-0010). Org admin standing = Appwrite team membership role `owner` (ADR-0007, Appwrite research).

### 1. Resource kinds and ids

Cerbos `resource.kind` strings are stable snake_case. Resource **id** is the primary key below; scoped rows also carry `organizationSlug` (or equivalent) in `attr` for conditions.

| Kind | Policy file | Resource id | `attr` (minimal) |
| --- | --- | --- | --- |
| `catalog` | `catalog_policy.yaml` | Organization slug (= Appwrite team id) | `organizationSlug` |
| `org_admin_console` | `org_admin_console_policy.yaml` | Organization slug | `organizationSlug` |
| `platform_admin_console` | `platform_admin_console_policy.yaml` | `platform` (singleton) | — |
| `stream` | `stream_policy.yaml` | Stream key (blueprint id, not Stream instance) | `streamKey`, `createdByUserId`, `hasStreamInstances` |
| `organization` | `org_admin_console_policy.yaml` | Organization slug | `organizationSlug` |
| `invitation` | `org_admin_console_policy.yaml` | Appwrite membership id | `organizationSlug`, `inviteeEmail`, `pending` |
| `join_request` | `org_admin_console_policy.yaml` | TablesDB row id | `organizationSlug`, `requesterUserId`, `status` |
| `organization_creation_request` | `platform_admin_console_policy.yaml` | TablesDB row id | `requesterUserId`, `status` |

Rename ported `hasProcesses` → `hasStreamInstances` on `stream` (GLOSSARY **Stream instance**). Slugs obey kernel `^[a-z0-9][a-z0-9-]{0,35}$`.

### 2. Principal (identity adapter after SSR)

Built once per request from session client + account/teams/labels (admin client only where the adapter already uses it for tables, not for Cerbos input).

```typescript
type CerbosWebPrincipal = {
  id: string; // Appwrite user id
  roles: Array<'authenticated' | 'org_admin' | 'platform_admin'>;
  attr: {
    emailVerified: boolean;
    org: string | null; // Affiliation Organization slug (≤ one team)
    roles: string[]; // Organization role slugs on that membership (not `owner`)
    orgAdmin: boolean; // `owner` on affiliation team
    platformAdmin: boolean; // platform admin user label
  };
};
```

**Role derivation:** include `authenticated` only when `emailVerified`; add `platform_admin` when `platformAdmin`; add `org_admin` when `orgAdmin` (policies still require `request.principal.attr.org == request.resource.attr.organizationSlug` for org-scoped resources so platform-wide `org_admin` is impossible). JWT minting for the engine reuses the same `org`, `roles`, `orgAdmin`, `platformAdmin` (kernel spec §8).

### 3. Actions per policy file (GLOSSARY vocabulary)

**`catalog_policy.yaml`** — resource `catalog`:

| Action | Who | Notes |
| --- | --- | --- |
| `view` | Org admin (own Organization), platform admin | Read **Role catalog** |
| `manage` | Org admin (own Organization) | Create/update/delete **Organization role** entries; app keeps ≥ one role |

**`org_admin_console_policy.yaml`** — resources `org_admin_console`, `organization`, `invitation`, `join_request`:

| Resource | Action | Who | Domain term |
| --- | --- | --- | --- |
| `org_admin_console` | `access` | Org admin (scoped org) | Org admin console |
| `organization` | `update_profile` | Org admin | Organization profile / team prefs (includes **Role catalog** payload with `manage`) |
| `organization` | `leave` | Affiliated Member or Org admin | **Leave** (sole Org admin blocked in app) |
| `invitation` | `offer` | Org admin | **Invitation** (session-backed create) |
| `invitation` | `revoke` | Org admin | Cancel pending **Invitation** |
| `invitation` | `accept` | Invitee (email / user match) | Accept **Invitation** |
| `invitation` | `decline` | Invitee | Decline **Invitation** |
| `join_request` | `submit` | Verified registered user | New **Join request** |
| `join_request` | `withdraw` | Requester | **Waiting** — withdraw **Join request** |
| `join_request` | `approve` | Org admin | Approve **Join request** (Member + named roles only) |
| `join_request` | `reject` | Org admin | Reject **Join request** |
| `organization` | `assign_organization_roles` | Org admin | Set **Organization role** slugs on a member |
| `organization` | `remove_member` | Org admin | Remove member (not sole Org admin demotion rules — app) |
| `organization` | `grant_org_admin_standing` | Org admin | Grant **Org admin** (`owner`) |
| `organization` | `remove_org_admin_standing` | Org admin | Remove **Org admin** when another remains |

**`platform_admin_console_policy.yaml`** — resources `platform_admin_console`, `organization_creation_request`:

| Resource | Action | Who | Domain term |
| --- | --- | --- | --- |
| `platform_admin_console` | `access` | Platform admin | Platform admin console |
| `organization_creation_request` | `submit` | Verified registered user | **Organization creation request** |
| `organization_creation_request` | `withdraw` | Requester | **Waiting** — withdraw request |
| `organization_creation_request` | `approve` | Platform admin | Approve; creates Organization + Org admin for requester |
| `organization_creation_request` | `reject` | Platform admin | Reject request |
| `invitation` | `offer` | Platform admin | Platform-initiated **Invitation** (e.g. new org) |
| `stream` | `reload` | Platform admin | Load/reload blueprint YAML (build surface; Cerbos kind `stream` or dedicated check) |
| `category` / `sub_category` | `manage` | Platform admin | **Category** / **Sub-category** taxonomy (separate kinds if build splits policies) |

**`stream_policy.yaml`** — resource `stream` (blueprint **Stream**, not instance):

| Action | Who | Notes |
| --- | --- | --- |
| `edit` | Platform admin; or creator if `hasStreamInstances == false` | Presentation + executable blueprint edits per ADR-0011 rules |
| `delete` | Same as `edit` | Remove blueprint |
| `purge_history` | Platform admin only | Drop instance/history data for that Stream key |

Step **Capability** (`view` / `work` / `seal`) stays on `step_policy.yaml` + kernel only — not these four policies.

### 4. Cerbos unreachable from `apps/web`

**Deny** (same as engine spike): treat as forbidden; do not fail open. Return HTTP **503** with code `cerbos-unavailable` on mutating routes; read-only pages that depend on Cerbos show a safe error state. Log and alert; no cached allow.

Build re-bases the four YAML files to this vocabulary; no YAML change in this ticket.

## Comments
