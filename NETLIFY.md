# Netlify deployment (Thinkport API proxy + server-side PDF export)

This repository is primarily built for **GitHub Pages** (static `dist/` only). To use **Netlify Functions** to proxy **all** Thinkport API traffic and optional **server-generated** PDF export for the implementations page, connect the repo to Netlify and use the root [`netlify.toml`](netlify.toml).

## Build settings

| Setting           | Value                                                      |
|-------------------|------------------------------------------------------------|
| Build command     | `pnpm install && pnpm build` (default from `netlify.toml`) |
| Publish directory | `dist`                                                     |

Set **`VITE_BASE_PATH`** in the Netlify UI to match how the site is served (e.g. `/` for a custom domain, or `/thinkport.brand/` for a project path).

## Environment variables (site)

| Variable                                            | Required    | Purpose                                                                                                                     |
|-----------------------------------------------------|-------------|-----------------------------------------------------------------------------------------------------------------------------|
| `THINKPORT_API_USERNAME` / `THINKPORT_API_PASSWORD` | Yes (proxy) | Basic Auth for `thinkportapi.netlify.app` — same as [`scripts/thinkport-api-client.mjs`](scripts/thinkport-api-client.mjs). |
| `VITE_THINKPORT_API_PROXY`                          | Recommended | Set to `true` so the browser uses `/api/thinkport/…` instead of calling the API host directly.                              |
| `VITE_THINKPORT_SERVER_PDF`                         | Optional    | Set to `true` for server-side PDF generation (`POST /api/references-pdf`).                                                  |

Do **not** expose credentials as `VITE_*` variables; only the flags above are safe for the client bundle.

Netlify injects **`URL`** / **`DEPLOY_PRIME_URL`** for the live site origin (used when resolving the Venitus logo during server PDF generation).

## Endpoints (after deploy)

**Unified Thinkport proxy** — path after `/api/thinkport` is appended to `https://thinkportapi.netlify.app` (Basic Auth added server-side):

- `POST /api/thinkport/.netlify/functions/references` — case-study listing GraphQL (legacy site path: `POST /api/thinkport-references`).
- `POST /api/thinkport/.netlify/functions/data` — people / data GraphQL (same host as in [`scripts/thinkport-api-client.mjs`](scripts/thinkport-api-client.mjs)).
- `GET /api/thinkport/images/…` — static assets on the API host (legacy: `/api/thinkport-references-media/…`).

**PDF export (implementations):**

- `POST /api/references-pdf` — body: `{ "referenceIds": ["id1", "id2", ...] }` (order preserved). Returns `application/pdf`.

## Local testing

Use the [Netlify CLI](https://docs.netlify.com/cli/get-started/): `netlify dev` (with the same env vars as above). **`pnpm dev`** uses a single Vite proxy: `/api/thinkport/*` → `thinkportapi.netlify.app` (see [`vite.config.js`](vite.config.js)). For **`netlify dev`**, optional **`PUPPETEER_EXECUTABLE_PATH`** can point to a local Chrome/Chromium binary if the bundled serverless Chromium is not suitable on your machine.

## Limits

Server-side PDF uses **Puppeteer** and **@sparticuz/chromium**. Cold starts, memory, and **function timeouts** depend on your Netlify plan; large multi-page exports may need a higher timeout tier or a background function.

After pulling these changes, run **`pnpm install`** so `pnpm-lock.yaml` includes `@sparticuz/chromium` and the explicit `puppeteer-core` dependency.

Redirects target **`/api/...`** from the site root. If you serve the built app under a subpath without rewriting, adjust [`netlify.toml`](netlify.toml) redirects (or keep the site at domain root with `VITE_BASE_PATH=/`).

## GitHub Actions → Netlify (optional)

The [`Deploy to GitHub Pages`](.github/workflows/deploy.yml) workflow can **also** ping a [Netlify build hook](https://docs.netlify.com/configure-builds/build-hooks/) after a successful `build` job (same triggers as Pages: merged PRs to `main`, successful release workflow, manual dispatch).

1. In Netlify: **Site configuration → Build & deploy → Continuous deployment → Build hooks** → create a hook (e.g. branch `main`).
2. In GitHub: **Repository → Settings → Secrets and variables → Actions** → add **`NETLIFY_BUILD_HOOK_URL`** with the full hook URL.

If the secret is unset, the `netlify-build-hook` job is skipped. Do not put the hook URL in the repo or in logs.

## GitHub Pages

The default GitHub Actions deploy remains static: **no** Netlify Functions. Pages that talk to Thinkport keep using the public API URL plus manual Basic Auth unless you add your own proxy.

## Node / CLI scripts

[`scripts/thinkport-api-client.mjs`](scripts/thinkport-api-client.mjs) still defaults to the **direct** API URL with `THINKPORT_API_USERNAME` / `THINKPORT_API_PASSWORD`. To call your deployed site proxy from a trusted server instead, set `THINKPORT_API_URL` to e.g. `https://<your-site>/api/thinkport/.netlify/functions/data` (no Basic Auth in the request; the Netlify function adds it).
