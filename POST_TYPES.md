# Post types

Posts remain Markdown or MDX files in `src/content/blog`. The `post_type` frontmatter field selects one of 16 validated formats. `created_at`, `tags`, and `metadata` are shared; each type then validates its own required fields during the normal Astro build.

| Type | Required content |
| --- | --- |
| `article` | `title` and Markdown/MDX body |
| `link` | `url` |
| `quote` | `quote_text` |
| `micro` | `text` of at most 140 characters |
| `video` | `url` |
| `podcast` | `url` |
| `photo` | one or more `images` |
| `bookmark` | `url` |
| `idea` | `text` of at most 500 characters |
| `reading` | `title` and `metadata.progress` from 0–100 |
| `music` | `url` |
| `event` | `title` and `metadata.starts_at` |
| `status` | `text` of at most 280 characters |
| `poll` | `metadata.question` and at least two `metadata.options` |
| `thread` | one or more `metadata.posts`, each at most 140 characters |
| `review` | `title`, `metadata.rating` from 0–5, and Markdown/MDX body |

Optional `updated_at`, `media_type`, `summary`, and `draft` fields are shared. URL-based renderers detect YouTube, Vimeo, Spotify, SoundCloud, Apple Podcasts, direct audio/video/image files, and ordinary web links at build time. Add a `media_type` only when an override is needed.

Static feeds are available at `/blog`, `/micro`, `/links`, `/media`, `/quotes`, and `/photos`. Every post still has a canonical detail page at `/blog/[slug]`.

## EchoThread comments

The domain-scoped `blake.pm` EchoThread site key is integrated into the component. `PUBLIC_ECHOTHREAD_API_KEY` remains available as a local/test override. Each discussion uses the stable identifier `post-[slug]` so its comments remain grouped if the canonical URL changes. The widget follows the active atmosphere through the site’s `--surface` and `--accent` variables. Leave **Widget theme** set to **Automatic** in the EchoThread dashboard.
