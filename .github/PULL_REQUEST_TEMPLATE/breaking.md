---
name: Breaking change
about: Incompatible change (feat!:, fix!:, or BREAKING CHANGE in footer)
---

## Summary

<!-- What breaks for consumers and what should they do instead? -->

## Migration

<!-- Steps, version bump expectation, or links to upgrade notes -->

## Commits

Use **`feat!:`** / **`fix!:`** or a footer:

```text
feat!: rename export path for brand bundle

BREAKING CHANGE: consumers must update import from X to Y.
```

## Checklist

- [ ] Breaking nature is explicit in commits and in this description
- [ ] Release / changelog impact understood (major bump with Release Please)
