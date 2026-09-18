const SITE_URL = (process.env.SITE_URL || process.env.FRONTEND_URL || 'https://www.phoenixadventures.in').replace(
  /\/$/,
  '',
);

function absoluteAssetUrl(url) {
  if (!url) return `${SITE_URL}/logo-mark.png`;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.includes('res.cloudinary.com')) {
    return url.startsWith('//') ? `https:${url}` : `https://${url.replace(/^\/+/, '')}`;
  }
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${SITE_URL}${path}`;
}

function adventurePublicImage(adventure) {
  const raw = adventure?.image_url || adventure?.image;
  return absoluteAssetUrl(raw);
}

module.exports = {
  SITE_URL,
  absoluteAssetUrl,
  adventurePublicImage,
};
