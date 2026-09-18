import type { CollectionEntry } from "astro:content"
import { createEffect, createSignal } from "solid-js"
import Fuse from "fuse.js"
import ArrowCard from "@components/ArrowCard"
import SearchBar from "@components/SearchBar"
import { postSummary, postTitle } from "@lib/posts"

type Props = {
  data: (CollectionEntry<"blog"> | CollectionEntry<"projects">)[]
}

export default function Search({ data }: Props) {
  const [query, setQuery] = createSignal("")
  const [results, setResults] = createSignal<(CollectionEntry<"blog"> | CollectionEntry<"projects">)[]>([])

  const searchable = data.map(entry => ({ entry, text: entry.collection === "blog" ? `${postTitle(entry)} ${postSummary(entry)} ${entry.data.tags.join(" ")}` : `${entry.data.title} ${entry.data.summary} ${entry.data.tags.join(" ")}` }))
  const fuse = new Fuse(searchable, {
    keys: ["entry.slug", "text"],
    includeMatches: true,
    minMatchCharLength: 2,
    threshold: 0.4,
  })

  createEffect(() => {
    if (query().length < 2) {
      setResults([])
    } else {
      setResults(fuse.search(query()).map((result) => result.item.entry))
    }
  })

  const onSearchInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    setQuery(target.value)
  }

  return (
    <div class="flex flex-col">
      <SearchBar onSearchInput={onSearchInput} query={query} setQuery={setQuery} placeholderText="What are you looking for?" />

      {(query().length >= 2 && results().length >= 1) && (
        <div class="mt-12">
          <div class="text-sm uppercase mb-2">
            Found {results().length} results for {`'${query()}'`}
          </div>
          <ul class="flex flex-col gap-3">
            {results().map(result => (
              <li>
                <ArrowCard entry={result} pill={true} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
