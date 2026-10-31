import assert from 'node:assert/strict';
import { resolveVideo } from '../src/lib/video.js';

function embedded(value, provider) {
  const result = resolveVideo(value);
  assert.equal(result.kind, 'embed');
  assert.equal(result.provider, provider);
  return result;
}

const youtubeStandard = embedded('https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=newsletter', 'YouTube');
assert.equal(youtubeStandard.embedUrl, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');
assert.equal(youtubeStandard.sourceUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

const youtubeShort = embedded('https://youtube.com/shorts/dQw4w9WgXcQ?si=share-token', 'YouTube');
assert.equal(youtubeShort.embedUrl, youtubeStandard.embedUrl);

const vimeo = embedded('https://vimeo.com/123456789?utm_medium=social', 'Vimeo');
assert.equal(vimeo.embedUrl, 'https://player.vimeo.com/video/123456789?dnt=1');

const instagram = embedded('https://www.instagram.com/reel/DfGIE_hM6AB/?vrfl=tracking', 'Instagram');
assert.equal(instagram.embedUrl, 'https://www.instagram.com/reel/DfGIE_hM6AB/embed/captioned/');
assert.equal(instagram.sourceLabel, 'Watch on Instagram');

const tiktok = embedded('https://www.tiktok.com/@hoopvenue/video/7468136598706576670?is_from_webapp=1', 'TikTok');
assert.match(tiktok.embedUrl, /player\/v1\/7468136598706576670/);
assert.equal(tiktok.sourceLabel, 'Watch on TikTok');
assert.equal(tiktok.sourceUrl, 'https://www.tiktok.com/@hoopvenue/video/7468136598706576670');

assert.deepEqual(resolveVideo('https://cdn.example.com/video.webm?utm_source=feed'), {
  kind: 'native', sourceUrl: 'https://cdn.example.com/video.webm', title: 'Video',
});

const tiktokShare = resolveVideo('https://vm.tiktok.com/ZPLfjegnm/?utm_source=copy');
assert.deepEqual(tiktokShare, {
  kind: 'fallback', provider: 'TikTok', sourceUrl: 'https://vm.tiktok.com/ZPLfjegnm/', sourceLabel: 'Watch on TikTok',
});

const unsupported = resolveVideo('https://example.com/video?id=1&utm_campaign=social');
assert.deepEqual(unsupported, {
  kind: 'fallback', provider: undefined, sourceUrl: 'https://example.com/video?id=1', sourceLabel: 'Watch video',
});
assert.deepEqual(resolveVideo('not a URL'), { kind: 'invalid' });
assert.deepEqual(resolveVideo(undefined), { kind: 'invalid' });

console.log('Passed: YouTube (including Shorts), Vimeo, Instagram, TikTok, tracking removal, and safe source-link fallbacks.');
