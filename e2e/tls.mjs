// A throwaway certificate for the suites' local HTTPS stand-ins (PostHog,
// a store page...). Made once per run, never committed. Chrome is started
// with --ignore-certificate-errors for these.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generate } from "selfsigned";
import { OUT } from "./env.mjs";

const keyFile = join(OUT, "tls-key.pem");
const certFile = join(OUT, "tls-cert.pem");
if (!existsSync(keyFile) || !existsSync(certFile)) {
  const pems = await generate([{ name: "commonName", value: "localhost" }], { days: 2, keySize: 2048 });
  writeFileSync(keyFile, pems.private);
  writeFileSync(certFile, pems.cert);
}

export const TLS = { key: readFileSync(keyFile), cert: readFileSync(certFile) };
