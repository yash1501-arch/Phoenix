import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { HOME_DESCRIPTION, HOME_TITLE, SEO_KEYWORDS, SITE_URL, absoluteAssetUrl, canonicalUrl, socialOgImageUrl } from '../utils/seo';

const SEO_DEFAULTS = {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    keywords: SEO_KEYWORDS,
    image: `${SITE_URL}/logo-mark.png`,
    type: 'website',
};

const Seo = ({
    title,
    description,
    keywords,
    image,
    type = 'website',
    noindex = false,
    jsonLd,
    titleSuffix = true,
    path,
}) => {
    const location = useLocation();
    const pathname = path || location.pathname || '/';
    const url = canonicalUrl(pathname);
    const desc = description || SEO_DEFAULTS.description;
    const keys = keywords || SEO_DEFAULTS.keywords;
    const robots = noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    const img = socialOgImageUrl(absoluteAssetUrl(image || SEO_DEFAULTS.image));

    let fullTitle = SEO_DEFAULTS.title;
    if (title) {
        if (!titleSuffix || /phoenix adventures/i.test(title)) fullTitle = title;
        else fullTitle = `${title} | Phoenix Adventures`;
    }

    const graphs = jsonLd == null ? [] : Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : [jsonLd];

    useEffect(() => {
        const keepLast = (selector) => {
            const nodes = [...document.head.querySelectorAll(selector)];
            nodes.slice(0, -1).forEach((n) => n.remove());
        };
        keepLast('link[rel="canonical"]');
        keepLast('meta[name="description"]');
        keepLast('meta[name="robots"]');
        ['og:url', 'og:title', 'og:description', 'og:image', 'og:type'].forEach((p) => {
            keepLast(`meta[property="${p}"]`);
        });
        ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:url'].forEach((n) => {
            keepLast(`meta[name="${n}"]`);
            keepLast(`meta[property="${n}"]`);
        });
    }, [url, fullTitle, desc, img, noindex, type, keys]);

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            <meta name="keywords" content={keys} />
            <link rel="canonical" href={url} />
            <meta name="robots" content={robots} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content="Phoenix Adventures" />
            <meta property="og:image" content={img} />
            <meta property="og:image:secure_url" content={img} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:url" content={url} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={img} />
            <meta name="twitter:url" content={url} />
            {graphs.map((node, i) => (
                <script key={i} type="application/ld+json">
                    {JSON.stringify(node).replace(/</g, '\\u003c')}
                </script>
            ))}
        </Helmet>
    );
};

export default Seo;
