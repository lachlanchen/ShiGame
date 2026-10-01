# Fan Yang: clear recovery after a council replay

Replaying Chen can leave a Fan Yang record bound to an earlier political bargain. The save guard correctly refused to overwrite it, but entry focus scrolled past its warning to disabled orders; the restart action was much farther below. This interruption was observed during signed Android9 qualification.

The web/source successor now presents a focused recovery screen instead of an unusable negotiation. It explains that the record is preserved, offers **Return to Chen**, and places **Restart this scene…** alongside the explanation. Restart still requires a separate confirmation and successful durable save. Cancel, return and Escape preserve the old record. The initial-position metrics are hidden until the player has chosen how to proceed; they are not presented as the earlier save's state.

No rules, save format, historical claims or narrative outcomes changed. The original English/Chinese system copy was reviewed against actual behavior; other locales retain explicitly language-tagged English fallback. This is not full narrative localization or human accessibility acceptance.

## Evidence

- Full production build: **85 core + 416 web tests**, content/conformance/type/accessibility/font/audio checks and bundle budgets pass.
- Component regressions cover damaged and real other-council records, focus, cancel/return, failed replacement rollback, successful retry and unchanged upstream saves. Recovery semantics pass axe in English, Chinese and Arabic fallback.
- Final visible production-browser run: **328 checks, 19 captures, zero runtime exceptions**, including 61 heading-arrival measurements. Four complete routes exercise English390, Chinese320/reduced motion, English1280 and Arabic-shell390 with English scene fallback.
- Real UI council replays produce the incompatible records—no injected saves. The three recovery entries expose the restart action without corrective scrolling. Cancellation, return, Escape, confirmed replacement, legal ending and unchanged chapter/Chen records are checked.
- The alternate bargain has strong civilian protection but insufficient soldiers to accept surrender. The test verifies that refusal and completes withdrawal; it does not bypass the game rule. The first exploratory run wrongly attempted surrender and was rejected. Final complete rerun passed.

[Chinese narrow-phone recovery](evidence/fanyang-recovery-zh-20261002.png) · [English fallback in Arabic phone shell](evidence/fanyang-recovery-en-fallback-20261002.png). These and the final desktop recovery/withdrawal frames were visually inspected. Raw captures and reports remain private.

The browser skill's isolation check also exposed inherited x11vnc wildcard IPv6 listening. The launcher now explicitly disables IPv6 and verifies all four services bind only to IPv4 loopback. The accepted run captured those bindings. Its exact owned processes were stopped and ports verified closed after review.

## Release boundary

This source/web fix is **not in the already-distributed Android9 bundle**, which remains immutable. No new Android upload, TestFlight build, public store promotion or media admission occurred. Installed mobile qualification belongs to a later batched candidate. Continue the consequential crossing-to-council sequence and reviewed scene media; this removes a replay interruption, not the unfinished cinematic-quality gate.
