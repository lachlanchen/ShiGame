import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessMemory } from './check-workstation-resources.mjs';

const memory = (ramGiB, totalSwap = 400, freeSwap = 100) =>
  `MemAvailable: ${ramGiB * 1024 * 1024} kB\nSwapTotal: ${totalSwap} kB\nSwapFree: ${freeSwap} kB\n`;
test('admits exact boundary and rejects either pressured resource', () => {
  assert.equal(assessMemory(memory(24)).allowed, true);
  assert.equal(assessMemory(memory(23)).allowed, false);
  assert.equal(assessMemory(memory(50, 400, 99)).allowed, false);
  assert.equal(assessMemory(memory(50, 400, 101)).allowed, true);
});
test('no configured swap is not interpreted as exhausted swap', () => {
  assert.deepEqual(assessMemory(memory(32, 0, 0)), { availableGiB: 32, swapUsedPercent: 0, allowed: true });
});
test('fails closed on missing or impossible counters', () => {
  for (const raw of ['', 'MemAvailable: 999 kB', memory(50, 400, 401), memory(-1), memory(50).replace('SwapFree: 100', 'SwapFree: invalid')]) {
    assert.throws(() => assessMemory(raw), /invalid kernel memory/);
  }
});
