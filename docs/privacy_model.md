# Privacy model — Phase 1 and 2

**Writing is not encrypted. Use non-sensitive sample content only.**

Entries and the current draft are stored as plaintext in this origin's IndexedDB, on this browser profile. The decorative-motion preference is stored in localStorage. No passphrase, encryption key, account, tracking ID or server database exists. Writing is not submitted to a server or analysed.

Device access, shared browser profiles, developer tools, browser extensions, malicious scripts or compromised software may expose writing. Same-origin browser isolation is not encryption. Browser storage can be cleared or evicted; switching browsers, devices, origins or ports does not transfer the data. No backup or recovery feature is available yet. Uninstalling or clearing site data may lose all writing.

Individual deletion removes application records and associated drafts. Draft discard requires confirmation. These operations do not promise forensic erasure from a device or its backups.

External support links are opened only on user action, with noreferrer. The application does not append writing to links. Tests verify that the representative writing workflow makes no external requests; this is limited evidence, not a security certification.

Phase 3 must introduce an explicitly designed vault: AES-GCM with random nonces, PBKDF2 with random salt and appropriate calibrated work factor, passphrase lock, authenticated versioned backups, import validation and clear-all controls. Address plaintext migration explicitly before making encryption claims. Never persist keys or passphrases. Lost-passphrase and browser-compromise limitations must remain visible. A separate security review is needed before sensitive use.
