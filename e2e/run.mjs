// Runs the browser tests (e2e/suites) against the built extension and site.
//
//   npm run build && npm run build:firefox && npm run site:build
//   npm run e2e:chrome          once: the Chrome version they run on
//   npm run e2e                 every suite
//   npm run e2e -- board keys   just these
//
// Serves e2e/pages on http://localhost:8765, runs each suite in its own
// process, keeps each one's output in e2e/output/logs, and exits non-zero if
// any failed. A suite that fails is run once more; passing then is reported
// as "passed on retry", so flaky suites show up without blocking. See
// e2e/README.md.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CHROME, CHROME_BUILD, OUT, PAGES } from "./env.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SUITES = join(here, "suites");
const LOGS = join(OUT, "logs");
const TIMEOUT_MS = 6 * 60 * 1000;
mkdirSync(LOGS, { recursive: true });

if (!CHROME || !existsSync(CHROME)) {
  console.error(`No Chrome to test with: run npm run e2e:chrome (downloads Chrome ${CHROME_BUILD}), or set CHROME_PATH.`);
  process.exit(1);
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };
const root = resolve(PAGES);
const serve = (req, res) => {
  const file = resolve(root, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (!existsSync(file)) return res.writeHead(404).end();
  // A folder (startfresh opens the site's root): a plain page listing it
  if (statSync(file).isDirectory()) {
    const links = readdirSync(file).map((name) => `<li><a href="${encodeURI(name)}">${name}</a></li>`).join("");
    return res.writeHead(200, { "Content-Type": TYPES[".html"] }).end(`<!doctype html><title>Test pages</title><ul>${links}</ul>`);
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
};

// A bad request fails that request, never the whole run
const server = createServer((req, res) => {
  try {
    serve(req, res);
  } catch {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
});
await new Promise((resolve) => server.listen(8765, resolve));

// Each run of a suite gets its own temp folder (browser profiles, downloads),
// deleted afterwards: hundreds of runs otherwise fill the disk. Under the
// system's temp folder, not e2e/output: Chrome on Linux puts a socket in the
// temp folder, and socket paths can't be longer than 108 characters. In CI
// (/home/runner/work/<repo>/<repo>/e2e/output/...) they were, and Chrome
// quit as it started.
const cleanUp = (dir) => {
  for (let i = 0; i < 5; i++) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return;
    } catch {
      // Windows: the browser may still be letting go of its files
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
    }
  }
};

const runOnce = (name) =>
  new Promise((resolve) => {
    const temp = mkdtempSync(join(tmpdir(), "dm-e2e-"));
    const env = { ...process.env, TEMP: temp, TMP: temp, TMPDIR: temp };
    const child = spawn(process.execPath, [join(SUITES, `${name}.mjs`)], { cwd: here, env });
    let output = "";
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    const timer = setTimeout(() => {
      output += `\nTIMEOUT after ${TIMEOUT_MS / 1000}s`;
      child.kill();
    }, TIMEOUT_MS);
    child.on("close", (code) => {
      clearTimeout(timer);
      cleanUp(temp);
      const failed = code !== 0 || /^FAIL /m.test(output) || /^\d+ FAILED$|TIMEOUT after/m.test(output);
      const skipped = !failed && /^SKIP /m.test(output);
      const passes = (output.match(/^PASS /gm) || []).length;
      resolve({ output, failed, skipped, passes });
    });
  });

const wanted = process.argv.slice(2);
const all = readdirSync(SUITES)
  .filter((f) => f.endsWith(".mjs"))
  .map((f) => f.replace(/\.mjs$/, ""))
  .sort();
const names = wanted.length ? all.filter((n) => wanted.includes(n)) : all;
const unknown = wanted.filter((n) => !all.includes(n));
if (unknown.length) console.log(`Unknown suites: ${unknown.join(", ")}`);

const results = [];
for (const name of names) {
  const started = Date.now();
  let result = await runOnce(name);
  let retried = false;
  if (result.failed) {
    writeFileSync(join(LOGS, `${name}.first-try.log`), result.output);
    retried = true;
    result = await runOnce(name);
  }
  writeFileSync(join(LOGS, `${name}.log`), result.output);
  const status = result.failed ? "FAILED" : result.skipped ? "skipped" : retried ? "passed on retry" : "passed";
  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(`${status.padEnd(16)} ${name.padEnd(14)} ${String(result.passes).padStart(3)} checks  ${seconds}s`);
  if (result.failed || result.skipped) {
    const lines = result.output.split("\n").filter((l) => /^FAIL |Error|TIMEOUT|SKIP |FATAL/.test(l)).slice(0, 8);
    lines.forEach((l) => console.log(`    ${l.trim().slice(0, 200)}`));
  }
  results.push({ name, status });
}
server.close();

const failed = results.filter((r) => r.status === "FAILED");
const flaky = results.filter((r) => r.status === "passed on retry");
console.log(
  `\n${results.length - failed.length}/${results.length} suites passed` +
    (flaky.length ? `, ${flaky.length} on retry (${flaky.map((r) => r.name).join(", ")})` : "") +
    (failed.length ? `; failed: ${failed.map((r) => r.name).join(", ")}` : "") +
    `. Logs: ${LOGS}`
);
process.exit(failed.length ? 1 : 0);
