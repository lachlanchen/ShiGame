import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const draftURL = new URL("../content/story-drafts/chen-retreat.v1.json", import.meta.url);
const speakers = new Set(["narrator", "keeper", "supply-officer", "yu-mu", "qin-courier",
  "wounded-soldier", "partner-steward", "rear-guard"]);
const nonempty = value => typeof value === "string" && value.trim().length > 0;
const matches = (condition, facts) => Object.entries(condition ?? {}).every(([key, value]) => facts[key] === value);

/** Authoring utility only: these facts do not represent production save data. */
export function validateDraft(draft) {
  assert.equal(draft.schemaVersion, 1);
  assert.equal(draft.status, "authoring-only");
  assert.equal(draft.publicationApproved, false);
  for (const field of ["id", "title", "locale", "boundary", "inputBoundary", "epilogue"]) assert.ok(nonempty(draft[field]), field);
  assert.ok(draft.remainingGates.length > 0);
  const domains = new Map();
  for (const [key, values] of Object.entries(draft.inputs)) {
    assert.ok(Array.isArray(values) && values.length && values.every(nonempty), key);
    assert.equal(new Set(values).size, values.length, `Duplicate input value: ${key}`);
    domains.set(key, values);
  }
  assert.ok(draft.scenes.length > 0);
  const positions = new Map(draft.scenes.map((scene, index) => [scene.id, index]));
  assert.equal(positions.size, draft.scenes.length, "Duplicate scene");
  assert.equal(draft.entry, draft.scenes[0].id);
  const ids = new Set();
  for (const scene of draft.scenes) {
    assert.ok(nonempty(scene.id) && !domains.has(scene.id), `Conflicting fact: ${scene.id}`);
    assert.ok(scene.choices.length > 0);
    for (const choice of scene.choices) {
      assert.ok(nonempty(choice.id) && !ids.has(choice.id), `Duplicate/empty choice: ${choice.id}`);
      ids.add(choice.id);
    }
    domains.set(scene.id, scene.choices.map(choice => choice.id));
  }
  const checkLines = lines => {
    assert.ok(Array.isArray(lines) && lines.length > 0, "Missing authored lines");
    for (const line of lines) assert.ok(speakers.has(line.speaker) && nonempty(line.text), `Invalid line: ${JSON.stringify(line)}`);
  };
  const checkCondition = (condition, current) => {
    assert.ok(condition && typeof condition === "object" && !Array.isArray(condition));
    for (const [key, value] of Object.entries(condition)) {
      assert.ok(domains.get(key)?.includes(value), `Unknown fact ${key}=${value}`);
      if (positions.has(key)) assert.ok(positions.get(key) < current, `Future knowledge: ${key}`);
    }
  };
  for (const [index, scene] of draft.scenes.entries()) {
    assert.ok(nonempty(scene.title) && nonempty(scene.setting) && nonempty(scene.transition));
    assert.ok(Number.isInteger(scene.act) && scene.act >= 5 && scene.act <= 8);
    if (index) assert.ok(scene.act >= draft.scenes[index - 1].act, "Act moves backward");
    assert.ok(scene.sourceIds.length > 0);
    for (const sourceId of scene.sourceIds) {
      const source = draft.sources[sourceId];
      assert.ok(source && [7, 8].includes(source.volume) && nonempty(source.anchor) && nonempty(source.supports), `Missing source: ${sourceId}`);
    }
    checkLines(scene.lines);
    for (const variant of scene.variants) { checkCondition(variant.when, index); checkLines(variant.lines); }
    if (scene.exitLines) checkLines(scene.exitLines);
    for (const choice of scene.choices) {
      assert.ok(nonempty(choice.title) && nonempty(choice.intent));
      checkLines(choice.response);
      if (choice.requires) checkCondition(choice.requires, index);
      assert.ok(Boolean(choice.next) !== Boolean(choice.ending), `Exactly one destination required: ${choice.id}`);
      if (choice.next) assert.ok(positions.has(choice.next) && positions.get(choice.next) > index, `Invalid transition: ${choice.id}`);
      if (choice.ending) assert.ok(Object.hasOwn(draft.endings, choice.ending), `Missing ending: ${choice.ending}`);
    }
  }
  for (const ending of Object.values(draft.endings)) {
    assert.ok(nonempty(ending.title) && nonempty(ending.unresolved));
    checkLines(ending.lines);
  }
  return draft;
}

