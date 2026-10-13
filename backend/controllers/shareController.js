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
  sentence += ' Trekking adventure booking with Phoenix Adventures — Mumbai and Pune pickup, pay by UPI.';
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
    const facts = [adventure.location, adventure.duration, adventure.difficulty].filter(Boolean).join(' · ');
    const price = adventure.price != null && adventure.price !== '' ? `₹${adventure.price}` : '';
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      name: title,
      description,
      url: pageUrl,
      image,
      provider: {
        '@type': 'TravelAgency',
        name: 'Phoenix Adventures',
        url: `${SITE_URL}/`,
      },
    };
    if (price) {
      jsonLd.offers = {
        '@type': 'Offer',
        url: pageUrl,
        priceCurrency: 'INR',
        price: String(adventure.price),
        availability: 'https://schema.org/InStock',
      };
    }

    const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(pageUrl)}" />
  <meta property="og:site_name" content="Phoenix Adventures" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
  <script>
    (function () {
      var ua = navigator.userAgent || '';
      if (!/facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Pinterest|Googlebot|Google-InspectionTool|Storebot-Google|bingbot|DuckDuckBot|GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai|PerplexityBot|Applebot|Amazonbot/i.test(ua)) {
        window.location.replace(${JSON.stringify(pageUrl)});
      }
    })();
  </script>
</head>
<body>
  <article>
    <p>Phoenix Adventures — trekking adventure booking</p>
    <h1>${escapeHtml(title)}</h1>
    ${facts ? `<p>${escapeHtml(facts)}</p>` : ''}
    ${price ? `<p>Price from ${escapeHtml(price)} per person. Pay by UPI.</p>` : '<p>Pay by UPI to book.</p>'}
    <p>${escapeHtml(description)}</p>
    <p>To book: sign in on Phoenix Adventures, choose the date and seats, pay 9372506447@sbi (PHEONIX ADVENTURES LLP), then upload the screenshot and UTR. Pickup is from Mumbai or Pune when the departure lists it.</p>
    <p><a href="${escapeHtml(pageUrl)}">Open this trek booking</a> · <a href="${SITE_URL}/treks">All Sahyadri trek bookings</a> · <a href="${SITE_URL}/faq">Booking FAQ</a></p>
  </article>
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
