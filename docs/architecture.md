# Architecture

React renders a Vite single-page application. React Router maps the quiet room, editor, thought collection, settings, support and future-feature previews. Production hosting must route unknown application paths to index.html.

IndexedDB database `unsaid-writing`, schema version 1:

- `thoughts`: records keyed by UUID, containing title, body, deduplicated tags, creation and update timestamps.
- `drafts`: one current draft, optionally referencing a saved entry.

Writing UI is separated into `src/features/writing`, reusable presentation and dialog components into `src/components`, and routing/preferences/support into `src/app`.

The storage boundary lives in `src/lib/storage/writing.ts`. Editor draft writes are serialized; saving waits for queued writes. Thought save and draft removal share a transaction. Deleting a thought removes a draft referencing that thought in the same transaction. Editing another thought asks before replacing an unrelated draft.

No backend, authentication, service worker, analytics, external fonts, external AI or remote writing storage exists. Browser storage failures are surfaced rather than reported as success. This version assumes one active editing tab; simultaneous edits across tabs can overwrite each other. A tab closing before its latest IndexedDB write commits can lose the last change.

Dependencies: React and React DOM render UI; React Router handles navigation; idb wraps IndexedDB; Motion provides reduced-motion-aware entrance transitions; Lucide supplies bundled icons; Tailwind integrates styling. Vite/TypeScript build, Vitest/Testing Library/fake-indexeddb validate logic and components, Playwright exercises browsers, ESLint/Prettier check quality. XYFlow/D3 and cryptography are not installed because their phases are not in scope.
