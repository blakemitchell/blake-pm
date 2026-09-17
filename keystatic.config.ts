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
        title: fields.slug({ name: { label: 'Title' } }),
        summary: fields.text({ label: 'Short description', multiline: true, validation: { isRequired: true } }),
        date: fields.date({ label: 'Publication date', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
        draft: fields.checkbox({ label: 'Draft — keep off the live site', defaultValue: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags', itemLabel: props => props.value }),
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
