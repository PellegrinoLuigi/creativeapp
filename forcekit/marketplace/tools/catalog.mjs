#!/usr/bin/env node
// ForceKIT Marketplace — controllo e aggiornamento del catalogo (catalog.json).
//
//   node forcekit/marketplace/tools/catalog.mjs          controlla e basta (esce con 1 se c'e' un errore)
//   node forcekit/marketplace/tools/catalog.mjs --write  ricalcola size e sha256 dei file e li scrive nel catalogo
//
// Nessuna dipendenza: solo Node (>= 18). L'estensione rifa' gli stessi
// controlli (lib/marketplace.js nel repo dell'estensione) prima di installare.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA_VERSION = 1;
export const TYPES = { apex: "apex", javascript: "js" };
export const LANGS = ["en", "it", "fr", "es", "de"];
export const MAX_FILE_BYTES = 200 * 1024;
const ID_RE = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SHA_RE = /^[0-9a-f]{64}$/;

export function compareVersions(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
}
export function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}
function isLocalized(v, { optional = false } = {}) {
  if (v == null) return optional;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v !== "object" || Array.isArray(v)) return false;
  return typeof v.en === "string" && v.en.trim().length > 0 && Object.keys(v).every((k) => LANGS.includes(k) && typeof v[k] === "string");
}
function isLocalizedList(v) {
  if (Array.isArray(v)) return v.length > 0 && v.every((s) => typeof s === "string" && s.trim());
  if (!v || typeof v !== "object") return false;
  return Array.isArray(v.en) && v.en.length > 0 && Object.entries(v).every(([k, l]) => LANGS.includes(k) && Array.isArray(l) && l.every((s) => typeof s === "string"));
}

/**
 * Controlla il catalogo. readFile(path relativo al catalogo) -> Buffer | null.
 * Con fix=true corregge size/sha256 invece di segnalarli.
 * Ritorna { errors: string[], catalog }.
 */
