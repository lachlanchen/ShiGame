import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const campaignPath = resolve(root, "content/campaigns/chapter-01-daze.json");
const campaign = JSON.parse(await readFile(campaignPath, "utf8"));
const errors = [];

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

for (const [key, value] of Object.entries(campaign.initialResources ?? {})) {
  assert(Number.isFinite(value) && value >= 0 && value <= 100, `initial resource ${key} must be between 0 and 100`);
}
for (const source of campaign.sources ?? []) {
  hasRequiredText(source.note, `source ${source.id}.note`);
  assert(["primary-account", "later-compilation", "dramatic-reconstruction"].includes(source.claimStatus), `source ${source.id} has an invalid claimStatus`);
}
for (const node of campaign.nodes ?? []) {
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
    choiceIds.add(choice.id);
    hasRequiredText(choice.label, `choice ${choice.id}.label`);
    hasRequiredText(choice.intent, `choice ${choice.id}.intent`);
    hasRequiredText(choice.consequence, `choice ${choice.id}.consequence`);
    hasRequiredText(choice.strategy, `choice ${choice.id}.strategy`);
    if (choice.nextNodeId) assert(nodeIds.has(choice.nextNodeId), `choice ${choice.id} points to missing node ${choice.nextNodeId}`);
    for (const [key, value] of Object.entries(choice.effects ?? {})) {
      assert(["grain", "trust", "momentum", "people", "danger"].includes(key), `choice ${choice.id} has unknown resource ${key}`);
      assert(Number.isFinite(value), `choice ${choice.id} has non-numeric effect ${key}`);
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

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Content valid: ${campaign.nodes.length} nodes, ${campaign.nodes.reduce((sum, node) => sum + node.choices.length, 0)} choices, ${campaign.sources.length} source records, ${finaleCount} conclusions.`);
