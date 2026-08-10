# SHI repository guidance

SHI (《势》) is a production game repository. Treat every change as shipping work, not as a throwaway prototype.

## Shared-workstation resource policy

- Reuse the single SHI-owned noVNC/Xvfb/x11vnc/websockify stack recorded in `references/private/runtime-handoff.md`; never start a second stack while it is healthy.
- Keep at most one packaged game, emulator, Blender, Unreal Editor, Unity Editor, or heavy build/model job for SHI at a time.
- Before launching a heavy GUI or build, check `free -h`, SHI-owned processes, SHI tmux windows, and the recorded noVNC ports.
- If available RAM is below 24 GiB or swap use exceeds 75%, stop only obsolete SHI-owned runtimes before starting heavy work. Never stop another project's service based only on size.
- Stop a superseded SHI review build after its successor is accepted. Preserve evidence in screenshots, logs, manifests, and commits rather than resident processes.
- When no review is actively waiting for the user, stop the SHI player and its dedicated GUI stack after capturing evidence. Relaunch one stack on demand; an idle desktop is not milestone evidence.
- Keep source assets, saves, evidence, and the current verified build. Retain at most the current and immediately previous reproducible package per milestone unless the user asks otherwise.
- Do not duplicate SDKs, model weights, browser profiles, or source archives when a verified shared installation exists.
- The session that launches a SHI runtime owns its exact cleanup and must update the private runtime handoff after replacement or shutdown.
- Never commit runtime handoffs, browser profiles, credentials, cookies, private session history, caches, DerivedDataCache, Intermediate, Saved, or packaged build trees.

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
