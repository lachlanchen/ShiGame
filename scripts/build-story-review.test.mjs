import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { collectReadings, renderBook, renderReading } from "./build-story-review.mjs";

test("offline review contains eight complete legal readings with no active remote content", () => {
  const readings = collectReadings();
  const html = renderBook(readings);
  assert.equal(html, renderBook(readings));
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.documentElement.lang, "zh-Hans");
  assert.equal(doc.querySelectorAll("details").length, 8);
  assert.equal(doc.querySelectorAll("details[open]").length, 1);
  assert.equal(doc.querySelectorAll("script,iframe,img,link,form").length, 0);
  for (const reading of readings) {
    const article = doc.getElementById(reading.id);
    assert.ok(article.textContent.includes("历史参照"));
    assert.ok(article.textContent.includes("陈地议事"));
    assert.ok(article.textContent.includes("SHA256"));
  }
  for (const link of doc.querySelectorAll("a")) assert.ok(doc.getElementById(link.getAttribute("href").slice(1)));
  assert.ok(doc.getElementById("reunion").textContent.includes("我怕你回来没得领"));
  assert.ok(doc.getElementById("courier").textContent.includes("韩驿使来信"));
});
test("source prose cannot become executable markup", () => {
  const doc = new JSDOM(renderReading('<script>alert(1)</script>\n\n<img src="https://example.com/tracker">')).window.document;
  assert.equal(doc.querySelectorAll("script,img").length, 0);
  assert.ok(doc.body.textContent.includes("<script>"));
});
