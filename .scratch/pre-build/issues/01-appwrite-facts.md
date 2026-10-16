# Appwrite facts for the identity adapter

Type: research
Status: resolved
Blocked by: none
Map: ../map.md

## Question

ADR-0007 makes Appwrite the whole people-and-organizations context and flags two behaviors it could not verify. The identity adapter (`Accounts`, `Organizations`, `Memberships`, `Invitations`, `Requests`) cannot be shaped until these are facts, from Appwrite's own documentation and SDK source, not memory:

1. Does `createMembership` called with a server API key add the member directly, with no accept step? If so, must Invitations be issued with the inviter's session for the invitee to see an accept/decline, and what does that cost the SSR pattern?
2. Does accepting an invitation (`updateMembershipStatus`) mark the user's email verified? `GLOSSARY.md` "Email verification" relies on it.
3. Custom team ids: exact character set, length, and whether a team id can be set on create. Kernel spec §1.1 assumes `^[a-z0-9][a-z0-9-]{0,35}$`.
4. The current database API (TablesDB vs Databases/Collections naming), row-level permission syntax for `Role.user(...)` and `Role.team(id, ['owner'])`, index types, and cursor pagination, enough to define the `join_requests` and `org_creation_requests` tables.
5. The SSR session pattern with `node-appwrite` in SvelteKit: creating a session server-side, storing the secret as an httpOnly cookie on our origin, per-request `setSession`, and how email verification and password recovery links are completed server-side.
6. Membership privacy settings (hiding member names and emails) and whether team prefs are the right place for the role catalog (size limits).

Pin the Appwrite version the answers hold for. Write findings to `docs/research/01-appwrite-facts.md` on branch `research/01-appwrite-facts`, each claim cited.


## Answer

Branch `research/01-appwrite-facts`, file `docs/research/01-appwrite-facts.md`, commit `36ed6f0b7a0160a30db40263eb53649ff4c663dd`.

1. Invitations need Org-admin session (not API-key admin); Join/Org-creation approval can use API key for immediate membership.
2. Invitation accept (and recovery) set `emailVerification`; adapter treats that as leaving the verification waiting path.
3. Keep kernel slug `^[a-z0-9][a-z0-9-]{0,35}$` (strict subset of Appwrite teamId rules).
4. Use TablesDB (not deprecated Databases); row security + `Role.team(slug,'owner')` for Org admin; two tables for Join / Org-creation requests.
5. SSR: httpOnly cookie with session secret on Attesta origin; per-request `setSession`; separate admin `setKey` client.
6. Role catalog in team prefs (64 KiB); membership privacy via console policy; role strings up to 81 chars.

Pins: Appwrite **2.5.0**, `node-appwrite` **29.3.1**. Open empirics: API key on verification/recovery routes; invite-accept session handoff into Attesta cookie.

## Comments
