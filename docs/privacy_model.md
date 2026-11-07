# Privacy model

**Encrypted local prototype, not independently security-reviewed. Use fictional, non-sensitive content until independent review.**

## What is stored

Writing, titles, tags, dates, drafts, reflection responses, graph positions, themes, connections and migration markers are encrypted together. Only a version, algorithm identifiers, work factor, salt, nonce, ciphertext and local concurrency revision are stored in the envelope. Motion and inactivity preferences are non-secret localStorage values. Passphrases and keys are not persisted by the application.

Opaque entry identifiers can appear in local URLs and browser history; browser history, download filenames and infrastructure request metadata are outside the vault encryption boundary. Writing text is never put into a URL.

The browser profile and origin own the data. There is no account, remote writing database, AI request, tracking pixel, analytics, third-party font request or cloud backup. Support resources open only on a user's action, without appended writing or a referrer. A development server still serves app assets and development tooling; privacy of application content is distinct from infrastructure metadata.

## Cryptography

Native Web Crypto: AES-256-GCM, a 128-bit authentication tag, random 96-bit nonce per operation, and schema-specific additional authenticated data. PBKDF2-HMAC-SHA256, 600,000 iterations, random 128-bit salt for a new passphrase key. Keys are non-extractable. Passphrase changes decrypt with the current passphrase for verification, derive a new key with a fresh salt, and re-encrypt atomically. Parameters are fixed and versioned for reproducibility and import resource bounds. This native-browser choice avoids shipping a custom cryptographic implementation, but a memory-hard KDF and device-calibrated work factor deserve independent review.

Backup export produces an authenticated encrypted envelope. Import checks size, format, cryptographic authentication, domain schema and graph references before replacing the current vault, using the current vault's key. Import is a replacement, not a merge, and requires explicit confirmation. Selected-writing export is encrypted with the current vault passphrase; for a reflection it includes its source so references remain valid. Old backups keep their original passphrase and contents after deletion or rekeying.

## Legacy plaintext

The application inspects the earlier database locally without displaying its content in logs or copying it to a remote service. It offers explicit migration on setup and in settings. Declining preserves the original plaintext; setup/settings identify it as such. Migration preserves legacy content and timestamps, and imports an unfinished editing draft separately so the original saved entry is not overwritten. It encrypts a copy before deleting old records. Cleanup compares the source snapshot and refuses to delete changed records. An interrupted cleanup can leave both copies and must be retried. Records changed in the old application are treated as new migration versions. Close all old app tabs first.

Migration/deletion does not prove that disk remnants, device backups, or prior screenshots have been erased. No forensic-erasure claim is made.

## Lock and recovery

Reload starts locked. Manual locking drains queued writes, clears session references and unmounts editors/readers. Default inactivity lock is 15 minutes, adjustable to 5/30 or manual-only. Browser suspension can delay timers. A failed write prevents silent automatic locking; explicit discard locking is available. Other unlocked tabs are independent sessions and must be locked separately. JavaScript cannot guarantee zeroization of strings or garbage-collected objects; clearing references is best effort.

Lost passphrases cannot be reset or recovered. Browser eviction/clearing can erase the vault. Maintain encrypted backups with their passphrases stored separately. A backup may become unrecoverable if its passphrase is lost. Do not rely on a live dev workspace or device as the only copy.

## Limits

Encryption does not protect against active same-origin code, compromised extensions/devices, someone looking at an unlocked screen, weak passphrases, hostile software capturing keystrokes, browser vulnerabilities or malicious updates. Ciphertext size, existence and revisions are visible. Replay/rollback of old valid storage or backups is not detected by a trusted external authority. This project has not been security-audited; automated tests establish limited functional evidence only.
