# Writing and publishing on blake.pm

## Open the editor

The local visual editor runs cross-platform on macOS, Windows, and Linux:

- **macOS**: Double-click `scripts/start-editor.command` in Finder, or run `npm run editor` in Terminal.
- **Windows**: Double-click `scripts/start-editor.bat` in File Explorer, or run `npm run editor` in Command Prompt / PowerShell.
- **Linux**: Run `./scripts/start-editor.sh` or `npm run editor` in your terminal.

A terminal window runs the editor process (keep it open while writing), and your default browser automatically opens http://127.0.0.1:4322/keystatic. If it opens before the server finishes initializing, simply refresh the page.

Alternatively, open the project folder in any command-line environment and run:

```sh
npm run editor
```

## Write a post

1. Open **Blog posts**, then **Create entry**.
2. Enter the title, short description, publication date, and optional tags.
3. Leave **Draft** checked while writing. Use the writing toolbar for headings, lists, links, and images. Images are copied into the site project.
4. Use **Video** for a YouTube URL or a direct HTTPS MP4/WebM URL, or **Audio** for a direct audio-file URL. Large media should live on a media service; images can stay in this project.
5. Save. The title's slug is its address: preview `http://127.0.0.1:4322/blog/your-post-slug`. Drafts can be previewed locally but are excluded from the production build, blog listing, search, and RSS.
6. When ready, clear **Draft** and save again.

Saving changes files in your local project folder. It does not publish immediately. Publication dates label/order posts; they are not a scheduling system.

## Publish

In GitHub Desktop, add the local `blake-pm` repository folder once. Review the changed post and images, enter a short summary such as “Publish my first post,” choose **Commit to main**, then **Push origin**. Cloudflare automatically builds and deploys the pushed version to https://blake.pm.

Or use Terminal in the project folder:

```sh
npm run build
git add src/content/blog public/images/blog
git commit -m "Publish a new post"
git push origin main
```

Create `public/images/blog` first if you have not added images. Only commit the changes you intend to publish. Wait for Cloudflare's deployment to succeed, then check the live post.

You do not need an LLM to write or publish. Keystatic runs locally; no paid CMS account is required. The public build does not include its editor or API routes.

## Contact form

The form uses the site's Cloudflare Worker, Turnstile, D1, and a private Discord webhook. It does not use email or a hosted form service. Complete the one-time Cloudflare and Discord configuration in [CONTACT_FORM.md](CONTACT_FORM.md) before enabling it in production.
