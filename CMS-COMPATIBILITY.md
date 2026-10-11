# Standalone CMS content contract (BLA-51 / BLA-52)

`blake-pm-cms/keystatic.config.ts` is the authoritative producer. The website's
`src/content/config.ts`, post normalization, and Astro renderers are the consumer.
The website builds without a CMS checkout, running editor, or CMS credentials.
BLA-52 removes the embedded editor while retaining `normalizeEditorPost` and the
BLA-51 rendering fixes.

## Findings and fixes

The two Keystatic collection schemas were identical before this audit; their
storage differed (local versus GitHub). Comparing them alone missed these issues:

| Discrepancy | Impact | Fix |
| --- | --- | --- |
| Current post/page routes rendered MDX without named component mappings; an older layout had mappings but was not the current blog path | CMS-produced Audio/Video blocks fail when rendered | Shared `MdxContent.astro` maps `Audio`/`Video` to the website components in every active body renderer and both page routes |
| Privacy frontmatter used a quoted timestamp while the legal editor expects a date | Existing entry fails Keystatic date validation | Store `2026-09-16`; displayed date and `/legal/privacy` are unchanged |
| Slug fields permitted an empty display name with a manually supplied slug | Empty titles could violate required Astro titles | Require names in both transitional producer configs |
| Reading progress/review rating had defaults but were clearable | Cleared values are omitted and violate required consumer numbers | Require those fields, retaining defaults and ranges |
| Photo array required one entry but permitted an empty image entry | Null/omitted image fails Astro image-array validation | Require each image |
| Legal MDX images used default colocated storage | No explicit public URL contract; unlike posts/pages, assets could require build-time relative-image handling | Use `public/images/legal` with `/images/legal/` |

No content or URL migration is needed beyond the privacy date representation.
BLA-51 applied the producer fixes to both configurations. BLA-52 removes the
website copy; `blake-pm-cms` retains all producer fixes and is now the sole owner.

## Stored contracts

- Posts: `src/content/blog/<slug>.mdx`; pages: `src/content/pages/<slug>.mdx`;
  legal: `src/content/legal/<slug>.mdx`. The collection called `posts` in the CMS
  is called `blog` in Astro. Keep existing slugs when editing to preserve URLs.
- Posts use `format: { discriminant, value }`, **not** new top-level per-format
  fields. Astro's existing preprocessing maps this into `post_type`, direct fields,
  and `metadata`. All 16 discriminants have consumers. Legacy normalized posts
  remain accepted by Astro, but this does not make legacy-only fields editable
  in Keystatic. All current blog entries already use `format`.
- Publication/update/legal dates are `YYYY-MM-DD`. Keystatic writes YAML dates;
  Astro coerces them to `Date`, and `formatDate` uses UTC so date-only values do
  not shift a day on a Chicago-time build. Quoted date-only values also work.
  Event/thread fields are datetime inputs; Keystatic serializes their wall-clock
  value as a UTC YAML timestamp. They do not store an author-selected time zone.
  Event/thread display currently uses the build host's local time zone. Keep this
  existing distinction; do not change datetime semantics as part of editor removal.
- Empty optional URLs/dates serialize as absent keys, not null or empty strings.
  This matches Astro `.optional()` fields. Empty text, empty tags, numeric zero,
  and absent photo alt text have supported rendering paths.
- CMS summary/description validation is stricter than the blog consumer's optional
  summary. New posts/pages default to drafts. Astro accepts older posts without a
  draft flag as published; always preserve the producer's explicit flag.
- MDX blocks serialize as `<Audio url="https://…" caption="…" />` and
  `<Video url="https://…" caption="…" />`, without imports. Caption is optional.
  Use direct HTTPS audio, HTTPS MP4/WebM, or supported YouTube/Vimeo URLs. The
  generic CMS URL field does not enforce these provider/protocol restrictions.
  Unsupported video displays “Video unavailable”; unsupported audio produces no
  player. Remote playback/availability is not guaranteed by a successful build.
- Only posts/pages expose these custom blocks; legal pages expose normal MDX.
  Quote, micro, bookmark, idea, status, poll, and thread formats intentionally
  render their structured fields instead of the supplemental MDX body. Article,
  link, video, podcast, photo, reading, music, event, and review render the body.
