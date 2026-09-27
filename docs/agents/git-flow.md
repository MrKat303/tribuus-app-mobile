---
trunk: main
featureBase: main
deployTrigger: main
promotionChain:
  - main
---

# Git flow for this repo

**Model**: trunk-based (inferred from the current `main` checkout and local remote-tracking branches; verify the GitHub default branch when access is available).

**Promotion chain**: `main`

- **featureBase** (`main`) — new feature pull requests target this branch.
- **deployTrigger** (`main`) — merge-triggered ticket completion automation targets this branch.

## How skills use this file

- `/start-ticket` creates new ticket branches from `origin/main`.
- `/ship-ticket` targets `main` when opening pull requests.
- A merge hook must be configured separately before tickets can be promoted automatically from `QA` to `DONE`.
