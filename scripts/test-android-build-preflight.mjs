import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve(import.meta.dirname, 'build-android.sh');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'shi-android-build-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'apps/mobile/android'), { recursive: true });
  mkdirSync(join(root, '.runtime'));
  writeFileSync(join(root, 'package.json'), '{}');
  writeFileSync(join(root, 'apps/mobile/android/gradlew'), 'fixture');
  return root;
}
function run(root, build, version = '1.0.0', overrides = {}) {
  const env = { ...process.env, ...overrides, SHI_ROOT: root, SHI_VERSION: version };
  delete env.SHI_BUILD;
  if (build !== undefined) env.SHI_BUILD = build;
  return spawnSync('bash', [script], { env, encoding: 'utf8', timeout: 5000 });
}
test('missing or malformed build is rejected before signing', t => {
  const root = fixture(t);
  assert.match(run(root).stderr, /Set SHI_BUILD/);
  for (const build of ['0', '-1', '02', '2100000001', '99999999999', '../2', '2.0']) {
    const result = run(root, build);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Invalid SHI_BUILD/);
  }
  assert.match(run(root, '2', '../1').stderr, /Invalid SHI_VERSION/);
});
test('retained output or symlink is refused and owned lock released', t => {
  const root = fixture(t);
  const output = join(root, '.runtime/android-release-1.0.0-2');
  mkdirSync(output);
  assert.match(run(root, '2').stderr, /Refusing existing Android output/);
  assert.equal(existsSync(output), true);
  assert.equal(existsSync(join(root, '.runtime/.shi-android-build-lock')), false);
  symlinkSync(join(root, 'absent'), join(root, '.runtime/android-release-1.0.0-3'));
  assert.match(run(root, '3').stderr, /Refusing existing Android output/);
});
test('foreign active lock is preserved', t => {
  const root = fixture(t);
  const lock = join(root, '.runtime/.shi-android-build-lock');
  mkdirSync(lock);
  assert.match(run(root, '2').stderr, /reconcile the active job/);
  assert.equal(existsSync(lock), true);
  assert.equal(existsSync(join(root, '.runtime/android-release-1.0.0-2')), false);
});
test('resource refusal happens before credentials and output reservation', t => {
  const root = fixture(t);
  const bin = join(root, 'bin'); mkdirSync(bin);
  writeFileSync(join(bin, 'node'), '#!/bin/sh\necho "fixture: SHI heavy work held" >&2\nexit 2\n', { mode: 0o755 });
  const result = run(root, '5', '1.0.0', { PATH: `${bin}:${process.env.PATH}`, SHI_ANDROID_KEYSTORE_PASSWORD: '' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /SHI heavy work held/);
  assert.doesNotMatch(result.stderr, /upload-keystore.password/);
  assert.equal(existsSync(join(root, '.runtime/android-release-1.0.0-5')), false);
  assert.equal(existsSync(join(root, '.runtime/.shi-android-build-lock')), false);
});
