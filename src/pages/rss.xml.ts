import rss from "@astrojs/rss"
import { getCollection } from "astro:content"
import { SITE } from "@consts"
import { postDate, postSummary, postTitle, validatePostBody } from "@lib/posts"

type Context = {
  site: string
}

export async function GET(context: Context) {
	const posts = (await getCollection("blog")).map(validatePostBody)
  const projects = await getCollection("projects")

  const items = [...posts, ...projects].filter(item => !item.data.draft)

  items.sort((a, b) => {
    const aDate = a.collection === "blog" ? postDate(a) : a.data.date
    const bDate = b.collection === "blog" ? postDate(b) : b.data.date
    return bDate.getTime() - aDate.getTime()
  })

  return rss({
    title: SITE.TITLE,
    description: SITE.DESCRIPTION,
    site: context.site,
    items: items.map((item) => ({
      title: item.collection === "blog" ? postTitle(item) : item.data.title,
      description: item.collection === "blog" ? postSummary(item) : item.data.summary,
      pubDate: item.collection === "blog" ? postDate(item) : item.data.date,
      link: item.collection === "blog"
        ? `/blog/${item.slug}/`
        : `/projects/${item.slug}/`,
    })),
  })
}
