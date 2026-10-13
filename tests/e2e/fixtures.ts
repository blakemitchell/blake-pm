import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ safety: void }>({
  safety: [async ({ context, page }, use, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    // Block integrations, never submit to a real contact endpoint (even on a redirect).
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/contact') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' });
      if (url.origin !== 'http://127.0.0.1:4322') return route.fulfill({ status: 200, body: '', contentType: 'text/plain' });
      return route.continue();
    });
    await context.addInitScript(() => {
      localStorage.setItem('blake-motion', 'false');
      localStorage.setItem('blake-surprises', 'false');
    });
    await use();
    await testInfo.attach('browser-errors', { body: JSON.stringify(errors, null, 2), contentType: 'application/json' });
    expect(errors, 'Unexpected JavaScript/console errors').toEqual([]);
  }, { auto: true }],
});
export { expect };
