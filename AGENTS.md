# Agent instructions — thinkport.brand

Guidance for coding agents working in this repository (Cursor, Codex, etc.).

## Preview and generated assets

When you change code, templates, or styles that affect **user-visible previews** (embedded iframes, downloadable samples, OG/social images, example PDFs), **update the corresponding preview artifact in the same task**—do not leave stale binaries in the repo.

### How to decide

- If the change touches a **generator script**, **HTML/CSS template** used for print/PDF, or **sample data** shown in examples: run the appropriate `pnpm` script or re-export the file.
- If no script exists, update the **checked-in asset** (e.g. PNG/PDF under `examples/`) manually or add a script if that is the established pattern.

### This repository (non-exhaustive)

| Area | Typical paths | Refresh command / action |
|------|----------------|---------------------------|
| Reference PDF listing / export | `app/js/references-pdf.mjs`, `app/implementations/references-pdf.html`, `assets/templates/references-sample-a4.html` | `pnpm run generate:references:sample-pdf` (updates `examples/references/references-sample.pdf`) |
| Letterhead / portfolio PDFs | Scripts under `scripts/generate-*-pdf*.mjs` | Matching `pnpm run generate:…` |
| OG banners / social previews | `scripts/generate-og-banners.mjs`, `generate-social-preview` | `pnpm run generate:og-banners` / `generate:social-preview` as relevant |
| Cards, avatars, LinkedIn, README headers, iOS posters | Respective `generate:*` scripts | Matching `pnpm run generate:…` or `:samples` variant |

If unsure which command applies, search `package.json` for `generate:` or read the header comment of the edited script.

### Commit expectation

Include regenerated preview files in the **same commit** as the code change when they are tracked in git.
