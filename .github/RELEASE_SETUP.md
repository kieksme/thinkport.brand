# Release Setup Instructions

## Initial Release Setup

**Important:** release-please requires an existing release to work properly. You need to create an initial release manually before the automated workflow can function.

### Step 1: Create and push the initial tag

```bash
git tag v0.1.0
git push origin v0.1.0
```

### Step 2: Create the initial release on GitHub

1. Go to the repository on GitHub
2. Navigate to "Releases" → "Draft a new release"
3. Select tag `v0.1.0`
4. Add release title: "v0.1.0 - Initial Release"
5. Add release notes (you can use the content from RELEASE_README.md template)
6. Click "Publish release"

### Step 3: Verify the release

After publishing, verify that:

- The release appears in the Releases section
- The tag `v0.1.0` is visible
- The `.release-please-manifest.json` file contains `".": "0.1.0"`

## Future Releases

Once the initial release is set up, release-please will:

- Automatically create release PRs when you push to `main` (if there are changes)
- You can merge the release PR to create a new release
- The `release.yml` workflow will automatically package and upload all assets
- The [`deploy.yml`](workflows/deploy.yml) workflow deploys GitHub Pages (and optionally pings Netlify via build hook) when that GitHub Release is **published** — not on every merge to `main`

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) so Release Please can group changes in `CHANGELOG.md`. Changelog sections are configured in [`release-please-config.json`](../release-please-config.json) (`changelog-sections`) and match the PR templates under [`.github/PULL_REQUEST_TEMPLATE/`](PULL_REQUEST_TEMPLATE/) (e.g. `feat`, `fix`, `docs`, `test`, `deps`).

Default **semver** bumps with Release Please’s default versioning strategy:

- **Breaking** (`feat!:`, `fix!:`, or `BREAKING CHANGE` footer) → major (or minor while pre-1.0 if `bump-minor-pre-major` were set)
- **`feat:`** (and `feature:`) → minor (patch while pre-1.0 if `bump-patch-for-minor-pre-major` is set)
- **All other conventional types** in use here (`fix:`, `docs:`, `test:`, `deps:`, `chore:`, `ci:`, `build:`, `refactor:`, `perf:`, `style:`, `revert:`) → **patch**

Use **`feat(docs):`** when you intentionally want a **minor** bump for a documentation-only change (same as any `feat:`).

Examples:

- `feat: Add new logo variant` — minor bump; listed under Features
- `fix: Update color palette` — patch bump; listed under Bug Fixes
- `docs: Clarify Netlify env vars` — patch bump; listed under Documentation
- `deps: Bump puppeteer-core` — patch bump; listed under Dependencies
- `feat!: Remove deprecated export` — major bump (subject to pre-1.0 rules above)

### Forcing a Release for Existing `docs:` Commits

If you have already made `docs:` commits and want to trigger a release, you can create an empty commit with `Release-As:`:

```bash
git commit --allow-empty -m "chore: release 0.2.0" -m "Release-As: 0.2.0"
git push origin main
```

This will create a release PR for the specified version.

## Troubleshooting

### "Could not resolve to a node with the global id of 'PR_...'" (after deleting releases)

This happens when Release Please tries to add a label to a Pull Request that no longer exists (e.g. after you deleted releases and the associated Release PR was closed or deleted).

**Fix:**

1. **Create one release again** so Release Please has a baseline:
   - Create tag `v0.15.0` (or whatever version is in `.release-please-manifest.json`):  
     `git tag v0.15.0 && git push origin v0.15.0`
   - In GitHub: **Releases** → **Draft a new release** → choose that tag → Publish.
2. **Close any open Release Please PRs** (e.g. "chore(main): release X.Y.Z") so the next run creates a fresh one instead of updating a stale reference.
3. **Re-run the Release Please workflow** (Actions → Release Please → Run workflow) or push a new commit to `main`.

### Commit parsing errors

- This is normal for the initial setup before the first release exists
- Create the initial release manually as described above
- Future releases will work automatically

### JSON parsing errors

- Ensure `.release-please-manifest.json` is valid JSON
- The file should contain: `{ ".": "0.1.0" }`
- No trailing commas or extra characters

### Private Repository Setup

For private repositories, you need to use a Personal Access Token (PAT) instead of the default `GITHUB_TOKEN`:

1. **Create a Personal Access Token:**
   - Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Give it a name (e.g., "Release Please Token")
   - Select scopes: `repo` (full control of private repositories)
   - Generate and copy the token

2. **Add the token as a repository secret:**
   - Go to your repository settings
   - Navigate to "Secrets and variables" > "Actions"
   - Click "New repository secret"
   - Name: `RELEASE_PLEASE_TOKEN`
   - Value: Paste your PAT
   - Click "Add secret"

3. **Update the workflow** to use the PAT:

   ```yaml
   - uses: googleapis/release-please-action@v4
     with:
       config-file: release-please-config.json
       token: ${{ secrets.RELEASE_PLEASE_TOKEN }}
   ```

## Non-Technical Release Notes With Copilot CLI

The `Release Please` workflow now rewrites generated release notes for non-technical readers before publishing them to GitHub Releases.

- Source: raw Release Please release body
- Rewrite tool: `@github/copilot` in GitHub Actions
- Result: plain-language markdown focused on value and impact
- Fallback: if Copilot rewrite fails, original Release Please notes remain in place

### Token Behavior

Copilot CLI in GitHub Actions requires:

- `COPILOT_GITHUB_TOKEN` (recommended as repository secret)

If this secret is missing, the workflow skips rewriting and keeps the original Release Please notes as fallback.

### Release Notes Source Of Truth

`release.yml` keeps updating release assets and README-based notes, but it now skips note overwrites when it detects the Copilot marker:

`<!-- rewritten-by-copilot-cli -->`

This ensures rewritten non-technical notes are not replaced later in the release pipeline.
