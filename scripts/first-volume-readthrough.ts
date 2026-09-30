// Read-only editorial export. Replay real rules before presenting a route.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { createInitialState, getNode, resolveChoice, councilEntry, createCouncil, resolveCouncil,
  councilAnswers, prepareFanyangEntry, createFanyang, resolveFanyang, fanyangAnswers, fanyangCanChoose,
  encodeFanyangSnapshot, prepareRetreatEntry, createRetreat, resolveRetreat, inspectRetreatChoice } from "../packages/game-core/src/index";
import { encodeCouncilSnapshot } from "../apps/web/src/council-snapshot";
import { readRoute } from "./story-readthrough.mjs";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const courier = args.includes("--courier");
const beacon = args.includes("--beacon");
assert.ok(!(courier && beacon), "Choose one opening: --courier or --beacon");
const endingIndex = args.indexOf("--ending");
const ending = endingIndex >= 0 ? args[endingIndex + 1] : "together";
const receptionIndex = args.indexOf("--reception");
const reception = receptionIndex >= 0 ? args[receptionIndex + 1] : undefined;
const fanyangIndex = args.indexOf("--fanyang");
const fanyangOutcome = fanyangIndex >= 0 ? args[fanyangIndex + 1] : "withdrawn";
const councilIndex = args.indexOf("--council");
const councilRoute = councilIndex >= 0 ? args[councilIndex + 1] : "defer";
const councilRoutes = {
  defer: ["defer-title", "joint-ledger", "one-command"],
  crown: ["take-crown", "army-rations", "hold-chen"],
  alliance: ["recognize-allies", "buy-convoys", "many-banners"],
};
assert.ok(Object.hasOwn(councilRoutes, councilRoute!), "Use --council defer|crown|alliance");
const councilChoices = councilRoutes[councilRoute as keyof typeof councilRoutes];
assert.ok(["opened", "withdrawn", "deferred"].includes(fanyangOutcome), "Use --fanyang opened|withdrawn|deferred");
const receptions = ["gather-own", "open-reception", "verify-with-partners", "borrow-local-grain"];
assert.ok(receptionIndex < 0 || receptions.includes(reception!), "Use --reception gather-own|open-reception|verify-with-partners|borrow-local-grain");
for (const option of ["--ending", "--reception", "--check", "--courier", "--beacon", "--fanyang", "--council"]) assert.ok(args.filter(arg => arg === option).length <= 1, "Duplicate reading option");
assert.ok(["together", "remnant", "dispersed", "scattered"].includes(ending), "Use --ending together|remnant|dispersed|scattered");
assert.ok(args.every((arg, index) => ["--check", "--ending", "--reception", "--courier", "--beacon", "--fanyang", "--council"].includes(arg) || index === endingIndex + 1 && endingIndex >= 0 || index === receptionIndex + 1 && receptionIndex >= 0 || index === fanyangIndex + 1 && fanyangIndex >= 0 || index === councilIndex + 1 && councilIndex >= 0), "Unknown reading option");
assert.ok(!args.includes("--check") || ending === "together" && reception === undefined && !courier && !beacon && fanyangIndex < 0 && councilIndex < 0, "--check compares the saved default route only");
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
const fanyangResearch = load("content/research/fanyang-entry-review.v1.json");
const zh = (value: Record<string, string>) => { assert.ok(value?.["zh-Hans"]); return value["zh-Hans"]; };
const text: string[] = ["# 势 第一卷连续读稿 草案",
  "这是一条从大泽乡到陈地撤离的完整示例路线，供审阅人物、转折和结尾。它不是唯一故事，也不是最优攻略。请选择你愿意质疑的地方，不必认同这里替读者选定的行动。",
  "正文取自共享游戏文本，按实际规则从种子零回放；没有补满资源或另写过场。为便于连读，省去数值面板、操作按钮和未选项，不代表完整交互体验。对话、地方行动及替代结局是原创戏剧重构；历史与反事实边界保留在各段及文末。开发续篇尚未发行，读稿不是人类验收。"];
