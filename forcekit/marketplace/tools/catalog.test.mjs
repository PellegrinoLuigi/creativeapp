// node --test forcekit/marketplace/tools/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog, compareVersions, sha256 } from "./catalog.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readReal = (rel) => {
  const p = resolve(root, rel);
  return p.startsWith(root + "/") && existsSync(p) ? readFileSync(p) : null;
};

function sample() {
  const body = Buffer.from("System.debug('hi');\n");
  const catalog = {
    schemaVersion: 1,
    updatedAt: "2026-10-21",
    categories: [{ id: "data", label: { en: "Data" } }],
    scripts: [
      {
        id: "fk.sample",
        name: { en: "Sample" },
        description: { en: "A sample." },
        author: { name: "ForceKIT" },
        official: true,
        type: "apex",
        category: "data",
        versions: [
          {
            version: "1.1.0",
            date: "2026-10-21",
            file: "scripts/fk.sample/1.1.0.apex",
            size: body.length,
            sha256: sha256(body),
            compatibility: { minExtensionVersion: "7.2.0" },
            changelog: { en: ["Second"] },
          },
          {
            version: "1.0.0",
            date: "2026-10-20",
            file: "scripts/fk.sample/1.0.0.apex",
            size: body.length,
            sha256: sha256(body),
            compatibility: { minExtensionVersion: "7.2.0" },
            changelog: ["First"],
          },
        ],
      },
    ],
  };
  return { catalog, read: () => body };
}

test("the published catalog is valid", () => {
  const catalog = JSON.parse(readFileSync(resolve(root, "catalog.json"), "utf8"));
  const { errors } = validateCatalog(catalog, readReal);
  assert.deepEqual(errors, []);
});

test("a correct catalog has no errors", () => {
  const { catalog, read } = sample();
  assert.deepEqual(validateCatalog(catalog, read).errors, []);
});

test("a changed file is caught by the hash", () => {
  const { catalog } = sample();
  const { errors } = validateCatalog(catalog, () => Buffer.from("System.debug('tampered');\n"));
  assert.ok(errors.some((e) => e.includes("sha256")));
});

test("--write fixes size and hash", () => {
  const { catalog } = sample();
  const other = Buffer.from("x");
  const { errors } = validateCatalog(catalog, () => other, { fix: true });
  assert.deepEqual(errors, []);
  assert.equal(catalog.scripts[0].versions[0].sha256, sha256(other));
  assert.equal(catalog.scripts[0].versions[0].size, 1);
});

test("non official, duplicated ids, bad types and bad paths are rejected", () => {
  const { catalog, read } = sample();
  const s = catalog.scripts[0];
  catalog.scripts.push({ ...s });
  s.official = false;
  s.type = "python";
  const { errors } = validateCatalog(catalog, read);
  assert.ok(errors.some((e) => e.includes("official")));
  assert.ok(errors.some((e) => e.includes("duplicated id")));
  assert.ok(errors.some((e) => e.includes("type must be")));
});

test("versions must be newest first and point to their own file", () => {
  const { catalog, read } = sample();
  catalog.scripts[0].versions.reverse();
  catalog.scripts[0].versions[0].file = "../../etc/passwd";
  const { errors } = validateCatalog(catalog, read);
  assert.ok(errors.some((e) => e.includes("newest first")));
  assert.ok(errors.some((e) => e.includes("file must be")));
});

test("compareVersions", () => {
  assert.ok(compareVersions("1.10.0", "1.9.9") > 0);
  assert.equal(compareVersions("2.0.0", "2.0.0"), 0);
  assert.ok(compareVersions("7.1.0", "7.2.0") < 0);
});
