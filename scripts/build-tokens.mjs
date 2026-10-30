// Generates src/styles/tokens.css from design-system/tokens.json, so the
// design system stays the one source of every color, size and shadow.
// Run `npm run tokens` after changing tokens.json, and commit the result.
//
// Themes:
// - Light ("Paper") is the default, on :root (extension pages and the
//   website) and :host (the shadow root notes render in on web pages).
// - Dark ("Night") applies when the system prefers it, unless the page
//   opted out with data-theme="light", or always with data-theme="dark".
//   Notes on web pages set data-theme="light": they are paper on any site.
import { readFileSync, writeFileSync } from "node:fs";

const tokens = JSON.parse(readFileSync(new URL("../design-system/tokens.json", import.meta.url), "utf8"));
const [light, dark] = tokens.color.themes.map((theme) => theme.id);

// "{hl-yellow}" -> var(--hl-yellow)
const css = (value) => String(value).replace(/\{([^}]+)\}/g, "var(--$1)");
const valueFor = (token, theme) => (typeof token.value === "object" ? token.value[theme] ?? token.value[light] : token.value);

const lightVars = [];
const darkVars = [];
const add = (token) => {
  lightVars.push(`  --${token.name}: ${css(valueFor(token, light))};`);
  if (typeof token.value === "object" && token.value[dark] !== undefined) {
    darkVars.push(`  --${token.name}: ${css(token.value[dark])};`);
  }
};

tokens.color.tokens.forEach(add);
for (const family of ["spacing", "radius", "shadow", "stroke"]) {
  tokens[family]?.tokens.forEach(add);
}
for (const [name, stack] of Object.entries(tokens.type.families)) {
  lightVars.push(`  --font-${name}: ${stack};`);
}

const out = `/* Docamatic — generated from design-system/tokens.json by scripts/build-tokens.mjs. Don't edit by hand. */
:root,
:host,
[data-theme="light"] {
  color-scheme: light;
${lightVars.join("\n")}
}

[data-theme="dark"] {
  color-scheme: dark;
${darkVars.join("\n")}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${darkVars.map((line) => "  " + line).join("\n")}
  }
}
`;

writeFileSync(new URL("../src/styles/tokens.css", import.meta.url), out);
console.log(`Wrote src/styles/tokens.css (${lightVars.length} tokens)`);
