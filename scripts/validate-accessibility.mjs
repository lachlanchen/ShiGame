import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const css = await readFile(resolve(root, "apps/web/src/styles.css"), "utf8");

const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const declaration = (selector, property) => {
  const match = css.match(new RegExp(`${escapePattern(selector)}\\s*\\{([^}]*)\\}`));
  if (!match?.[1]) throw new Error(`Accessibility contract selector is missing: ${selector}`);
  const propertyMatch = match[1].match(new RegExp(`${escapePattern(property)}\\s*:\\s*([^;]+)`));
  if (!propertyMatch?.[1]) throw new Error(`Accessibility contract property is missing: ${selector} ${property}`);
  return propertyMatch[1].trim().replace(/\s*!important$/, "");
};

const hexChannels = (hex) => {
  const value = hex.replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`Expected a six-digit hex color, received '${hex}'.`);
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
};
const luminance = (hex) => hexChannels(hex)
  .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

const contrastPairs = [
  ["dim interface metadata", ":root", "--dim", "#11120f"],
  ["site marker", ".site-marker", "color", "#181914"],
  ["reported site marker", ".site-marker.site-reported", "color", "#181914"],
  ["reference site marker", ".site-marker.site-reference", "color", "#181914"],
  ["map shortcut", ".map-inspect-hint span", "color", "#141512"],
  ["map position metadata", ".map-intel footer span", "color", "#141512"],
  ["story number", ".story-number", "color", "#1d1d18"],
  ["opponent posture metadata", ".opposition-identity span", "color", "#181914"],
  ["opponent posture forecast", ".opposition-panel > p", "color", "#181914"],
  ["opponent counterplay", ".opposition-panel > small", "color", "#181914"],
  ["opponent modifier", ".opposition-effects span", "color", "#181914"],
  ["method-read metadata", ".method-read-identity span", "color", "#181914"],
  ["method-read memory", ".method-read-counts span", "color", "#181914"],
  ["method-read forecast", ".method-read-panel > p", "color", "#181914"],
  ["method-read modifier", ".method-read-effects span", "color", "#181914"],
  ["method-read counterplay", ".method-read-panel > small", "color", "#181914"],
  ["choice method label", ".method-choice > span", "color", "#272720"],
  ["choice method explanation", ".method-choice p", "color", "#272720"],
  ["choice method outcome", ".method-choice", "color", "#272720"],
  ["method-read resolution", ".method-read-reveal span", "color", "#11120f"],
  ["method-read hit", ".method-read-reveal.is-read span", "color", "#11120f"],
  ["record method read", ".record-list .record-method-read", "color", "#171713"],
  ["commitment metadata", ".commitment-identity span", "color", "#181914"],
  ["commitment title", ".commitment-identity strong", "color", "#181914"],
  ["commitment promise", ".commitment-panel > p", "color", "#181914"],
  ["commitment stakeholder", ".commitment-panel > small", "color", "#181914"],
  ["establishing commitment metadata", ".commitment-establish > span", "color", "#272720"],
  ["establishing commitment title", ".commitment-establish > strong", "color", "#272720"],
  ["establishing commitment promise", ".commitment-establish p", "color", "#272720"],
  ["establishing commitment stakeholder", ".commitment-establish small", "color", "#272720"],
  ["commitment answer label", ".commitment-forecast > span", "color", "#272720"],
  ["commitment answer forecast", ".commitment-forecast p", "color", "#272720"],
  ["commitment answer effect", ".commitment-forecast-effects span", "color", "#272720"],
  ["record commitment", ".record-list .record-commitment", "color", "#171713"],
  ["ending commitment", ".commitment-ending", "color", "#171713"],
  ["field seed", ".field-signal-head code", "color", "#1d1d18"],
  ["dialogue metadata", ".dialogue footer", "color", "#1d1d18"],
  ["choice input hint", ".choices-heading small", "color", "#181915"],
  ["choice arrow", ".choice-arrow", "color", "#272720"],
  ["selected order label", ".decision-inspector-head p", "color", "#211f19"],
  ["selected order intent", ".decision-inspector-head div > span", "color", "#211f19"],
  ["selected strategic reading", ".decision-principle p", "color", "#211f19"],
  ["order review reminder", ".decision-confirmation small", "color", "#151712"],
  ["issue order action", ".issue-order-button", "color", "#c09a60"],
  ["issue order label", ".issue-order-button span", "color", "#c09a60"],
  ["source section", ".source-section", "color", "#171713"],
  ["claim confidence", ".claim-meta code", "color", "#171713"],
  ["record number", ".record-list li > span", "color", "#171713"],
  ["record scene", ".record-list small", "color", "#171713"],
  ["record opponent posture", ".record-opposition b", "color", "#171713"],
  ["restart action", ".restart-button", "color", "#171713"],
  ["audio introduction", ".audio-intro", "color", "#171713"],
  ["audio channel label", ".audio-enable strong, .audio-channel strong", "color", "#211e18"],
  ["audio runtime status", ".audio-enable small", "color", "#211e18"],
  ["audio channel output", ".audio-channel output", "color", "#171713"],
  ["audio preview", ".audio-preview", "color", "#171713"],
  ["audio review gate", ".audio-review", "color", "#171713"],
];

