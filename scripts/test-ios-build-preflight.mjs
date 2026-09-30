// Admission tests only: no signing credentials, Xcode, or provider writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve(import.meta.dirname, 'build-ios.sh');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'shi-ios-build-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'apps/mobile/ios'), { recursive: true });
  writeFileSync(join(root, 'apps/mobile/ios/project.yml'), 'name: SHI\n');
  writeFileSync(join(root, 'apps/mobile/ios/ExportOptions.plist'), 'fixture\n');
  mkdirSync(join(root, 'release'));
  return root;
}
function run(root, override = {}) {
  const env = { ...process.env, SHI_ROOT: root, SHI_VERSION: '1.0.0', ...override };
  if (!Object.hasOwn(override, 'SHI_BUILD')) delete env.SHI_BUILD;
  return spawnSync('bash', [script], { env, encoding: 'utf8', timeout: 5000 });
}

test('requires explicit build before any signing or output creation', t => {
  const root = fixture(t);
  const r = run(root);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Set SHI_BUILD/);
  assert.equal(existsSync(join(root, 'release/.shi-ios-build-lock')), false);
});
test('rejects malformed version/build values before signing', t => {
  const root = fixture(t);
  for (const build of ['0', '-1', '02', '2/../1', '2.0', '2;touch bad']) {
    const r = run(root, { SHI_BUILD: build });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Invalid SHI_BUILD/);
  }
  const r = run(root, { SHI_BUILD: '2', SHI_VERSION: '../1' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Invalid SHI_VERSION/);
});
test('refuses existing archive and preserves its bytes', t => {
  const root = fixture(t);
  const target = join(root, 'release/SHI-1.0.0-2.xcarchive');
  writeFileSync(target, 'retained archive');
  const r = run(root, { SHI_BUILD: '2' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Refusing to overwrite/);
  assert.equal(readFileSync(target, 'utf8'), 'retained archive');
});
test('refuses existing export and dangling archive symlink', t => {
  const root = fixture(t);
  mkdirSync(join(root, 'release/export-1.0.0-2'));
  assert.match(run(root, { SHI_BUILD: '2' }).stderr, /Refusing to overwrite/);
  symlinkSync(join(root, 'absent'), join(root, 'release/SHI-1.0.0-3.xcarchive'));
  assert.match(run(root, { SHI_BUILD: '3' }).stderr, /Refusing to overwrite/);
});
test('respects an existing job lock without clearing it', t => {
  const root = fixture(t);
  const lock = join(root, 'release/.shi-ios-build-lock');
  mkdirSync(lock);
  const r = run(root, { SHI_BUILD: '2' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /reconcile the active job/);
  assert.equal(existsSync(lock), true);
});
test('rejects non-store workspace', t => {
  const root = fixture(t);
  const r = run(join(root, 'missing'), { SHI_BUILD: '2' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /formal store project/);
});
