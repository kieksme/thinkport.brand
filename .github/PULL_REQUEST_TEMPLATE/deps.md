---
name: Dependencies
about: Dependency updates (deps:)
---

## Summary

<!-- Which packages changed and why (security, compatibility, feature)? -->

## Commits

Use **`deps:`** or **`deps(scope):`**, e.g. `deps: bump puppeteer-core`.

Release Please lists **`deps:`** commits under **Dependencies** in `CHANGELOG.md` (see `changelog-sections` in `release-please-config.json`); they follow the usual **patch** bump unless a `feat:` / breaking commit is also in the release.

## Checklist

- [ ] `pnpm-lock.yaml` updated; install is reproducible
- [ ] Build and tests pass after the bump
