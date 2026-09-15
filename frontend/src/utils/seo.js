export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.phoenixadventures.in').replace(
    /\/$/,
    '',
);

export function canonicalUrl(pathname = '/') {
    const raw = String(pathname || '/').split('?')[0].split('#')[0];
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    const clean = path.replace(/\/+$/, '') || '/';
    return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean}`;
}

export function absoluteAssetUrl(url) {
    if (!url) return `${SITE_URL}/logo-mark.png`;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('//')) return `https:${url}`;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${SITE_URL}${path}`;
}

export function truncateMeta(text, max = 160) {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1).trimEnd()}…`;
}

function asStringList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
            return [];
        }
    }
    return [];
}

function pickupCities(adventure) {
    const cities = [];
    if (asStringList(adventure?.pickup_mumbai).length) cities.push('Mumbai');
    if (asStringList(adventure?.pickup_pune).length) cities.push('Pune');
    if (!cities.length && Array.isArray(adventure?.departure_cities)) {
        for (const c of adventure.departure_cities) {
            const label = String(c || '').toLowerCase() === 'pune' ? 'Pune' : String(c || '').toLowerCase() === 'mumbai' ? 'Mumbai' : '';
            if (label && !cities.includes(label)) cities.push(label);
        }
    }
    return cities;
}

export function adventureMetaDescription(adventure) {
    if (!adventure) {
        return truncateMeta(
            'Sahyadri fort treks and Maharashtra outdoor trips with pickup from Mumbai and Pune. Book with Phoenix Adventures.',
        );
    }
    const bits = [adventure.title || 'Adventure'];
    if (adventure.location) bits[0] += ` in ${adventure.location}`;
    const extras = [adventure.duration, adventure.difficulty].filter(Boolean);
    let sentence = extras.length ? `${bits[0]} — ${extras.join(', ')}.` : `${bits[0]}.`;
    const cities = pickupCities(adventure);
    if (cities.length) sentence += ` Pickup from ${cities.join(' and ')}.`;
    sentence += ' Book with Phoenix Adventures.';
    return truncateMeta(sentence);
}

function nextBatchDate(dates) {
    const list = asStringList(dates);
    if (!list.length) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const future = list
        .map((d) => new Date(d))
        .filter((d) => !Number.isNaN(d.getTime()) && d >= start)
        .sort((a, b) => a - b);
    return future[0] || null;
}

export function adventureJsonLd(adventure, { id, image } = {}) {
    if (!adventure) return null;
    const aid = id || adventure._id || adventure.id;
    const url = canonicalUrl(`/adventure/${aid}`);
    const description = adventureMetaDescription(adventure);
    const img = image || absoluteAssetUrl(null);
    const offer = {
        '@type': 'Offer',
        url,
        priceCurrency: 'INR',
        price: String(adventure.price ?? ''),
        availability: 'https://schema.org/InStock',
    };

    const trip = {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: adventure.title,
        description,
        url,
        image: img,
        offers: offer,
    };

    const count = Number(adventure.reviews_count);
    const rating = Number(adventure.rating);
    if (count > 0 && rating > 0) {
        trip.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: String(rating),
            ratingCount: String(count),
            bestRating: '5',
        };
    }

    const start = nextBatchDate(adventure.available_dates);
    if (!start) return trip;

    const event = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: adventure.title,
        description,
        image: img,
        url,
        startDate: start.toISOString().slice(0, 10),
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
            '@type': 'Place',
            name: adventure.location || 'Maharashtra, India',
        },
        offers: offer,
        organizer: {
            '@type': 'TravelAgency',
            name: 'Phoenix Adventures',
            url: `${SITE_URL}/`,
        },
    };

    return [trip, event];
}

export function articleJsonLd(post, { image } = {}) {
    if (!post) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt || undefined,
        image: image || undefined,
        datePublished: post.created_at || undefined,
        dateModified: post.updated_at || post.created_at || undefined,
        author: {
            '@type': 'Person',
            name: post.author || 'Phoenix Adventures',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Phoenix Adventures',
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/logo-mark.png`,
            },
        },
        mainEntityOfPage: canonicalUrl(`/blog/${post.slug}`),
    };
}

export function faqPageJsonLd(groups) {
    const entities = [];
    for (const g of groups || []) {
        for (const item of g.items || []) {
            if (!item?.q || !item?.a) continue;
            entities.push({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.a,
                },
            });
        }
    }
    if (!entities.length) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: entities,
    };
}
