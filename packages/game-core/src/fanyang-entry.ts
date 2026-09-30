import { councilEntry, restoreCouncil, type CouncilDefinition, type CouncilEntry, type CouncilMetrics, type CouncilOutcome } from "./council";
import type { GameState } from "./types";

/** Development contract for the northern-envoy scene, not a new playable episode. */
export interface FanyangEntry {
  version: 1;
  sceneId: "fanyang-guarantee.v1";
  id: string;
  councilDefinitionId: string;
  councilSHA256: string;
  origin: CouncilEntry;
  choices: string[];
  metrics: CouncilMetrics;
  outcome: CouncilOutcome;
}

/** Replay the saved council against the exact originating, already validated chapter.
 * The caller supplies the verified canonical content digest, never one read from
 * the save itself. No resources, promises or prior decisions are reset or saved.
 * Untagged legacy saves must pass the existing revision migration first.
 */
export function prepareFanyangEntry(
  definition: CouncilDefinition,
  chapter: GameState,
  snapshot: unknown,
  canonicalSHA256: string,
): FanyangEntry | null {
  if (!/^[a-f0-9]{64}$/.test(canonicalSHA256) || !snapshot || typeof snapshot !== "object"
    || Array.isArray(snapshot)
    || (snapshot as { definitionSHA256?: unknown }).definitionSHA256 !== canonicalSHA256) return null;
  const origin = councilEntry(chapter);
  if (!origin) return null;
  const council = restoreCouncil(definition, origin, snapshot);
  if (!council?.completed || !council.outcome) return null;
  const choices = council.history.map(turn => turn.choiceId);
  return {
    version: 1, sceneId: "fanyang-guarantee.v1",
    id: JSON.stringify(["fanyang-guarantee.v1", definition.id, canonicalSHA256, origin, choices]),
    councilDefinitionId: definition.id, councilSHA256: canonicalSHA256,
    origin: { ...origin }, choices, metrics: { ...council.metrics }, outcome: council.outcome,
  };
}
