# Developer Workflow

## Branch Policy

- `dev` is the normal working branch for Claude Code, Codex, or any other coding agent.
- `staging` receives approved development changes and may also receive future content edits from Keystatic.
- `main` represents production.

## Normal Workflow

1. **Before beginning work on `dev`**: Fetch from origin and incorporate the latest `origin/staging`.
2. **Before promoting `dev` into `staging`**: Fetch again and incorporate the latest `staging` changes.
3. **Never force-push** over remote content changes.
4. **Never silently resolve merge conflicts** involving content files.
5. If a content conflict occurs, stop and explain both versions before resolving it.
6. **Do not merge or push to `main`** unless explicitly instructed.
7. **Do not assume a branch belongs to a specific coding agent**; multiple agents may work through `dev`.

## Notes

- Routine development work on `dev` should not trigger the staging deployment.
- The staging build will eventually be served from `https://stage.blake.pm`
- Production builds deploy from the `main` branch to `blake.pm`

## Testing

- See [TESTING.md](TESTING.md) for setup, coverage, integration limits, and baseline review.
- Run `npm run lint` after changes to authored JS, TS, TSX, Astro, tests, or tooling. Fix or accurately report findings; `lint:fix` is explicit opt-in, never part of builds or commits.
- Run `npm run test:e2e:types` and relevant Playwright specs while editing; run `npm run test:e2e` before submitting UI changes, including the mobile/browser matrix.
- Keep existing Node/CMS tests. Run `BUILD_NOTIFY_WEBHOOK= npm run build` and checks appropriate to the change; `tests/shared-atmosphere.mjs` requires the build output.
- Playwright intercepts contact/external integrations; never replace those mocks with production submissions or bypass Turnstile.
- Never automatically update visual baselines to fix a failure. Inspect artifacts, distinguish site/test/environment failures, and report executed passes, failures, skips, and environment limitations accurately. Never claim an unexecuted check passed.
