## Summary

<!-- Describe the user-visible behavior and outcome of this change. -->

## Context and problem

- **Problem or opportunity:**
- **Affected user or workflow:**
- **Issue, ticket, or reference:**

## Scope

### Included
-

### Out of scope
-

## Technical implementation

- **Affected modules, routes, and components:**
- **Data flow before and after:**
- **Architecture decisions and alternatives considered:**
- **Changed contracts, types, state, or domain behavior:**
- **iOS / Android / web compatibility:**

<!-- Name relevant files, functions, hooks, providers, and services. Explain why this design was chosen. -->

## Data, backend, and security

- **APIs, services, or external dependencies:**
- **Schema changes or migrations:**
- **Authentication, authorization, and RLS:**
- **New or changed environment variables:**
- **Device permissions and personal data handling:**
- [ ] I reviewed the diff for secrets, private tokens, and `service_role` keys.

<!-- If a field does not apply, write N/A and briefly explain. Never include secret values here. -->

## UI and user experience

- **UI changes:**
- **Loading, empty, and error states:**
- **Accessibility and screen reader navigation:**
- **Screenshots or video (Android/iOS/web):**

## Validation

| Check | Result / evidence |
| --- | --- |
| `npm run lint` | |
| `npm run typecheck` | |
| `npm run test` | |
| Manual flow on Android | |
| Manual flow on iOS | |
| Manual flow on web (if applicable) | |
| EAS build / native configuration (if applicable) | |

<!-- If a check was not run, explain why and describe the remaining risk. -->

## Risks and deployment

- **Known risks or edge cases:**
- **Required feature flags or configuration:**
- **Deployment or migration steps:**
- **Rollback plan:**

## Reviewer checklist

- [ ] The PR has a clear scope and contains no unrelated changes.
- [ ] I added or updated tests for changed logic.
- [ ] I updated documentation and example environment variables where needed.
- [ ] I kept `package-lock.json` in sync if dependencies changed.
- [ ] I checked relevant error, loading, and empty states.
- [ ] I reviewed permissions, accessibility, and platform differences.
- [ ] I did not include local files, agent configuration, or credentials.
