// ForceKIT Marketplace · fk.js.page-info 1.0.0
// Information about the Salesforce page you are on: object, record Id,
// app, Lightning or Classic. Read only: it changes nothing on the page.
if (window !== window.top) return undefined;
const path = location.pathname;
const lightning = /\/lightning\//.test(path);
const rec = /\/lightning\/r\/(\w+)\/([a-zA-Z0-9]{15,18})\//.exec(path);
const list = /\/lightning\/o\/(\w+)\//.exec(path);
const classicId = !lightning && /^\/([a-zA-Z0-9]{15}|[a-zA-Z0-9]{18})(?:[/?]|$)/.exec(path);
const app = /\/lightning\/app\/([^/]+)/.exec(path);
return {
  ui: lightning ? "Lightning" : "Classic",
  host: location.host,
  object: rec?.[1] || list?.[1] || null,
  recordId: rec?.[2] || classicId?.[1] || null,
  app: app ? decodeURIComponent(app[1]) : null,
  title: document.title,
  url: location.href,
};
