#!/usr/bin/env node
// ForceKIT Marketplace — controllo del catalogo delle chiamate API (api/catalog.json).
//
//   node forcekit/marketplace/tools/api-catalog.mjs     controlla (esce con 1 se c'e' un errore)
//
// Nessuna dipendenza: solo Node (>= 18). L'estensione rifa' gli stessi
// controlli (parseApiCatalog in lib/api-market.js nel repo dell'estensione)
// prima di mostrare il catalogo: una voce non valida viene scartata.
// Sono solo dati (raccolte di richieste HTTP), nessun codice da eseguire.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA_VERSION = 1;
export const LANGS = ["en", "it", "fr", "es", "de"];
export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
export const BODY_TYPES = ["none", "json", "xml", "text", "form"];
// niente autenticazione "Salesforce": il catalogo e' di API pubbliche
export const AUTH_TYPES = ["none", "bearer", "basic", "apikey"];
export const MAX_CATALOG_BYTES = 512 * 1024;
const ID_RE = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const VAR_RE = /^[\w.-]{1,80}$/;
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REQUEST_KEYS = new Set(["id", "name", "kind", "method", "url", "params", "headers", "bodyType", "body", "form", "auth", "soapVersion", "soapAction"]);

function isLocalized(v) {
  if (typeof v === "string") return v.trim().length > 0;
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  return typeof v.en === "string" && v.en.trim().length > 0 && Object.keys(v).every((k) => LANGS.includes(k) && typeof v[k] === "string");
}
const isStr = (v, max) => typeof v === "string" && v.length <= max;
function rowsOk(list) {
  return (
    list == null ||
    (Array.isArray(list) &&
      list.length <= 50 &&
      list.every((r) => r && typeof r === "object" && isStr(r.k, 200) && r.k.trim() && isStr(r.v ?? "", 4000) && (r.on == null || typeof r.on === "boolean")))
  );
}

/** Controlla il catalogo. Ritorna { errors: string[] }. */
export function validateApiCatalog(catalog) {
  const errors = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  if (!catalog || typeof catalog !== "object") return { errors: ["catalog: not an object"] };
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
  if (!Array.isArray(catalog.packages)) {
    err("catalog", "packages must be an array");
    return { errors };
  }
  const ids = new Set();
  for (const p of catalog.packages) {
    const w = `package ${p?.id ?? "?"}`;
    if (!ID_RE.test(p?.id || "") || p.id.length > 60) err(w, "id must be lowercase letters/digits separated by . or - (max 60)");
    else if (ids.has(p.id)) err(w, "duplicated id");
    ids.add(p?.id);
    if (p?.id === "salesforce") err(w, "the id salesforce is reserved for the calls built into the extension");
    if (!isStr(p?.name, 80) || !p.name.trim()) err(w, "name required (max 80)");
    if (!isLocalized(p?.description)) err(w, "description (with en) required");
    if (!p?.author || !isStr(p.author.name, 80) || !p.author.name.trim()) err(w, "author.name required");
    if (p?.official !== true) err(w, "only official packages can be published (official: true)");
    if (!catIds.has(p?.category)) err(w, `unknown category ${JSON.stringify(p?.category)}`);
    if (p?.tags != null && (!Array.isArray(p.tags) || p.tags.length > 8 || !p.tags.every((t) => isStr(t, 20)))) err(w, "tags: up to 8 short strings");
    if (!/^https:\/\/[^\s]+$/.test(p?.site || "") || p.site.length > 300) err(w, "site must be an https URL");
    if (!SEMVER_RE.test(p?.version || "")) err(w, "version must be x.y.z");
    if (!DATE_RE.test(p?.date || "")) err(w, "date must be YYYY-MM-DD");
    if (!SEMVER_RE.test(p?.compatibility?.minExtensionVersion || "")) err(w, "compatibility.minExtensionVersion must be x.y.z");
    const vars = p?.vars ?? [];
    if (!Array.isArray(vars) || vars.length > 50 || !vars.every((v) => VAR_RE.test(v?.k || "") && isStr(v.v ?? "", 2000))) err(w, "vars: up to 50 { k, v } (k: letters, digits, _ . -)");
    const reqs = Array.isArray(p?.requests) ? p.requests : [];
    if (!reqs.length || reqs.length > 50) err(w, "requests: 1..50");
    const rids = new Set();
    for (const r of reqs) {
      const rw = `${w} › ${r?.id ?? "?"}`;
      if (!r || typeof r !== "object") {
        err(rw, "not an object");
        continue;
      }
      for (const k of Object.keys(r)) if (!REQUEST_KEYS.has(k)) err(rw, `unknown key ${k}`);
      if (!ID_RE.test(r.id || "") || r.id.length > 60) err(rw, "id must be lowercase letters/digits separated by . or - (max 60)");
      else if (rids.has(r.id)) err(rw, "duplicated id");
      rids.add(r.id);
      if (!isStr(r.name, 120) || !r.name.trim()) err(rw, "name required (max 120)");
      const soap = r.kind === "soap";
      if (r.kind != null && r.kind !== "rest" && !soap) err(rw, "kind must be rest or soap");
      if (r.method != null && (!METHODS.includes(r.method) || (soap && r.method !== "POST"))) err(rw, `method must be one of ${METHODS.join(", ")} (POST for SOAP)`);
      if (!isStr(r.url, 2000) || !/^(https?:\/\/|\{\{)/.test(r.url)) err(rw, "url must start with http://, https:// or a {{variable}}");
      for (const k of ["params", "headers", "form"]) if (!rowsOk(r[k])) err(rw, `${k}: up to 50 { k, v, on }`);
      if (r.bodyType != null && !BODY_TYPES.includes(r.bodyType)) err(rw, `bodyType must be one of ${BODY_TYPES.join(", ")}`);
      if (r.body != null && !isStr(r.body, 100000)) err(rw, "body: string, max 100000 chars");
      if (soap && !/Envelope/.test(r.body || "")) err(rw, "SOAP requests need the envelope in body");
      if (r.auth != null) {
        if (!AUTH_TYPES.includes(r.auth?.type)) err(rw, `auth.type must be one of ${AUTH_TYPES.join(", ")}`);
        else if (!Object.entries(r.auth).every(([k, v]) => ["type", "token", "user", "pass", "key", "value", "in"].includes(k) && isStr(v, 2000))) err(rw, "auth: unknown fields");
      }
      if (r.soapVersion != null && !["1.1", "1.2"].includes(r.soapVersion)) err(rw, "soapVersion must be 1.1 or 1.2");
      if (r.soapAction != null && !isStr(r.soapAction, 500)) err(rw, "soapAction: string, max 500");
    }
  }
  return { errors };
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const path = join(root, "api", "catalog.json");
  const text = readFileSync(path, "utf8");
  const errors = [];
  if (Buffer.byteLength(text) > MAX_CATALOG_BYTES) errors.push(`catalog: larger than ${MAX_CATALOG_BYTES} bytes`);
  if (text.includes("\r")) errors.push("catalog: Windows line endings (CRLF), keep .gitattributes (eol=lf)");
  const catalog = JSON.parse(text);
  errors.push(...validateApiCatalog(catalog).errors);
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
  const n = catalog.packages.reduce((s, p) => s + p.requests.length, 0);
  console.log(`✓ api catalog ok: ${catalog.packages.length} package(s), ${n} request(s)`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
