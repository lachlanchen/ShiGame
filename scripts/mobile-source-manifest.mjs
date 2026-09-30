// Hash only public source inputs. Output is generated evidence, not a clean-tree claim.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const scopes = ['apps/mobile', 'apps/web/src', 'apps/web/index.html',
  'apps/web/vite.config.ts', 'apps/web/package.json', 'packages/game-core',
  'content', 'assets/mobile', 'assets/art', 'assets/audio', 'assets/provenance',
  'package.json', 'package-lock.json', 'capacitor.config.json',
  'scripts/sync-ios-content.ts', 'scripts/sync-unity-content.mjs',
  'scripts/build-ios.sh', 'scripts/build-android.sh', 'scripts/check-workstation-resources.mjs'];
const paths = [...new Set(execFileSync('git', ['ls-files', '-co',
  '--exclude-standard', '-z', '--', ...scopes], { encoding: 'utf8' })
  .split('\0').filter(Boolean))].sort();
if (paths.some(p => /(^|\/)(private|build|node_modules|Resources)\//.test(p))) {
  throw new Error('Refusing private/generated input; check ignore rules');
}
const files = Object.fromEntries(paths.map(p => [p,
  createHash('sha256').update(readFileSync(p)).digest('hex')]));
const sourceSetSHA256 = createHash('sha256').update(JSON.stringify(files)).digest('hex');
console.log(JSON.stringify({ schemaVersion: 1, sourceSetSHA256,
  note: 'Mixed tracked/uncommitted public source snapshot; not a clean commit or toolchain attestation.',
  files }, null, 2));
