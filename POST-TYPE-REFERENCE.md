# Post discovery and content reference

Reviewed 2026-10-11 on `feature/post-type-discovery`, branched from `main` at
`65c90ef`. That baseline already includes website PR #36. The reviewed work is
prepared for promotion through `dev` into `staging`; the publishing workflow, URLs,
and standalone CMS are unchanged. The privacy-page date was corrected to a
CMS-compatible date-only value; its legal text is unchanged. This report describes
the implementation and local validation, not a deployment.

## Original behavior and cause

Both `src/pages/index.astro` and `src/pages/blog/index.astro` explicitly filtered
posts to **article and review**. The other 14 supported types were excluded:
link, quote, micro, video, podcast, photo, bookmark, idea, reading, music, event,
status, poll, and thread. This was an explicit editorial restriction in code,
not a CMS serialization or rendering failure. Specialized format feeds exist,
but there is no evidence that the restriction should govern an “All Posts” Blog
or Recent Posts under the current requirements.

The existing published `just-playing-around` and `an-ai-image` photo entries
therefore had working detail pages but could not appear in either listing.
`ArrowCard` already handled every post type through `postTitle` and `postSummary`;
there was no missing photo-card renderer. Cards are compact text/date/tag links,
not miniature versions of the individual post renderers.

| Behavior | Original | Updated |
| --- | --- | --- |
| Homepage eligible types | Article, review | All 16 supported types |
| Homepage limit | Hardcoded `.slice(0,3)` | Seven, named `RECENT_POST_LIMIT` in `src/lib/posts.ts` |
| Blog eligible types | Article, review | All 16 supported types |
| Blog limit | None; no pagination | Unchanged |
| Drafts | Excluded on both listings, even in development | Unchanged |
| Future-dated posts | Included if not a draft; dates do not schedule publication | Unchanged |
| Sort | Newest `updated_at ?? created_at` first | Unchanged, shared `publishedPosts` helper |
| Equal dates | Stable source order; no explicit tie-breaker | Unchanged |
| Filters | Blog text search + multi-select tags + sort direction | Adds multi-select Post Type between Search and Tags |
| Missing description | Authored fallback or generated “Title — type post” | Authored fallback or no description |

Validation still calls `validatePostBody` before excluding drafts: even draft
articles/reviews need a nonempty body for a successful build. That publishing
constraint is unchanged. Detail pages allow draft previews in development;
production detail pages, RSS, and global search exclude drafts.

## Filter behavior and display

Blog options are derived from the actual Zod discriminated-union variants in
`src/content/config.ts`, not a second handwritten list. All supported types are
available even if a type currently has no posts. Projects reuse SearchCollection
without post-type controls.

Multi-select uses native checkboxes without dependencies. Selecting
Photo and Video matches **either** type; text search and selected tags must also
match. Tags retain their existing **all selected tags** behavior. No selected
types means all types. “All types” resets only the type selection; “Clear filters”
clears search, tags, and types, retaining the chosen sort direction. Search remains
case-insensitive substring matching across the card title, effective description,
and tags. It does not search the full MDX body or arbitrary metadata. Global
`/search` remains its separate Solid/Fuse implementation.

Controls use keyboard-operable native disclosures and labeled checkboxes, with
fieldset/legend grouping and the existing live result count. Without JavaScript,
all published Blog cards remain server-rendered and visible. The desktop sidebar
and mobile layout are retained. Post Type and Tags start collapsed, showing All
(or selection counts), an expand arrow, and a “Select multiple” hint. Checkboxes
appear only when expanded; options scroll within a bounded panel. Clicking or
tabbing away closes an open panel after 15 seconds; returning the pointer or
keyboard focus cancels the timer. Escape closes immediately. Closing preserves
selections. “All tags” resets only the tag selection.

## Post-type inventory

All rows use the same homepage and Blog card: date, title/fallback label, optional
authored description, tags, and a link to `/blog/<slug>`. Homepage shows only the
newest seven; Blog shows all eligible entries before interactive filtering. Neither
listing requires an image, summary, or type-specific article metadata. The table's
“card content” column applies to **both** listings. An explicitly authored summary
always takes precedence over the listed fallback text.

