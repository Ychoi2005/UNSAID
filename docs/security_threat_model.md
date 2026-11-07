# Security threat model

Status: design/implementation review by the implementing agent only. **No independent audit, certification, penetration test, or approval for sensitive use.**

## Assets and trust boundaries

Assets: writing, letter text, reflections, tags, timestamps, constellation relationships, passphrases and keys. Boundaries: user/browser UI, JavaScript memory, origin-scoped IndexedDB, exported backup files, application/dependency delivery, and external links. No writing backend or AI boundary exists.

## Threats and mitigations

| Threat                                               | Implemented response                                                                                                           | Residual risk                                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Someone reading browser storage or a backup file     | AES-GCM encrypted document and metadata; no persisted app key/passphrase                                                       | Ciphertext can be copied for offline guessing; weak passphrases remain vulnerable                                                    |
| Password guessing                                    | PBKDF2-SHA256 600,000 iterations and unique random salt; minimum 12 characters                                                 | Not memory-hard, no entropy guarantee or remote rate limiting                                                                        |
| Ciphertext modification                              | GCM authentication, schema validation and fixed version/KDF parameters                                                         | A valid older envelope can be replayed; external rollback detection is absent                                                        |
| Nonce misuse                                         | Native CSPRNG generates a new 96-bit nonce for each encryption, including selected exports                                     | Random collisions are probabilistic; long-term usage limits need cryptographic review                                                |
| Accidental plaintext persistence                     | One encrypted document, encrypted draft writes; no persisted search index or key; request/persistence tests                    | Old declined migration data stays plaintext; memory, DOM, screenshots, extensions and OS swap are outside this protection            |
| Stale-tab writes                                     | Revision comparison in an atomic IndexedDB transaction                                                                         | No merging; local failed changes must be copied, retried or explicitly discarded                                                     |
| Import corruption/resource exhaustion                | File/ciphertext limits, fixed derivation cost, authenticated decrypt, typed domain validation, confirmation before replacement | Large allowed documents can still consume significant CPU/memory; fuzzing remains needed                                             |
| Entry deletion leaving graph references              | Domain cascade deletes affected reflections, drafts, stars and edges                                                           | Backups retain old copies; no forensic-erasure guarantee                                                                             |
| Migration interruption                               | Encrypted save before plaintext cleanup, source comparison and versioned retry markers                                         | Two databases cannot share an atomic transaction; an older app tab can later write plaintext again                                   |
| Unattended unlocked interface                        | Manual and inactivity lock; reload starts locked; private UI unmounted on lock                                                 | Suspended timers, other unlocked tabs, screen capture and memory remnants remain                                                     |
| Injected scripts, malicious update, XSS or extension | React text rendering, no HTML rendering of writing, no external text service, local assets                                     | Encryption is defeated while hostile code runs on an unlocked origin; deployment CSP/headers and supply-chain review are outstanding |
| Data loss                                            | Encrypted backups and import validation; visible save errors and unsaved guards                                                | Browser eviction, lost passwords, failed storage and missing backups can permanently lose data                                       |

## Review gates before sensitive use

Independent cryptography/data-flow review; migration and import fuzzing; manual keyboard/screen-reader and cross-browser validation; origin/deployment/header/CSP review; dependency and update policy; realistic performance/nonce-volume assessment; backup-recovery drills; and testing on actual mobile browsers. These are remaining engineering needs, not certifications implied by this document.

## Evidence and non-evidence

Tests exercise round trips, wrong passphrases, tampering, salt/nonce variation, non-extractable keys, plaintext absence in representative persisted envelopes, encrypted drafts, backups, rekeying, stale writes, migration and graph integrity. Browser tests also observe requests in functional workflows. These checks cannot prove absence of every information leak, implementation defect or environmental compromise. No security certification or clinical benefit is claimed.

Opaque entry IDs may appear in route URLs, browser history and request logs on reload; navigation history is not encrypted by the vault. Writing text and titles are not placed in URLs or export filenames.
