# SHI volume I — alliances, land and authority

Design baseline: 2026-10-02. This volume develops the Jinyang opening into diplomacy, settlement and a household/career layer. The [master design](GAME_DESIGN_DOCUMENT.md) governs the full historical series. This file specifies production work; it does not claim an implemented volume.

## The player experience

You hold an office with people, land and obligations attached to it. You inspect a threat, decide how much to risk, establish contact with other power holders, negotiate terms, and command what you actually control. Successful action can bring land, wealth, position and new relationships. Each gain creates a new problem worth playing.

The campaign opens from Zhao's historical viewpoint at Jinyang. Original casting supplies the faces; the historical record supplies the offices, interests and circumstances. A delegated envoy viewpoint is announced when control changes. A player cannot issue an order to Han's army before Han accepts an agreement.

A volume is a complete game arc with its own ending. Several volumes can belong to one historical era. The ten era bands in the master design organize the long series; they are not ten videos or a requirement to cover every event in one sitting.

## Volume I's three chapters

| Chapter | Main question | Play | Progression |
| --- | --- | --- | --- |
| 1. Jinyang | Can you keep the city alive and make the besieging alliance turn? | Command work parties, dispatch an envoy, establish commitments, coordinate an operation or withdraw | Surviving force, prepared resources, contacts and claims arising from the outcome |
| 2. Division and settlement | Which gains can you secure without making the next hostile coalition? | Bargain over land and obligations; choose appointments; arrange revenue and protection | Land rights, treasury, office powers and reciprocal obligations |
| 3. The household and the succession | Who will support the authority you have built, and what survives you? | Adult household relationships, family/alliance negotiations and succession planning | Spouse/concubine relationships, support networks, household commitments and a viable successor arrangement |

Chapter 1 is the current 15–20 minute delivery gate. The complete volume targets approximately 45–60 minutes, measured and revised through playtests. Finish all three chapters before starting a new volume's production. Chapter 2 and 3 need their own complete source and branch packets before implementation; do not expose a Continue button for unfinished content.

A named source supports land division after the battle. The local Shiji also records subsequent marriage and a contested succession arrangement. That provides a historical direction for chapter 3; it does not establish that a wife was a concubine or that new partners were awarded for winning the siege. Additional adult characters and alternative relationships are clearly classified as reconstruction.

## Chapter 1 — entry through ending

