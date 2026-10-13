# Testing blake.pm

## Setup and commands

Use the repository's installed Node/npm toolchain. Install dependencies with `npm ci`,
then `npx playwright install chromium webkit`. On supported Linux hosts, use
`npx playwright install --with-deps chromium webkit` if system libraries are missing.
Browser downloads and the local server may require permission outside an agent's sandbox.

| Command | Purpose |
| --- | --- |
| `npm run lint` | Correctness-focused ESLint; warnings fail |
| `npm run lint:fix` | Explicit opt-in lint fixes; review the diff |
| `npm run test:e2e` | Full Chromium/WebKit desktop, phone, and tablet matrix, including visual comparisons |
| `npm run test:e2e -- --project=chromium` | Quick desktop browser check |
| `npm run test:e2e -- --grep-invert 'visual:'` | Functional/accessibility matrix without OS-specific screenshot comparisons |
| `npm run test:e2e -- accessibility.spec.ts` | WCAG A/AA automated scans and open interactive states |
| `npm run test:e2e:visual` | Four screenshot comparisons, Chromium desktop and Pixel emulation only |
| `npm run test:e2e:ui` | Interactive runner; select a spec/project to inspect |
| `npm run test:e2e:debug -- --project=chromium` | Playwright Inspector |
| `npm run test:e2e:report` | Open the last HTML report |
| `npm run test:e2e:types` | Type-check the runner configuration and E2E tests |
| `npm run test:e2e -- --last-failed` | Re-run only failures after investigating them |

Playwright starts and stops `npm run dev` with `tests/e2e/astro.config.mjs` (the
normal config plus a disabled dev toolbar and an isolated Vite cache) on **127.0.0.1:4322**. It refuses to reuse
an existing server, so stale previews and unexpected origins are not tested. Stop a
server occupying that port before running. It does not start Wrangler or deploy.
`BUILD_NOTIFY_WEBHOOK` is empty in the test server environment. Do not point these
tests at production.

## Existing tests and minimum validation

Existing tests remain unchanged and cover concerns the browser cannot:

```sh
npm run lint
npm run test:e2e:types
npm run test:e2e
BUILD_NOTIFY_WEBHOOK= npm run build
node tests/atmosphere.cjs
node tests/shared-atmosphere.mjs
node tests/contact-worker.mjs
npm run test:posts
npm run test:cms
git diff --check
```

Build before `tests/shared-atmosphere.mjs`, which reads `dist`. The CMS suite needs
an installed `../blake-pm-cms` checkout; an alternative path can be passed to
`node scripts/test-cms-compatibility.mjs /path/to/blake-pm-cms`.
`npm run lint` uses the flat `eslint.config.mjs`: ESLint recommended correctness,
non-type-aware TypeScript recommended rules, and Astro recommended rules. It covers
handwritten source, browser scripts, Worker code, scripts, tests, and root configs.
Browser, Node, and Worker globals are scoped separately; E2E files also use browser
globals for page callbacks. Dependencies, generated output/types, caches, reports,
and snapshots are excluded. No formatting/import sorting or typed-project service
is configured. TypeScript handles undefined names in TS files; ESLint checks them
in JavaScript. Builds never run automatic fixes.

Dependencies are pinned to ESLint/@eslint/js 9.39.5, typescript-eslint 8.61.0,
eslint-plugin-astro 1.3.1, and globals 15.15.0. Engine/peer compatibility was checked
against Node 25.3.0 and TypeScript 5.8.3 before installation. npm marks ESLint 9 as
unsupported; it is retained at the explicitly requested major. Review these tools
together in a future approved upgrade rather than independently taking latest Astro
plugin versions, which have different Node/ESLint requirements.

For a small local change, run E2E type checks, the relevant spec on Chromium, and
checks appropriate to the change. Before a PR, run the full browser matrix, build,
and relevant existing tests. UI changes should include both mobile engines and
visual comparisons on the baseline host. Investigate failures before promotion;
never hide defects by weakening assertions or editing the application just to pass.

## Repository assessment and coverage

The website is static Astro 4 with MDX and a Solid/Fuse search island. `PageLayout`
composes `BaseHead`, `Header`, `Drawer`, `Footer`, and `Atmosphere`. Page-specific
layouts supply reading widths. Tests cover these public HTML routes:

- `/`, `/about/`, `/about-this-site/`, `/blog/`, `/social/`, `/contact/`, `/search/`
- `/projects/` and all four current project detail pages
- All five current blog detail pages
- `/links/`, `/micro/`, `/media/`, `/photos/`, `/quotes/`, `/debris-lab/`
- `/legal/privacy/`

