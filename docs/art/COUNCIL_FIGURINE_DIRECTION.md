# Council figures and cinematic performance direction

Status: production art and performance contract. It authorizes character blockout and shot work, not a claim of historical reconstruction or approval of generated meshes as final assets.

## Experience target

SHI's council is a conversation between people whose bodies reveal the cost of an order. The player should feel present at wet timber, mud and low firelight—not as an emperor above a strategy table. The two-person composition always has a named speaker and the Keeper/player viewpoint. It must remain intimate enough to read a breath, a hand withholding an object and an unfinished glance, while still letting the wartable and the affected ground occupy the same visual sentence.

The figures are not anonymous pieces. Nor are they heroic statues, collectible miniatures or a shortcut around facial performance. A character can become still under pressure, but the scene must retain breathing, eye focus, weight and intention. No crown, throne, coronation pose, imperial dragon shorthand or hindsight halo is permitted in Chapter I.

## Performance grammar

Each council entrance is built from four restrained beats:

1. **Ground:** establish the material problem before the face—rain on a register, an empty scoop, a drum on its side, a missing object or stones pressed into mud.
2. **Offer:** the speaker places, turns, counts or refuses one object. The hand action makes the question concrete.
3. **Regard:** the speaker finds the Keeper's eyes. This is the dialogue shot; the object and enough environment remain legible.
4. **Space:** after the line, hold long enough for the player to look between person and consequence before command controls ask for input.

Animation must favor asymmetry and interrupted intention over looping gestures. Rain, fatigue and social rank affect posture without becoming pantomime. Reduced-motion mode preserves all four informational beats with cuts and held poses. Subtitles receive a calm negative-space field and are never covered by hands, lips, objective cards or choice prompts.

## Chapter I cast

### The Keeper — fictional player viewpoint

- **Read:** literate field worker inside Qin's levy apparatus, not a court scholar, masked avatar or predestined sovereign.
- **Silhouette:** practical layered work clothing; narrow document satchel; sleeves tied clear of wet slips; no officer crest.
- **Body language:** attends before judging. Hands hover near evidence but do not seize another person's prop. Decisions become visible through a small shift from recording to arranging.
- **Components:** production body, head/hair, tied mantle, satchel, hands and register interaction rig. The face must support a broad but non-prescriptive player identity; first-person/over-shoulder coverage avoids over-defining reactions.
- **Cinematic boundary:** the Keeper never becomes the authored speaker. Return-to-council controls restore the named speaker's eyeline, with the Keeper as camera-side presence.

### Chen Sheng — historical figure; words are dramatized

- **Read:** a *tunzhang* among delayed conscripts becoming a political organizer under mortal pressure, not yet a crowned ruler or polished fantasy general.
- **Silhouette:** rain-heavy travel layers, practical tied hair, worn conscript equipment, grounded stance that can gather a room without parade armor.
- **Opening object/action:** one hand steadies the soaked register; his voice remains quiet while rain occupies the pause after “what are we?”
- **Broken Crossing:** he watches the Keeper place three tally slips—people, provisions, pursuit—on the wet rail. He does not theatrically point at them.
- **Finale:** he draws no paper map. He presses three ordinary stones into mud, then leaves space between them for the Keeper's answer. This shot carries SHI's thesis that power emerges from relation and ground.
- **Reject:** emperor iconography, ornate lamellar invented from later templates, immaculate robes, broad victory gestures, villainous sneer or prophetic certainty about Qin's fall.

### Wu Guang — historical figure; words are dramatized

- **Read:** fellow *tunzhang*, organizer and reader of collective movement—not a generic secondary warrior.
- **Silhouette:** compact readiness; travel layers arranged for work; a distinct shoulder line and center of gravity from Chen Sheng without color-only differentiation.
- **Object/action:** turns the captured drum onto its side and stops it rolling with a palm. The abandoned sounding surface makes his question about why people follow more important than spectacle.
- **Performance:** he listens to off-screen movement and measures time physically. Controlled impatience is allowed; swagger is not.
- **Reject:** permanent weapon-ready pose, shouting at the Keeper, oversized weapon, later cavalry/stirrup language or action-figure armor.

### Aunt Yu — fictional displaced-household leader

- **Read:** experienced organizer of food and households. “Aunt” denotes social relation, not helplessness, comic age or mystical wisdom.
- **Silhouette:** layered working clothes shaped by repeated carrying and weather; firm planted stance; hands made visually important without beautification.
- **Object/action:** places an empty grain scoop beside the register, oriented so the Keeper can see the absence. Her hand stays on it until the rule is spoken.
- **Performance:** economy of motion; direct eye line; fatigue and authority coexist. Her household knowledge changes logistics rather than decorating a moral scene.
- **Reject:** bent caricature, healer/shaman coding, ornamental jewelry, spotless silk, maternal sentimentality or a generic suffering-villager loop.

### Courier Han — fictional Qin relay courier

- **Read:** frightened, observant and operationally useful. His knowledge of sequence, routes and institutional signals creates agency without cleansing the system he served.
- **Silhouette:** lean travel posture, small relay satchel/seal container subject to historical review, weathered hems and a habit of keeping an exit in view.
- **Object/action:** looks first at the blank space where the register was, then at the intended recipient line. No invisible pantomime of holding the missing list.
- **Performance:** scans before committing; breath is shallower than the other speakers; eye movement settles when he turns fear into a routing proposal.
- **Reject:** sly spy stereotype, courtly messenger uniform, comedy cowardice, secret-assassin reveal or moral exposition delivered as certainty.

