# Issue tracker: Exponential

Exponential is the issue tracker for this repository. Use the `exponential` CLI for ticket and feature operations, with `--json` when machine-readable output is useful.

## Repository coordinates

No Exponential workspace or product is configured in this checkout. Do not guess either value. Ask the user to choose a workspace and product before creating tickets or listing a product's tickets. `/start-ticket` can still fetch a ticket when the user supplies its CUID or short ID.

Once the CLI is installed and authenticated, record the selected workspace and product here and set the CLI's default workspace with `exponential workspaces set-default <workspace-slug>`.

## Ticket lifecycle

- Ticket workflow: `BACKLOG` → `NEEDS_REFINEMENT` or `READY_TO_PLAN` → `IN_PROGRESS` → `QA` → `DONE`.
- `/start-ticket` moves a ticket to `IN_PROGRESS` after checking out its branch.
- `/ship-ticket` links the pull request and moves it to `QA`.
- Moving a ticket from `QA` to `DONE` requires a separately configured merge hook.
- Triage roles map to statuses as documented in `.agents/skills/setup-matt-pocock-skills/issue-tracker-exponential.md`.
