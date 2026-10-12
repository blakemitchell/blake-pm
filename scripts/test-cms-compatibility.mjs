import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

const site = fileURLToPath(new URL('../', import.meta.url));
const cms = path.resolve(process.argv[2] || path.join(site, '../blake-pm-cms'));
const requireCms = createRequire(path.join(cms, 'package.json'));
const yaml = requireCms('js-yaml');
const temp = await mkdtemp(path.join(site, 'node_modules/.cms-compat-'));
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const image = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'));
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };

try {
  // Select Keystatic's published default (editor) export: its Node export deliberately
  // stubs editor-state creation. No private serializer or package patches are used.
  const coreRoot = path.resolve(path.dirname(requireCms.resolve('@keystatic/core')), '..');
  const corePackage = JSON.parse(await readFile(path.join(coreRoot, 'package.json'), 'utf8'));
  await build({ entryPoints: [path.join(cms, 'keystatic.config.ts')], outfile: path.join(temp, 'cms.mjs'),
    bundle: true, platform: 'node', format: 'esm', packages: 'external',
    plugins: [{ name: 'cms-editor-exports', setup(b) {
      b.onResolve({ filter: /^@keystatic\/core(?:\/.*)?$/ }, ({ path: specifier }) => {
        const key = specifier === '@keystatic/core' ? '.' : '.' + specifier.slice('@keystatic/core'.length);
        return { path: path.join(coreRoot, corePackage.exports[key].default), external: true };
      });
    } }],
  });
  const { default: config } = await import(pathToFileURL(path.join(temp, 'cms.mjs')));
  const { createReader } = await import(pathToFileURL(requireCms.resolve('@keystatic/core/reader')));
  const reader = createReader(site, config);
  for (const collection of Object.keys(config.collections)) {
    const entries = await reader.collections[collection].all();
    for (const entry of entries) await entry.entry.content();
    check(entries.length > 0, `Existing ${collection} readable by standalone CMS`);
  }

  // Field serializers produce the frontmatter; omitted optional fields stay omitted.
  function serialize(field, value, slugField = false) {
    if (field.kind === 'object') return Object.fromEntries(Object.entries(field.fields).map(([key, child]) => [key, serialize(child, value?.[key])]));
    if (field.kind === 'array') {
      const values = value ?? [];
      if (field.validation?.length?.min) check(values.length >= field.validation.length.min, 'Array minimum');
      return values.map(item => serialize(field.element, item));
    }
    if (field.kind === 'conditional') return { discriminant: value.discriminant, value: serialize(field.values[value.discriminant], value.value) };
    const parsed = field.parse(value, slugField ? { slug: 'cms-contract' } : undefined);
    field.validate(parsed);
    if (slugField) return field.serializeWithSlug(parsed).value;
    return field.serialize(parsed).value;
  }

  for (const name of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'tailwind.config.mjs', 'package.json']) await cp(path.join(site, name), path.join(temp, name), { recursive: true });
  await symlink(path.join(site, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const { posts, pages, legal } = config.collections;
  for (const collection of [posts, pages, legal]) {
    assert.throws(() => collection.schema.title.validate(collection.schema.title.parse('', { slug: 'custom-slug' })));
    checks++;
  }
  for (const field of [posts.schema.created_at, legal.schema.date]) {
    assert.throws(() => field.validate(field.parse('2026-09-16T12:00:00Z'))); checks++;
    assert.throws(() => field.validate(field.parse('not-a-date'))); checks++;
  }
  for (const [type, key] of [['reading', 'progress'], ['review', 'rating']]) {
    const field = posts.schema.format.values[type].fields[key];
    assert.throws(() => field.validate(null)); checks++;
    check(field.serialize(field.defaultValue()).value === 0, `${type} numeric default`);
  }
  for (const [type, limit] of [['micro', 140], ['idea', 500], ['status', 280]]) {
    const field = posts.schema.format.values[type].fields.text;
    assert.throws(() => field.validate(field.parse('x'.repeat(limit + 1)))); checks++;
  }
  check(posts.schema.draft.defaultValue() === true && pages.schema.draft.defaultValue() === true, 'New content defaults to draft');
  const photoField = posts.schema.format.values.photo.fields.images.element;
  assert.throws(() => photoField.validate(null)); checks++;
  const photo = photoField.serialize({ data: image, extension: 'png', filename: 'cms-contract.png' }, { slug: 'cms-contract-photo', suggestedFilenamePrefix: 'cms-contract-photo' });
  await mkdir(path.join(temp, photoField.directory, 'cms-contract-photo'), { recursive: true });
  await writeFile(path.join(temp, photoField.directory, 'cms-contract-photo', photo.asset.filename), photo.asset.content);
  check(photo.value.startsWith('/images/blog/'), 'Gallery uses public URL');

  async function fixture(collection, slug, values, media = true) {
    const directory = collection === posts ? 'blog' : collection === pages ? 'pages' : 'legal';
    const imagePath = `/images/${directory}/${slug}/cms-contract.png`;
    let body = `CMS contract body **bold**.\n\n![Contract image](${imagePath})\n`;
    if (media) body += '\n<Audio url="https://example.com/contract.mp3" caption="Contract audio" />\n\n<Video url="https://example.com/contract.mp4" caption="Contract video" />\n\n<Video url="https://youtu.be/dQw4w9WgXcQ" />\n\n<Video url="https://vimeo.com/123456789" />\n';
    const field = collection.schema.content;
    const external = new Map([[`public/images/${directory}`, new Map([['cms-contract.png', image]])]]);
    const state = field.parse(undefined, { content: encoder.encode(body), other: new Map(), external, slug });
    const serialized = field.serialize(field.validate(state), { slug });
    body = decoder.decode(serialized.content);
    check(body.includes(imagePath), `${directory} image survives CMS edit`);
    if (media) check(body.includes('<Audio url=') && !body.includes('import '), 'CMS emits import-free named MDX components');
    for (const [dir, files] of serialized.external) {
      for (const [filename, bytes] of files) {
        await mkdir(path.dirname(path.join(temp, dir, slug, filename)), { recursive: true });
        await writeFile(path.join(temp, dir, slug, filename), bytes);
      }
    }
    const frontmatter = {};
    for (const [key, field] of Object.entries(collection.schema)) {
      if (key === 'content') continue;
      // Gallery upload is serialized separately with its asset context above.
      if (key === 'format' && values.format.discriminant === 'photo') frontmatter[key] = { discriminant: 'photo', value: { images: [photo.value], alt: ['Gallery description'] } };
      else frontmatter[key] = serialize(field, values[key], key === collection.slugField);
    }
    await writeFile(path.join(temp, 'src/content', directory, `${slug}.mdx`), `---\n${yaml.dump(frontmatter, { skipInvalid: true })}---\n${body}`);
    return frontmatter;
  }
  const variants = {
    article: {}, link: { url: 'https://example.com', commentary: 'Link commentary' },
    quote: { quote_text: 'Contract quotation' }, micro: { text: 'Contract micro' },
    video: { url: 'https://example.com/contract.mp4' }, podcast: { url: 'https://example.com/contract.mp3' },
    photo: {}, bookmark: { url: 'https://example.com' }, idea: { text: 'Contract idea' },
    reading: { progress: 42 }, music: { url: 'https://open.spotify.com/track/contract' },
    event: { starts_at: '2026-10-10T15:30' }, status: { text: 'Contract status' },
    poll: { question: 'Contract question?', options: ['One', 'Two'] },
    thread: { posts: [{ text: 'Undated entry' }, { text: 'Dated entry', created_at: '2026-10-10T15:30' }] },
    review: { rating: 4 },
  };
  assert.deepEqual(Object.keys(variants).sort(), Object.keys(posts.schema.format.values).sort()); checks++;
  for (const [type, value] of Object.entries(variants)) {
    const data = await fixture(posts, `cms-contract-${type}`, { title: `Contract ${type}`, summary: `Summary ${type}`, created_at: '2026-10-10', draft: false, format: { discriminant: type, value } });
    check(data.updated_at === undefined, 'Empty update date omitted');
  }
  await fixture(pages, 'cms-contract-page', { title: 'Contract page', description: 'Contract description', draft: false });
  // Exercise the dedicated route too, without changing source content.
  await fixture(pages, 'about-this-site', { title: 'About This Site', description: 'Contract description', draft: false });
  await fixture(pages, 'cms-contract-draft', { title: 'Draft page', description: 'Hidden', draft: true });
  await fixture(legal, 'cms-contract-legal', { title: 'Contract legal', date: '2026-10-10' }, false);

  const result = spawnSync(process.execPath, [path.join(site, 'node_modules/astro/astro.js'), 'build'], {
    cwd: temp, env: { ...process.env, KEYSTATIC_LOCAL: 'true', TZ: 'America/Chicago' }, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  // A stale editor flag must no longer enable hybrid output or injected routes.
  await assert.rejects(readFile(path.join(temp, 'dist/keystatic/index.html')), { code: 'ENOENT' }); checks++;
  await assert.rejects(readFile(path.join(temp, 'dist/api/keystatic/index.html')), { code: 'ENOENT' }); checks++;
  check(!result.stdout.includes('output: "hybrid"'), 'Site stays static with retired editor flag');
  const searchHtml = await readFile(path.join(temp, 'dist/search/index.html'), 'utf8');
  check(searchHtml.includes('astro-island') && searchHtml.includes('cms-contract-article'), 'Solid search retains CMS content and hydration');
  const html = route => readFile(path.join(temp, 'dist', route, 'index.html'), 'utf8');
  const bodyTypes = ['article', 'link', 'video', 'podcast', 'photo', 'reading', 'music', 'event', 'review'];
  for (const type of Object.keys(variants)) {
    const output = await html(`blog/cms-contract-${type}`);
    check(output.includes(`Summary ${type}`), `${type} metadata`);
    check(output.includes('Oct 10, 2026'), `${type} date-only display`);
    if (bodyTypes.includes(type)) {
      check(output.includes('<audio') && output.includes('Contract audio'), `${type} audio`);
      check(output.includes('<video') && output.includes('Contract video'), `${type} video`);
      check(output.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ') && output.includes('player.vimeo.com/video/123456789'), `${type} providers`);
      check(output.includes(`src="/images/blog/cms-contract-${type}/cms-contract.png"`), `${type} body image`);
    }
  }
  for (const route of ['cms-contract-page', 'about-this-site']) {
    const output = await html(route);
    check(output.includes('<audio') && output.includes('<video') && output.includes('Contract description'), `${route} media and metadata`);
    check(output.includes(`src="/images/pages/${route}/cms-contract.png"`), `${route} image`);
  }
  const legalHtml = await html('legal/cms-contract-legal');
  check(legalHtml.includes('Oct 10, 2026') && legalHtml.includes('src="/images/legal/cms-contract-legal/cms-contract.png"'), 'Legal date and image');
  check((await html('legal/privacy')).includes('Sep 16, 2026'), 'Privacy retains displayed date');
  check((await html('blog/cms-contract-photo')).includes('alt="Gallery description"'), 'Gallery alt text');
  check((await readFile(path.join(temp, 'dist', photo.value))).length > 0, 'Gallery upload resolves');
  const expected = { micro: 'Contract micro', quote: 'Contract quotation', idea: 'Contract idea', status: 'Contract status', poll: 'Contract question?', thread: 'Undated entry', reading: '42%', review: '4/5', link: 'Link commentary' };
  for (const [type, text] of Object.entries(expected)) check((await html(`blog/cms-contract-${type}`)).includes(text), `${type} format-specific content`);
  const rss = await readFile(path.join(temp, 'dist/rss.xml'), 'utf8');
  check(rss.includes('/blog/cms-contract-article/') && rss.includes('Summary article'), 'RSS consumes CMS metadata');
  const threadHtml = await html('blog/cms-contract-thread');
  const undatedItem = threadHtml.match(/<li>[^<]*<span>1<\/span><p>Undated entry<\/p>(.*?)<\/li>/s);
  check(undatedItem !== null && !undatedItem[1].includes('<time'), 'Missing thread timestamp stays absent');
  await assert.rejects(html('cms-contract-draft'), { code: 'ENOENT' }); checks++;
  for (const [dir, slug] of [['blog', 'article'], ['pages', 'page'], ['legal', 'legal']]) check((await readFile(path.join(temp, 'dist/images', dir, `cms-contract-${slug}`, 'cms-contract.png'))).length > 0, `${dir} asset copied`);
  for (const file of await readdir(path.join(site, 'src/content/blog'))) check((await html(`blog/${file.replace(/\.mdx$/, '')}`)).includes('<article'), `Existing ${file} renders`);
  console.log(`CMS compatibility: ${checks} assertions passed; all 16 post formats, pages, legal, media and uploaded assets built without embedded editor.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
