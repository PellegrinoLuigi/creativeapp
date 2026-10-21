// ForceKIT Marketplace · fk.js.open-object-manager 1.0.0
// From a Lightning record or list page, opens the object in Object Manager
// (new tab; if the browser blocks it, in this tab).
if (window !== window.top) return undefined;
const where = '{{Open:Fields,Layouts,Validation rules,Record types,Triggers}}';
const section = { Fields: "FieldsAndRelationships", Layouts: "PageLayouts", "Validation rules": "ValidationRules", "Record types": "RecordTypes", Triggers: "ApexTriggers" }[where] || "Details";
const obj =
  /\/lightning\/[or]\/(\w+)\//.exec(location.pathname)?.[1] || /\/lightning\/setup\/ObjectManager\/(\w+)\//.exec(location.pathname)?.[1];
if (!obj) return "Open a Lightning record or list page and run it again.";
const url = `${location.origin}/lightning/setup/ObjectManager/${obj}/${section}/view`;
if (!window.open(url, "_blank", "noopener")) location.assign(url);
return url;