Important static routes remain explicit in `site.spec.ts`: update those when
adding or renaming a static page. Blog and project detail routes are discovered
from each unpaginated listing's entry links, using Astro's published visibility
and slugs. Each discovered route gets the same status/layout/overflow checks in a
named test step. New published entries need no test-list edits. This checks routes
exposed by the listings, not independent collection completeness; keep the existing
post-discovery/CMS contract tests. If pagination is introduced, extend discovery to
visit every listing page. Explicit photo/search assertions remain representative
content fixtures and may need updating if those entries are renamed or removed. RSS, robots, and missing-route status are checked separately. Astro's generated
production sitemap is checked by production build tooling, not the dev server.

Browser assertions cover status/title, content and footer visibility, horizontal
overflow, wordmark/navigation/control overlap, desktop navigation, drawer toggling
and navigation, compact scroll header and backdrop blur, palettes/persistence,
Home's 680-star sky and horizon, Social's continuous sky and four orbits, shared
header/footer stars, filters and delayed collapse, Solid search, content metadata,
images, privacy date, and contact validation/rejection. Every browser test records
unexpected JavaScript and console errors as failures.

Projects: desktop Chromium and WebKit (1280×900), Pixel 7 Chromium, iPhone 13 WebKit,
and a Chromium tablet viewport (820×1180). Device emulation is not a substitute for
physical-device testing. Functional tests run in all five projects. Screenshots
run only in the two Chromium desktop/phone projects to keep baseline count small.

**Theme limitation:** all current planet palettes deliberately force `.dark` and
`color-scheme: dark`; the follow-system control is hidden. No actual light palette
exists. Tests exercise both OS light/dark preferences and verify palette selection
and persistence without inventing a light-mode feature. Visual references cover
Earth/dark preference and Venus/light preference; both rendered palettes are dark.

**Git/CI:** normal development is `dev`, promotion goes through `staging`, then
`main`. The existing GitHub workflow synchronizes CMS content from main; it is not
validation CI. This task does not change that workflow or deployment configuration.
For future CI, use a read-only PR workflow with `npm ci`, installed browsers, the
functional/accessibility matrix, and retained reports. Choose a canonical screenshot
OS before enabling visual gating on a different runner; do not silently accept new
platform baselines in CI.

## Isolation and integration limits

`fixtures.ts` intercepts all `/api/contact` requests and all external HTTP requests.
External scripts such as Turnstile and EchoThread receive empty local responses.
The contact test sends synthetic data only to an intercepted response with
`ok: false`. It neither obtains nor supplies a Turnstile token and never contacts
Cloudflare verification, D1, Discord, or the real endpoint. The test covers native
required/email validation and the existing client error/re-enable path, not successful
delivery. The existing Worker test covers server validation and failure durability.
Live integration verification needs a separately provisioned test Worker/D1,
Turnstile test configuration, and a safe notification destination; it must never
use production messages to validate a UI change.

External media playback, EchoThread, third-party availability, production response
headers, redirects from `public/_redirects`, and Cloudflare routing are outside this
local Astro suite. Do not infer these integrations work from green browser tests.

Tests use reduced motion and disable surprises in isolated local storage to avoid
background timers changing the scene. They do not change normal application behavior.
Normal-motion orchestration remains covered by the existing atmosphere tests; human
review remains useful for animation quality.

## Accessibility reports

`@axe-core/playwright` scans WCAG 2 A/AA and 2.1 A/AA rules on representative pages,
plus open preferences and mobile navigation. No violations are suppressed. Findings
fail their tests and attach the complete axe JSON (including affected selectors,
impact, and guidance). Classify actual site defects separately from test/environment
problems; propose design fixes separately. Automated scans cannot prove full WCAG
conformance or replace keyboard/screen-reader review. Third-party widgets are not
scanned because they are isolated from these tests.

## Screenshot policy

The four Social references cover the wordmark/navigation, continuous sky, monogram,
orbits, and footer at desktop/mobile widths in two palettes. Home and interior stars
also have DOM assertions. Motion is disabled, decorations use a test-only seeded
random source, fonts are awaited, and a test-only Astro config disables the dev toolbar.
There are no changes to application randomness or styles. Comparisons allow at
most 100 differing pixels to tolerate minor rasterization noise without accepting
large local changes simply because a full-page image is tall.

Checked-in PNG references are platform-specific (`*-darwin.png` currently, captured
on macOS arm64). Font rasterization may differ on Linux or other hardware. Use the
same OS and locked Playwright version for comparisons. On another OS, run functional
checks first; a missing screenshot is an environment/setup issue, not a site regression.

`updateSnapshots: 'none'` means normal runs never write baselines. For the initial
setup of an approved new platform only, explicitly run:

```sh
npm run test:e2e:visual -- --update-snapshots=missing
```

For an intentional, reviewed visual change, narrowly select its test and explicitly
use `--update-snapshots=changed`. Inspect every changed PNG and the actual/expected/diff
images; include the reason in review. **Never update baselines automatically to make
a failing test pass.** Do not use broad `--update-snapshots=all` as a repair strategy.

## Failure investigation

