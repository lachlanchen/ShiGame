// Read-only editorial export. Replay real rules before presenting a route.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { createInitialState, getNode, resolveChoice, councilEntry, createCouncil, resolveCouncil,
  councilAnswers, prepareFanyangEntry, createFanyang, resolveFanyang, fanyangAnswers,
  encodeFanyangSnapshot, prepareRetreatEntry, createRetreat, resolveRetreat } from "../packages/game-core/src/index";
import { encodeCouncilSnapshot } from "../apps/web/src/council-snapshot";
import { readRoute } from "./story-readthrough.mjs";

const root = resolve(import.meta.dirname, "..");
const sources = new Map<string, string>();
function load(path: string) {
  const bytes = readFileSync(resolve(root, path));
  sources.set(path, createHash("sha256").update(bytes).digest("hex"));
  return JSON.parse(bytes.toString());
}
const chapterPath = "content/campaigns/chapter-01-daze.json";
const councilPath = "content/councils/chen-council.v1.json";
const fanyangPath = "content/councils/fanyang-guarantee.v1.json";
const campaign = load(chapterPath), councilDef = load(councilPath), fanyangDef = load(fanyangPath);
const story = load("content/story-drafts/chen-retreat.v1.json");
const rules = load("content/campaigns/chen-retreat.rules.v1.json");
const viewpoints = load("content/presentation/viewpoints.v1.json");
const zh = (value: Record<string, string>) => { assert.ok(value?.["zh-Hans"]); return value["zh-Hans"]; };
const text: string[] = ["# 势 第一卷连续读稿 草案",
  "这是一条从大泽乡到陈地撤离的完整示例路线，供审阅人物、转折和结尾。它不是唯一故事，也不是最优攻略。请选择你愿意质疑的地方，不必认同这里替读者选定的行动。",
  "正文取自共享游戏文本，按实际规则从种子零回放；没有补满资源或另写过场。为便于连读，省去数值面板、操作按钮和未选项，不代表完整交互体验。对话、地方行动及替代结局是原创戏剧重构；历史与反事实边界保留在各段及文末。开发续篇尚未发行，读稿不是人类验收。"];
const add = (...items: string[]) => text.push(...items.filter(Boolean));
let chapter = createInitialState(campaign, 0);
const openingChoices = ["read-the-names", "issue-grain-tallies", "repair-the-ford", "root-in-villages"];
for (const id of openingChoices) {
  const node = getNode(campaign, chapter.currentNodeId);
  add(`## ${zh(node.title)}`, zh(node.dateLabel), zh(node.context), zh(node.dialogue));
  for (const echo of node.storyEchoes ?? []) if (chapter.flags.includes(echo.requiredFlag)) add(zh(echo.text));
  const resolution = resolveChoice(campaign, chapter, id);
  add(zh(resolution.condition.signal), `所选行动：${zh(resolution.choice.label)}`, zh(resolution.choice.intent), zh(resolution.choice.consequence));
  if (resolution.commitment) add(zh(resolution.commitment.outcome.response));
  if (resolution.choice.pressure) add(zh(resolution.choice.pressure.reveal));
  if (resolution.oppositionStage) add(zh(resolution.oppositionStage.response));
  if (resolution.methodRead) {
    const read = resolution.methodRead.read;
    add(zh("response" in read ? read.response : resolution.methodReadMatched ? read.hitResponse : read.missResponse));
  }
  chapter = resolution.state;
}
assert.ok(chapter.completed && !chapter.failureReason);
const origin = councilEntry(chapter); assert.ok(origin);
let council = createCouncil(councilDef, origin);
add(`## ${zh(councilDef.title)}`, zh(councilDef.boundary), zh(viewpoints.scenes.council.text), zh(councilDef.introduction));
for (const id of ["defer-title", "joint-ledger", "one-command"]) {
  const round = councilDef.rounds[council.history.length];
  const choice = round.choices.find((item: { id: string }) => item.id === id); assert.ok(choice);
  add(`### ${zh(round.title)}`, zh(round.context), `所选行动：${zh(choice.title)}`, zh(choice.intent), zh(choice.response));
  for (const answer of councilAnswers(council, choice)) add(zh(answer.text));
  if (choice.pledge) add(`当众承诺：${zh(choice.pledge)}`);
  council = resolveCouncil(councilDef, council, id);
}
assert.ok(council.completed && council.outcome);
add(zh(councilDef.outcomes[council.outcome].title), zh(councilDef.outcomes[council.outcome].text));
const councilSave = JSON.parse(encodeCouncilSnapshot(council, sources.get(councilPath)!));
const fanyangEntry = prepareFanyangEntry(councilDef, chapter, councilSave, sources.get(councilPath)!); assert.ok(fanyangEntry);
let fanyang = createFanyang(fanyangDef, fanyangEntry);
add(`## ${zh(fanyangDef.title)}`, zh(fanyangDef.boundary), zh(viewpoints.scenes.fanyang.text), zh(fanyangDef.introduction));
for (const id of ["public-safety", "hold-talks", "withdraw-envoy"]) {
  const round = fanyangDef.rounds[fanyang.history.length];
  const choice = round.choices.find((item: { id: string }) => item.id === id); assert.ok(choice);
  add(`### ${zh(round.title)}`, zh(round.context), `所选行动：${zh(choice.title)}`, zh(choice.intent), zh(choice.response));
  for (const answer of fanyangAnswers(fanyang, choice)) add(zh(answer.text));
  fanyang = resolveFanyang(fanyangDef, fanyang, id);
}
assert.equal(fanyang.outcome, "withdrawn");
add(zh(fanyangDef.outcomes[fanyang.outcome!].title), zh(fanyangDef.outcomes[fanyang.outcome!].text));
const entry = prepareRetreatEntry({ campaign, council: councilDef, fanyang: fanyangDef },
  { chapter, council: councilSave, fanyang: JSON.parse(encodeFanyangSnapshot(fanyang, sources.get(fanyangPath)!)) },
  { campaign: sources.get(chapterPath)!, council: sources.get(councilPath)!, fanyang: sources.get(fanyangPath)! });
