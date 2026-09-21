# Blake Mitchell's website

Personal website built with Astro. Run `npm install`, then `npm run dev` to preview it locally. Run `npm run build` to check and build the site.

## Git Workflow

This repository follows a standardized Git workflow:

- `dev` = active development branch used by any coding agent or local development session
- `staging` = candidate/review environment  
- `main` = production

### Promotion Flow
`dev` → `staging` → `main`

### Deployment Configuration
- `stage.blake.pm` deploys from `staging`
- `blake.pm` deploys from `main`
- Routine development work on `dev` should not trigger the staging deployment

## Content

- Site name and links: `src/consts.ts`
- Homepage: `src/pages/index.astro`
- Blog posts: `src/content/blog/`
- Contact form: `src/pages/contact.astro`
- Ordinary pages, including About Me and About This Site: `src/content/pages/`
- Privacy: `src/content/legal/privacy.mdx`
- Projects are still theme placeholders, pending a content decision.

## Before publishing

The production canonical address defaults to https://blake.pm; SITE_URL can override it.

The contact form uses a Cloudflare Worker endpoint, Turnstile, D1, and a Discord webhook notification. The production Turnstile site key is integrated; `PUBLIC_TURNSTILE_SITE_KEY` can override it for local testing. See [CONTACT_FORM.md](CONTACT_FORM.md) for the required D1 binding, secrets, migration, local testing, and production verification steps.

Writing supports 16 validated post formats, static format feeds, and optional EchoThread comments. See [POST_TYPES.md](POST_TYPES.md) for frontmatter requirements, feed routes, and the EchoThread build variable.

Original theme attribution is retained in `LICENSE`.

## Atmospheres and surprises

The planet icon opens Themes and Options tabs. Earth is the default. The menu lists Sol through Neptune in distance order, followed by Sagittarius A*, the black-and-white theme. Pluto appears between Neptune and Sagittarius A* only after a successful saucer visit. "Take me to your leader" triggers an immediate visit. A visible page can also trigger one at 11:11:11 AM in the visitor's local time, once per local day. Sleeping devices/background tabs do not replay missed encounters.

After the first successful encounter, Allow surprises appears in the menu. The Undo notification restores the prior palette; Options opens the Options tab, where Allow surprises can be disabled. Notifications dismiss after 12 seconds and pause while hovered or focused. Turning surprises off does not disable a deliberate manual summon. Reset to defaults restores Earth, balanced motion settings, and surprises allowed; it also hides Pluto and Allow surprises until the next visit. Preferences are stored locally in the visitor's browser. Reduced-motion preferences suppress automatic encounters and ambient motion; a manual summon changes the palette without the flight.

At the balanced setting, shooting stars are scheduled every 5–10 seconds, twinkles every 1.2–3 seconds, and slow debris every 30–48 seconds while visible and motion is enabled. The Options sliders can make debris and star events more or less frequent, and the aurora faster or slower. At the highest setting, event intervals are about 9.5 times more frequent than balanced. One debris object appears at a time. The home starfield contains 680 static stars. The [Debris Lab](https://blake.pm/debris-lab) previews the current catalog: satellite, asteroid, Hubble, Webb, Apollo spacecraft, astronaut, and Laika capsule. Shooting-star gradients keep their bright end pointed in the direction of travel.

Run `node tests/atmosphere.cjs` for the preference and scheduling checks. These use a simulated clock and DOM; check the visual flight in the browser as well.

## Visual Editor

For local blog writing and visual content editing:
- Run `npm run editor` in any terminal (macOS, Windows, Linux).
- macOS: Double-click `scripts/start-editor.command`.
- Windows: Double-click `scripts/start-editor.bat`.
- Linux: Run `./scripts/start-editor.sh`.
See [PUBLISHING.md](PUBLISHING.md) for full writing and publishing workflow instructions.

The footer reveals a small build identifier when About This Site is hovered or focused. The same identifier appears on the About This Site page. It uses the UTC build date and seven characters of the Git commit (`YYYY.MM.DD.abcdef0`), so branch and pull-request builds need no shared version counter. Cloudflare Workers Builds supplies the commit SHA; local builds read the current Git commit. A local uncommitted edit will not change the identifier until it is committed.

## Deployment

Cloudflare Workers Builds is connected to `blakemitchell/blake-pm`, production branch `main`. Build: `npm run build`; deploy: `npx wrangler deploy`. `wrangler.jsonc` runs the small contact endpoint and serves `dist/` as static assets on blake.pm and www.blake.pm. No server-rendering adapter is required.

### Optional build notification

The build command runs `astro check`, `astro build`, then `scripts/notify-build.mjs`. Add **`BUILD_NOTIFY_WEBHOOK`** as a **build secret** in Cloudflare **Workers & Pages → blake-pm → Settings → Build → Build Variables and Secrets**. Set its value to the HTTPS URL of the service that should receive the alert. It is read by the build process and is not included in the site or `wrangler.jsonc`. Without this variable, the notification is skipped. A timeout, network error, or non-success HTTP response logs a warning but leaves a successful build successful.

The default request is JSON with `event`, `status`, `site`, `branch`, `commit`, and `timestamp`. If the URL is a Discord webhook, also set **`BUILD_NOTIFY_FORMAT=discord`**; for a Slack incoming webhook, set **`BUILD_NOTIFY_FORMAT=slack`**. Those formats send the service's expected message field. Set the secret on the production build trigger if you only want production alerts. This runs before Cloudflare's separate `wrangler deploy` command, so the alert confirms a successful Astro build, not a completed deployment.
