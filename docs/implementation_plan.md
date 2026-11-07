# Full redesign and implementation

The existing Phase 1/2 repository was inspected before implementation. It contained the React foundation, plaintext IndexedDB writing, tests/docs and a clean `main` branch. No unrelated files were overwritten. The redesign replaces the earlier presentation and plaintext-writing APIs while retaining the legacy schema reader and explicit migration path.

## Work delivered

1. New typed entry/draft/graph model; pure domain operations; versioned data validation.
2. Native authenticated encryption, key derivation, envelope-only IndexedDB, serialized writes with revision checks and session locking.
3. Explicit consent-based migration, source compare-and-clear, encrypted backups/import/rekey/clear controls.
4. Editorial shell and warm-paper writing, letters, archive and timeline over one collection.
5. Real XYFlow constellation with custom stars and spatial/nonspatial graph controls.
6. Static optional reflections linked to writing and stored as encrypted records.
7. Responsive/accessibility/error/unsaved polish, automated tests, actual screenshots and documentation.

## Acceptance evidence

| Criterion                    | Implementation / evidence                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| No account                   | Vault setup has only passphrase and local recovery acknowledgement; browser setup test                 |
| Create encrypted vault       | Native Web Crypto + persisted envelope; unit and browser tests                                         |
| Lock/unlock                  | Session drops key/data references; reload starts locked; wrong-passphrase and browser lock tests       |
| Write/edit/delete            | Shared editor, domain commands and confirmation dialogs; storage/browser lifecycle tests               |
| Draft refresh recovery       | Encrypted draft overlays; fresh-session and real reload tests                                          |
| Letters                      | Optional openings, envelope collection, edit/search/encrypted export; browser letter workflow          |
| Constellation                | Real saved-entry stars; browser rendering/dragging and domain integrity tests                          |
| Connections                  | Manual handles and forms, removal controls; domain/browser tests                                       |
| Timeline/archive             | Shared real records with chronology, type/tag/month/search/sort controls; browser workflows            |
| Perspective Shift            | Three modes/nine static questions; encrypted drafts and saved responses; browser test                  |
| Backup round trip            | Authenticated export/import with replacement confirmation; unit/browser tests                          |
| No private-text transmission | No text-processing endpoint or analytics code; observed browser requests in a representative lifecycle |
| Desktop/mobile               | Responsive menu/writing/graph controls; actual Chromium viewport tests and screenshots                 |
| Tests                        | See current outcomes in validation.md; tests are not proof of security                                 |
| Build                        | Strict TypeScript and production Vite build; current outcome in validation.md                          |
| Working navigation           | All seven destinations have real implementations; no coming-soon routes remain                         |
| Privacy limits               | Locked/unlocked notices, settings, README, privacy model and threat model                              |

Independent review, broader browser/device testing, manual assistive-technology testing and deployment hardening remain explicitly outstanding. Functional completeness as a local prototype is distinct from suitability for sensitive use.