for (const [label, selector, property, background] of contrastPairs) {
  const foreground = declaration(selector, property);
  const ratio = contrast(foreground, background);
  if (ratio < 4.5) throw new Error(`${label} contrast is ${ratio.toFixed(2)}:1; expected at least 4.5:1.`);
}

const microtypeSelectors = [
  ".map-inspect-hint", ".map-intel-head span", ".map-intel-uncertainty b", ".map-intel footer span",
  ".opposition-identity span", ".opposition-panel > p", ".opposition-effects span", ".opposition-panel > small", ".opposition-panel > small b",
  ".method-read-identity span", ".method-read-counts span", ".method-read-panel > p", ".method-read-effects span", ".method-read-panel > small",
  ".method-choice > span", ".method-choice p", ".method-choice small", ".method-choice small b", ".record-method-read b",
  ".commitment-identity span", ".commitment-identity strong", ".commitment-panel > p", ".commitment-panel > small", ".commitment-panel > small b",
  ".commitment-establish > span", ".commitment-establish > strong", ".commitment-establish p", ".commitment-establish small",
  ".commitment-forecast > span", ".commitment-forecast p", ".commitment-forecast-effects span", ".record-commitment b", ".commitment-ending", ".commitment-ending b",
  ".resolution-copy:has(.commitment-reveal) span", ".resolution-copy:has(.commitment-reveal) p",
  ".field-signal-head", ".field-signal-head code", ".field-effects span", ".dialogue footer em",
  ".choice-reading span", ".pressure-warning > span", ".effects span, .delta-list span", ".locked",
  ".decision-inspector-head p", ".decision-inspector-head div > span", ".decision-principle > span", ".decision-principle p",
  ".decision-confirmation small", ".issue-order-button span", ".issue-order-button strong",
  ".resolution-copy span", ".controller-callout span", ".controller-callout p", ".source-status",
  ".source-section", ".source-external", ".claim-meta span", ".claim-meta code", ".claim p",
  ".record-list small", ".record-pressure b", ".record-opposition b", ".record-field b",
  ".audio-intro", ".audio-enable strong, .audio-channel strong", ".audio-enable small",
  ".audio-channel output", ".audio-preview", ".audio-review",
];
for (const selector of microtypeSelectors) {
  const size = declaration(selector, "font-size");
  const match = size.match(/^([0-9.]+)rem$/);
  if (!match || Number(match[1]) < 0.6) throw new Error(`${selector} uses ${size}; production microtype must be at least 0.6rem.`);
}

const targetSelectors = [
  [".title-footer button", "min-height"], [".primary-button", "min-height"], [".header-button", "height"],
  [".site-marker", "min-height"], [".map-inspect-hint", "min-height"], [".map-intel-head button", "height"],
  [".map-intel footer button", "min-height"], [".source-link", "min-height"], [".resolution-banner > button", "min-height"],
  [".icon-button", "height"], [".source-external", "min-height"],
  [".audio-enable input", "width"], [".audio-channel input[type=\"range\"]", "height"], [".audio-preview", "min-height"],
  [".issue-order-button", "min-height"],
];
for (const [selector, property] of targetSelectors) {
  const size = declaration(selector, property);
  const match = size.match(/^([0-9.]+)px$/);
  if (!match || Number(match[1]) < 24) throw new Error(`${selector} uses ${property}: ${size}; targets must be at least 24 CSS px.`);
}

const forcedColorStart = css.indexOf("@media (forced-colors: active)");
if (forcedColorStart < 0) throw new Error("The forced-colors accessibility contract is missing.");
const forcedColors = css.slice(forcedColorStart);
const forcedColorSelectors = [
  ".three-backdrop", ".title-image", ".map-sweep", ".meter", ".resource.danger",
  ".site-marker.site-reported i", ".site-marker.site-reference i", ".site-marker.active i",
  ".choice-card.is-selected:not(:disabled)", ".choice-card:disabled", ".decision-inspector", ".issue-order-button", ".effects span", ".map-intel-uncertainty",
  ".opposition-panel", ".opposition-effects span",
  ".method-read-panel", ".method-read-effects span", ".method-read-counts span", ".method-choice", ".method-read-reveal",
  ".commitment-panel", ".commitment-establish", ".commitment-forecast", ".commitment-forecast-effects span", ".commitment-reveal",
  ".audio-enable input, .audio-channel input", ".audio-preview",
];
for (const selector of forcedColorSelectors) {
  if (!forcedColors.includes(selector)) throw new Error(`Forced-colors contract selector is missing: ${selector}`);
}
for (const systemColor of ["Canvas", "CanvasText", "Highlight", "HighlightText", "GrayText"]) {
  if (!forcedColors.includes(systemColor)) throw new Error(`Forced-colors contract must use the ${systemColor} system color.`);
}

console.log(`Accessibility contract valid: ${contrastPairs.length} contrast pairs, ${microtypeSelectors.length} microtype floors, ${targetSelectors.length} target dimensions, ${forcedColorSelectors.length} forced-colors selectors.`);
