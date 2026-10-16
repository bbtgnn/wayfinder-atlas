# Deployment and notary custody

Type: task
Status: resolved
Blocked by: 10
Map: ../map.md

## Question

Engine surface outline pinned notary PEM path + `keyId = ed25519:` + SHA-256(pubkey) hex and `/.well-known/attesta-notary-keys.json`. Decide deployment topology before build:

1. Coolify: two processes (web + engine) behind its proxy — hostnames, internal URLs, TLS termination.
2. Where `ATTESTA_NOTARY_PRIVATE_KEY_PATH` points in local compose vs production; how the key is provisioned/rotated.
3. What rotation means for historical Seals and `verifySeal` (publish old public keys in well-known forever?).
4. Dev key generation one-liner and whether a committed test-only public key is allowed.

## Answer

DRI decisions (user away):

1. Coolify runs **two apps**: `apps/web` and `apps/engine`. Public hostnames: `app.<domain>` → web, `engine.<domain>` → engine (or path-routed `/api` to engine via Coolify proxy). TLS terminates at Coolify. Web calls engine over the internal Coolify network (`http://engine:<port>`), never browser→Mongo. Browser hits web origin for SSR/auth and engine origin (or same-origin reverse proxy) for SSE/WS/blob routes as named in `spikes/10-engine-surface-outline/`.
2. Local: PEM at path named by `ATTESTA_NOTARY_PRIVATE_KEY_PATH` (default `./.local/notary.ed25519.pem`, gitignored). Production: Coolify secret/file mount, same env var; never bake the private key into the image. Generate with `openssl genpkey -algorithm Ed25519 -out "$ATTESTA_NOTARY_PRIVATE_KEY_PATH"`.
3. Rotation: new key gets a new `keyId`; Seals store `keyId` used at seal time; `/.well-known/attesta-notary-keys.json` keeps **all** historical public keys; `verifySeal` looks up by `keyId`. Retire (stop signing) without deleting published publics.
4. Committed **test-only public** key in fixtures is allowed; private keys never committed. Kernel/fixture verify uses the published test public.

## Comments
