import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

const source = ['src/**/*.{js,ts,tsx,astro}', 'public/js/**/*.js', 'worker/**/*.js', 'scripts/**/*.{js,mjs,cjs,ts}', 'tests/**/*.{js,mjs,cjs,ts,tsx}', '*.{js,mjs,cjs,ts}'];

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.astro/**', '**/.wrangler/**', '**/coverage/**', '**/.cache/**', '**/playwright-report/**', '**/test-results/**', '**/blob-report/**', '**/*-snapshots/**', 'src/env.d.ts'] },
  { ...js.configs.recommended, files: source },
  ...ts.configs.recommended.map(config => ({ ...config, files: ['**/*.{ts,tsx}'] })),
  ...astro.configs['flat/recommended'],
  {
    files: ['**/*.astro'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
  { files: ['public/js/**/*.js', 'src/**/*.{js,ts,tsx,astro}'], languageOptions: { globals: globals.browser } },
  { files: ['scripts/**', 'tests/**', '*.{js,mjs,cjs,ts}'], languageOptions: { globals: globals.node } },
  { files: ['tests/e2e/**/*.ts'], languageOptions: { globals: globals.browser } },
  { files: ['worker/**/*.js'], languageOptions: { globals: globals.worker } },
];
