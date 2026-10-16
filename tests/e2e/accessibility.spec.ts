import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';

for (const route of ['/', '/about/', '/blog/', '/blog/an-ai-image/', '/social/', '/contact/', '/legal/privacy/']) {
  test(`accessibility: ${route}`, async ({ page }, testInfo) => {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    await testInfo.attach('axe-results', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
    expect(results.violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, targets: nodes.map(node => node.target) }))).toEqual([]);
  });
}

test('accessibility: open preferences and mobile navigation', async ({ page }, testInfo) => {
  await page.goto('/about/');
  if (page.viewportSize()!.width < 1024) {
    await page.locator('#header-drawer-button').click();
    const drawer = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    await testInfo.attach('axe-drawer', { body: JSON.stringify(drawer, null, 2), contentType: 'application/json' });
    expect.soft(drawer.violations, 'Open mobile drawer').toEqual([]);
    await page.locator('#header-drawer-button').click();
  }
  await page.locator('#header-theme-button').click();
  const preferences = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  await testInfo.attach('axe-preferences', { body: JSON.stringify(preferences, null, 2), contentType: 'application/json' });
  expect(preferences.violations, 'Open appearance preferences').toEqual([]);
});
