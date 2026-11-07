# UNSAID implementation plan

The repository was empty, with no existing application or commits. This task implements Phase 1 and Phase 2 only.

1. Foundation: strict TypeScript, React, Vite, Tailwind, local system fonts, sidebar navigation, responsive welcome screen, reduced motion, support and preferences.
2. Private writing foundation: IndexedDB persistence, optional title and tags, automatically preserved single draft, manual save, collection search, reading, editing, confirmed deletion and error feedback.
3. Validation: storage lifecycle unit tests, component checks, real-browser lifecycle and mobile/keyboard smoke tests, production build, lint and formatting.

Later phases remain deliberately unavailable: passphrase encryption and backup controls; unsent letters; constellation; reflection prompts and full timeline. Navigation previews explain this status rather than simulate implemented features.

Architecture: UI and routes in `src/app`, shared domain types in `src/types`, local persistence in `src/lib/storage`, styles in `src/styles`. Extract feature components as later phases grow; avoid empty scaffolding or unused visualization dependencies.

This phase is explicitly a non-sensitive prototype. Local-first does not mean encrypted. Do not enter personal or sensitive information until Phase 3 has been implemented and tested.
