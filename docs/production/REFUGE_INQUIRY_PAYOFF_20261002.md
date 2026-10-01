# A person at the end of the inquiry

October 2, 2026. Chinese development-web continuation, not released mobile
content or a completed cinematic sequence.

## Player change

The contact scene no longer ends with only a promise of a later scene. Its three
leads now open distinct encounters: return to the house at sunset, investigate
the reed bank independently, or reach the ferry with the guide. Household
dialogue also distinguishes a general message from the identifying record left
with the householder.

A stranger needs a place for the night. The player can spend one available
common ration to obtain shelter, missing the last ferry inquiry, or keep the
food and accompany the stranger to ask about the boat, leaving food and lodging
unresolved. Costs and limits appear before confirmation. The player changes
this person's immediate circumstances without being handed an invented reunion
or a universally correct answer. Zero-food histories retain the escort choice.

This closes a local episode with an actual choice and consequence. It does not
resolve every missing person's fate or add a new historical era. The final
screen states the current playable endpoint rather than offering a dead button.

## Continuity and history

The supplied Tongjian volume-8 extraction was reread at lines 2786–2806 for the
fractured circumstances following Chen Sheng's defeat and death. The local
household, stranger, ferry schedule, dialogue and decisions are reconstruction.
No private book page, modern translation or invented historical quotation is
published. [The review record](../../content/research/refuge-followup-review.v1.json)
pins the source identity, exact reading range and authored-scene hash.

The householder explicitly consents to one night's shelter; helping the
stranger does not repair the player's broken roof promise. Existing grain debts
are not repaid by generosity. Previously disclosed information cannot be taken
back. The guided account is not independent testimony, a matching shoe is not
identification, and the missing companions remain unconfirmed.

## Implementation boundary

[Shared scene](../../content/story-drafts/refuge-followup.v1.json) and
[deterministic rules](../../packages/game-core/src/refuge-followup.ts) derive the
entry by replaying the preceding contact decision. A separate branch- and
revision-bound identifier-only save reconstructs the new consequence. Reading,
selecting, returning and reloading cannot spend another ration or overwrite the
night, morning, contact or retreat records. The previous contact hash is
unchanged. Failed persistence cannot show a successful reaction; incompatible
saves remain intact for recovery rather than silently restarting.

The scene is reachable only through the existing development continuation.
Production validation rejects both its identifier and title if either appears
in released web assets. Native SwiftUI/Unreal follow-up parity is **not yet
implemented**; their previously verified refuge/contact endpoints remain as
they were. No signing, store submission, model generation or public story
approval is implied by this checkpoint.

## Verification

Focused rules tests cover all available prior contact/record/food combinations,
including zero-food recovery, both new outcomes, foreign/stale saves and forged
inventory fields. Existing complete-route tests now carry real chapter,
council, Fan Yang, retreat, night, morning and contact inputs into this scene.
Component tests cover all three entrances and both actions, reload, save
failure/rollback/retry, duplicate inputs, busy navigation, corrupt-save
preservation, keyboard containment and semantic accessibility.

Three final visible routes each passed **124 checks with zero runtime
exceptions**: household/record/sharing, guided-ferry/escort, and independent
reed-bank/sharing. Phone choice and consequence captures were inspected.
Cold reload preserves the committed ration count and every preceding save.
The independent branch visibly retains the broken roof promise even after the
householder admits the stranger. The guided route has a specific shore-to-boat
reaction: the first review caught and corrected a generic line that would have
sent people to a ferry they had already reached. A final zero-food fallback
wording correction is covered by component tests for all three entrances, not a
separate visible zero-food run.

[Phone choice](evidence/refuge-followup-choice-20261002.png) ·
[Guided ferry consequence](evidence/refuge-followup-ferry-20261002.png).
The review record pins the captured bytes and the three browser status hashes.
All three owned desktop stacks were stopped after capture; no idle GUI remains.

Final `npm run build` passed **85 core and 404 web tests**, all content/source
validators and deployment budgets. The production asset scan confirms the new
scene identifier and title are absent. Initial JavaScript remains 99.87 KiB/100
KiB and CSS 11.89 KiB/12 KiB; the public bundle has not acquired this draft.
Existing multilingual README, citation and repository metadata remain intact.

Human enjoyment, pacing, balance, assistive-technology acceptance, native/device
parity and reviewed moving imagery/music remain open.