function initialFacts(draft, input) {
  assert.deepEqual(Object.keys(input).sort(), Object.keys(draft.inputs).sort(), "Supply all and only declared authoring inputs");
  for (const [key, value] of Object.entries(input)) assert.ok(draft.inputs[key].includes(value), `Invalid input: ${key}`);
  return { ...input };
}

export function readRoute(draft, input, choices) {
  validateDraft(draft);
  const facts = initialFacts(draft, input);
  let sceneId = draft.entry;
  let endingId;
  const transcript = [];
  for (const choiceId of choices) {
    assert.ok(sceneId && !endingId, "Route continues after its ending");
    const scene = draft.scenes.find(item => item.id === sceneId);
    const choice = scene.choices.find(item => item.id === choiceId);
    assert.ok(choice && matches(choice.requires, facts), `Unavailable choice: ${choiceId}`);
    transcript.push({ sceneId, title: scene.title, transition: scene.transition, setting: scene.setting,
      lines: [...scene.lines, ...scene.variants.filter(item => matches(item.when, facts)).flatMap(item => item.lines)],
      choiceId, choiceTitle: choice.title, intent: choice.intent,
      reaction: [...choice.response, ...(scene.exitLines ?? [])] });
    facts[sceneId] = choiceId;
    sceneId = choice.next;
    endingId = choice.ending;
  }
  assert.ok(endingId && !sceneId, "Incomplete reading route");
  return { facts, transcript, endingId, ending: draft.endings[endingId] };
}

export function auditDraft(draft) {
  validateDraft(draft);
  let inputs = [{}];
  for (const [key, values] of Object.entries(draft.inputs)) inputs = inputs.flatMap(input => values.map(value => ({ ...input, [key]: value })));
  const endingCounts = Object.fromEntries(Object.keys(draft.endings).map(key => [key, 0]));
  const choicesSeen = new Set();
  const variantsSeen = new Set();
  let routes = 0;
  for (const input of inputs) {
    const visit = (sceneId, facts, path) => {
      const scene = draft.scenes.find(item => item.id === sceneId);
      scene.variants.forEach((variant, index) => { if (matches(variant.when, facts)) variantsSeen.add(`${sceneId}:${index}`); });
      const available = scene.choices.filter(choice => matches(choice.requires, facts));
      assert.ok(available.length, `Narrative dead end: ${path.join("/")}`);
      for (const choice of available) {
        choicesSeen.add(choice.id);
        const nextPath = [...path, choice.id];
        const nextFacts = { ...facts, [sceneId]: choice.id };
        if (choice.next) visit(choice.next, nextFacts, nextPath);
        else {
          const result = readRoute(draft, input, nextPath);
          assert.equal(result.endingId, choice.ending);
          endingCounts[choice.ending]++;
          routes++;
        }
      }
    };
    visit(draft.entry, initialFacts(draft, input), []);
  }
  assert.equal(choicesSeen.size, draft.scenes.reduce((sum, scene) => sum + scene.choices.length, 0), "Unreachable choice");
  assert.equal(variantsSeen.size, draft.scenes.reduce((sum, scene) => sum + scene.variants.length, 0), "Unreachable conditional dialogue");
  assert.ok(Object.values(endingCounts).every(count => count > 0), "Unreachable ending");
  return { scope: "Authoring graph only; not resource balance, save integration, historical review or shipped gameplay",
    inputContexts: inputs.length, routes, choices: choicesSeen.size, conditionalPassages: variantsSeen.size, endings: endingCounts };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const draft = JSON.parse(await readFile(draftURL, "utf8"));
  const args = process.argv.slice(2);
  if (!args.length) console.log(JSON.stringify(auditDraft(draft), null, 2));
  else {
    assert.equal(args[0], "--read", "Usage: node scripts/story-readthrough.mjs [--read opened|withdrawn|deferred present|absent|unestablished cooperating|unavailable|unestablished choice-id ...]");
    const [, fanyang, yu, han, ...choices] = args;
    const result = readRoute(draft, { fanyang, yu, han }, choices);
    console.log(`${draft.title}\n${draft.boundary}\n`);
    for (const beat of result.transcript) {
      console.log(`${beat.title}\n${beat.setting}`);
      for (const line of beat.lines) console.log(`${line.speaker}: ${line.text}`);
      console.log(`选择：${beat.choiceTitle}\n${beat.intent}`);
      for (const line of beat.reaction) console.log(`${line.speaker}: ${line.text}`);
      console.log("");
    }
    console.log(result.ending.title);
    for (const line of result.ending.lines) console.log(`${line.speaker}: ${line.text}`);
    console.log(`${result.ending.unresolved}\n${draft.epilogue}`);
  }
}
