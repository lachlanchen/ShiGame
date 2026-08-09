# Historical martial-command system

Status: approved direction · implementation contract · updated 2026-08-09 · owner: game director

## Player promise

SHI should let the player inhabit command, not merely choose dialogue and watch numbers change. A martial encounter must ask the player to read terrain, organize people, communicate intent, preserve a reserve, decide what risk is acceptable and live with the political and human result.

The target is a historical command game with cinematic embodiment. It is not a detached battle minigame, an army-size comparison, a superhuman crowd brawler or a film that temporarily removes player agency. The player may walk a command space, inspect a field edge, speak with officers and manipulate physical signals, but the meaningful action is deciding what other people should attempt under imperfect conditions.

## Playable command loop

```text
Read the ground and intelligence horizon
  → meet the people who must carry the order
  → choose an objective, main effort, reserve and withdrawal condition
  → place or revise a small number of formations and signals
  → issue one command pulse
  → watch movement, terrain, morale and the opponent answer
  → reinforce, redirect, disengage or accept the opening
  → recover wounded, households, supplies and testimony
  → carry the military, political and moral result into the campaign
```

An encounter is won by achieving an authored objective at an acceptable cost, not by erasing every opposing body. Holding a crossing, screening a withdrawal, protecting a column, breaking contact, opening a road or forcing a negotiation can all be victories. A tactically successful order can still create hunger, distrust, exposure or an officer relationship that later becomes dangerous.

## Command vocabulary

The first prototype uses a deliberately small order language:

| Order | Player question | Typical cost or risk |
| --- | --- | --- |
| Anchor | What must not move? | Can be fixed, surrounded or exhausted |
| Advance | Where should pressure be applied? | Extends supply and signal distance |
| Screen | What movement must the opponent not read clearly? | Uses people without decisive contact |
| Shift | Which lane or flank needs weight now? | Creates a temporary gap elsewhere |
| Feint | What false commitment should the opponent answer? | Fails if intent is already legible |
| Reserve | What remains uncommitted, and who may release it? | Sacrifices immediate momentum |
| Withdraw | What is the break-contact condition and route? | Can cost material, reputation or cohesion |

Historical terminology, exact formation names and period equipment remain review-gated. Modern labels may be used in tooltips for clarity, but the world presentation cannot imply a Qin- or Chu-period term without an edition-backed claim record.

## Force state

Campaign resources remain authoritative at the strategic layer. A martial encounter adds local state only where it creates a decision:

- `cohesion`: whether a group can still act as an organized body;
- `resolve`: willingness to hold, advance or return after shock;
- `fatigue`: accumulated movement, weather and labor cost;
- `readiness`: weapons, formation, officer contact and immediate ability to execute;
- `supply`: encounter-local food, water, ammunition and transport access;
- `visibility`: what each side can currently observe or plausibly infer;
- `commandDelay`: time between intent, signal, receipt and attempted execution.

These values are not seven permanent HUD bars. The interface exposes only the states relevant to the current command pulse, names the causal relationship in plain language and preserves color-independent shapes and text. Casualties are people and relationships, never a score multiplier. Wounded recovery, missing households, captured messengers and exhausted animals must be represented in the aftermath when relevant.

## Terrain and formation

Each engagement uses a bounded graph of named terrain zones rather than a decorative open world or an omniscient measured map. A zone records movement cost, visibility, frontage, shelter, supply access and historically reviewed material features. Connections record who can move, see, signal or withdraw between zones.

A force occupies a formation footprint with a facing, depth, frontage and current order. Geometry must make the state readable without requiring a tactical icon legend: compressed bodies show congestion, broken intervals show lost cohesion, signal distance is visible, and reserves remain visibly distinct from committed ranks. Animation communicates readiness and disorder before spectacle.

The design principle is positional: a smaller organized force on usable ground can create an opening; a larger force can become brittle when hungry, divided, overextended or unable to receive orders. No hidden combat-power number decides the result.

## Time, control and opponent

Unreal presents encounters in real time, but command resolves in deterministic pulses. The player can pause at authored command windows, inspect the evidence available to their role and revise orders that have not yet been sent. Once a signal is issued, delay and interpretation are part of the position; units do not rotate instantly because the cursor moved.

The opponent uses the same state and order vocabulary. Its current posture, observable preparation and known method read are disclosed to the degree the player has evidence. It may exploit a gap, protect a route, screen a movement, hold a reserve or disengage. It cannot receive arbitrary stat bonuses, read unrevealed player input or spawn forces outside the authored encounter record.

Runtime variation remains seed-reproducible and disclosed before it matters. Weather, footing, messenger delay or incomplete reports may vary only through authored condition sets. The resolver never rolls a hidden hit chance after commitment.

## First vertical slice: the broken crossing

The first martial-command encounter extends Chapter I's existing `broken-crossing` position rather than inventing an unrelated battle.

### Situation

- households and the movement's core are approaching a damaged ford;
- carts and grain occupy limited frontage;
- a rear guard must preserve time without becoming a sacrificial health bar;
- Qin pursuit is represented first through signals, scouts and closing routes, not an ahistorical full army;
- mud, water, bank height, darkness and route geometry remain reconstruction until individually reviewed.

### Objective

Move the protected column across, retain an organized rear element and break contact before the pursuit closes. The player must define which obligation takes precedence if all three cannot be preserved.

### Three command pulses

1. **Establish the shape.** Assign a screen, crossing order and reserve; inspect who receives each signal.
2. **Answer disruption.** A disclosed terrain, supply, network or state pressure changes one lane. Reinforce, redirect, abandon material or slow the crossing.
3. **Break contact.** Release the reserve, hold long enough for the last group, or withdraw early along a named route.

