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