const add = (...items: string[]) => text.push(...items.filter(Boolean));
let chapter = createInitialState(campaign, 0);
const openingChoices = courier
  ? ["hide-the-register", "turn-the-courier", "families-first", "root-in-villages"]
  : beacon ? ["take-the-beacon", "extinguish-and-move", "repair-the-ford", "root-in-villages"]
  : ["read-the-names", "issue-grain-tallies", "repair-the-ford", "root-in-villages"];
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
const councilMemories = viewpoints.scenes.council.chapterBridges.filter((item: { afterChoice: string }) => chapter.history.some(turn => turn.choiceId === item.afterChoice));
add(`## ${zh(councilDef.title)}`, zh(councilDef.boundary), zh(viewpoints.scenes.council.text), zh(viewpoints.scenes.council.bridge));
if (councilMemories.length === 1) add(zh(councilMemories[0].text));
add(zh(councilDef.introduction));
for (const id of councilChoices) {
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
function findFanyangRoute(state: ReturnType<typeof createFanyang>): string[] | undefined {
  if (state.completed) return state.outcome === fanyangOutcome ? state.history.map(turn => turn.choiceId) : undefined;
  for (const choice of fanyangDef.rounds[state.history.length].choices) {
    if (!fanyangCanChoose(fanyangDef, state, choice)) continue;
    const route = findFanyangRoute(resolveFanyang(fanyangDef, state, choice.id));
    if (route) return route;
  }
}
const fanyangChoices = fanyangIndex >= 0 || councilIndex >= 0 ? findFanyangRoute(fanyang) : ["public-safety", "hold-talks", "withdraw-envoy"];
assert.ok(fanyangChoices, "No legal route to the requested Fan Yang outcome from this council history");
add(`## ${zh(fanyangDef.title)}`, zh(fanyangDef.boundary), zh(viewpoints.scenes.fanyang.text), zh(viewpoints.scenes.fanyang.bridge), zh(fanyangDef.introduction));
for (const id of fanyangChoices) {
  const round = fanyangDef.rounds[fanyang.history.length];
  const choice = round.choices.find((item: { id: string }) => item.id === id); assert.ok(choice);
  add(`### ${zh(round.title)}`, zh(round.context), `所选行动：${zh(choice.title)}`, zh(choice.intent), zh(choice.response));
  for (const answer of fanyangAnswers(fanyang, choice)) add(zh(answer.text));
  fanyang = resolveFanyang(fanyangDef, fanyang, id);
}
assert.equal(fanyang.outcome, fanyangOutcome);
add(zh(fanyangDef.outcomes[fanyang.outcome!].title), zh(fanyangDef.outcomes[fanyang.outcome!].text));
const entry = prepareRetreatEntry({ campaign, council: councilDef, fanyang: fanyangDef },
  { chapter, council: councilSave, fanyang: JSON.parse(encodeFanyangSnapshot(fanyang, sources.get(fanyangPath)!)) },
  { campaign: sources.get(chapterPath)!, council: sources.get(councilPath)!, fanyang: sources.get(fanyangPath)! });
assert.ok(entry);
function findRequestedRoute(state: ReturnType<typeof createRetreat>): string[] | undefined {
  if (state.completed) return state.outcome === ending ? state.history.map(turn => turn.choiceId) : undefined;
  for (const choice of rules.scenes[state.history.length].choices) {
    if (state.history.length === 0 && courier && choice.id !== "verify-road") continue;
    if (state.history.length === 1 && reception && choice.id !== reception) continue;
    if (!inspectRetreatChoice(rules, state, choice.id).available) continue;
    const route = findRequestedRoute(resolveRetreat(rules, state, choice.id));
    if (route) return route;
  }
}
const choices = ending === "scattered" || reception || courier || beacon || fanyangIndex >= 0 || councilIndex >= 0
  ? findRequestedRoute(createRetreat(rules, entry))
  : ["keep-reserve", reception ?? "gather-own", ending === "together" ? "escort-households" : "hold-formation", "carry-records", ending === "together" ? "stay-together" : ending === "remnant" ? "move-with-remnant" : "release-groups"];
assert.ok(choices, "No legal route to the requested ending from this chapter history");
let retreat = createRetreat(rules, entry);
for (const choice of choices) retreat = resolveRetreat(rules, retreat, choice);
assert.equal(retreat.outcome, ending, "Actual rules must earn the requested ending without refilling resources");
const reading = readRoute(story, entry.readingContext, choices, entry.council.choices, openingChoices);
assert.equal(reading.endingId, ending === "scattered" ? "dispersed" : retreat.outcome);
if (ending === "scattered") {
  // The authoring graph alone cannot resolve resource-triggered scattering.
  // Only substitute after the actual rules above have proved that outcome.
  reading.transcript.at(-1)!.reaction = [
    ...story.scatteredEnding.response,
    ...story.witnessedEvents.filter((event: { id: string }) => reading.witnessedEvents.includes(event.id))
      .flatMap((event: { endingResponses: { scattered: { speaker: string; text: string }[] } }) => event.endingResponses.scattered)
  ];
  reading.ending = { ...story.scatteredEnding, title: zh(rules.scattered.title),
    lines: [...story.scatteredEnding.lines, ...story.scatteredEnding.variants
      .filter((variant: { when: Record<string, string> }) => Object.entries(variant.when).every(([key, value]) => reading.facts[key] === value))
      .flatMap((variant: { lines: { speaker: string; text: string }[] }) => variant.lines)] };
}
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
add(reading.ending.unresolved, story.epilogue, "## 历史参照", "### 大泽乡与渡口");
for (const id of ["zztj-7-qin", "shiji-48-daze", "dramatic-daze-keeper"]) {
  const source = campaign.sources.find((item: { id: string }) => item.id === id);
  assert.ok(source, `Missing opening source: ${id}`);
  add(`${source.work}；${source.locator}。${zh(source.note)}`);
}
add("《资治通鉴》卷七记述遇雨失期、陈胜吴广起事及进据陈地。这里采用传世叙事作为处境，不把其中的刑罚说法当作已独立证实的普遍秦律。掌简人、妪母、韩驿使及读名、亭燧、渡口救援与凭记安排均为戏剧重构；书中没有记载玩家的这些行动。",
  "### 陈地议事", zh(councilDef.history.account), zh(councilDef.history.distinction),
  "### 范阳交涉", `${fanyangResearch.source.work}；${fanyangResearch.source.section}；${fanyangResearch.source.locator}。`,
  "传世记载中，蒯彻劝武臣以保护和礼遇范阳令徐公来降低其他城邑抵抗的动机。这不是对徐公无罪的判定，也不能证明任何保证都会带来投降。使者视角、老卒异议、三轮交涉和不同结局是原创重构；游戏里的撤回或未决不是史书对范阳结局的记载。",
  "### 陈地撤离");
for (const source of Object.values(story.sources) as { volume: number; anchor: string; supports: string }[]) add(`《资治通鉴》卷${source.volume}，${source.anchor}。支持范围：${source.supports}`);
add("## 读后反馈", "哪一处让你不清楚自己在扮演谁？哪个人的要求最能理解，哪个最不像真人？哪次选择最难，哪段想跳过？结尾解决了什么，又留下了什么？你希望继续玩的原因是什么？也可以直接指出不想继续的原因。",
  "## 文本核对", ending === "together" && reception === undefined && !courier && !beacon && fanyangIndex < 0 && councilIndex < 0
    ? "本附录供制作核对，不需要读者审阅。生成命令：`npx vite-node scripts/first-volume-readthrough.ts`。校验已存读稿：同命令追加 `--check`。仅核验这一条路线，不证明其他分支或历史解释均已完成审查。"
    : `本附录供制作核对。生成命令：\`npx vite-node scripts/first-volume-readthrough.ts --ending ${ending}\`。本路线由实际规则回放验证，不补充资源；队伍散去路线按内容顺序寻找第一条合法路径，不表示最佳或唯一玩法。此输出不是默认已存读稿，不使用 --check 校验。`);
if (reception) add(`接应分支：${reception}。复现时在上述命令追加 --reception ${reception}。在本次真实继承状态下，按内容顺序寻找符合该分支与结局的第一条合法路线，不表示最佳或唯一玩法；找不到便拒绝输出，不补资源。`);
if (courier) add("驿使路线：复现时在上述命令追加 --courier。开篇藏名籍、争取韩驿使、家户先渡；陈地先验路讯。按实际规则寻找指定结局，不把回信当作驿使本人归队。");
if (beacon) add("夺燧路线：复现时在上述命令追加 --beacon。开篇夺取亭燧、熄燧潜行、以粮袋固渡、以乡里盟约为根。按实际继承状态寻找指定结局，不把控制信号写成无人追查，也不借用公开读名或招募驿使的经历。");
if (councilIndex >= 0) add(`议事路线：复现时在上述命令追加 --council ${councilRoute}。实际选择：${councilChoices.join(" → ")}。这是三项政策的固定示例，不代表该名号下只有这一套政策，也不代表史实路线。所有支出与承诺按真实规则继承。`);
if (fanyangIndex >= 0 || councilIndex >= 0) add(`范阳路线：复现时在上述命令追加 --fanyang ${fanyangOutcome}。实际选择：${fanyangChoices.join(" → ")}；实际结果：${fanyang.outcome}。在真实议事继承状态下按内容顺序寻找第一条合法路线，不代表最佳或唯一方案；支出与关系继续传入撤离篇，不重置资源。`);
if (ending !== "together" || reception || courier || beacon || fanyangIndex >= 0 || councilIndex >= 0) add(`撤离选择：${choices.join(" → ")}。实际结果：${retreat.outcome}；物资归属：${retreat.resourceCustody}。`);
for (const [path, hash] of sources) add(`- ${path} — SHA256 ${hash}`);
const output = text.join("\n\n") + "\n";
if (process.argv.includes("--check")) {
  assert.equal(readFileSync(resolve(root, "docs/design/FIRST_VOLUME_CONTINUOUS_READING_ZH.md"), "utf8"), output, "Reading copy is stale");
  console.log("Complete route replay and exact reading-copy comparison passed.");
} else console.log(output.trimEnd());
