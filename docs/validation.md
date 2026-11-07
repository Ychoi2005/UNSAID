# Validation evidence

Validated in the current Linux cloud workspace with Node 24, strict TypeScript, Vite and installed Chromium. All writing in tests/screenshots is explicitly fictional. Browser tests use isolated temporary profiles, not a user's personal browser data.

| Check                         | Result                     | Scope                                                                                                                                                                                                                                                                         |
| ----------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest                        | 17 tests passed in 2 files | Crypto, data validation, storage/session lifecycle, serialized writes, drafts, rekey/import/export, stale-tab rejection, graph/reflection integrity, migration/source-change cleanup, locked setup and native dialog component                                                |
| Playwright Chromium           | 11 tests passed            | Full writing lifecycle/reload, wrong passphrase, letters/export, graph drag/layout/themes/connect/disconnect/delete, archive/timeline/reflections, backups/rekey/clear, explicit migration, mobile/reduced motion, screenshots, axe checks, failed-write guards and idle lock |
| TypeScript + production build | Passed                     | `npm run build` runs `tsc -b` before Vite; constellation, settings and reflection are lazy chunks                                                                                                                                                                             |
| ESLint                        | Passed, no warnings        | Application and tests                                                                                                                                                                                                                                                         |
| Prettier                      | Passed                     | Source, configuration and documentation                                                                                                                                                                                                                                       |
| Built-app browser smoke       | Passed                     | Preview of `dist`: vault creation, save, archive, reload/unlock, lazy graph/list; no runtime errors or external requests observed                                                                                                                                             |

After the final error-state refinement, affected browser tests were rerun successfully (backup/rekey/clear, failed-write guards, and idle lock). After preference clearing and request assertions were added, the writing and backup tests were rerun successfully. The actual-application screenshot workflow was refreshed separately.

## What the checks demonstrate

Representative persisted envelopes contain no test titles, writing or passphrase strings. Cryptographic tests use real Web Crypto primitives and exercise authentication failure, key non-extractability and nonce/salt changes. Browser request checks reject external requests, non-read HTTP methods, and writing/title text in request URLs or bodies in the representative writing flow. The built-app smoke independently verifies that the production bundle, not just development modules, can run core features.

Axe ran WCAG 2/2.1/2.2 A/AA-tagged checks across vault setup, Quiet Room, editor, populated archive, letters, settings, sky and constellation list. Contrast findings were corrected without disabling rules. Native modal Escape and mobile overflow were exercised. These checks do not constitute a full accessibility audit.

## Unverified and limited

No independent security audit, penetration test, import fuzzing campaign, forensic-erasure validation, clinical evaluation or user research was performed. No browser engines other than Chromium or physical mobile devices were tested. CSP/deployment hardening, malicious extensions, compromised devices, suspended timers, memory remnants, sophisticated side channels, rollback attacks and large-collection performance need separate evaluation. Tests cannot prove complete secrecy or absence of every network leak.
