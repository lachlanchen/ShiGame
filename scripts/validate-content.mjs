import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const campaignPath = resolve(root, "content/campaigns/chapter-01-daze.json");
const campaign = JSON.parse(await readFile(campaignPath, "utf8"));
const editionRegisterPath = resolve(root, "content/research/editions.json");
const editionRegister = JSON.parse(await readFile(editionRegisterPath, "utf8"));
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
const oppositionStageFor = (resources) => campaign.opposition.stages.find((stage) => resources.danger >= stage.minDanger && resources.danger <= stage.maxDanger);

assert(campaign.schemaVersion === 4, "campaign schemaVersion must be 4");
assert(editionRegister.schemaVersion === 1, "edition register schemaVersion must be 1");
assert(typeof campaign.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(campaign.id), "campaign.id must use ASCII kebab-case");
hasRequiredText(campaign.title, "campaign.title");
hasRequiredText(campaign.subtitle, "campaign.subtitle");
for (const locale of ["en", "ar", "de", "es", "fr", "ja", "ko", "ru", "vi", "zh-Hans", "zh-Hant"]) {
  assert(typeof campaign.title?.[locale] === "string", `campaign.title is missing ${locale}`);
  assert(typeof campaign.subtitle?.[locale] === "string", `campaign.subtitle is missing ${locale}`);
}

const siteIds = unique(campaign.sites ?? [], "sites");
const characterIds = unique(campaign.characters ?? [], "characters");
const editionIds = unique(editionRegister.editions ?? [], "editions");
const sourceIds = unique(campaign.sources ?? [], "sources");
const claimIds = unique(campaign.claims ?? [], "claims");
const nodeIds = unique(campaign.nodes ?? [], "nodes");
assert(nodeIds.has(campaign.startNodeId), `start node does not exist: ${campaign.startNodeId}`);

