import { Helmet } from 'react-helmet-async';

const SEO_DEFAULTS = {
    title: 'Phoenix Adventures | Premium Indian Trekking & Camping',
    description:
        'Curated Sahyadri treks, Himalayan expeditions, and camping experiences across India. Book premium outdoor adventures with verified guides.',
    image: '/og-cover.jpg',
    type: 'website',
};

const Seo = ({ title, description, image, type = 'website' }) => {
    const fullTitle = title ? `${title} | Phoenix Adventures` : SEO_DEFAULTS.title;
    const desc = description || SEO_DEFAULTS.description;
    const img = image || SEO_DEFAULTS.image;
    const url = typeof window !== 'undefined' ? window.location.href : '';

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:type" content={type} />
            <meta property="og:image" content={img} />
            <meta property="og:url" content={url} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={img} />
        </Helmet>
    );
};

export default Seo;
