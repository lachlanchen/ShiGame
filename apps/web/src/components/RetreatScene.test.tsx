// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { canChoose, councilEntry, createCouncil, createFanyang, createInitialState, encodeFanyangSnapshot, getNode,
  prepareFanyangEntry, prepareRetreatEntry, resolveChoice, resolveCouncil, resolveFanyang,
  type Campaign, type CouncilDefinition, type FanyangDefinition } from "@shi/game-core";
import campaignRaw from "../../../../content/campaigns/chapter-01-daze.json";
import councilRaw from "../../../../content/councils/chen-council.v1.json";
import fanyangRaw from "../../../../content/councils/fanyang-guarantee.v1.json";
import councilHash from "../generated/chen-council.v1.sha256?raw";
import fanyangReview from "../../../../content/research/fanyang-entry-review.v1.json";
import retreatStory from "../../../../content/story-drafts/chen-retreat.v1.json";
import { encodeCouncilSnapshot } from "../council-snapshot";
import * as persistence from "../persistence";
import { ChenCouncil } from "./ChenCouncil";
import { RetreatScene, retreatSaveKey } from "./RetreatScene";

const definitions = { campaign: campaignRaw as Campaign, council: councilRaw as CouncilDefinition, fanyang: fanyangRaw as FanyangDefinition };
let chapter = createInitialState(definitions.campaign, 0);
while (!chapter.completed) chapter = resolveChoice(definitions.campaign, chapter, getNode(definitions.campaign, chapter.currentNodeId).choices.find(choice => canChoose(choice, chapter.resources))!.id).state;
let council = createCouncil(definitions.council, councilEntry(chapter)!);
for (const choice of ["defer-title", "joint-ledger", "one-command"]) council = resolveCouncil(definitions.council, council, choice);
const councilSnapshot = encodeCouncilSnapshot(council, councilHash.trim());
const fanyangEntry = prepareFanyangEntry(definitions.council, chapter, JSON.parse(councilSnapshot), councilHash.trim())!;
let fanyang = createFanyang(definitions.fanyang, fanyangEntry);
for (const choice of ["public-safety", "hold-talks", "withdraw-envoy"]) fanyang = resolveFanyang(definitions.fanyang, fanyang, choice);
const fanyangSnapshot = encodeFanyangSnapshot(fanyang, fanyangReview.contentSHA256);
const entry = prepareRetreatEntry(definitions, { chapter, council: JSON.parse(councilSnapshot), fanyang: JSON.parse(fanyangSnapshot) },
  { campaign: "a".repeat(64), council: councilHash.trim(), fanyang: fanyangReview.contentSHA256 })!;
const props = () => ({ entry, rulesHash: "b".repeat(64), storyHash: "c".repeat(64), reducedMotion: true, onClose: vi.fn(), onSavingChange: vi.fn() });
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function choose(view: ReturnType<typeof render>, id: string) {
  fireEvent.click(view.container.querySelector(`[data-retreat-choice="${id}"]`)!);
  fireEvent.click(view.getByTestId("retreat-commit"));
  const response = await view.findByTestId("retreat-response");
  fireEvent.click(within(response).getByRole("button", { name: /继续/ }));
}

