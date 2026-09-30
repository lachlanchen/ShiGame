import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canChoose, councilCanChoose, councilEntry, createCouncil, createFanyang, createInitialState,
  encodeFanyangSnapshot, fanyangCanChoose, getNode, migrateGameState, prepareFanyangEntry, prepareRetreatEntry,
  resolveChoice, resolveCouncil, resolveFanyang,
  type Campaign, type CouncilDefinition, type CouncilState, type FanyangDefinition,
  type FanyangState, type GameState, type RetreatRevisions } from "../src";
import campaignRaw from "../../../content/campaigns/chapter-01-daze.json";
import councilRaw from "../../../content/councils/chen-council.v1.json";
import fanyangRaw from "../../../content/councils/fanyang-guarantee.v1.json";
import storyDraft from "../../../content/story-drafts/chen-retreat.v1.json";

const definitions = { campaign: campaignRaw as Campaign, council: councilRaw as CouncilDefinition,
  fanyang: fanyangRaw as FanyangDefinition };
const digest = (path: string) => createHash("sha256").update(readFileSync(new URL(path, import.meta.url))).digest("hex");
const revisions: RetreatRevisions = {
  campaign: digest("../../../content/campaigns/chapter-01-daze.json"),
  council: digest("../../../content/councils/chen-council.v1.json"),
  fanyang: digest("../../../content/councils/fanyang-guarantee.v1.json"),
};
const chapters: GameState[] = [];
const failedChapters: GameState[] = [];
function visitChapter(state: GameState) {
  if (state.completed) { if (councilEntry(state)) chapters.push(state); else failedChapters.push(state); return; }
  for (const choice of getNode(definitions.campaign, state.currentNodeId).choices) {
    if (canChoose(choice, state.resources)) visitChapter(resolveChoice(definitions.campaign, state, choice.id).state);
  }
}
visitChapter(createInitialState(definitions.campaign, 0));
function fixture(chapter = chapters[0]!) {
  let council = createCouncil(definitions.council, councilEntry(chapter)!);
  for (const id of ["defer-title", "joint-ledger", "one-command"]) council = resolveCouncil(definitions.council, council, id);
  const councilSnapshot = { ...council, definitionSHA256: revisions.council };
  const entry = prepareFanyangEntry(definitions.council, chapter, councilSnapshot, revisions.council)!;
  let fanyang = createFanyang(definitions.fanyang, entry);
  for (const id of ["public-safety", "hold-talks", "withdraw-envoy"]) fanyang = resolveFanyang(definitions.fanyang, fanyang, id);
  return { chapter, council: councilSnapshot, fanyang: JSON.parse(encodeFanyangSnapshot(fanyang, revisions.fanyang)) };
}

