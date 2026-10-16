import config from '../../astro.config.mjs';

// Production config stays untouched. Development toolbar imports/overlays are
// not site behavior and can race navigation in WebKit or pollute screenshots.
export default {
  ...config,
  devToolbar: { enabled: false },
  // A normal build/dev server must not invalidate this server's optimized imports.
  vite: { ...config.vite, cacheDir: 'node_modules/.vite-e2e' },
};