## Implemented council-lens checkpoint

The first packaged physical-decision-object pass exposed a real composition defect: the original 44° dialogue camera aimed at the proxy head alone, leaving table evidence on the lower frame boundary. The accepted camera keeps the same authored lens and speaker position but lowers focus from `Z = 118 cm` to `Z = 95 cm`. The full speaker proxy, decision plane and palm-sized command weight now coexist without occlusion. This is a camera/blocking admission, not character approval; the BasicShape table and proxy bodies remain intentionally visible red gates.

The command weight is noninteractive and does not become a character prop loop. It establishes the minimum readable hand/object plane that production figures must reach. Before close framing is allowed, each replacement figure must prove wrist/finger deformation, stable contact, eye return and subtitle-safe negative space against this exact 44° composition. Front/back 28° review cameras are development-only asset inspection and cannot substitute for the council performance shot.

## Model and material contract

The current `AShiCouncilFigure` proxy already establishes two persistent slots, separate body/head/mantle components, click collision, stencil identity, transform and eyeline. Production figures must replace assets without changing canonical participant data or order resolution.

- Author in real scale and validate the established floor transform and 44° dialogue lens before detail work.
- Keep body, head/hair, mantle/outer layer and interaction hands separable. Additional satchel or prop components must have named sockets and stable pivots.
- Build deformation-ready shoulder, neck, elbow, wrist, finger and mouth topology. AI-generated topology is never accepted without retopology, symmetry/asymmetry review, UV review and real animation deformation tests.
- Use shared skin/eye base shaders with character-specific authored variation. Cloth, dampness, mud and oxidized metal are material layers, not baked lighting.
- Clothing construction, hair, footwear, fasteners, armor and every identifiable prop require item-level historical review. Plausible-looking output is not evidence.
- Provide gameplay LODs, cinematic LOD or groom policy, physics boundaries, simple interaction collision, lightmap/Nanite decision and texture-channel budget before Unreal approval.
- Preserve silhouette and provenance legibility without relying on red/green or stencil alone.

## Facial, gaze and voice gates

Close dialogue framing is earned only when eyelids, corneal aim, jaw, lips, cheek volume and neck deformation survive neutral, speech and held-breath tests. Until then, framing must remain wide enough that a proxy face is not presented as finished performance.

- Test direct Keeper eye contact, object glance, interrupted glance and return to eye line for every character.
- Lip sync may time authored dialogue but cannot alter, paraphrase or cover it. Historical speakers retain the non-transcript disclosure.
- Naturalistic micro-motion must be evaluated at normal speed; no random blink/noise layer substitutes for intention.
- Voice remains opt-in. Human listening must approve intelligibility, pronunciation, emotional register, fatigue, loudness and subtitle coexistence in every supported language before release.
- MetaHuman, Audio2Face or another facial stack must pass the installed UE 5.8 compatibility and licensing gate before it enters the project. A convincing demo from an older engine is not sufficient.

## Scene and camera acceptance

The opening scene, Broken Crossing and the finale form the minimum cinematic proof:

| Scene | Required readable relation | Failure condition |
| --- | --- | --- |
| Soaked register | Chen Sheng → register → Keeper; rain holds the unanswered beat | Hero pose, unreadable object, or dialogue card isolates face from circumstance |
| Empty scoop | Aunt Yu → absence beside names → Keeper | She is staged as background victim or scoop reads as decoration |
| Captured drum | Wu Guang → silenced drum → moving column beyond | Drum becomes triumph spectacle or fantasy-warrior introduction |
| Missing register | Courier Han → blank space → possible recipient | Invisible-object pantomime or comedy fear |
| Broken Crossing | three tally slips → damaged passage → pursuit pressure | The slips become a paper map or the landscape loses the choice's human debt |
| Finale | three stones → mud/ground → people beyond the table | coronation, victory montage, prophecy or abstract strategy detached from bodies |

For each proof, record dialogue-lens and wider-ground screenshots, reduced-motion parity, subtitle-safe framing, controller/mouse return-to-council behavior, and the exact canonical speaker/provenance disclosure. A human cinematic review must answer: Who needs what? What physical fact makes the choice difficult? What can the player change? What remains unknowable?

## Asset admission path

1. Approve a character/object brief and historical-risk list.
2. Produce silhouette and interaction thumbnails against actual 44°/ground cameras.
3. Build a neutral gray blockout with the required prop and validate eyeline, hands, collision and subtitles in Unreal.
4. Review clothing construction, anatomy and props before high-detail work.
5. Retopologize, UV and texture from editable source; keep source/tool/model/license/seed/input/output provenance.
6. Test expressions, speech, object contact, wet materials, LODs, reduced motion and all supported display scales.
7. Package the full chapter and review scene continuity, not isolated beauty renders.

No generated bitmap or mesh crosses from look development into the packaged game merely because it is attractive. It must make the authored human relation clearer, survive the technical gates and be deliberately accepted for a named use.