describe("retreat development scene", () => {
  it.each([false, true])("reads the saved reaction before accounting and restores it without a new order (reduced=%s)", async reducedMotion => {
    const input = { ...props(), reducedMotion };
    let view = render(<RetreatScene {...input} />);
    fireEvent.click(view.container.querySelector('[data-retreat-choice="decline-dispatch"]')!);
    fireEvent.click(view.getByTestId("retreat-commit"));
    await view.findByTestId("retreat-response");
    const saved = localStorage.getItem(retreatSaveKey);
    const response = view.getByTestId("retreat-response");
    const prose = response.querySelector(".chen-prose")!.textContent;
    const disclosure = view.getByTestId("retreat-response-changes") as HTMLDetailsElement;
    expect(disclosure.open).toBe(false);
    expect(disclosure.querySelectorAll(".chen-preview > span")).toHaveLength(5);
    expect(response.querySelector(".chen-prose")!.closest("details")).toBeNull();
    expect(view.container.querySelector(".chen-metrics")).toBeNull();
    fireEvent.click(disclosure.querySelector("summary")!);
    expect(disclosure.open).toBe(true);
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    view.unmount();
    view = render(<RetreatScene {...input} />);
    expect(view.getByTestId("retreat-response").querySelector(".chen-prose")!.textContent).toBe(prose);
    expect((view.getByTestId("retreat-response-changes") as HTMLDetailsElement).open).toBe(false);
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    fireEvent.click(within(view.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(view.container.querySelector(".chen-metrics")).not.toBeNull();
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
  });
  it.each([false, true])("resumes reviewed prose and preserves old bytes if the next write fails (failure=%s)", async failNext => {
    const input = props();
    input.rulesHash = retreatStory.saveCompatibility.rulesSHA256;
    const first = render(<RetreatScene {...input} />);
    expect(first.queryByTestId("retreat-prose-revision")).toBeNull();
    await choose(first, "decline-dispatch");
    const old = JSON.parse(localStorage.getItem(retreatSaveKey)!);
    old.storySHA256 = retreatStory.saveCompatibility.previousStorySHA256[0];
    const bytes = JSON.stringify(old);
    first.unmount(); localStorage.setItem(retreatSaveKey, bytes);
    const resumed = render(<RetreatScene {...input} />);
    expect(resumed.queryByRole("alert")).toBeNull();
    expect(resumed.getByTestId("retreat-prose-revision").textContent).toContain("你的决定与物资不变");
    expect(localStorage.getItem(retreatSaveKey)).toBe(bytes);
    fireEvent.click(within(resumed.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    if (failNext) {
      vi.spyOn(persistence, "flushPersistence").mockRejectedValueOnce(new Error("migration write failed")).mockResolvedValue(undefined);
      fireEvent.click(resumed.container.querySelector('[data-retreat-choice="gather-own"]')!);
      fireEvent.click(resumed.getByTestId("retreat-commit"));
      await resumed.findByRole("alert");
      expect(localStorage.getItem(retreatSaveKey)).toBe(bytes);
      expect(resumed.getByTestId("retreat-prose-revision")).toBeTruthy();
      expect(resumed.queryByTestId("retreat-response")).toBeNull();
    }
    await choose(resumed, "gather-own");
    const next = JSON.parse(localStorage.getItem(retreatSaveKey)!);
    expect(next.choices).toEqual(["decline-dispatch", "gather-own"]);
    expect(next.storySHA256).toBe(input.storyHash);
    expect(resumed.queryByTestId("retreat-prose-revision")).toBeNull();
  });

  it.each(["send-support", "decline-dispatch"])("recalls the missing escort only after %s, including resume", async dispatch => {
    const input = props();
    const view = render(<RetreatScene {...input} />);
    for (const id of [dispatch, "gather-own", "hold-formation", "carry-records"]) await choose(view, id);
    const memory = "那天是我叫他们跟车走的";
    expect(view.container.textContent!.includes(memory)).toBe(dispatch === "send-support");
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const resumed = render(<RetreatScene {...input} />);
    fireEvent.click(within(resumed.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(resumed.container.textContent!.includes(memory)).toBe(dispatch === "send-support");
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
  });

  it.each(["verify-with-partners", "borrow-local-grain"].flatMap(reception =>
    ["escort-households", "hold-formation", "split-routes"].map(evacuation => [reception, evacuation])))
  ("carries the unfinished search through %s and %s without an invented reunion", async (reception, evacuation) => {
    const input = props();
    input.entry = structuredClone(input.entry);
    // Presentation coverage with legal capacity, not proof of a real inherited route.
    input.entry.fanyang.metrics = { ...input.entry.fanyang.metrics, grain: 6, tempo: 6, city: 6, allies: 6, veterans: 6 };
    const authored = retreatStory.scenes.find(scene => scene.id === "dawn")!.variants
      .find(variant => "bad-news" in variant.when && variant.when["bad-news"] === reception)!;
    const before = JSON.stringify(input.entry);
    const view = render(<RetreatScene {...input} />);
    for (const id of ["decline-dispatch", reception, evacuation]) await choose(view, id);
    for (const line of authored.lines) expect(view.container.textContent).not.toContain(line.text);
    await choose(view, "strip-identities");
    for (const line of authored.lines) expect(view.container.textContent).toContain(line.text);
    const assertDecisionOrder = (current: ReturnType<typeof render>) => {
      const prompt = current.getByText("还按原来的队么？", { exact: false });
      for (const line of authored.lines) {
        const report = current.getByText(line.text, { exact: false });
        expect(report.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
      const firstChoice = current.container.querySelector("[data-retreat-choice]")!;
      expect(prompt.compareDocumentPosition(firstChoice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    };
    assertDecisionOrder(view);
    expect(view.container.textContent).not.toContain("阿衡。我还当你走了另一条路");
    expect(view.container.textContent).toContain("没有补写那些被去掉的名字");
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const restored = render(<RetreatScene {...input} />);
    for (const line of authored.lines) expect(restored.container.textContent).not.toContain(line.text);
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    for (const line of authored.lines) expect(restored.container.textContent).toContain(line.text);
    assertDecisionOrder(restored);
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    expect(JSON.stringify(input.entry)).toBe(before);
    if (reception === "borrow-local-grain") expect(restored.getByTestId("retreat-debts").textContent).toContain("欠本地粮主 2 份粮秣");
    else expect(restored.queryByTestId("retreat-debts")).toBeNull();
  });

  it.each([
    ["read-the-names", "repair-the-ford", "issue-grain-tallies"],
    ["read-the-names", "repair-the-ford", "voluntary-pots"],
    ["take-the-beacon", "cut-the-carts", "extinguish-and-move"],
    ["hide-the-register", "families-first", "turn-the-courier"],
  ].flatMap(route => ["root-in-villages", "race-for-chen", "send-two-envoys"].map(strategy => [...route, strategy])))
  ("recalls replay-verified %s, %s, %s and %s without inventing other memories", async (opening, crossing, organization, strategy) => {
    const input = props();
    let priorChapter = createInitialState(definitions.campaign, 0);
    while (!priorChapter.completed) {
      const node = getNode(definitions.campaign, priorChapter.currentNodeId);
      const preferred = node.id === "rain-order" ? opening : node.id === "broken-crossing" ? crossing
        : node.timeIndex === 1 ? organization : node.choices.some(choice => choice.id === strategy) ? strategy : undefined;
      priorChapter = resolveChoice(definitions.campaign, priorChapter,
        preferred ?? node.choices.find(choice => canChoose(choice, priorChapter.resources))!.id).state;
    }
    expect(priorChapter.failureReason).toBeUndefined();
    expect(priorChapter.history.some(turn => turn.choiceId === strategy)).toBe(true);
    let priorCouncil = createCouncil(definitions.council, councilEntry(priorChapter)!);
    for (const id of ["defer-title", "joint-ledger", "one-command"]) priorCouncil = resolveCouncil(definitions.council, priorCouncil, id);
    const savedCouncil = JSON.parse(encodeCouncilSnapshot(priorCouncil, councilHash.trim()));
    const origin = prepareFanyangEntry(definitions.council, priorChapter, savedCouncil, councilHash.trim())!;
    let priorFanyang = createFanyang(definitions.fanyang, origin);
    for (const id of ["public-safety", "hold-talks", "withdraw-envoy"]) priorFanyang = resolveFanyang(definitions.fanyang, priorFanyang, id);
    input.entry = prepareRetreatEntry(definitions, { chapter: priorChapter, council: savedCouncil,
      fanyang: JSON.parse(encodeFanyangSnapshot(priorFanyang, fanyangReview.contentSHA256)) },
      { campaign: "a".repeat(64), council: councilHash.trim(), fanyang: fanyangReview.contentSHA256 })!;
    expect(input.entry).not.toBeNull();
    const originalEntry = JSON.stringify(input.entry);
    const view = render(<RetreatScene {...input} />);
    expect(view.queryByTestId("retreat-chapter-memory")).toBeNull();
    await choose(view, "decline-dispatch");
    await choose(view, "gather-own");
    const assertMemory = (current: ReturnType<typeof render>, sceneId: string) => {
      const memory = current.getByTestId("retreat-chapter-memory");
      for (const callback of retreatStory.chapterCallbacks) {
        for (const line of callback.lines) expect(memory.textContent?.includes(line.text)).toBe(
          callback.sceneId === sceneId && priorChapter.history.some(turn => turn.choiceId === callback.afterChoice));
      }
    };
    assertMemory(view, "evacuation");
    await choose(view, "split-routes");
    assertMemory(view, "records");
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const restored = render(<RetreatScene {...input} />);
    expect(restored.queryByTestId("retreat-chapter-memory")).toBeNull();
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    assertMemory(restored, "records");
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    expect(JSON.stringify(input.entry)).toBe(originalEntry);
    await choose(restored, "carry-records");
    assertMemory(restored, "dawn");
    const dawnText = restored.getByTestId("retreat-scene").textContent!;
    const strategicMemory = retreatStory.chapterCallbacks.find(callback => callback.sceneId === "dawn"
      && priorChapter.history.some(turn => turn.choiceId === callback.afterChoice))!;
    expect(strategicMemory.lines.length).toBeGreaterThan(0);
    expect(dawnText.indexOf(strategicMemory.lines[0]!.text)).toBeLessThan(dawnText.indexOf("还按原来的队么？"));
    const dawnSave = localStorage.getItem(retreatSaveKey);
    restored.unmount();
    const dawnRestored = render(<RetreatScene {...input} />);
    expect(dawnRestored.queryByTestId("retreat-chapter-memory")).toBeNull();
    fireEvent.click(within(dawnRestored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    assertMemory(dawnRestored, "dawn");
    expect(dawnRestored.getByTestId("retreat-scene").textContent).toBe(dawnText);
    expect(localStorage.getItem(retreatSaveKey)).toBe(dawnSave);
    expect(JSON.stringify(input.entry)).toBe(originalEntry);
  });

  it.each(["escort-households", "hold-formation", "split-routes"])("shows the saved %s withdrawal before the records scene and preserves it on resume", async evacuation => {
    const input = props();
    input.entry = structuredClone(input.entry);
    input.entry.fanyang.metrics = { ...input.entry.fanyang.metrics, grain: 8, tempo: 8, city: 8, allies: 8, veterans: 8 };
    const view = render(<RetreatScene {...input} />);
    await choose(view, "keep-reserve");
    await choose(view, "gather-own");
    const authored = retreatStory.scenes.find(scene => scene.id === "evacuation")!;
    const selected = authored.choices.find(choice => choice.id === evacuation)!;
    for (const line of selected.response.slice(3)) expect(view.container.textContent).not.toContain(line.text);
    fireEvent.click(view.container.querySelector(`[data-retreat-choice="${evacuation}"]`)!);
    fireEvent.click(view.getByTestId("retreat-commit"));
    const response = await view.findByTestId("retreat-response");
    for (const line of selected.response) expect(response.textContent).toContain(line.text);
    for (const other of authored.choices.filter(choice => choice.id !== evacuation)) {
      for (const line of other.response.slice(3)) expect(response.textContent).not.toContain(line.text);
    }
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const restored = render(<RetreatScene {...input} />);
    for (const line of selected.response) expect(restored.getByTestId("retreat-response").textContent).toContain(line.text);
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(restored.getByRole("heading", { name: "带走什么凭据" })).toBeTruthy();
    expect(restored.queryByTestId("retreat-response")).toBeNull();
  });

  it.each(["divide-records", "carry-records", "strip-identities"])("keeps %s custody in all three orderly endings and after resume", async records => {
    for (const [decision, outcome] of [["stay-together", "together"], ["move-with-remnant", "remnant"], ["release-groups", "dispersed"]] as const) {
      localStorage.clear();
      const input = props();
      input.entry = structuredClone(input.entry);
      // Presentation boundary fixture: ample capacity, not evidence of a real entry route.
      input.entry.fanyang.metrics = { ...input.entry.fanyang.metrics, grain: 8, tempo: 8, city: 8, allies: 8, veterans: 8 };
      const view = render(<RetreatScene {...input} />);
      for (const id of ["keep-reserve", "gather-own", "escort-households", records, decision]) await choose(view, id);
      expect(view.getByTestId("retreat-outcome").dataset.outcome).toBe(outcome);
      const variants = retreatStory.endings[outcome].variants;
      const expected = variants.find(variant => variant.when.records === records)!;
      const memory = view.getByTestId("retreat-ending-memory");
      for (const line of expected.lines) expect(memory.textContent).toContain(line.text);
      for (const other of variants.filter(variant => variant !== expected)) {
        for (const line of other.lines) expect(memory.textContent).not.toContain(line.text);
      }
      const saved = localStorage.getItem(retreatSaveKey);
      const prose = memory.textContent;
      view.unmount();
      const restored = render(<RetreatScene {...input} />);
      fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
      expect(restored.getByTestId("retreat-ending-memory").textContent).toBe(prose);
      expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
      restored.unmount();
    }
  });

  it("supplies the marker column used by the shared two-column choice layout", () => {
    const view = render(<RetreatScene {...props()} />);
    const choices = [...view.container.querySelectorAll("[data-retreat-choice]")];
    expect(choices).toHaveLength(4);
    choices.forEach((choice, index) => {
      expect(choice.firstElementChild?.tagName).toBe("SPAN");
      expect(choice.firstElementChild?.textContent).toBe(String.fromCharCode(65 + index));
      expect([...choice.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())).toBe(true);
    });
  });

  it("keeps the actionable supply question after reports and prior promises in the reading order", () => {
    const view = render(<RetreatScene {...props()} />);
    const scene = view.container.querySelector(".chen-main .chen-scene")!;
    const prose = [...scene.querySelectorAll("p.chen-prose")].map(node => node.textContent);
    expect(prose.at(-1)).toContain("今天能不能一起走");
    expect(prose.some(text => text?.includes("谁卸车，谁带他们找粮"))).toBe(true);
    expect(prose.some(text => text?.includes("别让我到了那边才发现少了"))).toBe(true);
    expect(prose.findIndex(text => text?.includes("使者平安回去了"))).toBeLessThan(prose.findIndex(text => text?.includes("共验时分给他的账")));
    expect(view.getByTestId("retreat-commit")).toBeTruthy();
    expect(localStorage.getItem(retreatSaveKey)).toBeNull();
  });

  it.each([true, false])("uses the prior courier choice for Han's letter without inventing his physical presence (recruited=%s)", async recruited => {
    const input = props();
    let priorChapter = createInitialState(definitions.campaign, 0);
    while (!priorChapter.completed) {
      const node = getNode(definitions.campaign, priorChapter.currentNodeId);
      const preferred = node.id === "rain-order" ? "hide-the-register" : node.id === "shadow-council" ? recruited ? "turn-the-courier" : "release-oldest" : undefined;
      priorChapter = resolveChoice(definitions.campaign, priorChapter, preferred ?? node.choices.find(choice => canChoose(choice, priorChapter.resources))!.id).state;
    }
    let priorCouncil = createCouncil(definitions.council, councilEntry(priorChapter)!);
    for (const choice of ["defer-title", "joint-ledger", "one-command"]) priorCouncil = resolveCouncil(definitions.council, priorCouncil, choice);
    const savedCouncil = JSON.parse(encodeCouncilSnapshot(priorCouncil, councilHash.trim()));
    const priorFanyangEntry = prepareFanyangEntry(definitions.council, priorChapter, savedCouncil, councilHash.trim())!;
    let priorFanyang = createFanyang(definitions.fanyang, priorFanyangEntry);
    for (const choice of ["public-safety", "hold-talks", "withdraw-envoy"]) priorFanyang = resolveFanyang(definitions.fanyang, priorFanyang, choice);
    input.entry = prepareRetreatEntry(definitions, { chapter: priorChapter, council: savedCouncil,
      fanyang: JSON.parse(encodeFanyangSnapshot(priorFanyang, fanyangReview.contentSHA256)) },
      { campaign: "a".repeat(64), council: councilHash.trim(), fanyang: fanyangReview.contentSHA256 })!;
    expect(input.entry.continuity.courierRecruitedEarlier).toBe(recruited);
    // Capacity boundary fixture after an actual prior-choice replay.
    input.entry.fanyang.metrics = { ...input.entry.fanyang.metrics, grain: 8, tempo: 8, city: 8, allies: 8, veterans: 8 };
    const view = render(<RetreatScene {...input} />);
    for (const id of ["verify-road", "gather-own", "split-routes"]) await choose(view, id);
    if (!recruited) {
      expect(view.queryByText(/韩驿使来简/)).toBeNull();
      expect(view.queryByTestId("retreat-observations")).toBeNull();
      return;
    }
    expect(view.getByTestId("retreat-witnessed-arrival").textContent).toContain("韩驿使没有跟着来");
    expect(view.getByTestId("retreat-observations").textContent).toContain("不保证此刻仍可通行");
    fireEvent.click(view.container.querySelector('[data-retreat-choice="strip-identities"]')!);
    fireEvent.click(view.getByTestId("retreat-commit"));
    await view.findByTestId("retreat-response");
    expect(view.getByTestId("retreat-letter-answer").textContent).toContain("匿名抄件已不够");
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const restored = render(<RetreatScene {...input} />);
    expect(restored.getByTestId("retreat-letter-answer").textContent).toContain("匿名抄件已不够");
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    fireEvent.click(restored.container.querySelector('[data-retreat-choice="release-groups"]')!);
    fireEvent.click(restored.getByTestId("retreat-commit"));
    await restored.findByTestId("retreat-response");
    expect(restored.getByTestId("retreat-companion-answer").textContent).toContain("别拿他的名字");
  });

  it("witnesses Yu only after a saved escort and preserves the limited observation across resume and dispersal", async () => {
    const input = props();
    input.entry = structuredClone(input.entry);
    input.entry.fanyang.metrics = { ...input.entry.fanyang.metrics, grain: 8, tempo: 8, city: 8, allies: 8, veterans: 8 };
    const view = render(<RetreatScene {...input} />);
    expect(view.queryByTestId("retreat-observations")).toBeNull();
    for (const id of ["keep-reserve", "gather-own", "escort-households"]) await choose(view, id);
    expect(view.queryByTestId("retreat-witnessed-arrival")).toBeNull();
    fireEvent.click(view.container.querySelector('[data-retreat-choice="strip-identities"]')!);
    fireEvent.click(view.getByTestId("retreat-commit"));
    await view.findByTestId("retreat-response");
    expect(view.queryByTestId("retreat-observations")).toBeNull();
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const restored = render(<RetreatScene {...input} />);
    expect(restored.queryByTestId("retreat-observations")).toBeNull();
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(restored.getByTestId("retreat-witnessed-arrival").textContent).toContain("没跟北边的使团走");
    expect(restored.getByTestId("retreat-observations").textContent).toContain("不保证此后一直同行");
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    fireEvent.click(restored.container.querySelector('[data-retreat-choice="release-groups"]')!);
    fireEvent.click(restored.getByTestId("retreat-commit"));
    await restored.findByTestId("retreat-response");
    expect(restored.getByTestId("retreat-companion-answer").textContent).toContain("我留在这里问他们");
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(restored.getByTestId("retreat-observations").textContent).toContain("不保证此后一直同行");
    expect(input.entry.continuity.currentCompanionPresence.yu).toBe("unestablished");
  });

  it.each([
    ["take-crown", "新拨单用着议事后定下的王号", "拨单的名号栏仍空着"],
    ["recognize-allies", "约立六国的提议传出去了", "新拨单用着议事后定下的王号"],
    ["defer-title", "拨单的名号栏仍空着", "新拨单用着议事后定下的王号"]
  ])("preserves %s as a distinct political state at the viewpoint handoff", (authority, expected, excluded) => {
    const input = props();
    // Presentation fixture only; real entries still come through canonical replay.
    input.entry = structuredClone(input.entry);
    input.entry.council.choices[0] = authority;
    const before = JSON.stringify(input.entry);
    const view = render(<RetreatScene {...input} />);
    expect(view.getByTestId("retreat-viewpoint").textContent).toContain("不是议事篇接受王号的人");
    const memory = view.getByTestId("retreat-council-memory").textContent;
    expect(memory).toContain(expected);
    expect(memory).not.toContain(excluded);
    expect(localStorage.getItem(retreatSaveKey)).toBeNull();
    expect(JSON.stringify(input.entry)).toBe(before);
  });

  it("remembers the replayed council's grain account and command choice in later scenes", async () => {
    const input = props();
    const before = JSON.stringify(input.entry);
    const view = render(<RetreatScene {...input} />);
    expect(view.getByTestId("retreat-council-memory").textContent).toContain("共验时分给他的账");
    expect(view.queryByText(/上回不是等来了商队/)).toBeNull();
    await choose(view, "decline-dispatch");
    expect(view.queryByTestId("retreat-council-memory")).toBeNull();
    await choose(view, "gather-own");
    expect(view.getByTestId("retreat-council-memory").textContent).toContain("当初出城只传一道令");
    expect(view.queryByText(/当初说留在陈地/)).toBeNull();
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const restored = render(<RetreatScene {...input} />);
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(restored.getByTestId("retreat-council-memory").textContent).toContain("当初出城只传一道令");
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    expect(JSON.stringify(input.entry)).toBe(before);
  });

  it("pays off reception and escort with a witnessed reunion after resume, even with identities removed", async () => {
    const input = props();
    input.entry = structuredClone(input.entry);
    // Explicit capacity fixture; do not claim this is a canonical prior route.
    input.entry.fanyang.metrics = { ...input.entry.fanyang.metrics, grain: 8, tempo: 8, city: 8, allies: 8, veterans: 8 };
    const view = render(<RetreatScene {...input} />);
    for (const id of ["keep-reserve", "open-reception", "escort-households", "strip-identities"]) await choose(view, id);
    expect(view.getByText("阿衡。我还当你走了另一条路。", { exact: false })).toBeTruthy();
    expect(view.getByText(/其他失散者仍没有消息/)).toBeTruthy();
    expect(view.getByText(/没有补写那些被去掉的名字/)).toBeTruthy();
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const restored = render(<RetreatScene {...input} />);
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(restored.getByText(/亲眼见到了人/)).toBeTruthy();
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    await choose(restored, "release-groups");
    expect(restored.getByTestId("retreat-outcome")).toBeTruthy();
  });

  it("keeps authoring caveats in optional notes and explains the active choice in Chinese", () => {
    const view = render(<RetreatScene {...props()} />);
    expect(view.getByText("陈地，收发粮秣的院落。北方的文书辗转抵达，西边的催援也到了。")).toBeTruthy();
    expect(view.getByText(/付出一份粮秣，把答应的粮车送出/)).toBeTruthy();
    expect(view.container.querySelector(".chen-main")?.textContent).not.toContain("成文和抵达时间分别待历史校对");
    const notes = view.getByText("史料与开发说明").closest("details")!;
    expect(notes.open).toBe(false);
    expect(notes.textContent).toContain("成文和抵达时间分别待历史校对");
    expect(view.queryByText("Supply the agreed grain convoy but retain an escort reserve; partners receive less support than requested.")).toBeNull();
  });

  it("plays five decisions to an ending without touching previous episode saves", async () => {
    localStorage.setItem("shi.chen-council.v1", councilSnapshot);
    localStorage.setItem("shi.fanyang-guarantee.v1", fanyangSnapshot);
    const view = render(<RetreatScene {...props()} />);
    for (const id of ["decline-dispatch", "gather-own", "split-routes", "carry-records", "release-groups"]) await choose(view, id);
    expect(view.getByTestId("retreat-outcome").getAttribute("data-outcome")).toBe("dispersed");
    expect(JSON.parse(localStorage.getItem(retreatSaveKey)!).choices).toHaveLength(5);
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(councilSnapshot);
    expect(localStorage.getItem("shi.fanyang-guarantee.v1")).toBe(fanyangSnapshot);
  });

  it("restores the saved reaction without submitting or skipping the order", async () => {
    const input = props(), view = render(<RetreatScene {...input} />);
    await choose(view, "decline-dispatch");
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const writes = vi.spyOn(Storage.prototype, "setItem");
    const restored = render(<RetreatScene {...input} />);
    expect(restored.getByTestId("retreat-response").textContent).toContain("没有新的车队出发");
    expect(document.activeElement).toBe(within(restored.getByTestId("retreat-response")).getByRole("heading"));
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(writes).not.toHaveBeenCalled();
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
  });

  it("waits for durable storage and blocks duplicate commits and exits", async () => {
    let finish!: () => void;
    vi.spyOn(persistence, "flushPersistence").mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
    const input = props(), view = render(<RetreatScene {...input} />);
    fireEvent.click(view.container.querySelector('[data-retreat-choice="decline-dispatch"]')!);
    fireEvent.click(view.getByTestId("retreat-commit")); fireEvent.click(view.getByTestId("retreat-commit"));
    fireEvent.keyDown(view.getByTestId("retreat-scene"), { key: "Escape" });
    expect(view.queryByTestId("retreat-response")).toBeNull();
    expect(input.onClose).not.toHaveBeenCalled();
    expect(input.onSavingChange).toHaveBeenLastCalledWith(true);
    expect(JSON.parse(localStorage.getItem(retreatSaveKey)!).choices).toEqual(["decline-dispatch"]);
    await act(async () => finish());
    await view.findByTestId("retreat-response");
    expect(input.onSavingChange).toHaveBeenLastCalledWith(false);
  });

  it("rolls back a failed write and retries one order", async () => {
    vi.spyOn(persistence, "flushPersistence").mockRejectedValueOnce(new Error("storage failure")).mockResolvedValue(undefined);
    const view = render(<RetreatScene {...props()} />);
    fireEvent.click(view.container.querySelector('[data-retreat-choice="decline-dispatch"]')!);
    fireEvent.click(view.getByTestId("retreat-commit"));
    await view.findByRole("alert");
    expect(localStorage.getItem(retreatSaveKey)).toBeNull();
    expect(view.queryByTestId("retreat-response")).toBeNull();
    await choose(view, "decline-dispatch");
    expect(JSON.parse(localStorage.getItem(retreatSaveKey)!).choices).toEqual(["decline-dispatch"]);
  });

  it("preserves incompatible data until explicit restart and supports cancellation", async () => {
    localStorage.setItem(retreatSaveKey, "unreadable original");
    const view = render(<RetreatScene {...props()} />);
    expect(view.getByRole("alert")).toBeTruthy();
    expect((view.getByTestId("retreat-commit") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(view.getByRole("button", { name: "重开本段…" }));
    fireEvent.click(view.getByRole("button", { name: "取消" }));
    expect(localStorage.getItem(retreatSaveKey)).toBe("unreadable original");
    fireEvent.click(view.getByRole("button", { name: "重开本段…" }));
    fireEvent.click(view.getByRole("button", { name: "确认重开" }));
    await view.findByTestId("retreat-commit");
    expect(JSON.parse(localStorage.getItem(retreatSaveKey)!).choices).toEqual([]);
  });

  it.each(["divide-records", "carry-records", "strip-identities"])("previews scattering and preserves its %s closing scene after resume", async records => {
    const input = props(), empty = structuredClone(entry);
    for (const key of ["grain", "tempo", "city", "allies", "veterans"] as const) empty.fanyang.metrics[key] = 0;
    empty.fanyang.metrics.tempo = 1; // Allows copying; zero grain still makes orderly dispersion impossible.
    const view = render(<RetreatScene {...input} entry={empty} />);
    for (const id of ["decline-dispatch", "gather-own", "split-routes", records]) await choose(view, id);
    fireEvent.click(view.container.querySelector('[data-retreat-choice="stay-together"]')!);
    expect(view.getByTestId("retreat-prior-choice-required").textContent).toContain("此前撤离时没有选择护送家户");
    expect(view.getByText(/粮秣：0 \/ 需要 2 还缺 2/)).toBeTruthy();
    expect((view.getByTestId("retreat-commit") as HTMLButtonElement).disabled).toBe(true);
    const beforeInspection = localStorage.getItem(retreatSaveKey);
    fireEvent.click(view.getByTestId("retreat-commit"));
    expect(localStorage.getItem(retreatSaveKey)).toBe(beforeInspection);
    fireEvent.click(view.container.querySelector('[data-retreat-choice="release-groups"]')!);
    expect(view.queryByTestId("retreat-prior-choice-required")).toBeNull();
    expect(view.getByTestId("retreat-preview").getAttribute("data-outcome")).toBe("scattered");
    fireEvent.click(view.getByTestId("retreat-commit"));
    const response = await view.findByTestId("retreat-response");
    expect(response.textContent).toContain("账还没核完");
    expect(response.textContent).not.toContain("愿结伴的结伴");
    for (const line of retreatStory.scatteredEnding.response) expect(response.textContent).toContain(line.text);
    fireEvent.click(within(response).getByRole("button", { name: /继续/ }));
    expect(view.getByTestId("retreat-outcome").getAttribute("data-outcome")).toBe("scattered");
    expect(view.queryByTestId("retreat-ending-memory")).toBeNull();
    expect(view.getByTestId("retreat-outcome").textContent).not.toContain("人分开了，账还是找你");
    const memory = view.getByTestId("retreat-scattered-memory");
    for (const variant of retreatStory.scatteredEnding.variants) {
      for (const line of variant.lines) expect(memory.textContent?.includes(line.text)).toBe(variant.when.records === records);
    }
    const prose = view.getByTestId("retreat-outcome").textContent;
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const restored = render(<RetreatScene {...input} entry={empty} />);
    expect(restored.getByTestId("retreat-response").textContent).toContain("原先说好的分行，没有等到一一交接");
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(restored.getByTestId("retreat-outcome").textContent).toBe(prose);
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
  });

  it.each(["dispersed", "scattered"] as const)("preserves borrowed grain, debt and the matching %s ending through save failure and resume", async (outcome) => {
    const supported = structuredClone(entry);
    for (const key of ["tempo", "city", "allies", "veterans"] as const) supported.fanyang.metrics[key] = 6;
    supported.fanyang.metrics.grain = 0;
    // Deliberate unit-test inputs, not proof of campaign-route reachability.
    if (outcome === "scattered") Object.assign(supported.fanyang.metrics, { city: 2, allies: 4, veterans: 0 });
    const input = { ...props(), entry: supported };
    let view = render(<RetreatScene {...input} />);
    await choose(view, "decline-dispatch");
    const before = localStorage.getItem(retreatSaveKey);
    fireEvent.click(view.container.querySelector('[data-retreat-choice="borrow-local-grain"]')!);
    expect(view.getByTestId("retreat-debt-preview").textContent).toContain("2 份粮秣");
    expect(view.queryByTestId("retreat-debts")).toBeNull();
    expect(localStorage.getItem(retreatSaveKey)).toBe(before);
    vi.spyOn(persistence, "flushPersistence").mockRejectedValueOnce(new Error("loan save failed")).mockResolvedValue(undefined);
    fireEvent.click(view.getByTestId("retreat-commit"));
    await view.findByRole("alert");
    expect(localStorage.getItem(retreatSaveKey)).toBe(before);
    expect(view.queryByTestId("retreat-debts")).toBeNull();
    fireEvent.click(view.getByTestId("retreat-commit"));
    await view.findByTestId("retreat-response");
    expect(view.getByTestId("retreat-debts").textContent).toContain("欠本地粮主 2 份粮秣");
    expect(view.getByTestId("retreat-debts").closest("details")).toBeNull();
    expect(view.container.querySelector(".chen-metrics")).toBeNull();
    const saved = localStorage.getItem(retreatSaveKey);
    expect(JSON.parse(saved!).choices).toEqual(["decline-dispatch", "borrow-local-grain"]);
    view.unmount();
    view = render(<RetreatScene {...input} />);
    expect(view.getByTestId("retreat-response").textContent).toContain("粮补上了，欠契也留下了");
    expect(view.getByTestId("retreat-debts").querySelectorAll("p")).toHaveLength(1);
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    fireEvent.click(within(view.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    for (const id of ["split-routes", "strip-identities", "release-groups"]) await choose(view, id);
    expect(view.getByTestId("retreat-outcome").getAttribute("data-outcome")).toBe(outcome);
    expect(view.getByTestId("retreat-debts").textContent).toContain("分行不表示免责");
    const decisionRecord = view.getByTestId("retreat-decision-record") as HTMLDetailsElement;
    expect(decisionRecord.open).toBe(false);
    const decisionSave = localStorage.getItem(retreatSaveKey);
    fireEvent.click(within(decisionRecord).getByText("回看这一路的决定"));
    expect(decisionRecord.open).toBe(true);
    expect([...decisionRecord.querySelectorAll("[data-recorded-choice]")].map(element => element.getAttribute("data-recorded-choice")))
      .toEqual(["decline-dispatch", "borrow-local-grain", "split-routes", "strip-identities", "release-groups"]);
    const loanRecord = decisionRecord.querySelector('[data-recorded-choice="borrow-local-grain"]')!;
    expect(loanRecord.textContent).toContain("粮秣：0 → 2");
    expect(loanRecord.textContent).toContain("粮主保留欠契");
    expect(decisionRecord.querySelector('[data-recorded-choice="release-groups"]')!.textContent).toContain("本次未改变这五项数值");
    expect(localStorage.getItem(retreatSaveKey)).toBe(decisionSave);
    const ending = outcome === "scattered" ? retreatStory.scatteredEnding : retreatStory.endings.dispersed;
    const loan = ending.variants.find(variant => variant.when["bad-news"] === "borrow-local-grain")!;
    for (const line of loan.lines) expect(view.getByTestId("retreat-outcome").textContent).toContain(line.text);
    const endingSave = localStorage.getItem(retreatSaveKey);
    view.unmount();
    view = render(<RetreatScene {...input} />);
    fireEvent.click(within(view.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    for (const line of loan.lines) expect(view.getByTestId("retreat-outcome").textContent).toContain(line.text);
    expect(localStorage.getItem(retreatSaveKey)).toBe(endingSave);
    expect((view.getByTestId("retreat-decision-record") as HTMLDetailsElement).open).toBe(false);
    expect(view.getByTestId("retreat-decision-record").textContent).toBe(decisionRecord.textContent);
  });

  it("has a named Chinese dialog, keyboard focus wrapping and no automatic semantic violations", async () => {
    const view = render(<RetreatScene {...props()} />);
    expect(view.getByRole("dialog").getAttribute("lang")).toBe("zh-Hans");
    const close = view.getByRole("button", { name: "返回范阳" }); close.focus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(view.getByRole("button", { name: "重开本段…" }));
    expect((await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
    fireEvent.click(view.getByTestId("retreat-commit"));
    await view.findByTestId("retreat-response");
    expect((await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });

  it("enters from the real Chen and Fan Yang flow using hashes of actual canonical bytes", async () => {
    vi.stubGlobal("crypto", webcrypto);
    localStorage.setItem("shi.chen-council.v1", councilSnapshot);
    localStorage.setItem("shi.fanyang-guarantee.v1", fanyangSnapshot);
    const view = render(<ChenCouncil origin={chapter} locale="en" reducedMotion onCue={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(view.getByTestId("council-continue"));
    fireEvent.click(view.getByTestId("fanyang-enter"));
    fireEvent.click(within(view.getByTestId("fanyang-response")).getByRole("button", { name: /Continue/ }));
    fireEvent.click(view.getByTestId("retreat-enter"));
    await view.findByTestId("retreat-scene");
    await choose(view, "decline-dispatch");
    const saved = JSON.parse(localStorage.getItem(retreatSaveKey)!);
    expect(saved.rulesSHA256).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.storySHA256).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.choices).toEqual(["decline-dispatch"]);
  });
});
