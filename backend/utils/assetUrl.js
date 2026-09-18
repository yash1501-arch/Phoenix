const SITE_URL = (process.env.SITE_URL || process.env.FRONTEND_URL || 'https://www.phoenixadventures.in').replace(
  /\/$/,
  '',
);

function parseImageList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      if (raw.startsWith('http://') || raw.startsWith('https://')) return [raw];
      return [];
    }
  }
  return [];
}

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

/** Hero/banner: main image_url, else first gallery image. */
function resolveAdventureBannerUrl(adventure) {
  const primary = adventure?.image_url || adventure?.image;
  if (primary) return absoluteAssetUrl(primary);
  const gallery = parseImageList(adventure?.images);
  if (gallery.length) return absoluteAssetUrl(gallery[0]);
  return `${SITE_URL}/logo-mark.png`;
}

/** WhatsApp / Facebook-friendly size and format (Cloudinary). */
function toOpenGraphImageUrl(url) {
  const abs = absoluteAssetUrl(url);
  if (!abs.includes('res.cloudinary.com')) return abs;
  if (abs.includes('/upload/w_') || abs.includes('/upload/c_limit')) return abs;
  return abs.replace('/upload/', '/upload/w_1200,h_630,c_fill,q_auto,f_jpg/');
}

function adventurePublicImage(adventure) {
  return toOpenGraphImageUrl(resolveAdventureBannerUrl(adventure));
}

module.exports = {
  SITE_URL,
  absoluteAssetUrl,
  parseImageList,
  resolveAdventureBannerUrl,
  toOpenGraphImageUrl,
  adventurePublicImage,
};
