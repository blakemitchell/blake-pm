import type { CollectionEntry } from "astro:content"

export type BlogEntry = CollectionEntry<"blog">

export function postDate(post: BlogEntry) { return post.data.updated_at ?? post.data.created_at }
export function postTitle(post: BlogEntry) {
  const data = post.data
  if ("title" in data && data.title) return data.title
  if (data.post_type === "quote") return `Quote${data.metadata.attribution ? ` — ${data.metadata.attribution}` : ""}`
  if (data.post_type === "poll") return data.metadata.question
  return data.post_type.charAt(0).toUpperCase() + data.post_type.slice(1)
}
export function postSummary(post: BlogEntry) {
  if (post.data.summary) return post.data.summary
  const data = post.data
  if ("text" in data) return data.text
  if (data.post_type === "quote") return data.quote_text
  if ("caption" in data && data.caption) return data.caption
  if ("commentary" in data && data.commentary) return data.commentary
  if (data.post_type === "poll") return data.metadata.question
  return `${postTitle(post)} — ${data.post_type} post`
}
export function detectMediaType(url?: string) {
  if (!url) return undefined
  const host = new URL(url).hostname.replace(/^www\./, "")
  if (/youtu\.be|youtube\.com/.test(host)) return "youtube"
  if (/vimeo\.com/.test(host)) return "vimeo"
  if (/spotify\.com/.test(host)) return "spotify"
  if (/soundcloud\.com/.test(host)) return "soundcloud"
  if (/podcasts\.apple\.com/.test(host)) return "apple-podcasts"
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return "video-file"
  if (/\.(mp3|m4a|ogg|wav)(\?|$)/i.test(url)) return "audio-file"
  if (/\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url)) return "image"
  return "web"
}
export function validatePostBody(post: BlogEntry) {
  if (["article", "review"].includes(post.data.post_type) && !post.body.trim()) {
    throw new Error(`${post.data.post_type} post "${post.slug}" requires Markdown or MDX body content`)
  }
  return post
}
export function domainFor(url: string) { return new URL(url).hostname.replace(/^www\./, "") }
