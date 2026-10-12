import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Exercise the real Social scheduler: no duplicate timers, cleanup, and motion guards.
const items = [], timers = new Map(), events = {};
let next = 0;
const reduced = { matches: false };
const field = {
  append(item) { items.push(item); },
  querySelectorAll() { return items.filter(item => item.className !== 'social-star'); },
};
const document = {
  hidden: false, documentElement: { dataset: { motion: 'on' } },
  getElementById: () => field,
  createElement: () => ({ style: { setProperty() {} }, addEventListener() {}, remove() { const i = items.indexOf(this); if (i !== -1) items.splice(i, 1); } }),
};
vm.runInNewContext(await readFile(new URL('../public/js/social-bg.js', import.meta.url), 'utf8'), {
  document, innerWidth: 1000, matchMedia: () => reduced,
  setTimeout(callback) { timers.set(++next, callback); return next; },
  clearTimeout(id) { timers.delete(id); },
  addEventListener(name, callback) { events[name] = callback; },
});
assert.equal(items.length, 150);
assert.equal(timers.size, 2);
events.pageshow(); assert.equal(timers.size, 2);
const tick = () => { const [id, callback] = timers.entries().next().value; timers.delete(id); callback(); };
for (const mode of ['reduced', 'hidden', 'off']) {
  reduced.matches = mode === 'reduced'; document.hidden = mode === 'hidden'; document.documentElement.dataset.motion = mode === 'off' ? 'off' : 'on';
  tick(); assert.equal(items.length, 150, mode);
}
reduced.matches = false; document.hidden = false; document.documentElement.dataset.motion = 'on';
tick(); assert.equal(items.length, 151);
events.pagehide(); assert.equal(timers.size, 0); assert.equal(items.length, 150);
events.pageshow(); assert.equal(timers.size, 2);

// Production markup must not stack shared chrome fields onto Home or Social's header.
const html = route => readFile(new URL(`../dist/${route}index.html`, import.meta.url), 'utf8');
const home = await html('');
assert.ok(!home.includes('chrome-starfield'));
assert.ok(home.includes('id="ambient-sky"') && home.includes('aurora-horizon'));
const social = await html('social/');
assert.equal((social.match(/id="social-starfield"/g) || []).length, 1);
assert.ok(!social.includes('chrome-starfield-header'));
assert.ok(social.includes('chrome-starfield-footer'));
for (const route of ['about/', 'blog/', 'contact/', 'blog/an-ai-image/']) {
  const page = await html(route);
  assert.ok(page.includes('chrome-starfield-header') && page.includes('chrome-starfield-footer'), route);
  assert.ok(!page.includes('/js/social-bg.js') && !page.includes('/js/bg.js'), 'No ambient scheduler on standard pages');
}
console.log('Passed: Social timer lifecycle, reduced/disabled motion, page-specific star fields, and no extra ambient scheduler on standard pages.');
