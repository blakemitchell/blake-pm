import { defineCollection, z } from "astro:content"

const work = defineCollection({
  type: "content",
  schema: z.object({
    company: z.string(),
    role: z.string(),
    dateStart: z.coerce.date(),
    dateEnd: z.union([z.coerce.date(), z.string()]),
  }),
})

const postTypes = ["article", "link", "quote", "micro", "video", "podcast", "photo", "bookmark", "idea", "reading", "music", "event", "status", "poll", "thread", "review"] as const
export type PostType = typeof postTypes[number]

const common = {
  tags: z.array(z.string()).default([]),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().optional(),
  media_type: z.string().optional(),
  summary: z.string().optional(),
  draft: z.boolean().default(false),
}
const url = z.string().url()
const text = z.string().min(1)

const normalizedPostSchema = z.discriminatedUnion("post_type", [
  z.object({ ...common, post_type: z.literal("article"), title: text, metadata: z.record(z.unknown()).default({}) }),
  z.object({ ...common, post_type: z.literal("link"), title: z.string().optional(), url, commentary: z.string().optional(), metadata: z.record(z.unknown()).default({}) }),
  z.object({ ...common, post_type: z.literal("quote"), title: z.string().optional(), quote_text: text, source_url: url.optional(), metadata: z.object({ attribution: z.string().optional() }).default({}) }),
  z.object({ ...common, post_type: z.literal("micro"), text: text.max(140), metadata: z.record(z.unknown()).default({}) }),
  z.object({ ...common, post_type: z.literal("video"), title: z.string().optional(), url, caption: z.string().optional(), metadata: z.record(z.unknown()).default({}) }),
  z.object({ ...common, post_type: z.literal("podcast"), title: z.string().optional(), url, caption: z.string().optional(), metadata: z.record(z.unknown()).default({}) }),
  z.object({ ...common, post_type: z.literal("photo"), title: z.string().optional(), images: z.array(z.string()).min(1), caption: z.string().optional(), metadata: z.object({ location: z.string().optional(), alt: z.array(z.string()).optional() }).default({}) }),
  z.object({ ...common, post_type: z.literal("bookmark"), title: z.string().optional(), url, metadata: z.record(z.unknown()).default({}) }),
  z.object({ ...common, post_type: z.literal("idea"), title: z.string().optional(), text: text.max(500), metadata: z.object({ promoted_to: z.string().optional() }).default({}) }),
  z.object({ ...common, post_type: z.literal("reading"), title: text, metadata: z.object({ progress: z.number().min(0).max(100), notes: z.string().optional(), author: z.string().optional() }) }),
  z.object({ ...common, post_type: z.literal("music"), title: z.string().optional(), url, commentary: z.string().optional(), metadata: z.record(z.unknown()).default({}) }),
  z.object({ ...common, post_type: z.literal("event"), title: text, metadata: z.object({ starts_at: z.coerce.date(), location: z.string().optional(), ends_at: z.coerce.date().optional() }) }),
  z.object({ ...common, post_type: z.literal("status"), text: text.max(280), metadata: z.object({ activity: z.string().optional() }).default({}) }),
  z.object({ ...common, post_type: z.literal("poll"), title: z.string().optional(), metadata: z.object({ question: text, options: z.array(text).min(2) }) }),
  z.object({ ...common, post_type: z.literal("thread"), title: z.string().optional(), metadata: z.object({ posts: z.array(z.object({ text: text.max(140), created_at: z.coerce.date().optional() })).min(1) }) }),
  z.object({ ...common, post_type: z.literal("review"), title: text, url: url.optional(), metadata: z.object({ rating: z.number().min(0).max(5), item: z.string().optional() }) }),
])

function normalizeEditorPost(input: unknown) {
  if (!input || typeof input !== "object" || !("format" in input)) return input

  const { format, ...shared } = input as Record<string, any>
  if (!format || typeof format !== "object" || typeof format.discriminant !== "string") return input

  const post_type = format.discriminant
  const value = format.value && typeof format.value === "object" ? format.value : {}
  const metadata: Record<string, unknown> = {}
  const direct: Record<string, unknown> = {}

  switch (post_type) {
    case "link":
      Object.assign(direct, { url: value.url, commentary: value.commentary, media_type: value.media_type })
      break
    case "quote":
      Object.assign(direct, { quote_text: value.quote_text, source_url: value.source_url })
      metadata.attribution = value.attribution
      break
    case "micro":
      direct.text = value.text
      break
    case "video":
    case "podcast":
      Object.assign(direct, { url: value.url, caption: value.caption })
      break
    case "photo":
      Object.assign(direct, { images: value.images, caption: value.caption })
      Object.assign(metadata, { location: value.location, alt: value.alt })
      break
    case "bookmark":
      direct.url = value.url
      break
    case "idea":
      direct.text = value.text
      metadata.promoted_to = value.promoted_to
      break
    case "reading":
      Object.assign(metadata, { author: value.author, progress: value.progress, notes: value.notes })
      break
    case "music":
      Object.assign(direct, { url: value.url, commentary: value.commentary })
      break
    case "event":
      Object.assign(metadata, { starts_at: value.starts_at, ends_at: value.ends_at, location: value.location })
      break
    case "status":
      direct.text = value.text
      metadata.activity = value.activity
      break
    case "poll":
      Object.assign(metadata, { question: value.question, options: value.options })
      break
    case "thread":
      metadata.posts = value.posts
      break
    case "review":
      direct.url = value.url
      Object.assign(metadata, { item: value.item, rating: value.rating })
      break
  }

  return { ...shared, ...direct, post_type, metadata }
}

export const postSchema = z.preprocess(normalizeEditorPost, normalizedPostSchema)

const blog = defineCollection({ type: "content", schema: postSchema })

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
    demoUrl: z.string().optional(),
    repoUrl: z.string().optional(),
  }),
})

const legal = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
})

const pages = defineCollection({
  type: "content",
  schema: z.object({
    title: text,
    description: text,
    draft: z.boolean().default(true),
    updated_at: z.coerce.date().optional(),
  }),
})

export const collections = { work, blog, projects, legal, pages }
