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
        post_type: fields.select({ label: 'Post type', defaultValue: 'article', options: [
          'article','link','quote','micro','video','podcast','photo','bookmark','idea','reading','music','event','status','poll','thread','review'
        ].map(value => ({ label: value.charAt(0).toUpperCase() + value.slice(1), value })) }),
        summary: fields.text({ label: 'Short description', multiline: true, validation: { isRequired: true } }),
        created_at: fields.date({ label: 'Publication date', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
        updated_at: fields.date({ label: 'Updated date' }),
        draft: fields.checkbox({ label: 'Draft — keep off the live site', defaultValue: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags', itemLabel: props => props.value }),
        url: fields.url({ label: 'URL', description: 'Required for link, bookmark, video, podcast, and music posts.' }),
        quote_text: fields.text({ label: 'Quote text', multiline: true }),
        source_url: fields.url({ label: 'Quote source URL' }),
        text: fields.text({ label: 'Short text', multiline: true, description: 'Micro: 140 characters. Status: 280. Idea: 500.' }),
        commentary: fields.text({ label: 'Commentary', multiline: true }),
        caption: fields.text({ label: 'Caption', multiline: true }),
        images: fields.array(fields.image({ label: 'Image', directory: 'public/images/blog', publicPath: '/images/blog/' }), { label: 'Photo gallery', itemLabel: () => 'Image' }),
        metadata: fields.object({
          attribution: fields.text({ label: 'Quote attribution' }),
          location: fields.text({ label: 'Location' }),
          author: fields.text({ label: 'Author' }),
          progress: fields.number({ label: 'Reading progress (0–100)', defaultValue: 0, validation: { min: 0, max: 100 } }),
          notes: fields.text({ label: 'Notes', multiline: true }),
          starts_at: fields.text({ label: 'Event date and time (ISO format)' }),
          rating: fields.number({ label: 'Review rating (0–5)', defaultValue: 0, validation: { min: 0, max: 5 } }),
          question: fields.text({ label: 'Poll question' }),
          options: fields.array(fields.text({ label: 'Option' }), { label: 'Poll options', itemLabel: props => props.value }),
          posts: fields.array(fields.object({ text: fields.text({ label: 'Thread entry', multiline: true }) }), { label: 'Thread entries', itemLabel: props => props.fields.text.value || 'Entry' }),
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
