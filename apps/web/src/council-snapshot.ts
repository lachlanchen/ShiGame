import type { CouncilState } from "@shi/game-core";

// The only untagged council revision produced by the development client.
// Keep this immutable: later content needs an explicit migration, not replay
// under whatever happens to share the same content ID.
const initialCouncilSHA256 = "a4b21e01d8c442869bde8da79ead2fb7c787095eb635a1fe4504ed5a87e9a945";
const isSHA256 = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

export function councilSnapshotMatchesRevision(value: unknown, fingerprint: string): boolean {
  if (!isSHA256(fingerprint) || !value || typeof value !== "object" || Array.isArray(value)) return false;
  if (Object.hasOwn(value, "definitionSHA256")) {
    return (value as { definitionSHA256: unknown }).definitionSHA256 === fingerprint;
  }
  // Read-only compatibility: do not rewrite an old save just by opening it.
  // The ordinary replay validator still checks version, entry and each choice.
  return fingerprint === initialCouncilSHA256
    && (value as { definitionId?: unknown }).definitionId === "chen-council.v1";
}

export function encodeCouncilSnapshot(state: CouncilState, fingerprint: string): string {
  if (!isSHA256(fingerprint)) throw new Error("Missing council content fingerprint");
  return JSON.stringify({ ...state, definitionSHA256: fingerprint });
}
