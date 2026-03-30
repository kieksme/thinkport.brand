# AGENT Rules

This document defines the project rules and working conventions for AI agents.

## Communication

- Use gender-neutral language.
- Keep responses concise and in a Gen-Z style when communicating with users.
- Write documentation in English.

## Git and Commit Conventions

- Use Conventional Commits in English.
- Do not create commits unless explicitly requested by the user.
- Do not amend commits unless explicitly requested by the user.

## Configuration and Secrets

- Store credentials in a `.env` file for project configuration.
- Never commit secrets or credential files.

## Implementation Standards

- When adding new props, always:
  - update the corresponding documentation, and
  - adjust the corresponding Type definitions.
- Prefer `pnpm` as the package manager for this project.
- For every new corporate design implementation, always include:
  - an implementation example page aligned with existing implementation pages,
  - tests,
  - and a menu entry/navigation link.

## CLI Script Standard

- Always use shared CLI utilities when creating CLI scripts.
- For this repository, use `scripts/misc-cli-utils.mjs` (`info`, `success`, `warn`, `error`, etc.) instead of raw `console.log`/`console.error` for user-facing CLI output.

