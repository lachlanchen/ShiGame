import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const campaignPath = resolve(root, "content/campaigns/chapter-01-daze.json");
const campaign = JSON.parse(await readFile(campaignPath, "utf8"));
const errors = [];
const resourceKeys = ["grain", "trust", "momentum", "people", "danger"];
const pressureKinds = ["state", "terrain", "supply", "network"];

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};
const unique = (items, label) => {
  const seen = new Set();
  for (const item of items) {
    assert(item?.id, `${label} contains an item without an id`);
    assert(!seen.has(item.id), `${label} contains duplicate id: ${item.id}`);
    seen.add(item.id);
  }
  return seen;
};
const hasRequiredText = (value, label) => {
  assert(typeof value?.en === "string" && value.en.trim(), `${label} requires English text`);
  assert(typeof value?.["zh-Hans"] === "string" && value["zh-Hans"].trim(), `${label} requires Simplified Chinese text`);
};
const validateResourceMap = (value, label, minimum, maximum, requireAll = false) => {
  const entries = Object.entries(value ?? {});
  if (requireAll) {
    for (const key of resourceKeys) assert(Object.hasOwn(value ?? {}, key), `${label} is missing ${key}`);
  }
  for (const [key, amount] of entries) {
    assert(resourceKeys.includes(key), `${label} has unknown resource ${key}`);
    assert(Number.isFinite(amount) && amount >= minimum && amount <= maximum, `${label}.${key} must be between ${minimum} and ${maximum}`);
  }
};
const canChoose = (choice, resources) => resourceKeys.every((key) => {
  const minimum = choice.requirements?.min?.[key];
  const maximum = choice.requirements?.max?.[key];
  return (minimum === undefined || resources[key] >= minimum) && (maximum === undefined || resources[key] <= maximum);
});
const applyEffects = (resources, effects = {}) => Object.fromEntries(resourceKeys.map((key) => [key, Math.max(0, Math.min(100, Math.round(resources[key] + (effects[key] ?? 0))))]));

assert(campaign.schemaVersion === 1, "campaign schemaVersion must be 1");
hasRequiredText(campaign.title, "campaign.title");
hasRequiredText(campaign.subtitle, "campaign.subtitle");
for (const locale of ["en", "ar", "de", "es", "fr", "ja", "ko", "ru", "vi", "zh-Hans", "zh-Hant"]) {
  assert(typeof campaign.title?.[locale] === "string", `campaign.title is missing ${locale}`);
  assert(typeof campaign.subtitle?.[locale] === "string", `campaign.subtitle is missing ${locale}`);
}

const siteIds = unique(campaign.sites ?? [], "sites");
const characterIds = unique(campaign.characters ?? [], "characters");
const sourceIds = unique(campaign.sources ?? [], "sources");
const nodeIds = unique(campaign.nodes ?? [], "nodes");
assert(nodeIds.has(campaign.startNodeId), `start node does not exist: ${campaign.startNodeId}`);