validateResourceMap(campaign.initialResources, "initialResources", 0, 100, true);
assert(typeof campaign.opposition?.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(campaign.opposition.id), "campaign.opposition.id must use ASCII kebab-case");
assert(campaign.opposition?.claimStatus === "dramatic-reconstruction", "campaign.opposition must be classified as dramatic-reconstruction");
hasRequiredText(campaign.opposition?.title, "campaign.opposition.title");
hasRequiredText(campaign.opposition?.description, "campaign.opposition.description");
const oppositionStageIds = unique(campaign.opposition?.stages ?? [], "opposition stages");
assert(oppositionStageIds.size >= 2, "campaign.opposition requires at least two stages");
const dangerCoverage = Array.from({ length: 100 }, () => 0);
for (const stage of campaign.opposition?.stages ?? []) {
  assert(Number.isInteger(stage.minDanger) && stage.minDanger >= 0 && stage.minDanger <= 99, `opposition stage ${stage.id}.minDanger must be an integer from 0 to 99`);
  assert(Number.isInteger(stage.maxDanger) && stage.maxDanger >= 0 && stage.maxDanger <= 99, `opposition stage ${stage.id}.maxDanger must be an integer from 0 to 99`);
  assert(stage.minDanger <= stage.maxDanger, `opposition stage ${stage.id} has an inverted range`);
  hasRequiredText(stage.title, `opposition stage ${stage.id}.title`);
  hasRequiredText(stage.forecast, `opposition stage ${stage.id}.forecast`);
  hasRequiredText(stage.response, `opposition stage ${stage.id}.response`);
  hasRequiredText(stage.counterplay, `opposition stage ${stage.id}.counterplay`);
  validateResourceMap(stage.effects, `opposition stage ${stage.id}.effects`, -4, 4);
  for (const [key, amount] of Object.entries(stage.effects ?? {})) {
    assert(key === "danger" ? amount >= 0 : amount <= 0, `opposition stage ${stage.id}.${key} must not benefit the player`);
  }
  for (let danger = stage.minDanger; danger <= stage.maxDanger; danger++) dangerCoverage[danger]++;
}
for (let danger = 0; danger <= 99; danger++) assert(dangerCoverage[danger] === 1, `opposition stages must cover Exposure ${danger} exactly once`);
for (const edition of editionRegister.editions ?? []) {
  assert(typeof edition.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(edition.id), `edition ${edition.id} must use an ASCII kebab-case id`);
  assert(typeof edition.workId === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(edition.workId), `edition ${edition.id} has an invalid workId`);
  for (const field of ["title", "language", "editionType", "publisher", "accessDate", "rightsStatus", "rightsNote"]) {
    assert(typeof edition[field] === "string" && edition[field].trim(), `edition ${edition.id} requires ${field}`);
  }
  assert(/^\d{4}-\d{2}-\d{2}$/.test(edition.accessDate ?? ""), `edition ${edition.id} accessDate must use YYYY-MM-DD`);
  assert(["public-transcription", "project-original"].includes(edition.editionType), `edition ${edition.id} has an invalid editionType`);
  assert(["public-link-metadata-only", "project-original"].includes(edition.rightsStatus), `edition ${edition.id} has an invalid rightsStatus`);
  if (edition.rightsStatus === "public-link-metadata-only") {
    assert(edition.editionType === "public-transcription", `public edition ${edition.id} must be classified as public-transcription`);
    assert(/^https:\/\//.test(edition.sourceUrl ?? ""), `public edition ${edition.id} requires an HTTPS sourceUrl`);
  } else {
    assert(edition.editionType === "project-original", `project edition ${edition.id} must be classified as project-original`);
    assert(!edition.sourceUrl, `project edition ${edition.id} must not claim a public sourceUrl`);
  }
}
for (const source of campaign.sources ?? []) {
  assert(typeof source.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.id), `source ${source.id} must use an ASCII kebab-case id`);
  assert(editionIds.has(source.editionId), `source ${source.id} references unknown edition ${source.editionId}`);
  assert(typeof source.work === "string" && source.work.trim(), `source ${source.id} requires a work title`);
  assert(typeof source.section === "string" && source.section.trim(), `source ${source.id} requires a locator`);
  assert(typeof source.locator === "string" && source.locator.trim(), `source ${source.id} requires an exact locator`);
  hasRequiredText(source.note, `source ${source.id}.note`);
  assert(["received-account", "later-compilation", "strategic-text", "dramatic-reconstruction"].includes(source.claimStatus), `source ${source.id} has an invalid claimStatus`);
  assert(["public-link-metadata-only", "project-original"].includes(source.rightsStatus), `source ${source.id} has an invalid rightsStatus`);
  const edition = editionRegister.editions.find((candidate) => candidate.id === source.editionId);
  assert(source.rightsStatus === edition?.rightsStatus, `source ${source.id} rightsStatus does not match edition ${source.editionId}`);
  if (source.rightsStatus === "public-link-metadata-only") assert(/^https:\/\//.test(source.url ?? ""), `public source ${source.id} requires an HTTPS URL`);
  if (source.rightsStatus === "project-original") assert(!source.url, `project source ${source.id} must not claim a public URL`);
}
for (const claim of campaign.claims ?? []) {
  assert(typeof claim.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(claim.id), `claim ${claim.id} must use an ASCII kebab-case id`);
  assert(["chronology", "event", "institution", "person", "geography", "strategic-lens", "reconstruction"].includes(claim.kind), `claim ${claim.id} has an invalid kind`);
  hasRequiredText(claim.statement, `claim ${claim.id}.statement`);
  hasRequiredText(claim.uncertainty, `claim ${claim.id}.uncertainty`);
  hasRequiredText(claim.gameUse, `claim ${claim.id}.gameUse`);
  assert(Array.isArray(claim.sourceRefs) && claim.sourceRefs.length > 0, `claim ${claim.id} requires at least one source`);
  for (const sourceRef of claim.sourceRefs ?? []) assert(sourceIds.has(sourceRef), `claim ${claim.id} references unknown source ${sourceRef}`);
  assert(["evidence-located", "specialist-review-required", "authored-reconstruction"].includes(claim.reviewStatus), `claim ${claim.id} has an invalid reviewStatus`);
  assert(["high", "medium", "low", "not-applicable"].includes(claim.confidence), `claim ${claim.id} has invalid confidence`);
  assert(typeof claim.reviewer === "string" && claim.reviewer.trim(), `claim ${claim.id} requires a reviewer or pending review role`);
  if (claim.kind === "reconstruction") {
    assert(claim.reviewStatus === "authored-reconstruction", `reconstruction claim ${claim.id} must be explicitly authored`);
    assert(claim.confidence === "not-applicable", `reconstruction claim ${claim.id} must use not-applicable confidence`);
  } else {
    assert(claim.reviewStatus !== "authored-reconstruction", `historical claim ${claim.id} cannot masquerade as authored reconstruction`);
    assert(claim.confidence !== "not-applicable", `historical claim ${claim.id} requires a confidence assessment`);
  }
}
for (const site of campaign.sites ?? []) {
  assert(typeof site.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(site.id), `site ${site.id} must use an ASCII kebab-case id`);
  hasRequiredText(site.name, `site ${site.id}.name`);
  hasRequiredText(site.summary, `site ${site.id}.summary`);
  hasRequiredText(site.uncertainty, `site ${site.id}.uncertainty`);
  assert(Number.isFinite(site.x) && site.x >= 0 && site.x <= 100, `site ${site.id}.x must be between 0 and 100`);
  assert(Number.isFinite(site.z) && site.z >= 0 && site.z <= 80, `site ${site.id}.z must be between 0 and 80`);
  assert(["known", "reported", "reference"].includes(site.status), `site ${site.id} has invalid intelligence status ${site.status}`);
  assert(Array.isArray(site.sourceRefs) && site.sourceRefs.length > 0, `site ${site.id} must cite at least one source record`);
  assert(Array.isArray(site.claimRefs) && site.claimRefs.length > 0, `site ${site.id} must expose at least one claim record`);
  for (const sourceRef of site.sourceRefs ?? []) assert(sourceIds.has(sourceRef), `site ${site.id} references unknown source ${sourceRef}`);
  for (const claimRef of site.claimRefs ?? []) {
    assert(claimIds.has(claimRef), `site ${site.id} references unknown claim ${claimRef}`);
    const claim = campaign.claims.find((candidate) => candidate.id === claimRef);
    for (const sourceRef of claim?.sourceRefs ?? []) {
      assert(site.sourceRefs.includes(sourceRef), `site ${site.id} claim ${claimRef} requires missing source ${sourceRef}`);
    }
  }
}
const allChoiceIds = new Set();
const allConditionIds = new Set();
const referencedClaimIds = new Set();
for (const node of campaign.nodes ?? []) {
  assert(typeof node.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(node.id), `node ${node.id} must use an ASCII kebab-case id`);
  hasRequiredText(node.dateLabel, `node ${node.id}.dateLabel`);
  hasRequiredText(node.title, `node ${node.id}.title`);
  hasRequiredText(node.context, `node ${node.id}.context`);
  hasRequiredText(node.dialogue, `node ${node.id}.dialogue`);
  assert(siteIds.has(node.siteId), `node ${node.id} references unknown site ${node.siteId}`);
  assert(characterIds.has(node.speakerId), `node ${node.id} references unknown character ${node.speakerId}`);
  assert(Array.isArray(node.choices) && node.choices.length >= 2, `node ${node.id} must offer at least two choices`);
  assert(Array.isArray(node.conditions) && node.conditions.length >= 2, `node ${node.id} must define at least two field conditions`);
  assert(Array.isArray(node.sourceRefs) && node.sourceRefs.length > 0, `node ${node.id} must cite at least one source record`);
  assert(Array.isArray(node.claimRefs) && node.claimRefs.length > 0, `node ${node.id} must expose at least one historical or reconstruction claim`);
  for (const sourceRef of node.sourceRefs ?? []) assert(sourceIds.has(sourceRef), `node ${node.id} references unknown source ${sourceRef}`);
  for (const claimRef of node.claimRefs ?? []) {
    assert(claimIds.has(claimRef), `node ${node.id} references unknown claim ${claimRef}`);
    referencedClaimIds.add(claimRef);
    const claim = campaign.claims.find((candidate) => candidate.id === claimRef);
    for (const sourceRef of claim?.sourceRefs ?? []) {
      assert(node.sourceRefs.includes(sourceRef), `node ${node.id} claim ${claimRef} requires missing source ${sourceRef}`);
    }
  }
  for (const condition of node.conditions ?? []) {
    assert(typeof condition.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(condition.id), `node ${node.id} has invalid field condition id ${condition.id}`);
    assert(!allConditionIds.has(condition.id), `campaign contains duplicate field condition ${condition.id}`);
    allConditionIds.add(condition.id);
    assert(condition.claimStatus === "dramatic-reconstruction", `condition ${condition.id} must be classified as dramatic-reconstruction`);
    hasRequiredText(condition.title, `condition ${condition.id}.title`);
    hasRequiredText(condition.signal, `condition ${condition.id}.signal`);
    assert(Number.isInteger(condition.weight) && condition.weight >= 1 && condition.weight <= 100, `condition ${condition.id}.weight must be an integer from 1 to 100`);
    validateResourceMap(condition.effects, `condition ${condition.id}.effects`, -6, 6);
    assert(Object.keys(condition.effects ?? {}).length > 0, `condition ${condition.id}.effects cannot be empty`);
    assert(Object.values(condition.effects ?? {}).some((amount) => amount !== 0), `condition ${condition.id}.effects must change the position`);
  }
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
for (const id of claimIds) assert(referencedClaimIds.has(id), `claim is not exposed by any playable node: ${id}`);

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

const routeStats = { successful: 0, failed: 0, endings: new Set(), deadlocks: 0, oppositionVisits: Object.fromEntries([...oppositionStageIds].map((id) => [id, 0])) };
const walkRoutes = (nodeId, resources, flags, path = []) => {
  const node = campaign.nodes.find((candidate) => candidate.id === nodeId);
  const available = (node?.choices ?? []).filter((choice) => canChoose(choice, resources));
  if (available.length === 0) {
    routeStats.deadlocks++;
    assert(false, `playable route deadlocks at ${nodeId}: ${path.join(" -> ")}`);
    return;
  }

  for (const condition of node.conditions ?? []) {
    for (const choice of available) {
      const oppositionStage = oppositionStageFor(resources);
      assert(oppositionStage, `no opposition stage covers Exposure ${resources.danger}`);
      if (!oppositionStage) continue;
      routeStats.oppositionVisits[oppositionStage.id]++;
      const afterChoice = applyEffects(resources, choice.effects);
      const afterPressure = applyEffects(afterChoice, choice.pressure?.effects);
      const afterOpposition = applyEffects(afterPressure, oppositionStage.effects);
      const after = applyEffects(afterOpposition, condition.effects);
      const nextFlags = new Set([...flags, ...(choice.flags ?? [])]);
      const nextPath = [...path, `${condition.id}:${choice.id}`];
      if (after.danger >= 100 || after.people <= 0) {
        routeStats.failed++;
      } else if (!choice.nextNodeId) {
        routeStats.successful++;
        for (const flag of nextFlags) if (flag.startsWith("ending-")) routeStats.endings.add(flag);
      } else {
        walkRoutes(choice.nextNodeId, after, nextFlags, nextPath);
      }
    }
  }
};
walkRoutes(campaign.startNodeId, campaign.initialResources, new Set());
for (const ending of ["ending-wildfire", "ending-deep-roots", "ending-watchful"]) {
  assert(routeStats.endings.has(ending), `authored conclusion is unreachable under pressure rules: ${ending}`);
}
assert(routeStats.successful >= 3, "campaign requires at least three successful playable routes");
assert(routeStats.failed >= 1, "campaign pressure must expose at least one real failure route");
for (const [stage, visits] of Object.entries(routeStats.oppositionVisits)) assert(visits > 0, `opposition stage ${stage} is never reached by exhaustive traversal`);

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Content valid: ${campaign.nodes.length} nodes, ${campaign.nodes.reduce((sum, node) => sum + node.choices.length, 0)} choices, ${allConditionIds.size} field conditions, ${oppositionStageIds.size} opponent postures, ${campaign.sources.length} source records, ${campaign.claims.length} claim records, ${editionRegister.editions.length} registered editions, ${finaleCount} conclusions, ${routeStats.successful} successful condition-routes, ${routeStats.failed} failure condition-routes.`);
