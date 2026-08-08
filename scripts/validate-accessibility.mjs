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
  ["field seed", ".field-signal-head code", "color", "#1d1d18"],
  ["dialogue metadata", ".dialogue footer", "color", "#1d1d18"],
  ["choice input hint", ".choices-heading small", "color", "#181915"],
  ["choice arrow", ".choice-arrow", "color", "#272720"],
  ["source section", ".source-section", "color", "#171713"],
  ["claim confidence", ".claim-meta code", "color", "#171713"],
  ["record number", ".record-list li > span", "color", "#171713"],
  ["record scene", ".record-list small", "color", "#171713"],
  ["restart action", ".restart-button", "color", "#171713"],
];

for (const [label, selector, property, background] of contrastPairs) {
  const foreground = declaration(selector, property);
  const ratio = contrast(foreground, background);
  if (ratio < 4.5) throw new Error(`${label} contrast is ${ratio.toFixed(2)}:1; expected at least 4.5:1.`);
}

const microtypeSelectors = [
  ".map-inspect-hint", ".map-intel-head span", ".map-intel-uncertainty b", ".map-intel footer span",
  ".field-signal-head", ".field-signal-head code", ".field-effects span", ".dialogue footer em",
  ".choice-reading span", ".pressure-warning > span", ".effects span, .delta-list span", ".locked",
  ".resolution-copy span", ".controller-callout span", ".controller-callout p", ".source-status",
  ".source-section", ".source-external", ".claim-meta span", ".claim-meta code", ".claim p",
  ".record-list small", ".record-pressure b", ".record-field b",
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
];
for (const [selector, property] of targetSelectors) {
  const size = declaration(selector, property);
  const match = size.match(/^([0-9.]+)px$/);
  if (!match || Number(match[1]) < 24) throw new Error(`${selector} uses ${property}: ${size}; targets must be at least 24 CSS px.`);
}

console.log(`Accessibility contract valid: ${contrastPairs.length} contrast pairs, ${microtypeSelectors.length} microtype floors, ${targetSelectors.length} target dimensions.`);
