# Private council motion-film review

This checkpoint connects the existing relaxed-gesture Blender study to an opt-in development-only council review. It is not released narrative footage or final acting. The figure does not depict the saved council order; the review says so explicitly.

Enable `VITE_SHI_PRIVATE_COUNCIL_FILM=1` on a loopback development server and add `councilFilm=review` to its URL. Native and production builds do not mount the component. The server serves only the SHA-pinned local study and a fixed English caption, with no-store headers. It does not expose arbitrary runtime files.

The review starts collapsed and has no autoplay. Opening it offers explicit playback; closing it unmounts and pauses the player. Reduced motion uses a text alternative. No campaign decisions, resources, or save bytes are written by these controls.

## Verification and limits

- Web suite: 316 tests passed; TypeScript, production build, and build-boundary validation passed. Initial JS 99.41 KiB, CSS 11.87 KiB, deployment 26.98 MiB.
- Visible run: `.runtime/story-review/2026-10-01T02-26-54.033Z`. Chromium decoded the silent four-second 640×360 film, advanced playback after an explicit pointer action, paused it, and closed it without altering the saved council order. No browser exceptions were recorded.
- **The full route run failed**, later timing out on `council-continue` after the Fan Yang reload. Its failure screenshot shows the chapter ending rather than an open council. Do not count this run as an end-to-end pass; the cause is unresolved. Earlier successful route evidence remains separate.
- Follow-up `.runtime/story-review/2026-10-01T02-36-52.315Z` passed all 83 checks, captured 26 screenshots, and recorded no browser exceptions. It played and paused the pinned film, retained exact saves across council/Fan Yang/retreat cold resumes, and reached the `仍可同行` ending. The controller now waits two animation frames after scrolling before selecting pointer coordinates. This supports a transient scrolling/click timing explanation, but a passing rerun alone does not prove the first failure's root cause. No gameplay code or saved decisions were changed to make it pass.
- Follow-up owned PIDs 1548969, 1549004–1549007 and the same four ports were verified absent. Post-cleanup memory: 57 GiB available, 60/71 GiB swap used. The ending phone screenshot was inspected: reconstructed everyday recovery remains distinct from the recorded historical military outcome.
- Owned runtime PIDs 1480864, 1481123–1481126 and ports 4173, 5921, 6121, 9321 were absent after termination.

Movie SHA-256: `ef86dc9babb6e073949b2285a75bd4cc82703cae8eef55a422b42fe476819345`. Original source, authored pose procedure, motion checks and visual limitations are recorded in `COUNCIL_RELAXED_GESTURE_STUDY_20261001.md`. The study still needs convincing hands, costume, acting, temporal review and narrative staging before asset admission.

LocalVideoGen's studio was unavailable. Its installed H3 lane is not approved for SHI's worldwide release: the [official licence](https://huggingface.co/MiniMaxAI/MiniMax-H3/raw/main/LICENSE) restricts outputs outside the applicable territory. No generation, model download, paid action or store submission was performed.

## Emotional quality gate

The owner's requirement is that the game resonate with people. Film must support an affected person's response to a real saved consequence—not replace that consequence with decoration. Prioritize recurring relationships, remembered promises, unresolved losses and visible debts. Keep historical evidence distinct from reconstructed dialogue and local counterfactual fate. This technical blockout does not establish emotional quality; a coherent scene and human playtest are still required.
