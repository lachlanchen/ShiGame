# SHI repository guidance

SHI (《势》) is a production game repository. Treat every change as shipping work, not as a throwaway prototype.

## Structure

- `apps/web/`: React, TypeScript and Three.js playable client.
- `apps/unity/`: Unity 6 project using the shared campaign exports.
- `packages/game-core/`: deterministic campaign rules shared by tools and the web client.
- `content/`: versioned campaigns, schemas, localization and historical-source metadata.
- `assets/`: reviewed source assets and provenance. Do not add unreviewed AI output.
- `docs/`: game design, historical research, art direction, production and roadmap decisions.
- `references/private/`: private source notes and books; always ignored by Git.

## Quality contract

- Preserve historical claim/source boundaries. Mark reconstructed dialogue as dramatization.
- Never commit private books, chat exports, credentials, browser profiles or generated caches.
- Every asset needs provenance, license status, review status and intended use.
- Do not ship generated text, art, video, music or 3D assets without a recorded review.
- Keep gameplay rules deterministic and covered by tests.
- Validate keyboard, mobile layout, reduced motion, contrast, text overflow and RTL behavior.
- Web and Unity clients consume the same versioned campaign data; do not fork narrative truth between engines.
- External paid generation, store submission and public release actions require an explicit visible confirmation.

## Commands

```bash
npm install
npm run validate
npm run test
npm run build
npm run dev
```

Use `scripts/sync-unity-content.mjs` before Unity builds. Run browser smoke tests through the dedicated noVNC profile documented in `docs/production/PLAYTESTING.md`.

## Commits

Inspect `git status --short --branch`, stage only intentional paths, run validation, and use concise imperative commit messages. Explain or ignore every dirty path before finishing.
