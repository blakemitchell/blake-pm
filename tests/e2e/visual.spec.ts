import { test, expect } from './fixtures';

// Four baselines total: Chromium desktop/mobile × two representative palettes.
// System preferences are covered too, but neither palette is a true light theme.
for (const [palette, colorScheme] of [['earth', 'dark'], ['venus', 'light']] as const) {
  test(`visual: ${palette} palette with ${colorScheme} system preference`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.addInitScript(palette => {
      localStorage.setItem('blake-atmosphere', palette);
      // Test-only seed for random decorations. Never change application randomness.
      let seed = 73;
      Math.random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
    }, palette);
    await page.goto('/social/');
    await expect(page.locator('html')).toHaveAttribute('data-atmosphere', palette);
    await expect(page.locator('.social-star').first()).toBeAttached();
    await expect(page.locator('astro-dev-toolbar')).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`social-${palette}.png`, { fullPage: true });
  });
}