`playwright-report/` contains the HTML report; `test-results/` contains JSON summary,
failure screenshots, retained traces, browser-error lists, and axe attachments.
These directories are ignored by Git; baseline PNGs are not. Use the HTML report to
inspect expected/actual screenshot differences or `npx playwright show-trace
/path/to/trace.zip` to inspect actions/network/DOM. Re-run a specific failure with
`--project=<name> --grep '<test title>'`. Do not classify a browser-install/server
startup failure as an executed test pass. A CI retry is diagnostic, not proof a flaky
failure can be ignored.

## Findings from initial setup (2026-10-12)

The initial suite exposed a desktop WebKit defect, now fixed: **palette selection by
pointer**. Before the fix, opening About and clicking the atmosphere button then
Venus closed the panel but left Earth selected. Event tracing showed WebKit moving
focus from `#themes-tab` to `BODY` on mousedown; the `focusout` timeout hid the panel
before mouseup/click reached Venus. Keyboard selection and touch taps were unaffected.
`public/js/atmosphere.js` now explicitly focuses enabled buttons on primary mouse
press and prevents the default focus loss, for both the panel and its trigger.
Click handlers still select/toggle; keyboard and outside-pointer dismissal remain
unchanged. Regression tests cover mouse/touch selection, persisted choice, focus
restoration, Options/Themes tabs, Escape, trigger toggling, outside activation, and
Tab leaving the panel across all five browser/device projects. No tests are skipped
or marked as expected failures, and no screenshot references were updated.

Setup issues were isolated from that defect:

- Astro's dev-toolbar imports could be cancelled during WebKit navigation. The
  test-only config disables the toolbar, which is not part of production UI.
- A concurrently running production build invalidated the development server's
  Vite cache and produced `504 Outdated Optimize Dep` on Search. E2E now has a
  separate cache. Run the documented minimum checks sequentially.
- Navigation scroll assertions now wait for load/fonts, and Search waits for its
  Solid island to hydrate before typing. Both corrected checks passed three
  repeated mobile WebKit runs. Input entered before hydration is not covered;
  the server-rendered Search input can accept text before its handler is ready.
- Initial screenshot capture included the development toolbar. The unreviewed
  initial references were corrected after fixing the capture setup; no application
  visuals were changed or regressions accepted to make tests pass.

Recommended follow-ups: select a canonical screenshot host before adding PR
CI; retain human keyboard/screen-reader and physical-device review; provision an
isolated contact integration environment only if end-to-end delivery coverage is
needed. ESLint is now configured as described above.

## Final validation (2026-10-12)

Full Playwright run: **184 passed, zero failed, zero skipped**. All 40 axe checks
and all four unchanged screenshot comparisons passed. Desktop WebKit palette
selection and dismissal now pass, as do the other browser/device projects.

| Project | Passed | Failed |
| --- | ---: | ---: |
| Desktop Chromium | 38 | 0 |
| Desktop WebKit | 36 | 0 |
| Mobile Chromium (Pixel 7) | 38 | 0 |
| Mobile WebKit (iPhone 13) | 36 | 0 |
| Tablet Chromium | 36 | 0 |

The previous 214-test total became 184 because nine individually declared content
route tests became two discovery tests with named route steps, and one dismissal
test was added per project. All five current published posts and four projects
remain covered across the five projects; future published listing entries are
picked up automatically.

Also passed: E2E TypeScript checks, production build with notifications disabled
(70 files checked, zero errors/warnings/hints, 25 pages), atmosphere,
shared-atmosphere, contact-worker, post-discovery, CMS compatibility (178 assertions),
and `git diff --check`. Contact-worker failure messages are expected mocked cases.
The earlier missing ESLint command was resolved in the subsequent linting task.
No other failures remain in the executed checks.

The only application change is the palette button focus correction. No light theme,
CI, Cloudflare, deployment configuration, or screenshot baseline changes were made
in this follow-up. All framework and follow-up work remains uncommitted on `dev`
for review. Live integrations and physical-device verification remain outside the
automated coverage described above.

## ESLint introduction

The initial run found seven errors: four intentional empty catches (storage and
invalid media URL fallbacks), two never-reassigned local variables, and an explicit
`any` at the CMS normalization boundary. Catch comments now explain the existing
fallbacks, locals use `const`, and normalization uses guarded `unknown` records.
No blanket disables, formatting pass, or automatic fixes were used. In-memory
probe inputs verified unused-variable checks in JS, TS, and Astro and undefined
JavaScript references. The configured scope currently contains 94 files.

ESLint-task validation: `npm run lint` passed with zero errors/warnings;
`npm run test:e2e:types` and the notification-disabled production build passed;
all 184 Playwright tests passed without baseline updates. Atmosphere,
shared-atmosphere, contact-worker, post-discovery, and CMS compatibility (178
assertions) passed, as did `git diff --check`. Astro remains 4.16.18, TypeScript
5.8.3, and Node 25.3.0. npm reported 43 aggregate dependency advisories at install;
no unrelated audit fixes were applied. No lint findings remain outstanding.
