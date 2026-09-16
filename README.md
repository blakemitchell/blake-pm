# Blake Mitchell's website

Personal website built with Astro. Run `npm install`, then `npm run dev` to preview it locally. Run `npm run build` to check and build the site.

## Content

- Site name and links: `src/consts.ts`
- Homepage: `src/pages/index.astro`
- Blog posts: `src/content/blog/`
- Contact form: `src/pages/contact.astro`
- Projects are still theme placeholders, pending a content decision.

## Before publishing

The production canonical address defaults to https://blake.pm; SITE_URL can override it.

The contact form is intentionally disabled until a message-delivery service is configured. Set `PUBLIC_CONTACT_FORM_URL` to its public HTTPS form submission URL and rebuild. Configure the recipient privately in that service; do not put recipient addresses or API secrets in this repository or public environment variables. Verify delivery and the service's success/error behavior before publishing. The visitor's name, email, and message will be sent to that service.

A factual Privacy page describes local preferences and the currently disabled contact form. Update it when enabling message delivery or analytics.

Original theme attribution is retained in `LICENSE`.

## Atmospheres and surprises

The planet icon opens Themes and Options tabs. Midnight is the default; Deep Space is monochrome, with Eclipse, Aurora, and softened Lunar Day as alternatives. Follow system appearance is optional and maps dark to Midnight and light to Lunar Day. "Take me to your leader" triggers an immediate saucer visit. A visible page can also trigger one at 11:11:11 AM in the visitor's local time, once per local day. Sleeping devices/background tabs do not replay missed encounters.

After the first successful encounter, Allow surprises appears in the menu. The Undo notification restores the prior palette or system setting; Options opens the Options tab, where Allow surprises can be disabled. Notifications dismiss after 12 seconds and pause while hovered or focused. Turning surprises off does not disable a deliberate manual summon. Reset to defaults restores Midnight, motion enabled, and surprises allowed while retaining the record of a previous encounter. Preferences are stored locally in the visitor's browser. Reduced-motion preferences suppress automatic encounters and ambient motion; a manual summon changes the palette without the flight.

Shooting stars occur every 17–32 seconds, twinkles every 6–12 seconds, and slow satellites/rocks on varied paths every 45–85 seconds while visible and motion is enabled.

Run `node tests/atmosphere.cjs` for the preference and scheduling checks. These use a simulated clock and DOM; check the visual flight in the browser as well.

## Deployment

Cloudflare Workers Builds is connected to `blakemitchell/blake-pm`, production branch `main`. Build: `npm run build`; deploy: `npx wrangler deploy`. `wrangler.jsonc` serves `dist/` as static assets on blake.pm and www.blake.pm. No server-rendering adapter is required.
