import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const routes = ['/', '/about/', '/about-this-site/', '/blog/', '/social/', '/contact/', '/search/', '/projects/', '/links/', '/micro/', '/media/', '/photos/', '/quotes/', '/debris-lab/', '/legal/privacy/'];
for (const route of routes) test(`route and layout: ${route}`, async ({ page }) => {
  await checkRoute(page, route);
});

// These unpaginated collections expose all published entries using Astro's real
// slugs and draft filtering, avoiding a second frontmatter parser in the tests.
for (const collection of ['blog', 'projects']) test(`published ${collection} routes`, async ({ page }) => {
  await page.goto(`/${collection}/`);
  const paths = await page.locator('[data-entry] a').evaluateAll(links =>
    [...new Set(links.map(link => new URL((link as HTMLAnchorElement).href).pathname))]);
  expect(paths.length, 'Published collection must contain entries').toBeGreaterThan(0);
  test.setTimeout(30_000 + paths.length * 5_000);
  for (const path of paths) {
    expect(path).toMatch(new RegExp(`^/${collection}/.+`));
    await test.step(path, () => checkRoute(page, path));
  }
});

async function checkRoute(page: Page, route: string) {
  const response = await page.goto(route);
  expect(response?.status()).toBe(200);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('.brand-wordmark')).toBeVisible();
  await expect(page.locator('.site-footer')).toBeVisible();
  await expect(page).toHaveTitle(/Blake Mitchell/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow').toBe(true);
  const boxes = await page.evaluate(() => {
    const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().toJSON();
    return { brand: rect('.site-brand'), nav: rect('.primary-nav'), utilities: rect('#header .buttons') };
  });
  if (page.viewportSize()!.width >= 1024) {
    expect(boxes.brand.right, 'Wordmark must not overlap navigation').toBeLessThanOrEqual(boxes.nav.left);
    expect(boxes.nav.right, 'Navigation must not overlap utility buttons').toBeLessThanOrEqual(boxes.utilities.left);
  } else {
    await expect(page.locator('#header-drawer-button')).toBeVisible();
    expect(boxes.brand.right, 'Wordmark must not overlap mobile controls').toBeLessThanOrEqual(boxes.utilities.left);
  }
}

test('navigation, drawer, and compact header', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.locator('#header')).not.toHaveClass(/scrolled/);
  const width = page.viewportSize()!.width;
  if (width < 1024) {
    const toggle = page.locator('#header-drawer-button');
    await toggle.click(); await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click(); await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click(); await page.locator('#drawer').getByRole('link', { name: 'Blog', exact: true }).click();
  } else {
    await page.locator('.primary-nav').getByRole('link', { name: 'Blog', exact: true }).click();
  }
  await expect(page).toHaveURL(/\/blog\/?$/);
  // URL commitment can precede WebKit's navigation scroll restoration.
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => scrollTo(0, 400));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(24);
  await expect(page.locator('#header')).toHaveClass(/scrolled/);
  await expect(page.locator('#header')).toHaveCSS('height', '64px');
  await expect(page.locator('.chrome-starfield-header')).toHaveCSS('opacity', '0');
  expect(await page.locator('#header').evaluate(el => getComputedStyle(el).backdropFilter)).toContain('blur');
  await page.getByRole('link', { name: 'Blake Mitchell — Home' }).click();
  await expect(page).toHaveURL('/');
});

for (const colorScheme of ['light', 'dark'] as const) test(`palette persistence with ${colorScheme} system preference`, async ({ page }) => {
  await page.emulateMedia({ colorScheme });
  await page.goto('/about/');
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'earth');
  await page.locator('#header-theme-button').click();
  // Exercise persistence independently of pointer-focus behavior in WebKit.
  await page.locator('[data-theme-choice="venus"]').press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'venus');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'venus');
  // Current site deliberately forces dark mode for every palette; no light toggle exists.
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.locator('.brand-wordmark')).toBeVisible();
});

test('palette selection by pointer', async ({ page, isMobile }) => {
  await page.goto('/about/');
  const trigger = page.locator('#header-theme-button');
  const choice = page.locator('[data-theme-choice="venus"]');
  if (isMobile) { await trigger.tap(); await choice.tap(); }
  else { await trigger.click(); await choice.click(); }
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'venus');
  await expect(page.locator('#atmosphere-panel')).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'venus');
});

test('palette tabs and dismissal preserve focus and selection', async ({ page, isMobile }) => {
  await page.goto('/about/');
  const trigger = page.locator('#header-theme-button');
  const panel = page.locator('#atmosphere-panel');
  const activate = async (locator: ReturnType<Page['locator']>) => isMobile ? locator.tap() : locator.click();
  await activate(trigger);
  await activate(page.locator('#options-tab'));
  await expect(page.locator('#options-panel')).toBeVisible();
  await expect(panel).toBeVisible();
  await page.locator('#options-tab').press('ArrowLeft');
  await expect(page.locator('#themes-tab')).toBeFocused();
  await expect(page.locator('#themes-panel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await activate(trigger);
  await activate(trigger);
  await expect(panel).toBeHidden();
  await activate(trigger);
  await activate(page.locator('.site-footer p').first());
  await expect(panel).toBeHidden();
  await activate(trigger);
  await page.locator('#summon-saucer').focus();
  await page.keyboard.press('Tab');
  await expect(panel).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'earth');
});

test('atmosphere controls work with a pointing device', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Touch interaction is covered by the mobile palette test.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/about/');
  await page.locator('#header-theme-button').click();
  await page.locator('#options-tab').click();
  const panel = page.locator('#atmosphere-panel');
  const motion = page.locator('#ambient-motion');
  const debris = page.locator('#debris-frequency');
  await expect(motion).not.toBeChecked();
  await motion.click();
  await expect(motion).toBeChecked();
  await expect(panel).toBeVisible();
  await debris.fill('5');
  await expect(page.locator('#debris-frequency-value')).toHaveText('Very high');
  await expect(panel).toBeVisible();
  await page.reload();
  await page.locator('#header-theme-button').click();
  await page.locator('#options-tab').click();
  await expect(debris).toHaveValue('5');
});