- Public asset roots are `public/images/blog`, `public/images/pages`, and
  `public/images/legal`. Keystatic appends the entry slug: an upload references
  `/images/pages/<slug>/<filename>`, with the file stored under the matching
  public directory. Photo galleries follow the same slug convention. Commit
  assets together with MDX. Astro copies public assets directly; these are not
  imported `ImageMetadata` objects or optimized `src/assets` imports.
- `projects` and `work` are website collections outside the standalone editor's
  scope. Keep their consumer schemas and project rendering in BLA-52.

## Existing publishing constraints

Article/review bodies must be nonempty, as the editor description states. The
website enforces this in `validatePostBody` (including drafts); native Keystatic
MDX has no format-dependent required-body validation. An empty saved article or
review therefore still fails the publishing build. This is an existing authoring
constraint, not a dependency on the embedded editor. Do not remove this check as
part of BLA-52; a different draft/publishing policy is separate work.

`about-this-site` is a required entry rendered by a dedicated route, which always
renders it, even if its draft flag is set. Other page drafts are excluded from
production. Avoid slugs occupied by static site routes such as `contact` or
`social`; those routes take precedence. Legal pages have no draft field.

## Reproducible verification

Install each repository's locked dependencies, then run from the website:

```sh
npm run test:cms
# Or specify another checkout of the producer:
npm run test:cms -- /absolute/path/to/blake-pm-cms
npx astro check
npx astro build
```

Run `npm run build` in the standalone CMS as well. The website check/build commands
intentionally bypass `scripts/notify-build.mjs`, avoiding external notifications.

The compatibility script loads the **standalone** configuration, uses Keystatic's
published editor field parse/validate/serialize APIs, and exercises its reader
against every existing managed entry. It creates a temporary site with serialized
fixtures for every post format, ordinary and special pages, legal content, and
real image bytes. It builds with the retired `KEYSTATIC_LOCAL=true` flag and
`TZ=America/Chicago`, verifying that the flag no longer activates an editor,
then asserts rendered content, metadata, dates, media players/providers, gallery
alt text, RSS, draft exclusion, and emitted asset files. Temporary content is
removed in `finally`; the source collections are untouched. No new test framework
or package dependencies are required. The script resolves Keystatic and its YAML serializer from the standalone
checkout, not the website dependency tree. Only this optional integration check
requires both repositories; normal checks/builds are independent.

Validation on 2026-10-10: website Astro check (69 files, no diagnostics), existing
site build (23 pages), standalone CMS check/build, and the fixture suite (176 assertions) passed.
The CMS build emits an existing large-client-chunk advisory. After BLA-52, a clean
website dependency install, `BUILD_NOTIFY_WEBHOOK= npm run build` (69 files with
no diagnostics, 23 pages), the standalone CMS build, and the atmosphere/contact
regression scripts also passed. A localhost production preview served home,
ordinary/special pages, blog, legal, search, and RSS with HTTP 200; `/keystatic`,
`/keystatic/`, `/api/keystatic`, and `/api/keystatic/tree` returned 404. Browser
verification confirmed that typing “relaunch” in Solid search returns the existing
post and that opening it renders its body, metadata, and date.

## BLA-52 removal and verification

The website no longer has `keystatic.config.ts`, the Keystatic/React integrations
or direct dependencies, `npm run editor`, or the four editor launch scripts.
Astro output is always static; the editor-only cache configuration and generated
editor/API routes are gone. The lockfile prunes 120 package entries without
changing versions of retained packages. A clean `npm ci` and `npm ls` confirmed
that Keystatic, the React integration/runtime, and React types are absent.

Content collections, post normalization, MDX mappings, dynamic routes, feeds,
Solid search, and asset paths are retained. The obsolete editor orchestration
proposal is removed, and architecture/publishing documentation points to the
standalone GitHub-backed editor. No website build step contacts that application.

The BLA-51 contract constraints above continue to apply; editor removal does not
change draft policy, media-provider support, datetime display, or required bodies.
The combined changes are ready for review subject to the live smoke test below.

A live smoke test remains: authenticate to the standalone CMS, choose a disposable
branch, edit an existing entry, create representative content, upload an image,
and verify the committed MDX/assets and preview. This audit did not exercise
GitHub OAuth, branch permissions, GitHub writes, the deployed CMS version, broad
cross-browser visual layout, or actual external audio/video playback. No production configuration,
infrastructure, credentials, deployment, or remote content was changed.
