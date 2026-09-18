# Contact form setup

The contact page keeps the existing Astro form and submits it to `/api/contact` on the same origin. The repository's existing Cloudflare Worker serves the static `dist/` assets and handles that one API route. A successful request is verified by Turnstile, inserted into D1, and then sent to Discord as a notification. The D1 insert is the durable record; a Discord failure does not discard the submission.

No recipient email address or service credential is sent to the browser. The only public value is the Turnstile site key.

## Changes already in the repository

- `worker/index.js`: validates submissions, verifies Turnstile, writes D1, and notifies Discord.
- `migrations/0001_create_contact_submissions.sql`: creates the D1 table and timestamp index.
- `src/pages/contact.astro`: preserves the current form design and adds Turnstile plus submitting, success, and error states.
- `wrangler.jsonc`: uses the Worker entry point while continuing to serve the Astro build from `dist/`.
- `wrangler.contact.example.jsonc`: shows the D1 binding block without inventing a database ID.

The Worker expects a D1 binding named `CONTACTS_DB` and runtime secrets named `TURNSTILE_SECRET_KEY` and `DISCORD_WEBHOOK_URL`. The production Turnstile site key is public and already integrated into the contact page. `PUBLIC_TURNSTILE_SITE_KEY` remains available as an optional local/test override.

## Manual Cloudflare and Discord setup

1. Create the D1 database:

   ```sh
   npx wrangler login
   npx wrangler d1 create blake-pm-contacts
   ```

2. Bind that database to the `blake-pm` Worker as `CONTACTS_DB`. In the Cloudflare dashboard, open **Workers & Pages → blake-pm → Settings → Bindings → Add → D1 database**, enter `CONTACTS_DB`, and select `blake-pm-contacts`.

   If you prefer configuration as code, copy the `d1_databases` block from `wrangler.contact.example.jsonc` into `wrangler.jsonc`, replace the placeholder with the database ID returned by step 1, and commit that change. D1 database IDs are resource identifiers, not secrets, but this repository deliberately does not invent one.

3. Apply the production schema:

   ```sh
   npx wrangler d1 execute blake-pm-contacts --remote --file=./migrations/0001_create_contact_submissions.sql
   ```

4. The existing Turnstile widget must allow both `blake.pm` and `www.blake.pm`. Its public site key is already integrated into this repository.

5. Add the Turnstile secret as an encrypted Worker secret named `TURNSTILE_SECRET_KEY`. Use the dashboard's **Variables and Secrets** settings, or run:

   ```sh
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

6. In Discord, choose the private channel that should receive contact notifications, open **Edit Channel → Integrations → Webhooks**, create an incoming webhook, and copy its URL. Store it as an encrypted Worker secret named `DISCORD_WEBHOOK_URL`:

   ```sh
   npx wrangler secret put DISCORD_WEBHOOK_URL
   ```

   Never put the webhook URL in an Astro public variable, `.env` file committed to Git, or `wrangler.jsonc`.

7. Confirm the Worker build still uses `npm run build` and deploys with `npx wrangler deploy`. The repository's `main` branch remains the production branch.

## Local testing

Cloudflare publishes Turnstile test site and secret keys in its Turnstile testing documentation. Use those test values locally rather than production secrets.

After adding the real D1 binding block to `wrangler.jsonc`, create `.dev.vars` (which is ignored by Git):

```dotenv
TURNSTILE_SECRET_KEY=YOUR_TURNSTILE_TEST_SECRET
DISCORD_WEBHOOK_URL=YOUR_TEST_DISCORD_WEBHOOK_URL
```

Then build with the public test site key, migrate the local D1 database, and start Wrangler:

```sh
PUBLIC_TURNSTILE_SITE_KEY=YOUR_TURNSTILE_TEST_SITE_KEY npm run build
npx wrangler d1 migrations apply CONTACTS_DB --local
npx wrangler dev --var TURNSTILE_HOSTNAMES:localhost,127.0.0.1
```

Open the local URL printed by Wrangler and submit the contact form. Use a separate test Discord channel if you do not want local messages mixed with production notifications.

## Production verification

Submit one message at `https://blake.pm/contact`. Confirm the success message appears, then check:

1. The Discord channel received a **New Website Contact** embed.
2. D1 contains the durable record:

   ```sh
   npx wrangler d1 execute blake-pm-contacts --remote --command="SELECT id, name, email, created_at, notification_status FROM contact_submissions ORDER BY created_at DESC LIMIT 10;"
   ```

`notification_status = 'sent'` means Discord accepted the notification. A value of `failed` means the form was stored successfully but Discord delivery failed; inspect the Worker's Cloudflare logs using the submission ID. The Worker deliberately does not log the submitted message.

## Security behavior

- Turnstile tokens are verified server-side before storage, including their `contact` action and production hostname.
- Name, email, message length, request size, and field types are validated server-side.
- D1 statements use bound parameters.
- Submission IDs and timestamps are generated by the Worker.
- Discord mentions are disabled through `allowed_mentions` and `@` characters are neutralized in embed values.
- The browser receives short generic errors, never stack traces, D1 errors, webhook details, or secrets.
- Discord failures are logged only with the generated submission ID and remain stored in D1.
