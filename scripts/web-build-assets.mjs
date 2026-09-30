// Inspect Vite's generated entry document, including eager module preloads.
export function initialAssets(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
  const styles = [], preloads = [];
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = tag.match(/\brel=["']([^"']+)["']/i)?.[1].toLowerCase().split(/\s+/) ?? [];
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    if (rel.includes("stylesheet")) styles.push(href);
    if (rel.includes("modulepreload")) preloads.push(href);
  }
  return { scripts, styles, javascript: [...new Set([...scripts, ...preloads])] };
}
