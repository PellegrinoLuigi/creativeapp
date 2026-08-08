# creativeapp

Marketing sites for the Chrome extensions published under the **creativeapp** developer account.

- [`/`](index.html) — home page, links to every extension
- [`/forcekit/`](forcekit/index.html) — [ForceKIT](https://github.com/PellegrinoLuigi) site (Salesforce toolkit)
- [`/profilemanager/`](profilemanager/index.html) — Profile Manager site (Salesforce profile/permission set comparator)

## Adding a new extension

1. Create a new folder at the repo root (e.g. `myextension/`) with its own `index.html`, `privacy.html`, etc.
2. Keep all internal links relative so the folder works standalone under GitHub Pages.
3. Add a card for it in the root [`index.html`](index.html) `.apps` grid.

## Hosting

Static site, served via GitHub Pages from the `main` branch root — no build step.