test('page-specific atmosphere', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.sky-star')).toHaveCount(680);
  await expect(page.locator('.aurora-horizon')).toBeVisible();
  await expect(page.locator('.chrome-starfield')).toHaveCount(0);
  await page.goto('/social/');
  await expect(page.locator('.orbit-arm')).toHaveCount(4);
  await expect(page.locator('.social-brand-mark')).toBeVisible();
  expect(await page.locator('#social-starfield').evaluate(el => el.getBoundingClientRect().top)).toBe(0);
  await expect(page.locator('.chrome-starfield-header')).toHaveCount(0);
  await expect(page.locator('.chrome-starfield-footer')).toBeVisible();
  await page.goto('/blog/');
  await expect(page.locator('.chrome-starfield-header i')).toHaveCount(90);
  await expect(page.locator('.chrome-starfield-footer')).toBeVisible();
});

test('post discovery, filters, detail metadata, and privacy', async ({ page }) => {
  await page.goto('/blog/');
  await page.locator('summary').filter({ hasText: 'Post Type' }).click();
  await page.locator('input[data-post-type="photo"]').check();
  await page.locator('[data-search]').fill('An AI Image');
  await expect(page.locator('[data-count]')).toHaveText('1');
  await page.locator('[data-entry]:visible a').click();
  await expect(page.locator('h1')).toHaveText('An AI Image');
  await expect(page.locator('main time').first()).toHaveAttribute('datetime', /2026-/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/blog\/an-ai-image\/?$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /An AI Image/);
  await expect(page.locator('article img').first()).toBeVisible();
  await page.goto('/legal/privacy/');
  await expect(page.locator('h1')).toHaveText('Privacy');
  await expect(page.locator('main')).toContainText('Sep 16, 2026');
});

test('contact validation and mocked failure without Turnstile bypass', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/contact', route => { requests++; return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }); });
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Send message' }).click();
  expect(requests).toBe(0);
  expect(await page.locator('#contact-name').evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  await page.locator('#contact-name').fill('Automated test');
  await page.locator('#contact-email').fill('invalid');
  await page.locator('#contact-message').fill('Local intercepted test only.');
  await page.getByRole('button', { name: 'Send message' }).click();
  expect(requests).toBe(0);
  await page.locator('#contact-email').fill('test@example.invalid');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('#form-status')).toContainText('Something went wrong');
  expect(requests).toBe(1);
  await expect(page.getByRole('button', { name: 'Send message' })).toBeEnabled();
});


test('global search finds a published post', async ({ page }) => {
  await page.goto('/search/');
  // The server-rendered input is visible before Solid attaches its handlers.
  await expect(page.locator('astro-island[component-url*="Search"]')).toHaveCount(1);
  await expect(page.locator('astro-island[component-url*="Search"]')).not.toHaveAttribute('ssr', '');
  await page.getByPlaceholder('What are you looking for?').fill('An AI Image');
  await expect(page.locator('main a[href="/blog/an-ai-image"]')).toBeVisible();
  await page.locator('main a[href="/blog/an-ai-image"]').click();
  await expect(page.locator('h1')).toHaveText('An AI Image');
});

test('filters combine and delayed collapse preserves selections', async ({ page }) => {
  await page.clock.install();
  await page.goto('/blog/');
  const types = page.locator('details').filter({ has: page.locator('[data-type-all]') });
  const tags = page.locator('details').filter({ has: page.locator('[data-tag-all]') });
  await types.locator('summary').click();
  await page.locator('[data-post-type="photo"][type="checkbox"]').check();
  await page.locator('[data-post-type="article"][type="checkbox"]').check();
  await tags.locator('summary').click();
  await page.locator('input[data-tag="general"]').check();
  await page.locator('[data-search]').fill('An AI Image');
  await expect(page.locator('[data-count]')).toHaveText('1');
  await page.clock.fastForward(15_001);
  await expect(types).not.toHaveAttribute('open', '');
  await expect(tags).not.toHaveAttribute('open', '');
  await expect(page.locator('[data-type-summary]')).toHaveText('2 selected');
  await expect(page.locator('[data-tag-summary]')).toHaveText('1 selected');
  await page.locator('[data-clear]').click();
  await expect(page.locator('[data-type-summary]')).toHaveText('All');
  await expect(page.locator('[data-tag-summary]')).toHaveText('All');
  await expect(page.locator('[data-entry][hidden]')).toHaveCount(0);
});

test('public feeds and missing routes', async ({ request }) => {
  const rss = await request.get('/rss.xml');
  expect(rss.status()).toBe(200);
  expect(await rss.text()).toContain('<rss');
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap:');
  expect((await request.get('/e2e-route-that-does-not-exist')).status()).toBe(404);
});