describe("Chen retreat continuity handoff", () => {
  it("replays 993 Fan Yang endings across every Chen route from all three arrivals", () => {
    let count = 0;
    const identities = new Set<string>(), endings = new Set<string>();
    let zeroGrain = false;
    for (const arrival of ["supplied", "pressed", "divided"] as const) {
      const chapter = chapters.find(state => councilEntry(state)?.arrival === arrival)!;
      expect(chapter).toBeDefined();
      const walkCouncil = (council: CouncilState) => {
        if (!council.completed) {
          for (const choice of definitions.council.rounds[council.history.length]!.choices) {
            if (councilCanChoose(council, choice)) walkCouncil(resolveCouncil(definitions.council, council, choice.id));
          }
          return;
        }
        const councilSnapshot = { ...council, definitionSHA256: revisions.council };
        const origin = prepareFanyangEntry(definitions.council, chapter, councilSnapshot, revisions.council)!;
        const walkFanyang = (state: FanyangState) => {
          if (!state.completed) {
            for (const choice of definitions.fanyang.rounds[state.history.length]!.choices) {
              if (fanyangCanChoose(definitions.fanyang, state, choice)) walkFanyang(resolveFanyang(definitions.fanyang, state, choice.id));
            }
            return;
          }
          const snapshots = { chapter, council: councilSnapshot, fanyang: JSON.parse(encodeFanyangSnapshot(state, revisions.fanyang)) };
          const before = JSON.stringify(snapshots);
          const entry = prepareRetreatEntry(definitions, snapshots, revisions)!;
          expect(entry).not.toBeNull();
          expect(entry.chapter).toEqual(chapter);
          expect(entry.fanyang.metrics).toEqual(state.metrics);
          expect(entry.council.choices).toEqual(council.history.map(turn => turn.choiceId));
          expect(entry.fanyang.choices).toEqual(state.history.map(turn => turn.choiceId));
          expect(entry.readingContext).toEqual({ fanyang: state.outcome, yu: "unestablished", han: "unestablished" });
          expect(entry.sceneId).toBe(storyDraft.id);
          for (const key of ["fanyang", "yu", "han"] as const) expect(storyDraft.inputs[key]).toContain(entry.readingContext[key]);
          identities.add(entry.id); endings.add(entry.fanyang.outcome); count++;
          zeroGrain ||= entry.fanyang.metrics.grain === 0;
          entry.chapter.history[0]!.after.grain = 999;
          entry.chapter.flags.push("forged");
          entry.fanyang.metrics.grain = 999;
          entry.council.choices.push("forged");
          entry.revisions.council = "forged";
          expect(JSON.stringify(snapshots)).toBe(before);
        };
        walkFanyang(createFanyang(definitions.fanyang, origin));
      };
      walkCouncil(createCouncil(definitions.council, councilEntry(chapter)!));
    }
    expect(count).toBe(993);
    expect(identities.size).toBe(count);
    expect([...endings].sort()).toEqual(["deferred", "opened", "withdrawn"]);
    expect(zeroGrain).toBe(true);
  });

  it("carries opening and crossing choices without inventing later presence or register destruction", () => {
    const openings = new Set<string>(), recruitments = new Set<boolean>();
    for (const chapter of chapters) {
      const entry = prepareRetreatEntry(definitions, fixture(chapter), revisions)!;
      expect(entry).not.toBeNull();
      const first = chapter.history[0]!.choiceId;
      expect(entry.continuity.registerOpening).toBe(first === "read-the-names" ? "read-publicly"
        : first === "take-the-beacon" ? "beacon-seized" : "hidden");
      expect(entry.continuity.crossingOrder).toBe(chapter.history.find(turn => turn.nodeId === "broken-crossing")!.choiceId);
      expect(entry.continuity.courierRecruitedEarlier).toBe(chapter.history.some(turn => turn.choiceId === "turn-the-courier"));
      expect(entry.continuity.currentCompanionPresence).toEqual({ yu: "unestablished", han: "unestablished" });
      openings.add(entry.continuity.registerOpening); recruitments.add(entry.continuity.courierRecruitedEarlier);
    }
    expect(openings.size).toBe(3);
    expect(recruitments.size).toBe(2);
  });

  it("ignores fabricated totals, flags and endings at every replay layer", () => {
    const snapshots = fixture();
    const expected = prepareRetreatEntry(definitions, snapshots, revisions);
    const poisoned = structuredClone(snapshots);
    poisoned.chapter.resources.grain = 999;
    poisoned.chapter.flags = ["turned-courier", "families-first"];
    poisoned.council.metrics.grain = 999;
    poisoned.council.outcome = "empty-granaries";
    poisoned.fanyang.metrics = { grain: 999 };
    poisoned.fanyang.outcome = "opened";
    expect(prepareRetreatEntry(definitions, poisoned, revisions)).toEqual(expected);
  });

  it("preserves the replay semantics of seeded legacy chapters instead of applying modern penalties retroactively", () => {
    const oldSave = {
      saveVersion: 3, campaignId: definitions.campaign.id, seed: chapters[0]!.seed,
      history: chapters[0]!.history.map(({ nodeId, choiceId, conditionId }) => ({ nodeId, choiceId, conditionId })),
    };
    const migrated = migrateGameState(definitions.campaign, oldSave)!;
    expect(migrated.completed).toBe(true);
    expect(migrated.failureReason).toBeUndefined();
    const snapshots = fixture(migrated);
    const entry = prepareRetreatEntry(definitions, { ...snapshots, chapter: oldSave }, revisions)!;
    expect(entry.chapter).toEqual(migrated);
    expect(entry.chapter.legacyDecisionCount).toBe(migrated.history.length);
    expect(entry.chapter.preMethodReadDecisionCount).toBe(migrated.history.length);
    expect(entry.chapter.preCommitmentDecisionCount).toBe(migrated.history.length);
    expect(entry.chapter.history.every(turn => turn.commitmentId === undefined)).toBe(true);
  });

  it("rejects incomplete or invalid episodes, foreign saves and mismatched revisions", () => {
    const snapshots = fixture();
    for (const key of ["chapter", "council", "fanyang"] as const) {
      for (const bad of [null, [], {}, { ...snapshots[key], history: [], choices: [] }]) {
        expect(prepareRetreatEntry(definitions, { ...snapshots, [key]: bad }, revisions)).toBeNull();
      }
      expect(prepareRetreatEntry(definitions, snapshots, { ...revisions, [key === "chapter" ? "campaign" : key]: "invalid" })).toBeNull();
    }
    expect(prepareRetreatEntry(definitions, { ...snapshots, fanyang: { ...snapshots.fanyang, entryId: "foreign" } }, revisions)).toBeNull();
    expect(prepareRetreatEntry(definitions, { ...snapshots, fanyang: { ...snapshots.fanyang, choices: ["not-an-order"] } }, revisions)).toBeNull();
    expect(prepareRetreatEntry(definitions, snapshots, { ...revisions, council: "0".repeat(64) })).toBeNull();
    expect(prepareRetreatEntry(definitions, snapshots, { ...revisions, fanyang: "0".repeat(64) })).toBeNull();
    expect(failedChapters.length).toBeGreaterThan(0);
    for (const chapter of failedChapters) expect(prepareRetreatEntry(definitions, { ...snapshots, chapter }, revisions)).toBeNull();
    // Chapter raw saves carry no content hash; the verified canonical digest is
    // supplied by the caller and binds the new identity, not a fake signature.
    expect(prepareRetreatEntry(definitions, snapshots, { ...revisions, campaign: "0".repeat(64) })?.id)
      .not.toBe(prepareRetreatEntry(definitions, snapshots, revisions)?.id);
  });
});
