import assert from 'node:assert/strict';
import { readFile, writeFile, cp, mkdtemp, rm, symlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { build } from 'esbuild';

const site = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(path.join(site, 'node_modules/.post-discovery-'));
try {
  await build({ stdin: { contents: 'export * from "./src/content/config.ts"; export * from "./src/lib/posts.ts";', resolveDir: site },
    outfile: path.join(temp, 'contract.mjs'), bundle: true, format: 'esm', platform: 'node', packages: 'external',
    plugins: [{ name: 'content-schema', setup(b) {
      b.onResolve({ filter: /^astro:content$/ }, () => ({ path: 'content', namespace: 'test' }));
      b.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export { z } from "zod"; export const defineCollection = value => value;', resolveDir: site }));
    } }],
  });
  const { postTypes, postSchema, publishedPosts, RECENT_POST_LIMIT, postSummary } = await import(pathToFileURL(path.join(temp, 'contract.mjs')));
  const values = {
    article: {}, link: { url: 'https://example.com/link' }, quote: { quote_text: 'A real quotation' },
    micro: { text: 'Short observation' }, video: { url: 'https://example.com/video.mp4' },
    podcast: { url: 'https://example.com/audio.mp3' }, photo: { images: ['/images/site/field-notes-journal.webp'] },
    bookmark: { url: 'https://example.com/bookmark' }, idea: { text: 'Try a new approach' },
    reading: { progress: 35 }, music: { url: 'https://example.com/music' },
    event: { starts_at: '2099-01-20T12:00:00Z' }, status: { text: 'Working on discovery' },
    poll: { question: 'Which route?', options: ['North', 'South'] }, thread: { posts: [{ text: 'First entry' }] }, review: { rating: 4 },
  };
  assert.deepEqual(Object.keys(values).sort(), [...postTypes].sort(), 'Every schema type must have a fixture');
  const fixtures = postTypes.map((type, index) => {
    const source = { title: `Discovery ${type}`, format: { discriminant: type, value: values[type] }, created_at: type === 'photo' ? '2099-02-01' : `2099-01-${String(index + 1).padStart(2, '0')}`, tags: ['discovery', index % 2 ? 'odd' : 'even'], draft: false };
    return { collection: 'blog', slug: `discovery-${type}`, body: 'Authored body.', source, data: postSchema.parse(source) };
  });
  // Optional website titles and descriptions must not become listing requirements.
  for (const fixture of fixtures) {
    const input = { ...fixture.source };
    if (!['article', 'reading', 'event', 'review'].includes(fixture.data.post_type)) delete input.title;
    fixture.source = input;
    fixture.data = postSchema.parse(input);
    assert.equal(publishedPosts([fixture]).length, 1, `${fixture.data.post_type} eligible on homepage and Blog`);
  }
  const draft = { ...fixtures[0], slug: 'discovery-draft', source: { ...fixtures[0].source, draft: true, updated_at: '2100-01-01' } };
  draft.data = postSchema.parse(draft.source);
  const updated = { ...fixtures[0], data: { ...fixtures[0].data, updated_at: new Date('2100-01-02') } };
  assert.equal(publishedPosts([...fixtures, draft]).length, 16, 'Draft excluded, all future-dated published types included');
  assert.equal(publishedPosts([...fixtures, updated])[0], updated, 'Updated date wins over creation date');
  assert.equal(RECENT_POST_LIMIT, 7);
  assert.equal(publishedPosts(fixtures, RECENT_POST_LIMIT).length, 7);
  assert.deepEqual(publishedPosts([]), []);
  for (const type of ['article', 'photo', 'video', 'bookmark', 'reading', 'event', 'thread', 'review']) {
    assert.equal(postSummary(fixtures.find(p => p.data.post_type === type)), undefined, `${type} has no invented description`);
  }
  for (const [type, expected] of [['micro', 'Short observation'], ['quote', 'A real quotation'], ['poll', 'Which route?']]) {
    assert.equal(postSummary(fixtures.find(p => p.data.post_type === type)), expected);
  }
  assert.equal(postSummary({ ...fixtures[0], data: { ...fixtures[0].data, summary: '  ' } }), undefined);
  assert.equal(postSummary({ ...fixtures[0], data: { ...fixtures[0].data, summary: ' Authored summary ' } }), 'Authored summary');
  for (const [type, field] of [['photo', 'caption'], ['link', 'commentary']]) {
    const entry = fixtures.find(p => p.data.post_type === type);
    assert.equal(postSummary({ ...entry, data: { ...entry.data, [field]: 'Authored fallback' } }), 'Authored fallback');
  }

  // Exercise actual browser event handlers, including the existing project-only mode.
  function controls(entries, types = postTypes) {
    const node = (dataset = {}) => ({ dataset, hidden: true, value: '', textContent: '', handlers: {}, attributes: {},
      addEventListener(event, callback) { this.handlers[event] = callback; },
      setAttribute(name, value) { this.attributes[name] = value; },
      click() { (this.handlers.change ?? this.handlers.click)(); },
    });
    const rows = entries.map(entry => node({ postType: entry.type, tags: JSON.stringify(entry.tags), searchText: entry.text, date: String(entry.date) }));
    const tags = ['nature', 'night'].map(tag => node({ tag }));
    const typeButtons = types.map(postType => node({ postType }));
    const input = node(), clear = node(), sort = node(), count = node(), empty = node(), all = types.length ? node() : null;
    const allTags = node(), typeSummary = node(), tagSummary = node();
    const filters = [node(), node()];
    filters.forEach(filter => { filter.open = false; filter.contains = target => target === filter; });
    const timers = new Map(), documentHandlers = [];
    let nextTimer = 0;
    const ordered = [...rows];
    const list = { querySelectorAll: () => rows, append(row) { ordered.splice(ordered.indexOf(row), 1); ordered.push(row); } };
    const selectors = { '[data-search]': input, '[data-entries]': list, '[data-clear]': clear, '[data-sort]': sort, '[data-count]': count, '[data-empty]': empty, '[data-type-all]': all, '[data-tag-all]': allTags, '[data-type-summary]': typeSummary, '[data-tag-summary]': tagSummary, '.collection-controls': node() };
    const root = { dataset: {}, classList: { add() {} }, querySelector: key => selectors[key], querySelectorAll: key => key === '[data-filter]' ? filters : key === '[data-tag]' ? tags : typeButtons };
    vm.runInNewContext(collectionScript, { document: { querySelectorAll: () => [root], addEventListener: (event, callback) => documentHandlers.push(callback) }, setTimeout: (callback, delay) => { assert.equal(delay, 15000); timers.set(++nextTimer, callback); return nextTimer; }, clearTimeout: id => timers.delete(id) });
    return { filters, timers, outside: () => documentHandlers.forEach(callback => callback({ target: null })), allTags, typeSummary, tagSummary, input, clear, sort, count, empty, all, tags, typeButtons, rows, ordered, visible: () => ordered.filter(row => !row.hidden) };
  }
  const collectionScript = await readFile(path.join(site, 'public/js/collection.js'), 'utf8');
  const rows = postTypes.map((type, index) => ({ type, tags: type === 'photo' ? ['nature', 'night'] : ['nature'], text: `${type} sunset`, date: index }));
  const ui = controls(rows);
  assert.equal(ui.visible().length, 16);
  for (const button of ui.typeButtons) {
    button.click();
    assert.deepEqual(ui.visible().map(row => row.dataset.postType), [button.dataset.postType]);
    assert.equal(button.checked, true);
    button.click();
    assert.equal(ui.visible().length, 16, 'No selected types means all types');
  }
  const typeButton = type => ui.typeButtons.find(button => button.dataset.postType === type);
  typeButton('photo').click(); typeButton('video').click();
  assert.equal(ui.visible().length, 2, 'Selected types are ORed');
  ui.tags[0].click(); ui.tags[1].click();
  ui.input.value = ' SUNSET '; ui.input.handlers.input();
  assert.deepEqual(ui.visible().map(row => row.dataset.postType), ['photo'], 'Search AND all tags AND selected types');
  ui.all.click();
  assert.equal(ui.visible().length, 1, 'All types preserves search and tags');
  ui.input.value = 'no match'; ui.input.handlers.input();
  assert.equal(ui.count.textContent, '0'); assert.equal(ui.empty.hidden, false);
  ui.clear.click(); assert.equal(ui.visible().length, 16); assert.equal(ui.all.checked, true);
  assert.equal(ui.clear.hidden, true); assert.equal(ui.empty.hidden, true);
  ui.sort.click(); assert.equal(ui.ordered[0].dataset.date, '0');
  typeButton('photo').click(); assert.equal(ui.clear.hidden, false); ui.clear.click();
  assert.equal(controls(rows.slice(0, 2), []).visible().length, 2, 'Project controls work without type filter');

  assert.equal(ui.typeSummary.textContent, 'All');
  assert.equal(ui.tagSummary.textContent, 'All');
  assert.ok(ui.filters.every(filter => !filter.open), 'Both filters start collapsed');
  typeButton('photo').click(); ui.tags[0].click();
  assert.equal(ui.typeSummary.textContent, '1 selected');
  assert.equal(ui.tagSummary.textContent, '1 selected');
  for (const filter of ui.filters) {
    filter.open = true;
    ui.outside();
    assert.equal(ui.timers.size, 1, 'Click away schedules closure');
    assert.equal(filter.open, true, 'Closure is delayed');
    filter.handlers.focusin();
    assert.equal(ui.timers.size, 0, 'Returning focus cancels closure');
    ui.outside(); filter.handlers.pointerenter();
    assert.equal(ui.timers.size, 0, 'Returning pointer cancels closure');
    filter.handlers.focusout({ relatedTarget: null });
    for (const [id, callback] of ui.timers) { ui.timers.delete(id); callback(); }
    assert.equal(filter.open, false, 'Closes after 15 seconds away');
  }
  assert.equal(typeButton('photo').checked, true, 'Collapse preserves selected types');
  assert.equal(ui.tags[0].checked, true, 'Collapse preserves selected tags');
  ui.allTags.click();
  assert.equal(ui.tagSummary.textContent, 'All');
  assert.equal(typeButton('photo').checked, true, 'All tags preserves selected types');

  // Build representative content in isolation, preserving every source content file.
  for (const name of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'tailwind.config.mjs', 'package.json']) await cp(path.join(site, name), path.join(temp, name), { recursive: true });
  await symlink(path.join(site, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  for (const entry of [...fixtures, draft]) await writeFile(path.join(temp, 'src/content/blog', `${entry.slug}.mdx`), `---\n${JSON.stringify(entry.source)}\n---\n${entry.body}\n`);
  const result = spawnSync(process.execPath, [path.join(site, 'node_modules/astro/astro.js'), 'build'], { cwd: temp, env: { ...process.env, TZ: 'America/Chicago' }, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const html = route => readFile(path.join(temp, 'dist', route, 'index.html'), 'utf8');
  const blog = await html('blog'), home = await html(''), projects = await html('projects');
  for (const type of postTypes) {
    assert.ok(blog.includes(`href="/blog/discovery-${type}"`), `${type} rendered in Blog`);
    assert.ok(blog.includes(`data-post-type="${type}"`), `${type} filter available`);
  }
  assert.ok(blog.indexOf('data-search ') < blog.indexOf('Post Type') && blog.indexOf('Post Type') < blog.indexOf('>Tags '), 'Filter order');
  assert.ok(!blog.includes('discovery-draft') && !home.includes('discovery-draft'), 'Draft absent from listings');
  const homeSlugs = [...home.matchAll(/href="\/blog\/(discovery-[^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(homeSlugs, publishedPosts(fixtures, 7).map(post => post.slug), 'Actual homepage limits to seven newest published posts');
  assert.equal([...home.matchAll(/href="\/blog\/[^"/]+"/g)].length, 7, 'No older real posts leak past seven');
  assert.equal((blog.match(/<details class="collection-filter" data-filter/g) ?? []).length, 2, 'Both groups use collapsed native disclosures');
  assert.ok(!blog.includes('data-filter open'), 'Filters are initially collapsed');
  assert.ok(!projects.includes('data-type-all'), 'Project listing does not get post filters');
  for (const type of ['article', 'photo', 'video', 'bookmark', 'reading', 'event', 'thread', 'review']) {
    const output = await html(`blog/discovery-${type}`);
    assert.ok(!output.includes('name="description"') && !output.includes('property="og:description"') && !output.includes('property="twitter:description"'), `${type} omits unavailable description metadata`);
    assert.ok(!output.includes('undefined') && !output.includes(`— ${type} post`), `${type} has no placeholders`);
  }
  const rss = await readFile(path.join(temp, 'dist/rss.xml'), 'utf8');
  assert.ok(rss.includes('/blog/discovery-photo/') && !rss.includes('discovery-draft'), 'RSS accepts missing descriptions');
  assert.ok((await html('search')).includes('discovery-photo'), 'Site search includes missing-description photo');
  console.log('Passed: all 16 types, seven-post homepage, drafts/future dates/updated-date ordering, optional descriptions, multi-type + search + tag filters, clear/sort/empty states, projects, RSS and production fixtures.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
