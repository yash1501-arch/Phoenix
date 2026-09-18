const { getConvexClient } = require('../utils/convexClient');
const { SITE_URL, adventurePublicImage } = require('../utils/assetUrl');
const logger = require('../utils/logger');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function adventureShareDescription(adventure) {
  const bits = [adventure?.title || 'Adventure'];
  if (adventure?.location) bits[0] += ` in ${adventure.location}`;
  const extras = [adventure?.duration, adventure?.difficulty].filter(Boolean);
  let sentence = extras.length ? `${bits[0]} — ${extras.join(', ')}.` : `${bits[0]}.`;
  sentence += ' Book with Phoenix Adventures.';
  if (sentence.length > 200) sentence = `${sentence.slice(0, 197).trimEnd()}…`;
  return sentence;
}

exports.getAdventureSharePage = async (req, res) => {
  try {
    const { id } = req.params;
    const adventure = await getConvexClient().getAdventureById(id);
    if (!adventure || adventure.status === 'draft') {
      return res.status(404).send('Not found');
    }

    const title = adventure.title || 'Adventure';
    const description = adventureShareDescription(adventure);
    const image = adventurePublicImage(adventure);
    const pageUrl = `${SITE_URL}/adventure/${id}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}" />
</head>
<body>
  <p><a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(html);
  } catch (error) {
    logger.error('share adventure page error:', error.message);
    return res.status(500).send('Server error');
  }
};
