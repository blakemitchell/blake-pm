# Standalone editor plan

The current editor remains part of this repository for now. A future private editor can wrap Keystatic and manage this site plus other Git-backed sites from one always-on desktop machine.

## Intended experience

- The editor starts automatically when the host machine starts.
- A private browser URL opens a dashboard from a laptop on the local network or private VPN.
- The dashboard lists configured sites, repository status, unpublished changes, and running preview servers with their ports.
- Adding a site accepts a GitHub repository URL, a local folder, and a small site manifest that describes its editor command, preview command, build command, content schema, and publish rules.
- Each site can be pulled, edited, previewed, stopped, validated, and published independently.
- Publishing a single entry stages only that entry and its referenced assets, creates a commit, and pushes it. Publishing all changes remains a separate explicit action.

## Credential model

The editor should not store GitHub passwords, personal access tokens, SSH private keys, or Cloudflare credentials. Git operations should use the host account's existing SSH agent or operating-system Git credential manager. The UI can report when authentication is unavailable and direct the owner to configure Git outside the app.

For access from a laptop, bind the service to localhost by default. Remote access should use a private network such as Tailscale or an authenticated reverse proxy. Do not expose an unauthenticated editor directly to the public internet.

## Suggested architecture

1. **Editor service** — a small Node application that owns the site registry, process manager, port allocation, Git commands, and audit log.
2. **Site adapter** — a versioned manifest inside each site repository describing commands, content paths, and Keystatic configuration. This keeps site-specific knowledge with the site.
3. **Browser dashboard** — site cards for pull/status/publish actions plus a Running Sites view showing site name, URL, port, start time, and Stop button.
4. **Process manager** — launch previews as child processes, capture output, prevent duplicate starts, choose from a configured port range, and terminate the full process tree cleanly.
5. **Startup service** — use launchd on macOS, systemd on Linux, or Task Scheduler on Windows. Package this only after the service interface is stable.

## Repository boundary

When extraction begins, create a separate private repository for the editor service. Keep `keystatic.config.ts`, content schemas, and an editor manifest in each managed site repository. The standalone app should orchestrate repositories rather than absorb their site-specific schemas.

This division allows the current `blake-pm` editor to keep working during development and makes another site addable without copying application code.

## Implementation phases

1. Define and validate a site manifest for `blake-pm`.
2. Build the local site registry and Git clone/pull/status functions.
3. Add preview start/stop, port allocation, logs, and the Running Sites view.
4. Add file-scoped commits and pushes using the host's Git credentials.
5. Add local authentication and private-network access.
6. Add operating-system startup packaging and recovery after a reboot.
7. Move the orchestration code to its own repository while leaving each site's schema adapter in place.

The first extraction milestone should support one site end to end before adding generic multi-site configuration.
