import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function assessMemory(text) {
  const fields = new Map([...text.matchAll(/^([A-Za-z_]+):\s+(\d+)\s+kB\s*$/gm)]
    .map(([, key, value]) => [key, Number(value)]));
  const available = fields.get('MemAvailable');
  const totalSwap = fields.get('SwapTotal');
  const freeSwap = fields.get('SwapFree');
  if (![available, totalSwap, freeSwap].every(value => Number.isSafeInteger(value) && value >= 0)
    || freeSwap > totalSwap) throw Error('Missing or invalid kernel memory counters; refusing heavy work.');
  const availableGiB = available / 1024 / 1024;
  const swapUsedPercent = totalSwap === 0 ? 0 : (totalSwap - freeSwap) / totalSwap * 100;
  return { availableGiB, swapUsedPercent, allowed: availableGiB >= 24 && swapUsedPercent <= 75 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const status = assessMemory(readFileSync('/proc/meminfo', 'utf8'));
    console.log(JSON.stringify(status));
    if (!status.allowed) {
      console.error('SHI heavy work held: require >=24 GiB available RAM and <=75% swap use. Review only obsolete SHI-owned processes; never stop another project.');
      process.exitCode = 2;
    }
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
