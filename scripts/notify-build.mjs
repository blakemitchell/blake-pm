// Runs only after `astro check && astro build` succeeds. Delivery is best-effort:
// a notification service must never turn a successful site build into a failure.
const destination = process.env.BUILD_NOTIFY_WEBHOOK;

if (destination) {
  try {
    const url = new URL(destination);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported webhook URL protocol');

    const payload = {
      event: 'build.completed',
      status: 'success',
      site: 'blake.pm',
      branch: process.env.WORKERS_CI_BRANCH || process.env.CF_PAGES_BRANCH || null,
      commit: process.env.WORKERS_CI_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA || null,
      timestamp: new Date().toISOString(),
    };
    const format = (process.env.BUILD_NOTIFY_FORMAT || 'json').toLowerCase();
    const message = `Astro build succeeded for ${payload.site}${payload.branch ? ` (${payload.branch})` : ''}${payload.commit ? ` · ${payload.commit.slice(0, 7)}` : ''}.`;
    const body = format === 'discord' ? { content: message } : format === 'slack' ? { text: message } : payload;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.warn(`Build notification returned HTTP ${response.status}; continuing.`);
    else console.log('Build notification sent.');
  } catch (error) {
    // Never print the URL: webhook URLs often contain a secret token.
    console.warn(`Build notification could not be sent (${error instanceof Error ? error.name : 'error'}); continuing.`);
  }
}