assert.ok(entry);
const choices = ["keep-reserve", "gather-own", "escort-households", "carry-records", "stay-together"];
let retreat = createRetreat(rules, entry);
for (const choice of choices) retreat = resolveRetreat(rules, retreat, choice);
assert.equal(retreat.outcome, "together");
const reading = readRoute(story, entry.readingContext, choices, entry.council.choices, openingChoices);
assert.equal(reading.endingId, retreat.outcome);
const names: Record<string, string> = { narrator: "", keeper: "掌简人", "supply-officer": "催粮军吏", "yu-mu": "妪母", "qin-courier": "韩驿使", "wounded-soldier": "伤卒", "partner-steward": "邻部管事", "rear-guard": "守路士卒", "granary-holder": "粮主", "han-letter": "韩驿使来信" };
function lines(items: { speaker: string; text: string }[]) {
  for (const line of items) { assert.ok(Object.hasOwn(names, line.speaker)); add(names[line.speaker] ? `${names[line.speaker]}：${line.text}` : line.text); }
}
add(`## ${story.viewpoint.title}`, story.viewpoint.text, story.viewpoint.historyBoundary);
for (const beat of reading.transcript) {
  add(`### ${beat.title}`, beat.setting); lines(beat.lines);
  add(`所选行动：${beat.choiceTitle}`, beat.intent); lines(beat.reaction);
}
add(`## ${reading.ending.title}`); lines(reading.ending.lines);
add(reading.ending.unresolved, story.epilogue, "## 历史参照", zh(councilDef.history.account), zh(councilDef.history.distinction));
for (const source of Object.values(story.sources) as { volume: number; anchor: string; supports: string }[]) add(`《资治通鉴》卷${source.volume}，${source.anchor}。支持范围：${source.supports}`);
add("## 读后反馈", "哪一处让你不清楚自己在扮演谁？哪个人的要求最能理解，哪个最不像真人？哪次选择最难，哪段想跳过？结尾解决了什么，又留下了什么？你希望继续玩的原因是什么？也可以直接指出不想继续的原因。",
  "## 文本核对", "本附录供制作核对，不需要读者审阅。生成命令：`npx vite-node scripts/first-volume-readthrough.ts`。校验已存读稿：同命令追加 `--check`。仅核验这一条路线，不证明其他分支或历史解释均已完成审查。");
for (const [path, hash] of sources) add(`- ${path} — SHA256 ${hash}`);
const output = text.join("\n\n") + "\n";
if (process.argv.includes("--check")) {
  assert.equal(readFileSync(resolve(root, "docs/design/FIRST_VOLUME_CONTINUOUS_READING_ZH.md"), "utf8"), output, "Reading copy is stale");
  console.log("Complete route replay and exact reading-copy comparison passed.");
} else console.log(output.trimEnd());
