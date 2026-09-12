const express = require('express');
const router = express.Router();
const { getConvexClient } = require('../utils/convexClient');
const logger = require('../utils/logger');

function siteOrigin() {
    const raw = (process.env.FRONTEND_URL || 'https://www.phoenixadventures.in').replace(/\/$/, '');
    try {
        const u = new URL(raw);
        if (u.hostname === 'phoenixadventures.in') u.hostname = 'www.phoenixadventures.in';
        return u.origin;
    } catch {
        return 'https://www.phoenixadventures.in';
    }
}

function loc(origin, path) {
    if (path === '/') return `${origin}/`;
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

function xmlEscape(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const STATIC_PAGES = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/treks', changefreq: 'weekly', priority: '0.9' },
    { path: '/camping', changefreq: 'weekly', priority: '0.9' },
    { path: '/tours', changefreq: 'weekly', priority: '0.8' },
    { path: '/adventures', changefreq: 'weekly', priority: '0.8' },
    { path: '/gallery', changefreq: 'monthly', priority: '0.6' },
    { path: '/blog', changefreq: 'weekly', priority: '0.7' },
    { path: '/about', changefreq: 'monthly', priority: '0.7' },
    { path: '/contact', changefreq: 'monthly', priority: '0.6' },
    { path: '/safety', changefreq: 'monthly', priority: '0.5' },
    { path: '/faq', changefreq: 'monthly', priority: '0.5' },
    { path: '/terms', changefreq: 'yearly', priority: '0.3' },
    { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
    { path: '/refund', changefreq: 'yearly', priority: '0.3' },
];

async function collectAdventureUrls(client, origin) {
    const urls = [];
    let page = 1;
    const limit = 100;
    for (;;) {
        const result = await client.getAdventures({ page, limit, status: 'active' });
        const data = Array.isArray(result?.data) ? result.data : [];
        for (const a of data) {
            const id = a._id || a.id;
            if (id) {
                urls.push({
                    loc: loc(origin, `/adventure/${id}`),
                    changefreq: 'weekly',
                    priority: '0.8',
                });
            }
        }
        if (!result?.pagination?.hasMore) break;
        page += 1;
        if (page > 50) break;
    }
    return urls;
}

router.get('/sitemap.xml', async (req, res) => {
    try {
        const origin = siteOrigin();
        const urls = STATIC_PAGES.map((p) => ({
            loc: loc(origin, p.path),
            changefreq: p.changefreq,
            priority: p.priority,
        }));

        const client = getConvexClient();
        urls.push(...(await collectAdventureUrls(client, origin)));

        const posts = await client.getPublishedPosts({});
        for (const post of posts || []) {
            if (post?.slug) {
                urls.push({
                    loc: loc(origin, `/blog/${post.slug}`),
                    changefreq: 'monthly',
                    priority: '0.6',
                });
            }
        }

        const body = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            ...urls.map(
                (u) =>
                    `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
            ),
            '</urlset>',
            '',
        ].join('\n');

        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        res.send(body);
    } catch (error) {
        logger.error('sitemap error:', error);
        res.status(500).type('text/plain').send('Sitemap unavailable');
    }
});

module.exports = router;