export function validateCatalog(catalog, readFile, { fix = false } = {}) {
  const errors = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  if (!catalog || typeof catalog !== "object") return { errors: ["catalog: not an object"], catalog };
  if (catalog.schemaVersion !== SCHEMA_VERSION) err("catalog", `schemaVersion must be ${SCHEMA_VERSION}`);
  if (!DATE_RE.test(catalog.updatedAt || "")) err("catalog", "updatedAt must be YYYY-MM-DD");
  const cats = Array.isArray(catalog.categories) ? catalog.categories : [];
  if (!cats.length) err("catalog", "categories must be a non-empty array");
  const catIds = new Set();
  for (const c of cats) {
    if (!ID_RE.test(c?.id || "")) err("category", `invalid id ${JSON.stringify(c?.id)}`);
    else if (catIds.has(c.id)) err(`category ${c.id}`, "duplicated");
    catIds.add(c?.id);
    if (!isLocalized(c?.label)) err(`category ${c?.id}`, "label (with en) required");
  }
  if (!Array.isArray(catalog.scripts)) {
    err("catalog", "scripts must be an array");
    return { errors, catalog };
  }
  const ids = new Set();
  for (const s of catalog.scripts) {
    const w = `script ${s?.id ?? "?"}`;
    if (!ID_RE.test(s?.id || "") || s.id.length > 80) err(w, "id must be lowercase letters/digits separated by . or - (max 80)");
    else if (ids.has(s.id)) err(w, "duplicated id");
    ids.add(s?.id);
    if (!isLocalized(s?.name) || JSON.stringify(s.name).length > 600) err(w, "name (with en) required");
    if (!isLocalized(s?.description)) err(w, "description (with en) required");
    if (!s?.author || typeof s.author.name !== "string" || !s.author.name.trim()) err(w, "author.name required");
    if (s?.official !== true) err(w, "only official scripts can be published (official: true)");
    if (!Object.hasOwn(TYPES, s?.type)) err(w, `type must be one of ${Object.keys(TYPES).join(", ")}`);
    if (!catIds.has(s?.category)) err(w, `unknown category ${JSON.stringify(s?.category)}`);
    if (s?.icon != null && (typeof s.icon !== "string" || [...s.icon].length > 8)) err(w, "icon must be a short emoji");
    if (s?.tags != null && (!Array.isArray(s.tags) || !s.tags.every((t) => typeof t === "string" && t.length <= 30))) err(w, "tags must be short strings");
    const versions = Array.isArray(s?.versions) ? s.versions : [];
    if (!versions.length) err(w, "versions must be a non-empty array (newest first)");
    let prev = null;
    for (const v of versions) {
      const vw = `${w}@${v?.version ?? "?"}`;
      if (!SEMVER_RE.test(v?.version || "")) {
        err(vw, "version must be x.y.z");
        continue;
      }
      if (prev && compareVersions(prev, v.version) <= 0) err(vw, "versions must be unique and sorted newest first");
      prev = v.version;
      if (!DATE_RE.test(v.date || "")) err(vw, "date must be YYYY-MM-DD");
      if (!isLocalizedList(v.changelog)) err(vw, "changelog (list, with en) required");
      const min = v.compatibility?.minExtensionVersion;
      if (!SEMVER_RE.test(min || "")) err(vw, "compatibility.minExtensionVersion must be x.y.z");
      const max = v.compatibility?.maxExtensionVersion;
      if (max != null && !SEMVER_RE.test(max)) err(vw, "compatibility.maxExtensionVersion must be x.y.z");
      if (v.match != null && (s.type !== "javascript" || typeof v.match !== "string" || v.match.length > 500)) err(vw, "match is for javascript scripts only (URL globs, max 500 chars)");
      const ext = TYPES[s.type];
      const expected = `scripts/${s.id}/${v.version}.${ext}`;
      if (v.file !== expected) {
        err(vw, `file must be ${expected}`);
        continue;
      }
      const buf = readFile(v.file);
      if (!buf) {
        err(vw, `missing file ${v.file}`);
        continue;
      }
      if (buf.length === 0 || buf.length > MAX_FILE_BYTES) err(vw, `file size must be 1..${MAX_FILE_BYTES} bytes`);
      // Su Windows (git core.autocrlf) la copia locale puo' avere CRLF, ma GitHub
      // Pages pubblica il file come lo salva git (LF): size e sha256 calcolati sul
      // CRLF non corrisponderebbero mai a quello che l'estensione scarica.
      if (buf.includes(13)) {
        err(vw, `${v.file} has Windows line endings (CRLF), the published file has LF: keep .gitattributes (eol=lf) and run  git add --renormalize forcekit/marketplace/scripts`);
        continue;
      }
      const hash = sha256(buf);
      if (fix) {
        v.size = buf.length;
        v.sha256 = hash;
      } else {
        if (v.size !== buf.length) err(vw, `size is ${v.size}, file has ${buf.length} bytes (run with --write)`);
        if (!SHA_RE.test(v.sha256 || "") || v.sha256 !== hash) err(vw, "sha256 does not match the file (run with --write)");
      }
    }
  }
  return { errors, catalog };
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = resolve(here, "..");
  const path = join(root, "catalog.json");
  const fix = process.argv.includes("--write");
  const catalog = JSON.parse(readFileSync(path, "utf8"));
  const readFile = (rel) => {
    const p = resolve(root, rel);
    // sep: "\\" su Windows, "/" altrove (con "/" fisso su Windows nessun file risultava valido)
    if (!p.startsWith(root + sep) || !existsSync(p)) return null;
    return readFileSync(p);
  };
  const { errors } = validateCatalog(catalog, readFile, { fix });
  if (fix && !errors.length) writeFileSync(path, `${JSON.stringify(catalog, null, 2)}\n`);
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
  console.log(`✓ catalog ok: ${catalog.scripts.length} script(s)${fix ? " (size/sha256 updated)" : ""}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
