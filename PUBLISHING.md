# Writing and publishing on blake.pm

## Open the editor

Open https://cms.blake.pm and authenticate through Cloudflare Access and GitHub.
The standalone `blake-pm-cms` application edits this website's GitHub repository.
Choose the intended working branch before editing: saves commit to that branch,
not to a local website folder. Avoid saving to `main` while preparing a change;
changes to `main` can trigger production deployment.

The website no longer provides `npm run editor`, launch scripts, `/keystatic`, or
editor API routes. CMS setup and local CMS development belong to `blake-pm-cms`.
For website previews, check out/pull the branch edited by the CMS in a local
`blake-pm` checkout and run `npm run dev`. Use the URL printed by Astro (normally
http://localhost:4321), not the CMS server's URL.

## Write a post

Posts can use 16 formats, including articles, links, quotes, short notes, media, photos, polls, threads, and reviews. **Article** is the default. Choose **Post type** first; the editor then shows only the fields used by that format. The normal site build enforces the requirements. See [POST_TYPES.md](POST_TYPES.md) for the complete field and feed reference.

1. Open **Blog posts**, then **Create entry**.
2. Choose the post type, then enter its content, short description, publication date, and optional tags. The post-type choice shows the relevant controls for quotes, photos, reading progress, events, statuses, polls, threads, and reviews. The editor title also supplies the file name; formats such as Micro and Status do not display it as a post title.
3. Leave **Draft** checked while writing. Use the writing toolbar for headings, lists, links, and images. Images are committed alongside content in the selected website branch.
4. Use **Video** for a YouTube URL or a direct HTTPS MP4/WebM URL, or **Audio** for a direct audio-file URL. Large media should live on a media service; images can stay in this project.
5. Save, pull the selected branch into your website checkout, and preview `/blog/your-post-slug` on the website dev server. The title's slug is its address; preserve existing slugs when editing. Drafts can be previewed locally but are excluded from the production build, blog listing, search, and RSS.
6. When ready, clear **Draft** and save again.

The editor supports all 16 post types. It includes photo alt text, event start/end times, timestamped thread entries, poll options, reading progress, review details, and the other type-specific metadata. Shared publishing fields and the optional body editor remain available across formats. `npm run build` performs final type-specific validation before publication.

## Edit or create a page

Open **Site pages** in Keystatic. About Me and About This Site are managed there, and you can create additional prose pages with a title, search/sharing description, optional images, and rich text. The file name becomes a root-level address: a page saved as `uses.mdx` is available at `/uses`. The About This Site page has a fixed layout that displays the build identifier after its editable text. Open **Legal pages** to edit Privacy.

To add a page yourself:

1. In **Site pages**, choose **Create entry** and enter a title. The generated file name becomes its URL; for example, “Uses” creates `/uses`.
2. Add a short description, then write the page in the visual body editor. You can insert links, images, video, and audio with its toolbar.
3. Save with **Draft** checked while working. Pull the selected branch into your website checkout and preview `/uses` on the website dev server, replacing `uses` with your page's file name.
4. Clear **Draft**, save, and run `npm run build` before publishing.
5. If you want the new page in the top navigation or footer, edit the links in `src/consts.ts` or ask for help; creating the page does not add a menu item automatically.

Choose a unique file name: do not reuse `contact`, `social`, `blog`, `about-this-site`, or another existing route. About This Site is a special page: edit its existing entry rather than creating a second one. Its content stays visible even if you check Draft, because the footer always links to it. Specialized pages such as Contact, Social, Blog, and the animated home page remain code-driven because their forms, feeds, and visual elements require application logic.

Saving commits content and assets to the selected GitHub branch. Whether that triggers a deployment depends on the branch; `main` deploys production. Publication dates label/order posts; they are not a scheduling system.

## Publish

Review the CMS commits on the selected working branch. Pull them into your
website checkout and run `npm run build` before promotion. The normal build may
send a build notification when configured; use `npx astro check && npx astro build`
for validation without that notification.

Follow the repository workflow: `dev` → `staging` for review, then an approved
promotion to `main`. Cloudflare deploys `main` to https://blake.pm. Inspect both
MDX and uploaded assets in the change; the CMS has already committed them, so
there is no separate local commit step unless you also edited files locally.
Never overwrite newer remote content or resolve a content conflict without review.

After an approved deployment succeeds, check the live page or post. Publication
dates label/order posts; they are not a scheduling system. Article/review bodies
must be nonempty, including drafts, for website validation to pass.

See [CMS-COMPATIBILITY.md](CMS-COMPATIBILITY.md) for dates, supported media URLs,
asset directories, publishing constraints, and the optional cross-repository test.
The website builds and serves stored content without the CMS being available.

## Contact form

The form uses the site's Cloudflare Worker, Turnstile, D1, and a private Discord webhook. It does not use email or a hosted form service. Complete the one-time Cloudflare and Discord configuration in [CONTACT_FORM.md](CONTACT_FORM.md) before enabling it in production.