validateResourceMap(campaign.initialResources, "initialResources", 0, 100, true);
for (const source of campaign.sources ?? []) {
  assert(typeof source.work === "string" && source.work.trim(), `source ${source.id} requires a work title`);
  assert(typeof source.section === "string" && source.section.trim(), `source ${source.id} requires a locator`);
  hasRequiredText(source.note, `source ${source.id}.note`);
  assert(["primary-account", "later-compilation", "dramatic-reconstruction"].includes(source.claimStatus), `source ${source.id} has an invalid claimStatus`);
}
const allChoiceIds = new Set();
for (const node of campaign.nodes ?? []) {
  hasRequiredText(node.dateLabel, `node ${node.id}.dateLabel`);
  hasRequiredText(node.title, `node ${node.id}.title`);
  hasRequiredText(node.context, `node ${node.id}.context`);
  hasRequiredText(node.dialogue, `node ${node.id}.dialogue`);
  assert(siteIds.has(node.siteId), `node ${node.id} references unknown site ${node.siteId}`);
  assert(characterIds.has(node.speakerId), `node ${node.id} references unknown character ${node.speakerId}`);
  assert(Array.isArray(node.choices) && node.choices.length >= 2, `node ${node.id} must offer at least two choices`);
  for (const sourceRef of node.sourceRefs ?? []) assert(sourceIds.has(sourceRef), `node ${node.id} references unknown source ${sourceRef}`);
  const choiceIds = new Set();
  for (const choice of node.choices ?? []) {
    assert(!choiceIds.has(choice.id), `node ${node.id} contains duplicate choice ${choice.id}`);
    assert(!allChoiceIds.has(choice.id), `campaign contains duplicate choice ${choice.id}`);
    choiceIds.add(choice.id);
    allChoiceIds.add(choice.id);
    hasRequiredText(choice.label, `choice ${choice.id}.label`);
    hasRequiredText(choice.intent, `choice ${choice.id}.intent`);
    hasRequiredText(choice.consequence, `choice ${choice.id}.consequence`);
    hasRequiredText(choice.strategy, `choice ${choice.id}.strategy`);
    if (choice.nextNodeId) assert(nodeIds.has(choice.nextNodeId), `choice ${choice.id} points to missing node ${choice.nextNodeId}`);
    validateResourceMap(choice.effects, `choice ${choice.id}.effects`, -100, 100);
    validateResourceMap(choice.requirements?.min, `choice ${choice.id}.requirements.min`, 0, 100);
    validateResourceMap(choice.requirements?.max, `choice ${choice.id}.requirements.max`, 0, 100);
    if (choice.nextNodeId) {
      assert(choice.pressure, `nonterminal choice ${choice.id} requires a pressure response`);
    } else {
      assert(!choice.pressure, `terminal choice ${choice.id} must not add unresolved pressure`);
    }
    if (choice.pressure) {
      assert(pressureKinds.includes(choice.pressure.kind), `choice ${choice.id} has invalid pressure kind ${choice.pressure.kind}`);
      hasRequiredText(choice.pressure.warning, `choice ${choice.id}.pressure.warning`);
      hasRequiredText(choice.pressure.reveal, `choice ${choice.id}.pressure.reveal`);
      validateResourceMap(choice.pressure.effects, `choice ${choice.id}.pressure.effects`, -100, 100);
      assert(Object.keys(choice.pressure.effects ?? {}).length > 0, `choice ${choice.id}.pressure.effects cannot be empty`);
    }
  }
}

const reachable = new Set();
const visit = (nodeId, stack = []) => {
  assert(!stack.includes(nodeId), `campaign graph contains a cycle: ${[...stack, nodeId].join(" -> ")}`);
  if (reachable.has(nodeId)) return;
  reachable.add(nodeId);
  const node = campaign.nodes.find((candidate) => candidate.id === nodeId);
  for (const choice of node?.choices ?? []) if (choice.nextNodeId) visit(choice.nextNodeId, [...stack, nodeId]);
};
visit(campaign.startNodeId);
for (const id of nodeIds) assert(reachable.has(id), `node is unreachable: ${id}`);
const finaleCount = campaign.nodes.flatMap((node) => node.choices).filter((choice) => !choice.nextNodeId).length;
assert(finaleCount >= 3, "campaign requires at least three authored conclusions");

const routeStats = { successful: 0, failed: 0, endings: new Set(), deadlocks: 0 };
const walkRoutes = (nodeId, resources, flags, path = []) => {
  const node = campaign.nodes.find((candidate) => candidate.id === nodeId);
  const available = (node?.choices ?? []).filter((choice) => canChoose(choice, resources));
  if (available.length === 0) {
    routeStats.deadlocks++;
    assert(false, `playable route deadlocks at ${nodeId}: ${path.join(" -> ")}`);
    return;
  }

  for (const choice of available) {
    const afterChoice = applyEffects(resources, choice.effects);
    const after = applyEffects(afterChoice, choice.pressure?.effects);
    const nextFlags = new Set([...flags, ...(choice.flags ?? [])]);
    const nextPath = [...path, choice.id];
    if (after.danger >= 100 || after.people <= 0) {
      routeStats.failed++;
    } else if (!choice.nextNodeId) {
      routeStats.successful++;
      for (const flag of nextFlags) if (flag.startsWith("ending-")) routeStats.endings.add(flag);
    } else {
      walkRoutes(choice.nextNodeId, after, nextFlags, nextPath);
    }
  }
};
walkRoutes(campaign.startNodeId, campaign.initialResources, new Set());
for (const ending of ["ending-wildfire", "ending-deep-roots", "ending-watchful"]) {
  assert(routeStats.endings.has(ending), `authored conclusion is unreachable under pressure rules: ${ending}`);
}
assert(routeStats.successful >= 3, "campaign requires at least three successful playable routes");
assert(routeStats.failed >= 1, "campaign pressure must expose at least one real failure route");

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Content valid: ${campaign.nodes.length} nodes, ${campaign.nodes.reduce((sum, node) => sum + node.choices.length, 0)} choices, ${campaign.sources.length} source records, ${finaleCount} conclusions, ${routeStats.successful} successful routes, ${routeStats.failed} failure routes.`);
