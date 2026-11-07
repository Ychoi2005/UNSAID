# UNSAID — a room rather than an audience

## Why it exists

Some words are easier to write than to say. UNSAID explores a writing product that does not require social participation, classify emotions, or turn reflection into a measure of progress. It is intended for adults who want a self-directed place for thoughts and unsent words. These are product premises, not invented research findings.

## The design problem

The earlier foundation presented a generic night-themed dashboard and several unavailable spaces. The redesign connects the whole product around a reading-and-writing vocabulary: paper, quiet typographic rows, folded letters, marginal dates, and a separate night sky. A first-time user encounters one passphrase-protected space, then one primary writing action. Richer navigation is present without becoming a dashboard.

## Why privacy is central

An intimate writing product cannot treat storage as an implementation detail. The earlier plaintext IndexedDB prototype was explicitly unsuitable for sensitive writing. The new architecture encrypts content and relationships together and makes locking, backup ownership and passphrase loss visible. Legacy writing is migrated only by consent, with ciphertext committed before cleanup. An independent review is still necessary; implementation and functional tests do not establish complete security.

## Why no AI or social layer

Perspective Shift uses nine static questions across gentleness, curiosity and alternative explanations. It asks instead of interpreting. Responses are optional and saved as first-class writing. No AI is called. Any future AI proposal would require a separate opt-in and privacy review. Likes, reactions, public profiles and delivered letters would change the character of the space, so they are intentionally excluded. Letters never leave the local vault through a sending integration.

## How Thought Constellation works

Each saved entry has one encrypted star reference with a user-controlled position and theme. XYFlow provides spatial interaction; custom glyphs, typography and thin lines supply UNSAID's visual language. Users manually connect or disconnect stars and optionally label relationships. Deleting writing also removes its star and edges. An accessible list and nonspatial forms expose the same underlying records without relying on dragging. Nothing about graph shape is treated as a psychological finding.

## Technical trade-offs

A whole-document encrypted envelope simplifies protecting metadata and committing related changes atomically, at the cost of rewriting a collection during drafts. A fixed 20 MB limit makes that trade-off explicit. Native PBKDF2 and AES-GCM avoid a custom crypto implementation but do not replace review of KDF strength, nonce-volume limits or deployment threats. Browser-local ownership removes server retention and account requirements while making backups and lost passphrases the user's responsibility. Optimistic revisions prevent silent stale writes, but do not merge tabs. Migration across two databases has a deliberate copy-before-clear interruption window.

## Future work

Independent cryptographic and deployment review, manual assistive-technology testing, cross-browser and actual-device validation, import/migration fuzzing, more efficient large-archive storage, recovery education, and opt-in usability research without collecting private writing. No user interviews, adoption figures, clinical outcomes or security certifications are claimed.
