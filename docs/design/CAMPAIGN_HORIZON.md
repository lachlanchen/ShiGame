# Campaign horizon and authored time

Status: implementation contract · 2026-08-09 · owner: game director

## Player problem

Chapter I already names dates and moves the active wartable marker, but those facts are scattered between story and map. A player can understand the current scene without feeling the campaign advance. SHI needs a readable horizon: where the movement is, which strategic act it is living through, and how much authored time separates one position from the next.

The horizon is orientation, not a progress score. It must make the campaign's changing shape legible without implying that later victory is inevitable or that one act is intrinsically better than another.

## Shared content contract

- The campaign declares an ordered, unique list of authored acts. Each act has an ID, a localized title and a localized player-facing objective.
- Every playable node declares one `actId` and one non-negative `timeIndex`.
- Every node references a known act and site. Every authored act must be used by at least one reachable node.
- Every nonterminal transition moves to a strictly greater `timeIndex`. Act order may stay the same or advance, but may never move backward or skip an undeclared act.
- The first node belongs to the first act. At least one reachable node belongs to the final act.
- Act and time metadata are presentational. They cannot change resources, requirements, flags, routes, commitments, opponent logic, field conditions, endings or save replay.

Schema version 7 adds this metadata. Save format 6 remains authoritative because the resolution rules and stored decision identity do not change. Existing v1–v6 saves replay to the same resources, flags and endings; their current node simply receives the horizon metadata authored on that node.

## Chapter I horizon

| Act | Player question | Nodes |
| --- | --- | --- |
| I · The register | Can nine hundred isolated names become one political body without concealing the obligation created? | The road has become a river |
| II · The cost of organization | What rules will turn declared purpose into grain, signals and accountable witnesses? | The three route-specific councils |
| III · The crossing | Which promise cost can the movement pay while surviving pursuit, and what network shape follows? | The broken ford and the three roads |

These act labels are project-authored interpretation, not headings preserved in *Shiji*, *Hanshu* or *Zizhi Tongjian*. Date labels retain their existing historical/reconstruction review state; the horizon does not manufacture precision beyond them.

## Presentation and accessibility

- Web presents one compact three-act rail with passed/current/ahead text, non-color geometry, the current act objective, current site, authored date and scene position.
- The rail is a named region and the current act exposes `aria-current="step"`. It is not interactive and cannot steal decision focus.
- Mobile and 400% zoom keep all three act names inside the viewport; detail wraps below rather than creating horizontal scroll.
- Forced-colors mode removes decorative fills but preserves borders, the current marker and state words.
- Unity displays the same act number/title, scene position, site and date in its immediate-mode orientation line. UI Toolkit may later improve presentation but may not change the shared meaning.
- Unreal's Slate command surface displays the same act/scene/site/date boundary beside the cinematic 3D field. Camera movement may emphasize a transition but never substitute for the textual horizon.

## Verification boundary

- JSON Schema, JavaScript validation, Unreal preflight/automation source and Unity preflight reject unknown/duplicate/unused acts, missing text, invalid time indices, backwards time, backwards act order and unreachable final acts.
- TypeScript UI tests prove the initial horizon and its transition to Act II without altering save-v6 decision outcomes.
- Unity tests prove schema-v7 parsing and canonical act/time closure; runtime/editor/test sources must still compile warning-clean offline.
- Unreal static validation proves the project/parser boundary and byte-identical staging; native automation remains red until the official editor is installed.
- Visible Chrome acceptance covers desktop, mobile, all eleven UI locales, 320-pixel reflow, actual 400% zoom and forced colors.

Human review must still decide whether first-time players understand the elapsed-time jump and whether the rail clarifies rather than overexplains the campaign.
