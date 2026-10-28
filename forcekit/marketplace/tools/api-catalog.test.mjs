// node --test forcekit/marketplace/tools/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateApiCatalog } from "./api-catalog.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function sample() {
  return {
    schemaVersion: 1,
    updatedAt: "2026-10-28",
    categories: [{ id: "test", label: { en: "Testing" } }],
    packages: [
      {
        id: "sample",
        name: "Sample",
        description: { en: "A sample." },
        author: { name: "ForceKIT" },
        official: true,
        category: "test",
        tags: ["REST"],
        site: "https://example.com",
        version: "1.0.0",
        date: "2026-10-28",
        compatibility: { minExtensionVersion: "7.7.8" },
        vars: [{ k: "BASE", v: "https://example.com" }],
        requests: [
          { id: "get", name: "Get", url: "{{BASE}}/items", params: [{ k: "limit", v: "5", on: true }] },
          { id: "soap", name: "Soap", kind: "soap", url: "https://example.com/ws", body: "<soapenv:Envelope/>" },
        ],
      },
    ],
  };
}

test("the published API catalog is valid", () => {
  const catalog = JSON.parse(readFileSync(resolve(root, "api", "catalog.json"), "utf8"));
  assert.deepEqual(validateApiCatalog(catalog).errors, []);
});

test("a correct API catalog has no errors", () => {
  assert.deepEqual(validateApiCatalog(sample()).errors, []);
});

test("bad requests are reported", () => {
  const c = sample();
  const r = c.packages[0].requests;
  r.push({ id: "get", name: "Dup", url: "https://x" });
  r.push({ id: "bad-url", name: "Bad", url: "javascript:alert(1)" });
  r.push({ id: "sf", name: "Session", url: "https://x", auth: { type: "sf" } });
  r.push({ id: "extra", name: "Extra", url: "https://x", script: "evil()" });
  const errors = validateApiCatalog(c).errors.join("\n");
  assert.match(errors, /duplicated id/);
  assert.match(errors, /url must start/);
  assert.match(errors, /auth.type/);
  assert.match(errors, /unknown key script/);
});

test("package rules: official, reserved id, https site", () => {
  const c = sample();
  Object.assign(c.packages[0], { id: "salesforce", official: false, site: "http://example.com" });
  const errors = validateApiCatalog(c).errors.join("\n");
  assert.match(errors, /reserved/);
  assert.match(errors, /official/);
  assert.match(errors, /https URL/);
});