| Type | Purpose / appropriate example | Homepage and Blog card content without summary | Individual-page renderer |
| --- | --- | --- | --- |
| article | Long-form writing; a guide to building an Astro site | Required title; no invented excerpt | `ArticlePost`: MDX body; page header adds reading time |
| link | Share a URL with context; commentary on an interesting essay | Optional title or “Link”; commentary if present | `LinkPost`: destination/domain/media card, commentary, MDX |
| quote | Attribute a quotation; a passage from a book | Optional title, else “Quote — attribution”/“Quote”; quote text | `QuotePost`: blockquote, attribution, optional source |
| micro | Brief note; “Finished the migration” | “Micro”; required short text | `MicroPost`: text and creation date |
| video | Share a video; a recorded talk | Optional title or “Video”; caption if present | `VideoPost`: video renderer plus MDX |
| podcast | Share an episode; a direct MP3 or Spotify episode | Optional title or “Podcast”; caption if present | `PodcastPost`: Spotify embed, supported direct audio, or outbound listen link; MDX |
| photo | Publish a photo/gallery; a landscape image | Optional title or “Photo”; caption if present | `PhotoPost`: gallery, ordered alt text, caption/location, MDX |
| bookmark | Save a resource; an API reference | Optional title or “Bookmark”; no invented description | `BookmarkPost`: destination/domain card; no MDX body |
| idea | Capture a thought; a possible future article topic | Optional title or “Idea”; idea text | `IdeaPost`: idea text and label; promotion slug is stored but not linked |
| reading | Track a book; progress through a biography | Required title; no invented description (notes are not an automatic summary) | `ReadingPost`: progress, author, notes, MDX |
| music | Share a track/album; a Spotify release | Optional title or “Music”; commentary if present | `MusicPost`: Spotify embed or listen link, commentary, MDX |
| event | Announce an event; a meetup time/location | Required title; no invented description | `EventPost`: start time, location, MDX; end time is stored but not displayed |
| status | Share current activity; “Working on the garden” | “Status”; status text | `StatusPost`: status dot, text, activity |
| poll | Present choices; “Which trail next?” | Optional title or question; question (not repeated under identical detail heading) | `PollPost`: question/options and static-preview notice; no voting backend |
| thread | A sequence of short entries; observations from a trip | Optional title or “Thread”; no invented description | `ThreadPost`: ordered entries with optional timestamps |
| review | Evaluate something; a book review | Required title; no invented description | `ReviewPost`: stars/numeric rating, MDX, optional related link; item name is stored but not separately displayed |

Micro and status titles are stripped by Astro's variant schemas; the CMS title
still supplies their filenames. Thread titles **are** retained and displayed by
`postTitle`, despite the CMS label claiming thread titles are only filenames.
All detail pages also use the shared title/date/header and optional comments.
Quote, micro, bookmark, idea, status, poll, and thread intentionally do not render
supplemental MDX. This task does not change those detail-page decisions.

## Fields shared by every post

Producer source: `blake-pm-cms/keystatic.config.ts`, `collections.posts.schema`.
Consumer source: `blake-pm/src/content/config.ts` and `src/lib/posts.ts`.
“Required” below means validation enforces a value, not just that a control exists.
Empty optional CMS URLs/dates serialize as omitted keys. Optional text generally
starts empty; optional arrays start empty. There is no cross-repository schema import
in the website build.

| Field | Purpose | Shared/unique | CMS required | Website required | Default / renderer use |
| --- | --- | --- | --- | --- | --- |
| `title` / entry slug | Display title and stable filename/URL | All | Yes: name and slug | Nonempty title for article, reading, event, review; optional for other title-bearing variants; stripped for micro/status | Slug generated from title, editable in CMS. Website fallback is type label, quote attribution, or poll question. Preserve existing slug to preserve URLs |
| `format.discriminant` | Select post format | All | Select always has a value | Recognized type required after normalization | CMS `article`; consumer also accepts legacy `post_type` |
| `format.value` | Holds selected type's fields | All | Controls vary by type | Normalized into direct fields and `metadata`; required child fields vary | Empty object for article; per-type controls below |
| `summary` | Short description | All | **Yes**, multiline text | **No**, optional string for every type | No website default; authored fallback or omission. CMS rule remains unchanged |
| `created_at` | Publication date | All | Yes, date only | Yes, coercible date | CMS today; no website default. Required for sorting/date/RSS |
| `updated_at` | Update date | All | No, date only | No | Absent; when supplied replaces creation date for common display, sort, and RSS date |
| `draft` | Publication visibility | All | Checkbox always boolean | No, defaulted | CMS true; website false for legacy missing flags. Never drop an explicit draft flag |
| `tags[]` | Discovery labels | All | No; tag text may be empty | No, defaults to `[]` | Empty array. Cards, search, filters |
| `content` / MDX body | Rich authored content | All | No native required-body validator | `validatePostBody` requires nonempty body for article/review, including drafts | Empty body for others allowed; only body-rendering formats show it |

