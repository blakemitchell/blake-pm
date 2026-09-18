import { config, fields, collection } from '@keystatic/core';
import { block } from '@keystatic/core/content-components';

const postTypeOptions = [
  'article','link','quote','micro','video','podcast','photo','bookmark','idea','reading','music','event','status','poll','thread','review'
].map(value => ({ label: value.charAt(0).toUpperCase() + value.slice(1), value }));

const postFormat = fields.conditional(
  fields.select({
    label: 'Post type',
    description: 'The editor only shows the fields used by the selected format.',
    defaultValue: 'article',
    options: postTypeOptions,
  }),
  {
    article: fields.object({}, { label: 'Article details', description: 'Write the article in the Post body editor below.' }),
    link: fields.object({
      url: fields.url({ label: 'URL', validation: { isRequired: true } }),
      commentary: fields.text({ label: 'Commentary', multiline: true }),
      media_type: fields.text({ label: 'Media type override', description: 'Usually leave blank; the site detects this automatically.' }),
    }, { label: 'Link details' }),
    quote: fields.object({
      quote_text: fields.text({ label: 'Quote text', multiline: true, validation: { isRequired: true } }),
      source_url: fields.url({ label: 'Source URL' }),
      attribution: fields.text({ label: 'Attribution' }),
    }, { label: 'Quote details' }),
    micro: fields.object({
      text: fields.text({ label: 'Text', multiline: true, validation: { isRequired: true, length: { max: 140 } } }),
    }, { label: 'Micro post details' }),
    video: fields.object({
      url: fields.url({ label: 'Video URL', validation: { isRequired: true } }),
      caption: fields.text({ label: 'Caption', multiline: true }),
    }, { label: 'Video details' }),
    podcast: fields.object({
      url: fields.url({ label: 'Podcast URL', validation: { isRequired: true } }),
      caption: fields.text({ label: 'Caption', multiline: true }),
    }, { label: 'Podcast details' }),
    photo: fields.object({
      images: fields.array(fields.image({ label: 'Image', directory: 'public/images/blog', publicPath: '/images/blog/' }), {
        label: 'Photo gallery', itemLabel: () => 'Image', validation: { length: { min: 1 } },
      }),
      caption: fields.text({ label: 'Caption', multiline: true }),
      location: fields.text({ label: 'Location' }),
      alt: fields.array(fields.text({ label: 'Image description' }), {
        label: 'Alt text', description: 'Add descriptions in the same order as the photo gallery.', itemLabel: props => props.value || 'Image description',
      }),
    }, { label: 'Photo details' }),
    bookmark: fields.object({
      url: fields.url({ label: 'URL', validation: { isRequired: true } }),
    }, { label: 'Bookmark details' }),
    idea: fields.object({
      text: fields.text({ label: 'Idea', multiline: true, validation: { isRequired: true, length: { max: 500 } } }),
      promoted_to: fields.text({ label: 'Promoted post slug', description: 'Optional slug of the article this idea became.' }),
    }, { label: 'Idea details' }),
    reading: fields.object({
      author: fields.text({ label: 'Author' }),
      progress: fields.number({ label: 'Progress (0–100)', defaultValue: 0, validation: { min: 0, max: 100 } }),
      notes: fields.text({ label: 'Notes', multiline: true }),
    }, { label: 'Reading details' }),
    music: fields.object({
      url: fields.url({ label: 'Track or album URL', validation: { isRequired: true } }),
      commentary: fields.text({ label: 'Commentary', multiline: true }),
    }, { label: 'Music details' }),
    event: fields.object({
      starts_at: fields.datetime({ label: 'Starts', validation: { isRequired: true } }),
      ends_at: fields.datetime({ label: 'Ends' }),
      location: fields.text({ label: 'Location' }),
    }, { label: 'Event details' }),
    status: fields.object({
      text: fields.text({ label: 'Status', multiline: true, validation: { isRequired: true, length: { max: 280 } } }),
      activity: fields.text({ label: 'Activity' }),
    }, { label: 'Status details' }),
    poll: fields.object({
      question: fields.text({ label: 'Question', validation: { isRequired: true } }),
      options: fields.array(fields.text({ label: 'Option', validation: { isRequired: true } }), {
        label: 'Options', itemLabel: props => props.value, validation: { length: { min: 2 } },
      }),
    }, { label: 'Poll details' }),
    thread: fields.object({
      posts: fields.array(fields.object({
        text: fields.text({ label: 'Thread entry', multiline: true, validation: { isRequired: true, length: { max: 140 } } }),
        created_at: fields.datetime({ label: 'Entry date and time' }),
      }), {
        label: 'Entries', itemLabel: props => props.fields.text.value || 'Entry', validation: { length: { min: 1 } },
      }),
    }, { label: 'Thread details' }),
    review: fields.object({
      item: fields.text({ label: 'Item reviewed' }),
      rating: fields.number({ label: 'Rating (0–5)', defaultValue: 0, validation: { min: 0, max: 5 } }),
      url: fields.url({ label: 'Related URL' }),
    }, { label: 'Review details', description: 'Write the review in the Post body editor below.' }),
  }
);

const richTextComponents = {
  Video: block({ label: 'Video', schema: {
    url: fields.url({ label: 'Video URL', description: 'A YouTube link or a direct HTTPS .mp4 or .webm link.', validation: { isRequired: true } }),
    caption: fields.text({ label: 'Caption' }),
  } }),
  Audio: block({ label: 'Audio', schema: {
    url: fields.url({ label: 'Audio file URL', description: 'A direct HTTPS link to an audio file.', validation: { isRequired: true } }),
    caption: fields.text({ label: 'Caption' }),
  } }),
};

export default config({
  storage: { kind: 'local' },
  ui: { brand: { name: 'Blake Mitchell — Writing' } },
  collections: {
    posts: collection({
      label: 'Blog posts', slugField: 'title', path: 'src/content/blog/*', format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title or editor file name', description: 'Micro, status, and thread posts use this for the file name but do not display it as a title.' } }),
        format: postFormat,
        summary: fields.text({ label: 'Short description', multiline: true, validation: { isRequired: true } }),
        created_at: fields.date({ label: 'Publication date', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
        updated_at: fields.date({ label: 'Updated date' }),
        draft: fields.checkbox({ label: 'Draft — keep off the live site', defaultValue: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags', itemLabel: props => props.value }),
        content: fields.mdx({
          label: 'Post body', description: 'Required for Article and Review. It can add supporting content to other formats that render a body.',
          options: { image: { directory: 'public/images/blog', publicPath: '/images/blog/' } }, components: richTextComponents,
        }),
      },
    }),
    pages: collection({
      label: 'Site pages', slugField: 'title', path: 'src/content/pages/*', format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Page title' } }),
        description: fields.text({ label: 'Search and sharing description', multiline: true, validation: { isRequired: true } }),
        draft: fields.checkbox({ label: 'Draft — keep off the live site', defaultValue: true }),
        updated_at: fields.date({ label: 'Updated date', defaultValue: { kind: 'today' } }),
        content: fields.mdx({
          label: 'Page content', options: { image: { directory: 'public/images/pages', publicPath: '/images/pages/' } }, components: richTextComponents,
        }),
      },
    }),
  },
});