The ending of the siege is conventionally placed in 453 BCE. The local Shiji places the Zhi defeat in Zhou King Ding's sixteenth year; the chronology is earlier than Tongjian's 403 BCE recognition frame. A modern museum exhibition account gives the same ordering and endpoint. [Gansu exhibition account](https://www.gswbj.gov.cn/a/2024/08/20/21698.html)

Present the date as “晋阳 · 三家受封以前” on first entry. Put detailed chronology in the optional source view. The game begins with the problem on the ground.

| Beat / target budget | Scene and player action | What changes |
| --- | --- | --- |
| 0. Arrival / 20 seconds | Short camera move from floodwater to workers and the leader; control arrives; objective: keep a usable position | The player recognizes the water, dry route and immediate work |
| 1. Defense / 3–4 minutes | Inspect the wall and raised route; assign engineers, guides and garrison to competing tasks | Endurance, outside preparation and the withdrawal option diverge |
| 2. Liaison / 4–5 minutes | Authorize Zhang Mengtan's mission; inspect camp relationships; choose contact and assurance arrangements | Han and Wei receive different information; Zhi's vigilance can rise |
| 3. Readiness / 2–3 minutes | Receive replies; inspect actual signals; decide whether to confirm, change timing or act | Desire to defect, ability to move and willingness to risk exposure remain distinct |
| 4. Operation / 2–3 minutes | Launch the prepared operation; issue limited force orders; respond to a disrupted route | Water, forces and alliances visibly change; support may arrive late or be withheld |
| 5. Settlement / 2 minutes | Regroup and inspect the resulting map, losses, claims and obligations | A complete chapter ending and an initial estate/career record |

These timings include player decisions and observation, not compulsory cinematics. Pausing and reading do not advance the strategic clock. Inspecting freely does not make the city collapse.

### Space and camera

Use one continuous, deliberately compressed scene: inner dry ground → defensive wall → flooded approach → raised route → outer embankment, with the three camp positions around it. The layout is schematic, not a measured archaeological reconstruction. Maintain this geography across close views, command views and movie inserts.

The human view gives faces, actions and material detail. Planning raises the camera enough to show routes, groups and camps in the same space. Executing returns to the affected figures. A small regional overview shows who controls a camp or route; it does not replace the world with a reading screen.

The [first scene target](../../assets/art/lookdev/jinyang-scene-target-v1.png) establishes lighting, human scale, terrain readability and depth. Costume, ornaments, lamp types and exact structures need the period look-development pass. It is a concept reference.

### Controls and interface

Desktop: move with WASD or click-to-move; interact with E; pause/plan with Space; cancel with Escape. Controller: left stick, interact button, plan shoulder button and back. Touch: tap ground to move, tap a useful person/object, then choose a large contextual action; keep a persistent pause/plan control.

Planning follows select group → choose job/target → see known cost and route → confirm → watch. Selection is reversible; confirmation commits the action. The camera and cinematic completion do not commit orders.

Show one short objective and at most two subtitle lines. Context controls show useful actions and one known trade-off. Detailed resources, promises and source evidence appear on inspection. A message such as “Wei has not confirmed the date” gives a concrete next problem; a hidden universal trust number does not.

### Concrete actions and rule bindings

| World action | Constraint | Shared-rule fact it establishes |
| --- | --- | --- |
| Brace the threatened defenses | Engineers are busy here rather than at the outer preparation | City endurance/deadline |
| Survey and prepare the diversion | Requires time, access and a surviving work party | Diversion readiness |
| Prepare the exit route | Commits guides and capacity before the final action | Withdrawal readiness and capacity |
| Dispatch the authorized envoy | Has a route, travel window and exposure cost | Which ally received a proposal |
| Arrange verifiable partner assurances | Each party must receive its own evidence | Partner commitment received; disclosure risk |
| Agree and acknowledge a date | An offered date differs from an acknowledged date | Ally's agreed window |
| Inspect readiness and execute | Forces need time to reach positions; the enemy can respond | Force readiness, enemy vigilance and actual operation window |

The existing coordination experiment is a small kernel for these facts. The engine must derive them from performed actions and messages; passing an ideal snapshot into the kernel is not the encounter.

### Two viable styles

**Careful coordination:** commit labor to keeping the city usable, establish separate protected contacts and confirm the date. This consumes preparation time and reserves while limiting exposure.

**Concentrated action:** commit escorts and simultaneous messaging to compress the window, accept greater exposure and coordinate the operation sooner. This preserves some endurance while reducing the force available for other tasks.

The two plans must work in different disclosed conditions and leave different costs. The complete encounter needs an audit of reachable routes and observed play before either is called balanced.

An enemy response is visible: extra sentries, a moved patrol, a closed approach or an ally delaying its force. The player receives an opportunity to adapt before the irreversible operation.

### Interactive operation, revision 2

The agreed date now starts an operation before it grants an ending. Zhao commands its vanguard and reserve. Han and Wei remain bound to their own received commitments. The source sequence is embankment seizure → redirected water → disorder in Zhi's force → attacks on both flanks and the front. Guard reinforcement, reserve allocation, recoverable disruption and numerical losses are gameplay reconstruction.

An exposed approach produces an observable reinforced guard. The player can screen the breach workers with the reserve or rush while retaining it. A screened breach costs supplies and some force; a quiet rush can conserve both. Rushing the reinforced guard drives the workers back and costs force. The retained reserve can recover the breach, or a previously prepared exit can save a remnant. Attacking the intact front leads to defeat.

Once the water is through, the player can advance Zhao immediately or spend supplies holding its front while the allied wings close. Both can win with different losses. The ending carries actual surviving force and treasury into the same estate record. These are tactical rounds within the agreed operation window; inspecting the scene does not consume time or change ally readiness.

Revision 1 chronicles continue to replay under their original definition. New revision 2 chronicles use a separate save and include the operation orders; neither version silently reinterprets the other's earned ending. Full cinematic, novice and device acceptance remain separate production gates.

## Cast and source interpretation

| Actor | Authority / interest | Game behavior |
| --- | --- | --- |
| Zhao Xiangzi | Preserve the Zhao position and its supporting population | Direct Zhao tasks, authorize missions, commit resources and accept settlement terms |
| Zhang Mengtan | Conduct the authorized liaison under exposure risk | Travel, obtain replies and carry commitments; his appearance and voice remain consistent |
| Zhi Bo | Defeat Zhao while retaining the besieging coalition | React to visible preparations, maintain pressure and respond to warnings |
| Han Kangzi | Avoid becoming the next target without being exposed alone | Accept, withhold or condition cooperation on received evidence and timing |
| Wei Huanzi | Protect his own position and avoid unilateral loss | Make an independent decision from his own information and ability to act |
| Chi Ci | Warn Zhi about the coalition's instability | Supply an intelligible opposing assessment, affecting the authored vigilance response |

Public primary-source parallels: [Tongjian volume 1](https://zh.wikisource.org/wiki/資治通鑑/卷001), [Shiji, Zhao hereditary house](https://zh.wikisource.org/wiki/史記/卷043). The owner's local originals and supplied modern Chinese translations are the working text. Exact files and hashes stay in the private source packet.

Shiji uses 張孟同 where Tongjian uses 張孟談. Keep the game name tied to its spine and preserve the variant in the source view. Shiji's account of wavering retainers and Tongjian's account of the population's persistence concern different groups; do not flatten either into a single universal loyalty meter.

A source's recorded omen or supernatural report belongs to historical belief and textual context. It does not make magic the cause of the game's military resolution.

## Outcomes and earned progression

**Coordinated reversal:** the operation succeeds, allied forces have their own claims, and the player enters land/revenue bargaining with a surviving position. Record which commitments were used, actual costs and which allies can demand a settlement.

**Costly survival:** a prepared exit saves a limited remnant; the player retains people, contacts or resources while losing control of the position. The volume's continuation must be authored for these changed circumstances.

**Isolation and defeat:** show the absent signal, unready force, exposed plan or missed deadline that caused the defeat. Offer replay from the planning checkpoint and preserve the chronicle for comparison.

The estate record contains land/control rights, treasury, office/authority, contacts, obligations and household relationships. First-chapter land and wealth are provisional claims or prepared resources until the settlement establishes them. A victory does not automatically confer a royal title.

## The progression layer across the volume

Land gives revenue, provisioning and recruiting capacity, with protection and administrative obligations. Wealth supports supplies, gifts, missions, retainers and household commitments. Display era-appropriate wealth forms; use the accessible treasury summary without fabricating universal gold coins.

Positions grant actual powers: whom you may appoint, what you may command and whose permission you need. Diplomacy includes contact, recognition, exchanged guarantees, negotiated commitments and enforcement. A liaison relationship needs a working route and someone willing to carry information.

Adult spouses and concubines are named household relationships with interests, family/network ties, expectations and succession effects. Appointment to the household is a relationship event, with its own circumstances and terms. Give supporting women useful actions and positions in those networks. Record period-specific status accurately; retain the relationship state across scenes and later decisions.

Historical office holders remain subject to their era's constraints. Across a large time jump, explicitly introduce a new historical role or a supported successor. Keep volume-level estate and household consequences coherent; do not present one unchanged character living through the entire Tongjian span.

## Production order for the next gate

First stage the full chapter with the existing engine, shared rules, moving rigged figures and provisional sound. Bind player actions to the facts above and finish all three endings plus the initial estate record. Then playtest the complete route.

Use Blender for editable layout, characters and contact-correct animation; Unreal for movement, planning, camera blends and operation playback; Musia for related pressure/action/aftermath cues; LocalVideoGen/MiniMax for short establishing and transition shots after fast low-resolution previews. Keep optional movie shots interruptible and consistent with the save.

The first action set is walk/stop/turn, inspect/point, carry/brace, dispatch/receive, advance/recoil and withdraw. First scene music and effects must be heard in the actual player. Final faces, detailed cloth and additional film shots follow that integrated baseline.

Acceptance evidence is a complete recorded route, a materially different replay, working saves and observed comprehension. G0 can be recorded as a production design baseline; G1 remains open until the encounter is playable.