There is **no featured-image field** and no shared image requirement. Photo
`images` is type-specific. Body images are optional MDX uploads under
`public/images/blog/<slug>/`; they do not become card thumbnails or social images.
`BaseHead` has an optional image prop, but the blog route does not supply it.

## Format-specific fields

Stored CMS paths below are relative to `format.value`. Unchanged names map to
same-named direct consumer fields unless a `metadata.*` destination is shown.
All listed optional fields are safe to omit for rendering. No optional field has
a nonempty website default unless explicitly stated.

| Field / types | Purpose / consumer destination | Shared/unique | CMS required | Website required | Default / rendering notes |
| --- | --- | --- | --- | --- | --- |
| `url`: link, video, podcast, bookmark, music | Destination/media URL → `url` | Several | Yes | Yes, URL string | No default; destination/rendering depends on it |
| `url`: review | Related URL → `url` | Several | No | No, URL if present | Absent; optional related link |
| `commentary`: link, music | Context → `commentary` | Several | No | No | Empty/absent; description fallback and detail text |
| `media_type`: link | Detection override → `media_type` | Link editor only | No | No | Automatic detection when absent; used by LinkPost |
| `quote_text`: quote | Quoted passage → `quote_text` | Unique | Yes | Yes, nonempty | No default; description fallback and quotation |
| `source_url`: quote | Source link → `source_url` | Unique | No | No, URL if present | Absent; optional link |
| `attribution`: quote | Author/source → `metadata.attribution` | Unique | No | No | Empty/absent; recommended, used in fallback title/detail |
| `text`: micro | Short post → `text` | Several text formats | Yes, max 140 chars | Yes, 1–140 chars | No default; displayed text and description fallback |
| `text`: idea | Idea → `text` | Several text formats | Yes, max 500 chars | Yes, 1–500 chars | No default; displayed text and description fallback |
| `text`: status | Current status → `text` | Several text formats | Yes, max 280 chars | Yes, 1–280 chars | No default; displayed text and description fallback |
| `caption`: video, podcast, photo | Description → `caption` | Several | No | No | Empty/absent; description fallback and detail text |
| `images[]`: photo | Uploaded gallery → `images` | Unique | At least one, every upload required | At least one string | No populated default; image URLs resolved under public assets; consumer does not check file existence |
| `alt[]`: photo | Ordered descriptions → `metadata.alt` | Unique | No | No, string array if present | Empty/absent; renderer uses matching alt, then caption, then empty alt. Strongly recommended for meaningful photos |
| `location`: photo | Place → `metadata.location` | Shared name with event | No | No | Empty/absent; detail text |
| `promoted_to`: idea | Related future article slug → `metadata.promoted_to` | Unique | No | No | Empty/absent; stored, not currently linked by renderer |
| `author`: reading | Book author → `metadata.author` | Unique | No | No | Empty/absent; detail text |
| `progress`: reading | Percentage → `metadata.progress` | Unique | Yes, 0–100 | Yes, number 0–100 | CMS 0; no website default; progress renderer assumes a number |
| `notes`: reading | Reading notes → `metadata.notes` | Unique | No | No | Empty/absent; detail text, not searched unless copied into summary |
| `starts_at`: event | Start datetime → `metadata.starts_at` | Unique | Yes | Yes, coercible date | No default; renderer calls Date methods |
| `ends_at`: event | End datetime → `metadata.ends_at` | Unique | No | No | Absent; stored, not currently shown |
| `location`: event | Venue → `metadata.location` | Shared name with photo | No | No | Empty/absent; detail text |
| `activity`: status | Activity label → `metadata.activity` | Unique | No | No | Empty/absent; detail label |
| `question`: poll | Prompt → `metadata.question` | Unique | Yes | Yes, nonempty | No default; title/description fallback and poll heading |
| `options[]`: poll | Choices → `metadata.options` | Unique | At least two nonempty options | At least two nonempty strings | Empty initially, invalid until filled; static display only |
| `posts[]`: thread | Sequence → `metadata.posts` | Unique | At least one entry | At least one entry | Empty initially, invalid until filled |
| `posts[].text`: thread | Entry text → `metadata.posts[].text` | Unique nested field | Yes, max 140 chars | Yes, 1–140 chars | No default; displayed text |
| `posts[].created_at`: thread | Entry timestamp → `metadata.posts[].created_at` | Unique nested field | No | No | Absent; omit time display when absent |
| `item`: review | Item name → `metadata.item` | Unique | No | No | Empty/absent; stored, not displayed separately |
| `rating`: review | Rating → `metadata.rating` | Unique | Yes, 0–5 | Yes, number 0–5 | CMS 0; no website default; renderer rounds stars but displays numeric value |

