# Architecture

## Boundaries

- `src/app`: routing, vault lifetime, application state and idle/close guards. `VaultProvider` retains one session; locking unmounts the private UI and drops session references.
- `src/features/writing`: shared warm-paper thought/letter/reflection editor. A draft overlays a saved entry without changing the saved version until Keep is selected. Reflect on unsaved writing first keeps the source, as indicated by the control's title.
- `src/features/archive`: collection views and shared reading/edit/export/delete dialog. Timeline and letters are different presentations and queries over the same data.
- `src/features/constellation`: lazy-loaded XYFlow rendering, local position interaction and persisted graph commands. List/forms provide nonspatial operations.
- `src/features/reflection`: static prompt library and linked response drafts.
- `src/features/vault`: locked/setup experience, explicit migration, passphrase and backup controls.
- `src/domain`: pure graph, entry, draft and cascade-delete operations.
- `src/lib/crypto`: Web Crypto derivation and AES-GCM envelopes.
- `src/lib/storage`: envelope transactions, serialized session mutations and explicit legacy reading/migration. There is no production plaintext-writing API.
- `src/lib/validation`: versioned backup/data validation and resource limits.
- `src/types`: the domain model, plus read-only legacy schema types.

## Domain model

`Entry` has a UUID, kind (thought/letter/reflection), optional title, body, user tags and timestamps; a reflection also references its source and static question. `VaultData` has separate saved entries and draft overlays, graph nodes/edges and migration markers. Saving creates one star; editing does not duplicate it. Every star's ID equals its entry ID. Stars retain position, theme and creation time. Edges reference stars, carry an optional relationship label and are created only by a user. Deleting a source cascades through its reflection responses, drafts, stars and related edges.

All domain fields are encrypted together. Search, tag filtering, sorting and graph rendering operate only on decrypted in-memory data while unlocked. No plaintext index is persisted.

## Storage and concurrency

IndexedDB `unsaid-encrypted`, version 1, store `vault`, key `primary` contains a versioned encrypted envelope. Each mutation clones the current in-memory document, applies a domain command, validates, encrypts and atomically writes it after comparing its expected revision. Writes serialize in a session. Another tab with a stale revision receives an error; automatic conflict merging is intentionally absent.

The editor preserves drafts per input. Its local input state remains available if persistence fails. The provider guards page closure while writes or errors exist. Router blocking asks before leaving a failed editor; locking with a failed write requires explicit discard. Pending successful writes finish before locking; content is inert during the transition. Session keys and decrypted content are not stored between reloads.

Legacy records remain in `unsaid-writing` until explicit migration/clear consent. Encrypted save precedes a source compare-and-clear transaction. Cross-database atomicity is unavailable; retry markers handle an interrupted cleanup. Old app tabs must be closed to avoid new plaintext writes after migration.

## Dependency purposes

React/React DOM: rendering. React Router: routes and failed-save navigation blocking. idb: typed IndexedDB promises/transactions. Motion: restrained, preference-aware transition. XYFlow: zoom/pan/drag/connect controls and keyboard navigation for real stored stars; imported lazily. Lucide: locally bundled icons. Tailwind/Vite plugin: utility pipeline plus custom editorial styles. Web Crypto is native; there is no custom cipher or remote cryptography service.

TypeScript strict mode/Vite: build. Vitest/Testing Library/fake-indexeddb: unit/component and storage tests. Playwright: real browser workflows. axe-core/Playwright: automated accessibility checks. ESLint/Prettier: code quality. No external fonts, trackers, accounts, AI libraries or server database are included.

## Operational constraints

Serve over HTTPS or a trusted localhost context. Host SPA route fallbacks. No service worker or offline installation is included. Document limit is 20 MB before encryption; envelope limits and fixed derivation parameters reject unbounded backup inputs. Whole-document rewrites trade small-collection simplicity for poor large-archive scaling. Review deployment headers, update process, dependency supply chain and CSP as part of independent review; the Vite development server is not a production privacy boundary.
