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

Posts can use 16 formats, including articles, links, quotes, short notes, media, photos, polls, threads, and reviews. **Article** is the default. Choose **Post type** first; the editor then shows only the fields used by that format. The normal site build enforces the requirements. See [POST_TYPES.md](POST_TYPES.md) for the complete field and feed reference.

1. Open **Blog posts**, then **Create entry**.
2. Choose the post type, then enter its content, short description, publication date, and optional tags. The post-type choice shows the relevant controls for quotes, photos, reading progress, events, statuses, polls, threads, and reviews. The editor title also supplies the file name; formats such as Micro and Status do not display it as a post title.
3. Leave **Draft** checked while writing. Use the writing toolbar for headings, lists, links, and images. Images are copied into the site project.
4. Use **Video** for a YouTube URL or a direct HTTPS MP4/WebM URL, or **Audio** for a direct audio-file URL. Large media should live on a media service; images can stay in this project.
5. Save. The title's slug is its address: preview `http://127.0.0.1:4322/blog/your-post-slug`. Drafts can be previewed locally but are excluded from the production build, blog listing, search, and RSS.
6. When ready, clear **Draft** and save again.

The editor supports all 16 post types. It includes photo alt text, event start/end times, timestamped thread entries, poll options, reading progress, review details, and the other type-specific metadata. Shared publishing fields and the optional body editor remain available across formats. `npm run build` performs final type-specific validation before publication.

## Edit or create a page

Open **Site pages** in Keystatic. About Me and About This Site are managed there, and you can create additional prose pages with a title, search/sharing description, optional images, and rich text. The file name becomes a root-level address: a page saved as `uses.mdx` is available at `/uses`. The About This Site page has a fixed layout that displays the build identifier after its editable text. Open **Legal pages** to edit Privacy.

To add a page yourself:

1. In **Site pages**, choose **Create entry** and enter a title. The generated file name becomes its URL; for example, “Uses” creates `/uses`.
2. Add a short description, then write the page in the visual body editor. You can insert links, images, video, and audio with its toolbar.
3. Save with **Draft** checked while working. Preview at `http://127.0.0.1:4322/uses`, replacing `uses` with your page's file name.
4. Clear **Draft**, save, and run `npm run build` before publishing.
5. If you want the new page in the top navigation or footer, edit the links in `src/consts.ts` or ask for help; creating the page does not add a menu item automatically.

Choose a unique file name: do not reuse `contact`, `social`, `blog`, `about-this-site`, or another existing route. About This Site is a special page: edit its existing entry rather than creating a second one. Its content stays visible even if you check Draft, because the footer always links to it. Specialized pages such as Contact, Social, Blog, and the animated home page remain code-driven because their forms, feeds, and visual elements require application logic.

Saving changes files in your local project folder. It does not publish immediately. Publication dates label/order posts; they are not a scheduling system.

## Publish

In GitHub Desktop, add the local `blake-pm` repository folder once. Review the changed files, enter a short summary, and commit them on your working branch. Push that branch and open a pull request into `main`. Review and merge it when ready; Cloudflare deploys from `main` to https://blake.pm. Saving in the editor writes local files; committing records them in Git; pushing sends the commit to GitHub. A plain `git push origin main` does not send uncommitted edits.

Or use Terminal in the project folder:

```sh
npm run build
git add src/content/blog src/content/pages src/content/legal public/images/blog
git commit -m "Publish a new post"
git push -u origin HEAD
```

Only add paths that exist and that you intend to publish. Open and merge a pull request into `main` on GitHub, wait for Cloudflare's deployment to succeed, then check the live page or post. If you are already working directly on `main`, the push deploys immediately; check the current branch before publishing.

You do not need an LLM to write or publish. Keystatic runs locally; no paid CMS account is required. The public build does not include its editor or API routes.

The longer-term multi-site desktop editor direction is documented in [EDITOR_APP_PLAN.md](EDITOR_APP_PLAN.md).

## Contact form

The form uses the site's Cloudflare Worker, Turnstile, D1, and a private Discord webhook. It does not use email or a hosted form service. Complete the one-time Cloudflare and Discord configuration in [CONTACT_FORM.md](CONTACT_FORM.md) before enabling it in production.