Article has no format-specific fields; its title/body are the meaningful content.
CMS `datetime` values are serialized as timestamps, unlike shared date-only fields.
The existing event/thread renderer formats them in the build host's time zone;
there is no per-event time-zone field or scheduling logic. Date-only displays use UTC.

The consumer also accepts legacy `post_type`, top-level `media_type`, and normalized
`metadata` directly. Generic metadata records are not additional CMS fields. The generic-record
variants are article, link, micro, video, podcast, bookmark, and music. Other variants validate their specific metadata shapes.
Unknown object keys are stripped by Zod; arbitrary extras are not an authoring API.

### Rich body component fields

Both `Audio` and `Video` blocks have a required CMS `url` and optional `caption`.
They serialize as named, import-free MDX components, mapped by `MdxContent.astro`.
They have no separate frontmatter Zod schema: their renderer validates/recognizes
URLs. Use HTTPS direct audio for Audio; HTTPS MP4/WebM or supported YouTube/Vimeo
links for Video. CMS generic URL validation does not enforce those media/provider
restrictions. Body Markdown image alt text is optional in the editor and recommended
for accessibility. No title, featured image, rating, or date is required per block.

## Short descriptions: requirements and consumers

All 16 CMS types require `collections.posts.schema.summary` at
`blake-pm-cms/keystatic.config.ts` (the “Short description” field). All 16 Astro
variants already accept missing `summary` through the shared `common` schema.
There was no website validation rule to relax and no CMS file was changed.

`postSummary` now selects the first nonblank authored value in this order:
summary → text → quote text → caption → commentary → poll question. It trims the
chosen value. This preserves useful content without synthesizing a description or
extracting raw MDX (which could contain component/import syntax). If none exists:

- `ArrowCard` omits the description element; title/date/tags/link remain.
- Blog filter text and Solid global search use title/tags without “undefined”.
- The detail-page header omits its summary paragraph.
- Standard description, Open Graph description, and Twitter description meta tags
  are omitted. Title, canonical URL, and the remaining social metadata remain.
- RSS omits the optional item description; title/link/date still form a valid item.

A description can improve search relevance and social previews, but those benefits
are not a technical requirement. Clients may generate their own excerpt when a
meta description is absent. This task does not promise an automatic body excerpt.
Ordinary site-page `description` and project `summary` requirements are outside the
post-type task and remain unchanged.

## Requirement analysis and recommendations

