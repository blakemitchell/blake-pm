# Blake Mitchell's Website

Personal website built with Astro and deployed at [blake.pm](https://blake.pm).

This repository contains the website application, content, content validation, rendering, and Cloudflare deployment configuration.

Content editing is moving to the separate `blake-pm-cms` project. See [ARCHITECTURE.md](ARCHITECTURE.md) for the project boundary and current migration plan.

## Local Development

Install dependencies:

```sh
npm install
```

Start the local development server:

```sh
npm run dev
```

Run the normal validation and build process:

```sh
npm run build
```

The normal build can send a webhook notification when `BUILD_NOTIFY_WEBHOOK` is configured. See [Build Notification](#build-notification) before using the build command in automated or experimental workflows where external side effects are undesirable.

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

Important content locations:

- Site name and links: `src/consts.ts`
- Homepage: `src/pages/index.astro`
- Blog posts: `src/content/blog/`
- Ordinary pages, including About Me and About This Site: `src/content/pages/`
- Legal content: `src/content/legal/`
- Contact form: `src/pages/contact.astro`
- Astro content definitions and validation: `src/content/config.ts`

Projects are still theme placeholders pending a content decision.

Writing supports 16 validated post formats, static format feeds, and optional EchoThread comments. See [POST_TYPES.md](POST_TYPES.md) for frontmatter requirements, feed routes, and EchoThread configuration.

## Content Editing

The long-term content editing workflow uses the separate `blake-pm-cms` project.

Keystatic edits content stored in this repository as MDX, YAML frontmatter, and assets. Astro independently validates and renders that content.

An older embedded/local Keystatic editor currently remains in this repository while that migration is completed. It can be started with:

```sh
npm run editor
```

Platform-specific launch scripts also remain under `scripts/`.

The embedded editor is transitional and is scheduled for removal. Do not add new functionality to it.

See [PUBLISHING.md](PUBLISHING.md) for writing and publishing workflow information and [ARCHITECTURE.md](ARCHITECTURE.md) for the authoritative architectural direction.

## Contact Form

The contact form uses a Cloudflare Worker endpoint, Turnstile, D1, and a webhook notification.

The production Turnstile site key is integrated. `PUBLIC_TURNSTILE_SITE_KEY` can override it for local testing.

See [CONTACT_FORM.md](CONTACT_FORM.md) for required D1 bindings, secrets, migrations, local testing, and production verification.

## Environment Configuration

### Production

- Worker name: `blake-pm`
- Domains: `blake.pm`, `www.blake.pm`
- D1 database: `blake-pm-contacts`

### Website Staging

- Worker name: `blake-pm-stage`
- Domain: `stage.blake.pm`
- D1 database: `blake-pm-contacts-stage`
- Turnstile hostnames: `blake.pm`, `www.blake.pm`, `stage.blake.pm`

This is the website staging environment. It is separate from the CMS architecture; a permanent staging deployment of `blake-pm-cms` is not currently planned.

### Deployment Commands

Production:

```sh
npm run deploy:prod
```

or:

```sh
npx wrangler deploy
```

Website staging:

```sh
npm run deploy:staging
```

or:

```sh
npx wrangler deploy --env staging
```

## Deployment

Cloudflare Workers Builds is connected to `blakemitchell/blake-pm`, with `main` as the production branch.

Build:

```sh
npm run build
```

Deploy:

```sh
npx wrangler deploy
```

`wrangler.jsonc` runs the small contact endpoint and serves `dist/` as static assets on `blake.pm` and `www.blake.pm`.

No server-rendering adapter is required for the public website.

## Build Notification

The normal build command runs `astro check`, `astro build`, and then `scripts/notify-build.mjs`.

Add `BUILD_NOTIFY_WEBHOOK` as a build secret in Cloudflare **Workers & Pages → blake-pm → Settings → Build → Build Variables and Secrets** to enable notifications.

The value is read by the build process and is not included in the generated site or `wrangler.jsonc`.

Without this variable, notification is skipped. A timeout, network error, or non-success HTTP response logs a warning but leaves an otherwise successful build successful.

The default request is JSON containing:

- `event`
- `status`
- `site`
- `branch`
- `commit`
- `timestamp`

For a Discord webhook, also set:

```text
BUILD_NOTIFY_FORMAT=discord
```

For a Slack incoming webhook, set:

```text
BUILD_NOTIFY_FORMAT=slack
```

The notification occurs before Cloudflare's separate `wrangler deploy` command, so it confirms a successful Astro build rather than a completed deployment.

## Atmospheres and Surprises

The planet icon opens Themes and Options tabs. Earth is the default.

The menu lists Sol through Neptune in distance order, followed by Sagittarius A*, the black-and-white theme. Pluto appears between Neptune and Sagittarius A* only after a successful saucer visit.

"Take me to your leader" triggers an immediate visit. A visible page can also trigger one at 11:11:11 AM in the visitor's local time, once per local day. Sleeping devices and background tabs do not replay missed encounters.

After the first successful encounter, **Allow surprises** appears in the menu.

The Undo notification restores the prior palette. Options opens the Options tab, where Allow surprises can be disabled. Notifications dismiss after 12 seconds and pause while hovered or focused.

Turning surprises off does not disable a deliberate manual summon.

Reset to defaults restores Earth, balanced motion settings, and surprises allowed. It also hides Pluto and Allow surprises until the next visit.

Preferences are stored locally in the visitor's browser. Reduced-motion preferences suppress automatic encounters and ambient motion; a manual summon changes the palette without the flight.

At the balanced setting:

- shooting stars are scheduled every 5–10 seconds;
- twinkles every 1.2–3 seconds;
- slow debris every 30–48 seconds while visible and motion is enabled.

The Options sliders can make debris and star events more or less frequent and the aurora faster or slower. At the highest setting, event intervals are approximately 9.5 times more frequent than balanced.

One debris object appears at a time.

The home starfield contains 680 static stars.

The [Debris Lab](https://blake.pm/debris-lab) previews the current catalog: satellite, asteroid, Hubble, Webb, Apollo spacecraft, astronaut, and Laika capsule.

Shooting-star gradients keep their bright end pointed in the direction of travel.

Run:

```sh
node tests/atmosphere.cjs
```

for preference and scheduling checks. These tests use a simulated clock and DOM. Check the visual flight manually in a browser as well.

## Build Identifier

The footer reveals a small build identifier when About This Site is hovered or focused. The same identifier appears on the About This Site page.

It uses the UTC build date and seven characters of the Git commit:

```text
YYYY.MM.DD.abcdef0
```

Branch and pull-request builds therefore need no shared version counter.

Cloudflare Workers Builds supplies the commit SHA; local builds read the current Git commit. A local uncommitted edit does not change the identifier until it is committed.

## Documentation

The primary project documentation is:

- `README.md` — setup, normal development, and operation.
- `ARCHITECTURE.md` — project boundaries, architectural decisions, and migration direction.
- `PUBLISHING.md` — writing and publishing workflow.
- `POST_TYPES.md` — supported post formats and content requirements.
- `CONTACT_FORM.md` — contact form infrastructure and operations.

When an architectural decision or repository responsibility changes, update `ARCHITECTURE.md` in the same change.

When normal setup, commands, deployment, or developer workflow changes, update this README and any affected specialized documentation.

Original theme attribution is retained in `LICENSE`.