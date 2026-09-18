import { config, fields, collection } from '@keystatic/core';
import { block } from '@keystatic/core/content-components';

export default config({
  storage: { kind: 'local' },
  ui: { brand: { name: 'Blake Mitchell — Writing' } },
  collections: {
    posts: collection({
      label: 'Blog posts',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title or editor file name', description: 'Micro, status, and thread posts use this for the file name but do not display it as a title.' } }),
        post_type: fields.select({ label: 'Post type', description: 'Choose the format first, then complete the fields labelled for that format below.', defaultValue: 'article', options: [
          'article','link','quote','micro','video','podcast','photo','bookmark','idea','reading','music','event','status','poll','thread','review'
        ].map(value => ({ label: value.charAt(0).toUpperCase() + value.slice(1), value })) }),
        summary: fields.text({ label: 'Short description', multiline: true, validation: { isRequired: true } }),
        created_at: fields.date({ label: 'Publication date', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
        updated_at: fields.date({ label: 'Updated date' }),
        draft: fields.checkbox({ label: 'Draft — keep off the live site', defaultValue: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags', itemLabel: props => props.value }),
        url: fields.url({ label: 'URL — Link, Bookmark, Video, Podcast, Music, or Review', description: 'Required for Link, Bookmark, Video, Podcast, and Music; optional for Review.' }),
        quote_text: fields.text({ label: 'Quote text — Quote', multiline: true }),
        source_url: fields.url({ label: 'Source URL — Quote' }),
        text: fields.text({ label: 'Short text — Micro, Idea, or Status', multiline: true, description: 'Micro: up to 140 characters. Status: up to 280. Idea: up to 500.' }),
        commentary: fields.text({ label: 'Commentary — Link or Music', multiline: true }),
        caption: fields.text({ label: 'Caption — Video, Podcast, or Photo', multiline: true }),
        images: fields.array(fields.image({ label: 'Image', directory: 'public/images/blog', publicPath: '/images/blog/' }), { label: 'Photo gallery — Photo', description: 'Photo posts require at least one image.', itemLabel: () => 'Image' }),
        media_type: fields.text({ label: 'Media type override — Link', description: 'Usually leave blank. The site detects the media type from the URL automatically.' }),
        metadata: fields.object({
          attribution: fields.text({ label: 'Attribution — Quote' }),
          location: fields.text({ label: 'Location — Photo or Event' }),
          alt: fields.array(fields.text({ label: 'Image description' }), { label: 'Alt text — Photo', description: 'Add descriptions in the same order as the photo gallery.', itemLabel: props => props.value || 'Image description' }),
          author: fields.text({ label: 'Author — Reading' }),
          progress: fields.number({ label: 'Progress — Reading (0–100)', defaultValue: 0, validation: { min: 0, max: 100 } }),
          notes: fields.text({ label: 'Notes — Reading', multiline: true }),
          promoted_to: fields.text({ label: 'Promoted post slug — Idea', description: 'Optional slug of the article this idea became.' }),
          starts_at: fields.datetime({ label: 'Starts — Event', description: 'Required for Event posts.' }),
          ends_at: fields.datetime({ label: 'Ends — Event' }),
          activity: fields.text({ label: 'Activity — Status' }),
          question: fields.text({ label: 'Question — Poll' }),
          options: fields.array(fields.text({ label: 'Option' }), { label: 'Options — Poll', description: 'Polls require at least two options.', itemLabel: props => props.value }),
          posts: fields.array(fields.object({
            text: fields.text({ label: 'Thread entry', multiline: true, validation: { length: { max: 140 } } }),
            created_at: fields.datetime({ label: 'Entry date and time' }),
          }), { label: 'Entries — Thread', description: 'Threads require at least one entry; each entry can contain up to 140 characters.', itemLabel: props => props.fields.text.value || 'Entry' }),
          item: fields.text({ label: 'Item reviewed — Review' }),
          rating: fields.number({ label: 'Rating — Review (0–5)', defaultValue: 0, validation: { min: 0, max: 5 } }),
        }, { label: 'Type-specific details' }),
        content: fields.mdx({
          label: 'Post',
          options: { image: { directory: 'public/images/blog', publicPath: '/images/blog/' } },
          components: {
            Video: block({ label: 'Video', schema: {
              url: fields.url({ label: 'Video URL', description: 'A YouTube link or a direct HTTPS .mp4 or .webm link.', validation: { isRequired: true } }),
              caption: fields.text({ label: 'Caption' }),
            } }),
            Audio: block({ label: 'Audio', schema: {
              url: fields.url({ label: 'Audio file URL', description: 'A direct HTTPS link to an audio file.', validation: { isRequired: true } }),
              caption: fields.text({ label: 'Caption' }),
            } }),
          },
        }),
      },
    }),
  },
});