| Requirement | Current reason / technical necessity | Change needed and owner | Effect on existing content / priority |
| --- | --- | --- | --- |
| Every post needs CMS summary | Editorial uniformity; website rendering does not require it | BLA-100/BLA-101: remove `isRequired` from standalone `collections.posts.schema.summary`; website support is complete here | Existing summaries retain precedence; new posts may omit them. **Essential authoring follow-up** |
| CMS title for every format | Combined name/slug field gives filenames; only four website variants require a title | CMS: evaluate separate slug/name UX or deterministic labels for short/media posts. Website: keep meaningful fallback titles; change the four strict schemas only if their design changes | Preserve existing slugs to avoid broken URLs. **Optional**, especially for photo/micro/status; do not remove slug uniqueness |
| Article/review body including drafts | Website intentionally rejects empty long-form content; no native format-dependent CMS validator | Website: if incomplete drafts should save/build, revise validation policy separately. CMS: clarify or add supported validation/authoring guidance | Existing content unaffected; publication safeguards need explicit replacement. **Optional**, not changed here |
| Featured image | No such shared field or requirement exists | No change needed in either repo | Do not introduce one just to render a listing |
| Photo gallery with at least one image | Essential content of a photo post; renderer needs usable references | Retain requirement in both; optionally validate referenced file availability in the website | Existing uploads remain valid; **retain** |
| Photo alt descriptions | Optional, renderer can emit empty alt; not all meaningful photos should be decorative | CMS: improve per-image alt UX or recommend descriptions; website: retain accessible rendering and consider pairing alt/image objects only in a coordinated migration | Existing parallel arrays must retain ordering. **Recommended accessibility enhancement**, not a summary substitute |
| Required media/destination URLs | Essential for outbound cards/players and `new URL` calls | Retain for URL-based types; making optional needs guarded alternate renderers plus both schemas | Empty URLs currently fail validation. **Retain**; improve CMS help for supported HTTPS media |
| Required reading progress | Progress UI assumes number; 0 currently conflates “not started” and “unspecified” | Both: allow omission and hide progress UI when absent; do not silently default unknown progress | Existing 0 remains an explicit 0. **Optional authoring improvement** |
| Required review rating | Star UI assumes numeric rating; text-only reviews could be meaningful | Both: optional schema/control and conditionally render rating; keep body/title validation | Existing ratings unchanged; absent must not render as zero stars. **Optional** |
| Required publication date | Needed for listing order, date display, and RSS | Retain; CMS supplies today. Any alternative needs an explicit source of date and both contracts | Preserve historical dates/URLs. **Retain** |
| Event start datetime | Event UI calls `toISOString` and displays start | Retain unless supporting undated events with a distinct display; both schemas/renderers would change | No need to alter existing dates. **Retain** |
| Quote/short text, poll choices, thread entries | These are the content payload rather than article-style boilerplate | Retain minimum payload requirements in both | Avoid empty cards/detail pages. **Retain** |
| Stored-only item, end time, promotion slug | Not required; controls imply more functionality than renderers provide | Website: optionally display/link them; CMS: clarify help. Correct thread-title help separately | Rendering additions should preserve existing semantics. **Optional** |

No existing metadata requirement is made optional speculatively in this change.
The essential website fixes are discovery and safe missing-description rendering;
CMS summary relaxation belongs to BLA-100/BLA-101. Neither issue was edited here.

## Verification and limits

`npm run test:posts` uses the existing esbuild dependency and Node assertions,
without adding a test framework or package. It checks all schema variants, homepage
eligibility/limit, draft exclusion, unchanged future-date behavior and update-date
ordering; it runs the real collection browser handlers in a small DOM harness for
type selection, combined search/tags, clear/sort/count/empty states, and project
compatibility, delayed disclosure closure, cancellation on return, and retained
selections. An isolated Astro fixture build asserts all 16 Blog cards, actual
seven-post homepage output (including a photo), controls/order, missing descriptions,
metadata omission, RSS, global search, and draft exclusion. Fixtures never modify
source content and are removed after the run.

Validation results on 2026-10-11:

| Check | Result |
| --- | --- |
| `npm run test:posts` | Passed, including isolated production fixtures for all 16 types and description-free posts |
| `BUILD_NOTIFY_WEBHOOK= npm run build` | Passed; Astro check: 69 files, zero errors/warnings/hints; 25 production pages |
| `node tests/atmosphere.cjs` | Passed |
| `node tests/contact-worker.mjs` | Passed, including mocked D1/notification failure scenarios; no real notifications sent |
| `git diff --check` | Passed |
| `npm run test:cms` | Passed: 178 assertions covering all 16 formats, pages, legal, media, and uploaded assets after privacy date correction |
| Browser production preview | Both published photo posts appear on home and Blog; Photo + general tag + “AI Image” search returns one result; clear restores five; updated disclosures start collapsed; multiple selections work; both panels close after 15 seconds away and retain selection counts |

The original CMS-suite failure came from baseline privacy metadata:
`date: "2026-09-16T12:00:00Z"`. The standalone CMS uses required `fields.date`
for legal pages, so this value is now `date: "2026-09-16"`. The legal text and all
other metadata are unchanged. No standalone CMS changes were needed.

Browser checks used the local production preview, not live production. The current
repository has five published posts, so the seven-post maximum and eligibility of
all 16 types were tested with fixtures as well as the real two photo posts. Real
external audio/video playback and live CMS editing were not re-tested. Promotion targets `dev` → `staging`; no production deployment or publishing-workflow changes are part of this task.