The three existing doctrines—households first, brace the ford with grain and abandon the carts—become initial plans with different legal orders and obligations. They do not remain one-click outcome buttons. A versioned shared resolver converts the complete command record into the same campaign resources, commitment answer, pursuit state and chronicle history consumed by Web, Unreal and Unity.

### Delivery stages

1. Compile and visibly prove the current schema-v7 council → order → consequence → next-speaker loop in Unreal 5.8.1 without changing rules during the native baseline audit.
2. Add a schema-versioned engagement contract and pure deterministic resolver with exhaustive and hostile tests.
3. Build the Web command-board reference so rules, accessibility and complete routes remain inexpensive to verify.
4. Build the Unreal terrain zones, formations, signals, controller/pointer interaction, command pulses and restrained camera language from that same record.
5. Replace the old one-click crossing resolution only after both clients replay byte-identical engagement outcomes and save migration is proven.

Stage 2 source checkpoint, 2026-08-09: [`chapter-01-broken-crossing.v1.json`](../../content/engagements/chapter-01-broken-crossing.v1.json) now carries three plans, two field conditions, three command pulses, nine orders with separate authored responses, six local command metrics and four ordered outcomes. The pure TypeScript resolver records command effects before the field answer, derives campaign deltas only at completion and rebuilds saves from identifiers instead of trusting stored totals. Exhaustive validation covers all 76 legal plan/condition routes: all four outcomes and all nine commands are reachable, every plan remains viable under both conditions, and altered response or metric history is rejected. Its explicit delivery status is `validated-shared-contract-not-campaign-authority`; the existing campaign choice remains authoritative until the Web command board and native Unreal client produce the same replay evidence.

## Cinematic and embodied presentation

The default Unreal viewpoint moves between a human-scale command position and a readable elevated field view. The player can inspect an officer, messenger, formation or terrain edge directly, then return to command without losing selection or history.

Cinematic beats are short consequences attached to exact state transitions: a delayed signal, a lane opening, a reserve committing, a rear guard losing contact, the last household crossing. They may clarify scale and emotion, but they cannot hide required information, change deterministic timing or delay a requested skip. Cuts-only reduced motion preserves the same command truth.

Direct personal combat may appear later when the player's current role, evidence and encounter design justify it. It must use readable commitment, spacing, fatigue, injury and withdrawal; it cannot turn commanders into supernatural crowd-clearing avatars or overwrite the campaign's people and logistics.

## Historical-text use

Classical military and political works are design lenses, not proof that a historical character used a named doctrine in a particular scene.

| Work | Candidate design use | Required boundary |
| --- | --- | --- |
| `Sunzi` | comparative factors; positional force; orthodox/unorthodox relation; fullness and emptiness; movement and terrain | register exact edition and passage; label as strategic lens |
| `Sun Bin Bingfa` | formation, terrain response, deception and command problems | verify recovered-text passage, reconstruction and translation before use |
| `Sima Fa` | discipline, political purpose, restraint and the relation between civil order and military force | do not flatten contested textual layers into universal rules |
| `Wei Liaozi` | organization, command authority, rewards, punishment and material preparation | distinguish design abstraction from Qin institutional evidence |
| `Guiguzi` | persuasion, information, divided interests and diplomatic reading | use in councils/intelligence, not as automatic battlefield doctrine |
| `Wuzi` | preparation, cohesion, fatigue, observable disorder and adaptive command | reject faction stereotypes; distinguish received prescription from actual practice |
| `Shiji`, `Hanshu`, `Zizhi Tongjian` | event sequence, people, later narrative framing and comparison | preserve later-compilation status and anti-hindsight rules |

The private `../ZhJpBook` and `../Books` copies are research inputs only. SHI commits edition metadata, pinpoint locators, short reviewed original paraphrase or rights-cleared public text, uncertainty and gameplay use. It does not copy private PDFs, translations or generated chunks into the public repository. Candidate military passages and their promotion gates are versioned in the [martial-source review queue](../history/MARTIAL_SOURCE_REVIEW.md).

## Shared architecture

The engagement payload is versioned beside the campaign, not embedded in Unreal assets:

```text
engagement definition + historical claims + authored conditions
                         ↓
              pure deterministic resolver
              ↙                 ↓                 ↘
Web command board      Unreal presentation      Unity baseline
```

The authoritative record contains the initial state, every issued order, signal receipt, disclosed pressure, opponent answer, resolved local state, objective state and campaign deltas. Save loading replays that record instead of trusting stored totals. Presentation clients may interpolate movement and animation but may not invent an outcome.

## Acceptance gates

The broken-crossing slice is not called playable until all of the following agree:

- every legal command path terminates in success, costly success, withdrawal or explained failure;
- at least two materially different plans remain viable under every authored condition;
- Web and Unreal replay identical records and campaign deltas;
- pointer, keyboard and standard gamepad complete the same route;
- required state survives color loss, reduced motion, 200% text and screen-reader alternatives;
- camera, input, save and order transactions fail closed;
- a packaged Linux build completes the encounter without editor-only dependencies;
- performance remains within recorded CPU, GPU, memory and frame-time budgets;
- historical, material-culture, accessibility, controller and first-time-player reviews are recorded;
- observed players can explain why their command succeeded or failed and choose a different response on replay.

## Stop rules

- Do not add hundreds of soldiers before a ten-unit readability prototype is fun.
- Do not use cinematic violence to disguise an uninteresting command decision.
- Do not add a formation, weapon, rank or tactic without a historical review path.
- Do not let tactical success erase promises, civilian cost, hunger, pursuit or later politics.
- Do not fork Web and Unreal outcomes.
- Do not scale content or AI-generated assets faster than they can be reviewed in play.
