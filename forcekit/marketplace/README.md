# ForceKIT Marketplace

Catalogo pubblico degli script **ufficiali** di ForceKIT (Apex e JavaScript), servito da GitHub Pages:

- pagina: <https://pellegrinoluigi.github.io/creativeapp/forcekit/marketplace/>
- catalogo letto dall'estensione: <https://pellegrinoluigi.github.io/creativeapp/forcekit/marketplace/catalog.json>

Non c'è nessun backend: catalogo e file degli script sono file statici di questo repository, versionati con git.

## Struttura

```
forcekit/marketplace/
  index.html                     catalogo + dettaglio (?script=<id>), assets/marketplace.{css,js}
  catalog.json                   il catalogo (schemaVersion 1)
  scripts/<id>/<versione>.apex   codice Apex di ogni versione
  scripts/<id>/<versione>.js     codice JavaScript di ogni versione
  tools/catalog.mjs              controllo del catalogo e calcolo di size/sha256 (Node, nessuna dipendenza)
  tools/catalog.test.mjs         test dello strumento
  api/index.html                 chiamate API pronte, assets/api-market.js
  api/catalog.json               il catalogo delle chiamate API (schemaVersion 1)
  tools/api-catalog.mjs          controllo del catalogo delle chiamate API
  tools/api-catalog.test.mjs     test dello strumento
```

Le versioni vecchie restano nella cartella: chi ha un'estensione meno recente riceve la versione più nuova compatibile.

## Schema di una voce

```jsonc
{
  "id": "fk.apex.org-limits",              // unico, minuscole/cifre separate da . o - (max 80)
  "name": { "en": "Org limits", "it": "Limiti dell'org" },   // "en" obbligatorio, poi it/fr/es/de
  "description": { "en": "…", "it": "…" },
  "author": { "name": "ForceKIT", "url": "https://…" },
  "official": true,                        // per ora si pubblicano solo script ufficiali
  "type": "apex",                          // "apex" | "javascript"
  "category": "org",                       // uno degli id in "categories"
  "icon": "📊",                            // facoltativa: un'emoji
  "tags": ["limits"],
  "versions": [                            // dalla più nuova alla più vecchia
    {
      "version": "1.1.0",                  // x.y.z
      "date": "2026-10-21",
      "file": "scripts/fk.apex.org-limits/1.1.0.apex",   // sempre scripts/<id>/<versione>.<apex|js>
      "size": 946,                         // scritti da tools/catalog.mjs --write
      "sha256": "…",
      "compatibility": { "minExtensionVersion": "7.2.0" },  // facoltativo "maxExtensionVersion"
      "match": "*.force.com/*",            // solo JavaScript: pagine dove gira (come nell'editor di ForceKIT)
      "changelog": { "en": ["…"], "it": ["…"] }
    }
  ]
}
```

Il codice usa le stesse regole degli script di ForceKIT: campi `{{Nome}}`, `{{Nome?}}`, `{{Nome:A,B}}`, `{{Nome:checkbox}}`, passi `// @step`. Gli script JavaScript girano nella pagina Salesforce (corpo di una funzione `async`: `return` e `await` al primo livello).

## Pubblicare uno script o una nuova versione

1. Scrivi il file in `scripts/<id>/<versione>.apex` (o `.js`). Una versione pubblicata non si modifica mai: per cambiare il codice si crea una nuova versione.
2. Aggiungi la voce o la nuova versione **in cima** a `versions` in `catalog.json`, con data, changelog e `minExtensionVersion`. Aggiorna `updatedAt`.
3. Calcola dimensione e hash e controlla tutto:
   ```sh
   node forcekit/marketplace/tools/catalog.mjs --write
   node forcekit/marketplace/tools/catalog.mjs
   node --test forcekit/marketplace/tools/*.test.mjs
   ```
4. Apri la pagina in locale (`python3 -m http.server` nella radice del repo, poi `http://localhost:8000/forcekit/marketplace/`): il dettaglio mostra "integrità verificata".
5. Commit e push su `master` (il ramo pubblicato da GitHub Pages). L'Action **Marketplace catalog** (`.github/workflows/marketplace.yml`) ripete il controllo; GitHub Pages pubblica in pochi minuti.

