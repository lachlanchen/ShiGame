import { migrateGameState, resolveChoice, type Campaign, type ChoiceResolution, type GameState } from "@shi/game-core";

// Presentation metadata shares the campaign write, never a second save key.
// Only a validated, current-rules final turn may be reconstructed for display.
export function readChapterSnapshot(campaign: Campaign, input: unknown) {
  const state = migrateGameState(campaign, input);
  if (!state || !state.history.length) return null;
  let resolution: ChoiceResolution | null = null;
  const count = state.history.length;
  const marker = (input as { pendingAftermath?: unknown }).pendingAftermath;
  if (marker === count && count > state.preCommitmentDecisionCount) {
    const prior = migrateGameState(campaign, { ...state, history: state.history.slice(0, -1) });
    if (prior) {
      const replay = resolveChoice(campaign, prior, state.history[count - 1]!.choiceId);
      if (JSON.stringify(replay.state) === JSON.stringify(state)) resolution = replay;
    }
  }
  return { state, resolution };
}

export function writeChapterSnapshot(state: GameState, resolution: ChoiceResolution | null) {
  return JSON.stringify(resolution ? { ...state, pendingAftermath: state.history.length } : state);
}
