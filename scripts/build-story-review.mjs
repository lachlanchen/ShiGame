import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(import.meta.dirname, "..");
export const routes = [
  { id: "together", title: "仍可同行", note: "默认示例：留下接应队，收拢本部，护送家户。", args: [] },
  { id: "remnant", title: "余部上路", note: "保住一支仍能行动的队伍，不把失散者写成已经归来。", args: ["--ending", "remnant"] },
  { id: "dispersed", title: "各自的归路", note: "有序分行不等于欠账清零。", args: ["--ending", "dispersed"] },
  { id: "scattered", title: "队伍散去", note: "资源不足时的失序结局；不伪装成安排妥当的归乡。", args: ["--ending", "scattered"] },
  { id: "reunion", title: "阿衡归来，队伍仍散", note: "同伴重逢与集体能否维持，是两件不同的事。", args: ["--reception", "open-reception", "--ending", "scattered"] },
  { id: "partners", title: "邻部的回音", note: "共同查问有了进展，但尚未找到阿衡。", args: ["--reception", "verify-with-partners", "--ending", "remnant"] },
  { id: "loan", title: "借来的粮，留下的债", note: "渡过眼前难关，不代表偿还已经办妥。", args: ["--reception", "borrow-local-grain", "--ending", "together"] },
  { id: "courier", title: "韩驿使的一封回信", note: "从开篇争取驿使到后来收到路讯；回信不等于本人归队。", args: ["--courier", "--ending", "remnant"] },
];
export const escapeHTML = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
export function renderReading(markdown) {
  // Deliberately small plain-text renderer: never interpret raw HTML or links.
  return markdown.trim().split(/\n\s*\n/).map(block => {
    const heading = /^(#{1,3}) (.+)$/.exec(block);
    if (heading) return `<h${Math.min(heading[1].length + 1, 4)}>${escapeHTML(heading[2])}</h${Math.min(heading[1].length + 1, 4)}>`;
    return `<p>${escapeHTML(block)}</p>`;
  }).join("\n");
}
export function renderBook(readings) {
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>势 · 第一卷故事审阅</title><style>
:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f5f0e5;color:#252820;font:18px/1.9 Georgia,"Noto Serif CJK SC",serif}
main{max-width:52rem;margin:auto;padding:clamp(1rem,4vw,3rem)}h1,h2,h3,h4{line-height:1.4}p{white-space:pre-wrap;overflow-wrap:anywhere}
nav{display:flex;flex-wrap:wrap;gap:.6rem}a{color:#354926;text-underline-offset:.2em;padding:.3rem}summary{cursor:pointer;padding:1rem;font-weight:bold;font-size:1.2rem}
details{border:1px solid #8a887b;border-radius:.4rem;margin:1.5rem 0;scroll-margin:1rem}article{padding:0 clamp(.8rem,3vw,2rem) 1rem}
:focus-visible{outline:3px solid #755617;outline-offset:3px}.note{border-left:3px solid #82734d;padding-left:1rem}.back{display:inline-block;margin-top:1rem}
@media print{body{background:white;color:black;font-size:12pt}nav,.back{display:none}details{break-before:page;border:0}summary{padding:0}}
</style></head><body><main id="top"><h1>势 · 第一卷故事审阅</h1>
<p class="note">这是八条按实际游戏规则回放的完整示例，不是八个连续章节，也不是全部可能路线。先读一条，再比较其他分支。它是开发读稿，不是发行版本或人工验收。对白及地方人物行动为原创重构；历史参照与文本校验留在各篇末尾。</p>
<p>展开一篇即可阅读；各篇保留完整起因与结局。页面离线可用，不访问网络，不读写游戏存档。打印前展开希望保留的篇目。</p>
<nav aria-label="选择故事路线">${readings.map(r => `<a href="#${r.id}">${escapeHTML(r.title)}</a>`).join("")}</nav>
${readings.map((r, i) => `<details id="${r.id}"${i === 0 ? " open" : ""}><summary>${escapeHTML(r.title)}</summary><article aria-label="${escapeHTML(r.title)}"><p class="note">${escapeHTML(r.note)}</p>${renderReading(r.text)}<a class="back" href="#top">返回路线目录</a></article></details>`).join("\n")}
<footer><p>审阅时请留意：哪里不清楚自己在扮演谁？哪次选择最难？人物的要求是否可信？结尾解决了什么，还欠下什么？</p></footer></main></body></html>\n`;
}
export function collectReadings() {
  return routes.map(route => ({ ...route, text: execFileSync(process.execPath,
    [resolve(root, "node_modules/vite-node/vite-node.mjs"), "scripts/first-volume-readthrough.ts", ...route.args],
    { cwd: root, encoding: "utf8", maxBuffer: 2 * 1024 * 1024 }) }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2) throw new Error("Usage: node scripts/build-story-review.mjs");
  const readings = collectReadings();
  const html = renderBook(readings);
  const out = resolve(root, ".runtime/story-book");
  await mkdir(out, { recursive: true });
  await writeFile(resolve(out, "index.html"), html);
  await writeFile(resolve(out, "manifest.json"), JSON.stringify({
    scope: "Generated offline story review, not a playable or published build",
    htmlSHA256: createHash("sha256").update(html).digest("hex"),
    routes: readings.map(({ id, args, text }) => ({ id, args, textSHA256: createHash("sha256").update(text).digest("hex") })),
  }, null, 2) + "\n");
  console.log(resolve(out, "index.html"));
}