L'estensione controlla il catalogo ogni 6 ore (se ci sono script del Marketplace installati) o quando si apre il Marketplace (Scripts › + Nuovo › Marketplace). Gli aggiornamenti non si installano mai da soli: l'utente li vede e li conferma.

## Sicurezza

- L'estensione accetta solo voci valide con `official: true` dal catalogo ufficiale, scarica i file solo dalla cartella `scripts/` dello stesso sito e li confronta con `size` e `sha256` del catalogo prima di salvarli. Un file diverso non viene installato.
- Nulla viene eseguito durante l'installazione: gli script compaiono in **Scripts** in sola lettura (gruppo MARKETPLACE) e si eseguono solo quando l'utente preme Esegui.
- Il controllo dell'hash protegge da file corrotti o cambiati fuori dal catalogo; non sostituisce la revisione del codice. Ogni modifica a catalogo e script passa da commit su questo repository: rivedi il codice prima di pubblicarlo.

## Rimuovere uno script

Togli la voce da `catalog.json` (i file possono restare per lo storico). Chi l'ha già installato lo tiene, ma non riceve più aggiornamenti; può rimuoverlo dal Marketplace o da Scripts.

## Chiamate API (`api/catalog.json`)

Raccolte di API **pubbliche, gratuite e senza chiavi** per il client API di ForceKIT (Strumenti › API › Raccolte › ⋯ › Marketplace chiamate). Sono solo dati (richieste HTTP), nessun codice: per questo non ci sono file separati né SHA-256, il catalogo contiene tutto.

- pagina: <https://pellegrinoluigi.github.io/creativeapp/forcekit/marketplace/api/>
- catalogo letto dall'estensione: <https://pellegrinoluigi.github.io/creativeapp/forcekit/marketplace/api/catalog.json>

```jsonc
{
  "id": "open-meteo",                      // unico, minuscole/cifre separate da . o - (max 60); "salesforce" e' riservato
  "name": "Open-Meteo",
  "description": { "en": "…", "it": "…" }, // "en" obbligatorio, poi it/fr/es/de
  "author": { "name": "ForceKIT" },
  "official": true,
  "category": "data",                      // uno degli id in "categories"
  "tags": ["REST", "JSON"],
  "site": "https://open-meteo.com",        // documentazione (https)
  "version": "1.0.0",                      // x.y.z: alzala quando cambi le richieste
  "date": "2026-10-28",
  "compatibility": { "minExtensionVersion": "7.7.8" },
  "vars": [{ "k": "city", "v": "Milano" }],              // variabili della raccolta
  "requests": [
    { "id": "current", "name": "Current weather", "url": "https://api.open-meteo.com/v1/forecast",
      "params": [{ "k": "latitude", "v": "{{lat}}", "on": true }] }
  ]
}
```

Una richiesta ha gli stessi campi del client API: `id` (fisso), `name`, `kind` (`rest` di base o `soap`), `method` (di base GET; POST per SOAP), `url`, `params`, `headers`, `form`, `bodyType` (`none`, `json`, `xml`, `text`, `form`), `body` (per SOAP la busta completa), `auth` (`none`, `bearer`, `basic`, `apikey`: niente autenticazione Salesforce), `soapVersion`, `soapAction`. Altri campi non sono ammessi.

Gli Id non si cambiano mai: l'estensione li usa (`mkt:<pacchetto>:<richiesta>`) per riconoscere una raccolta già importata e aggiornare solo le differenze, senza toccare le richieste e le variabili aggiunte dall'utente. Il pacchetto `salesforce` (chiamate verso l'org attiva) resta dentro l'estensione perché dipende dalla sua versione API; l'estensione ha anche una copia di riserva del catalogo, usata se il sito non è raggiungibile.

Controllo:

```sh
node forcekit/marketplace/tools/api-catalog.mjs
node --test forcekit/marketplace/tools/*.test.mjs
```

Prima di pubblicare, prova le chiamate nuove dal client API di ForceKIT: devono rispondere senza chiavi né account.
