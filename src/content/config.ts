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

export const postSchema = z.discriminatedUnion("post_type", [
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

export const collections = { work, blog, projects, legal }
