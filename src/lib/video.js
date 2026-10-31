const TRACKING_PARAMETER = /^(?:utm_[^=]*|fbclid|gclid|dclid|msclkid|igshid|igsh|vrfl|si|is_from_webapp|sender_device|sender_web_id|web_id|refer|share_app_id|share_link_id|timestamp|tt_from)$/i;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const INSTAGRAM_ID = /^[A-Za-z0-9_-]+$/;
const VIMEO_ID = /^\d+$/;
const TIKTOK_ID = /^\d+$/;

/** @typedef {{ kind: 'embed', provider: string, layout: 'landscape' | 'portrait', embedUrl: string, sourceUrl: string, sourceLabel: string, title: string }} EmbeddedVideo */
/** @typedef {{ kind: 'native', sourceUrl: string, title: string }} NativeVideo */
/** @typedef {{ kind: 'fallback', provider?: string, sourceUrl: string, sourceLabel: string }} VideoFallback */
/** @typedef {{ kind: 'invalid' }} InvalidVideo */
/** @typedef {EmbeddedVideo | NativeVideo | VideoFallback | InvalidVideo} VideoResolution */

function parseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined;

  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

function sourceUrl(url) {
  const clean = new URL(url);
  clean.hash = '';
  for (const key of [...clean.searchParams.keys()]) {
    if (TRACKING_PARAMETER.test(key)) clean.searchParams.delete(key);
  }
  return clean.href;
}

function fallback(url, provider) {
  return {
    kind: 'fallback',
    provider,
    sourceUrl: sourceUrl(url),
    sourceLabel: provider ? `Watch on ${provider}` : 'Watch video',
  };
}

function youtube(url) {
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);
  let id;

  if (host === 'youtu.be') id = parts[0];
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v') ?? undefined;
    else if (['shorts', 'embed', 'live', 'v'].includes(parts[0])) id = parts[1];
  } else return undefined;

  if (!id || !VIDEO_ID.test(id)) return fallback(url, 'YouTube');
  return {
    kind: 'embed', provider: 'YouTube', layout: 'landscape',
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    sourceUrl: `https://www.youtube.com/watch?v=${id}`,
    sourceLabel: 'Watch on YouTube', title: 'YouTube video',
  };
}

function vimeo(url) {
  const host = url.hostname.toLowerCase();
  if (!['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) return undefined;

  const id = url.pathname.split('/').filter(Boolean).find(part => VIMEO_ID.test(part));
  if (!id) return fallback(url, 'Vimeo');
  const hash = url.searchParams.get('h');
  const hashQuery = hash && /^[A-Za-z0-9]+$/.test(hash) ? `?h=${hash}&dnt=1` : '?dnt=1';
  return {
    kind: 'embed', provider: 'Vimeo', layout: 'landscape',
    embedUrl: `https://player.vimeo.com/video/${id}${hashQuery}`,
    sourceUrl: `https://vimeo.com/${id}${hash && /^[A-Za-z0-9]+$/.test(hash) ? `?h=${hash}` : ''}`,
    sourceLabel: 'Watch on Vimeo', title: 'Vimeo video',
  };
}

function instagram(url) {
  const host = url.hostname.toLowerCase();
  if (!['instagram.com', 'www.instagram.com'].includes(host)) return undefined;

  const [type, id] = url.pathname.split('/').filter(Boolean);
  if (!['p', 'reel', 'reels'].includes(type) || !id || !INSTAGRAM_ID.test(id)) return fallback(url, 'Instagram');
  const path = `${type === 'p' ? 'p' : 'reel'}/${id}`;
  return {
    kind: 'embed', provider: 'Instagram', layout: 'portrait',
    embedUrl: `https://www.instagram.com/${path}/embed/captioned/`,
    sourceUrl: `https://www.instagram.com/${path}/`,
    sourceLabel: 'Watch on Instagram', title: 'Instagram post',
  };
}

function tiktok(url) {
  const host = url.hostname.toLowerCase();
  if (host !== 'tiktok.com' && !host.endsWith('.tiktok.com')) return undefined;

  const parts = url.pathname.split('/').filter(Boolean);
  const videoAt = parts.indexOf('video');
  const id = videoAt >= 0 ? parts[videoAt + 1] : undefined;
  if (!id || !TIKTOK_ID.test(id)) return fallback(url, 'TikTok');
  return {
    kind: 'embed', provider: 'TikTok', layout: 'portrait',
    embedUrl: `https://www.tiktok.com/player/v1/${id}?controls=1&description=1&music_info=0&rel=0`,
    sourceUrl: sourceUrl(url), sourceLabel: 'Watch on TikTok', title: 'TikTok video',
  };
}

function nativeVideo(url) {
  if (!/\.(mp4|webm)$/i.test(url.pathname)) return undefined;
  return { kind: 'native', sourceUrl: sourceUrl(url), title: 'Video' };
}

/**
 * Converts a user-facing video URL to a provider iframe or a safe source-link fallback.
 * This is deliberately local and synchronous: static builds never depend on provider APIs.
 */
/** @param {unknown} value @returns {VideoResolution} */
export function resolveVideo(value) {
  const url = parseUrl(value);
  if (!url) return { kind: 'invalid' };

  return youtube(url) ?? vimeo(url) ?? instagram(url) ?? tiktok(url) ?? nativeVideo(url) ?? fallback(url);
}
