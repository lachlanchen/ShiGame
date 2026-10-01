# Explicit, save-inert cinematic skip

The silent player now exposes the existing eleven-language Skip scene label beside Play/Pause. Skip pauses the element, revokes intent, invalidates pending requests and marks presentation `skipped`. It does not seek to duration, start/download media through Play, advance a story scene, choose an order or write storage. The written reaction and enclosing scene's explicit Continue control remain independent. A skipped clip is terminal until its asset changes or the player remounts.

Late play completions and unsolicited playing events cannot restart skipped playback. Late ended/error events preserve the skipped state. The localized finished presentation label describes the closed presentation, not proof that the player watched the clip. No watched/completed campaign flag is recorded.

Verification:20 player tests and two private-film component tests pass, including skip before playback with no storage writes and skip during a pending play promise. TypeScript and production build/boundary validation pass; initial JS99.40 KiB/CSS11.87 KiB/deploy26.98 MiB. Existing extensionless Vite config warning remains. No fresh browser visual review, physical-device skip check, native build or store/public release was performed. Reviewed release media admission remains separate.
