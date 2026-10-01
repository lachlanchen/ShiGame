import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInitialState, resolveChoice, councilEntry, createCouncil, resolveCouncil, prepareFanyangEntry,
  createFanyang, resolveFanyang, encodeFanyangSnapshot, prepareRetreatEntry, createRetreat, resolveRetreat,
  encodeRetreatSnapshot, prepareRefugeEntry, createRefuge, inspectRefugeChoice, resolveRefuge,
  encodeRefugeSnapshot, resolveMorning, encodeMorningSnapshot, prepareRefugeContactEntry,
  inspectContactChoice, resolveContact, type RefugeState, type MorningState, type ContactState,
  type RefugeOrder, type MorningOrder, type ContactOrder } from "../packages/game-core/src";

const root = resolve(import.meta.dirname, "..");
const paths = { campaign: "campaigns/chapter-01-daze.json", council: "councils/chen-council.v1.json", fanyang: "councils/fanyang-guarantee.v1.json",
  retreatRules: "campaigns/chen-retreat.rules.v1.json", retreatStory: "story-drafts/chen-retreat.v1.json", nightRules: "campaigns/refuge.rules.v1.json",
  nightStory: "story-drafts/refuge.v1.json", morning: "story-drafts/refuge-morning.v1.json", contact: "story-drafts/refuge-contact.v1.json" };
const data = Object.fromEntries(Object.entries(paths).map(([key, path]) => {
  const bytes = readFileSync(resolve(root, "content", path));
  return [key, { value: JSON.parse(bytes.toString()), hash: createHash("sha256").update(bytes).digest("hex") }];
}));
const hashes = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.hash]));
const chapterChoices = ["read-the-names", "issue-grain-tallies", "repair-the-ford", "root-in-villages"];
const councilChoices = ["defer-title", "joint-ledger", "one-command"];
const fanyangChoices = ["public-safety", "hold-talks", "withdraw-envoy"];
let chapter = createInitialState(data.campaign!.value, 0);
for (const id of chapterChoices) chapter = resolveChoice(data.campaign!.value, chapter, id).state;
let council = createCouncil(data.council!.value, councilEntry(chapter)!);
for (const id of councilChoices) council = resolveCouncil(data.council!.value, council, id);
const councilSave = { ...council, definitionSHA256: hashes.council };
let fanyang = createFanyang(data.fanyang!.value, prepareFanyangEntry(data.council!.value, chapter, councilSave, hashes.council!)!);
for (const id of fanyangChoices) fanyang = resolveFanyang(data.fanyang!.value, fanyang, id);
const retreatEntry = prepareRetreatEntry({ campaign: data.campaign!.value, council: data.council!.value, fanyang: data.fanyang!.value },
  { chapter, council: councilSave, fanyang: JSON.parse(encodeFanyangSnapshot(fanyang, hashes.fanyang!)) },
  { campaign: hashes.campaign!, council: hashes.council!, fanyang: hashes.fanyang! })!;
const routes = [
  ["keep-reserve", "gather-own", "escort-households", "carry-records", "stay-together"],
  ["send-support", "borrow-local-grain", "hold-formation", "strip-identities", "move-with-remnant"],
  ["decline-dispatch", "gather-own", "split-routes", "divide-records", "release-groups"],
  ["keep-reserve", "open-reception", "escort-households", "carry-records", "release-groups"],
];
const entries = routes.map(retreatChoices => {
  const retreat = retreatChoices.reduce((state, id) => resolveRetreat(data.retreatRules!.value, state, id), createRetreat(data.retreatRules!.value, retreatEntry));
  const entry = prepareRefugeEntry(data.retreatRules!.value, retreatEntry,
    JSON.parse(encodeRetreatSnapshot(retreat, hashes.retreatRules!, hashes.retreatStory!)), hashes.retreatRules!, hashes.retreatStory!)!;
  const cases: unknown[] = [];
  const summary = (orders: string[], night: RefugeState, morning?: MorningState, contact?: ContactState) => ({ orders,
    commonGrain: night.commonGrain, debts: night.debts, records: night.records, shelter: night.shelter,
    rested: night.rested, personalObligation: night.personalObligation, promise: morning?.promise ?? "none",
    localContact: morning?.contact ?? "none", lead: contact?.nextLead ?? morning?.lead ?? null,
    message: contact?.message ?? "not-entrusted", evidence: contact?.evidence ?? "none", disclosure: contact?.disclosure ?? "none",
    companionPresence: "unestablished", completed: Boolean(contact) });
  const initial = createRefuge(entry);
  const nightIDs: RefugeOrder[] = ["offer-grain", "offer-labour", "sleep-outside"];
  cases.push({ summary: summary([], initial), available: nightIDs.filter(id => inspectRefugeChoice(initial, id).available) });
  for (const nightID of nightIDs.filter(id => inspectRefugeChoice(initial, id).available)) {
    const night = resolveRefuge(initial, nightID);
    cases.push({ summary: summary([nightID], night), available: ["repair-roof", "follow-witness"] });
    for (const morningID of ["repair-roof", "follow-witness"] as MorningOrder[]) {
      const morning = resolveMorning(data.morning!.value, night, morningID);
      const contactEntry = prepareRefugeContactEntry(data.morning!.value, entry, JSON.parse(encodeRefugeSnapshot(night, hashes.nightStory!)),
        JSON.parse(encodeMorningSnapshot(morning, hashes.morning!, hashes.nightStory!)), hashes.nightStory!, hashes.morning!)!;
      const available = (["leave-route", "leave-record", "ask-unprompted", "show-record"] as ContactOrder[])
        .filter(id => inspectContactChoice(data.contact!.value, contactEntry, id).available);
      cases.push({ summary: summary([nightID, morningID], night, morning), available });
      for (const contactID of available) cases.push({ summary: summary([nightID, morningID, contactID], night, morning,
        resolveContact(data.contact!.value, contactEntry, contactID)), available: [] });
    }
  }
  return { retreatChoices, outcome: retreat.outcome, cases };
});
const output = process.argv[2];
if (!output) throw new Error("Pass a private fixture output path");
const fixture = { version: 1, paths, hashes, chapterChoices, councilChoices, fanyangChoices, entries,
  stateCount: entries.reduce((sum, entry) => sum + entry.cases.length, 0) };
writeFileSync(output, JSON.stringify(fixture));
console.log(`Refuge parity fixture: ${fixture.stateCount} states, four actual retreat endings and all three record modes.`);
