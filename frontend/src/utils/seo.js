export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.phoenixadventures.in').replace(
    /\/$/,
    '',
);

/** Primary query: trekking / adventure booking in the Sahyadris. */
export const HOME_TITLE = 'Book Sahyadri Treks & Adventure Trips | Phoenix Adventures';

export const HOME_DESCRIPTION =
    'Book a trekking adventure in the Sahyadris — fort treks, camping, and tours from Mumbai and Pune. Pickup, guides, and UPI booking with Phoenix Adventures.';

export const SEO_KEYWORDS = [
    'trekking adventure booking',
    'trek booking Mumbai',
    'trek booking Pune',
    'Sahyadri trek booking',
    'fort trek booking',
    'weekend trek Mumbai',
    'Raigad trek booking',
    'Rajgad trek',
    'Torna trek',
    'camping trip booking Maharashtra',
    'adventure booking',
    'Phoenix Adventures',
].join(', ');

export const BOOKING_ANSWERS = [
    {
        q: 'How do I book a trekking adventure with Phoenix Adventures?',
        a: 'Phoenix Adventures takes trekking adventure bookings on www.phoenixadventures.in. Open a trek, camping trip, or tour, sign in, choose the date and number of seats, and pay the amount shown by UPI to 9372506447@sbi (PHEONIX ADVENTURES LLP). Upload the payment screenshot and UTR. The team confirms the seat after the bank credit matches.',
    },
    {
        q: 'Which treks can I book from Mumbai and Pune?',
        a: 'You can book Sahyadri fort treks and Maharashtra outdoor trips, including Raigad, Rajgad, Torna, Pratapgad, Shivneri, Hadsar, and Sagargad. Most departures include pickup points in Mumbai and Pune.',
    },
    {
        q: 'What is included when I book a trek?',
        a: 'Each adventure page lists what is included and excluded. A typical trek booking covers a guide, trek meals, camping gear, permits, and first aid. Transport and stay are listed on that departure.',
    },
    {
        q: 'How do I pay for an adventure booking?',
        a: 'Payment is direct UPI only — there is no card gateway on the site. Treks and camping are paid in full at checkout. Tours usually take a per-person advance, with the remaining balance paid by UPI before departure.',
    },
    {
        q: 'Where is Phoenix Adventures, and how do I contact them?',
        a: 'Phoenix Adventures is based at Sindhudurg Building, 56/C8, Kandivali West, Mumbai 400067, Maharashtra. Call +91 93725 06447 or +91 77580 79726, or email pheonixadventuress@gmail.com. The company was established on 22 March 2023.',
    },
];

export function canonicalUrl(pathname = '/') {
    const raw = String(pathname || '/').split('?')[0].split('#')[0];
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    const clean = path.replace(/\/+$/, '') || '/';
    return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean}`;
}

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

export function absoluteAssetUrl(url) {
    if (!url) return `${SITE_URL}/logo-mark.png`;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.includes('res.cloudinary.com')) {
        const full = url.startsWith('http') ? url : `https://${url.replace(/^\/+/, '')}`;
        return full;
    }
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${SITE_URL}${path}`;
}

/** Trek banner: image_url, else first gallery photo. */
export function resolveAdventureBannerPath(adventure) {
    if (!adventure) return null;
    if (adventure.image_url) return adventure.image_url;
    if (adventure.image) return adventure.image;
    const gallery = parseImageList(adventure.images);
    return gallery[0] || null;
}

/** Optimized for WhatsApp / Facebook link previews (Cloudinary). */
export function socialOgImageUrl(url) {
    const abs = absoluteAssetUrl(url);
    if (!abs.includes('res.cloudinary.com')) return abs;
    if (abs.includes('/upload/w_') || abs.includes('/upload/c_limit')) return abs;
    return abs.replace('/upload/', '/upload/w_1200,h_630,c_fill,q_auto,f_jpg/');
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
    sentence += ' Trekking adventure booking with Phoenix Adventures.';
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

export function organizationJsonLd() {
    return {
        '@type': 'TravelAgency',
        '@id': `${SITE_URL}/#organization`,
        name: 'Phoenix Adventures',
        alternateName: 'PHEONIX ADVENTURES LLP',
        description: HOME_DESCRIPTION,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo-mark.png`,
        image: `${SITE_URL}/logo-mark.png`,
        email: 'pheonixadventuress@gmail.com',
        telephone: ['+91-93725-06447', '+91-77580-79726'],
        foundingDate: '2023-03-22',
        priceRange: '₹₹',
        currenciesAccepted: 'INR',
        paymentAccepted: 'UPI',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Sindhudurg Building, 56/C8, Kandivali, Charkop, Sahyadri Nagar, Kandivali West',
            addressLocality: 'Mumbai',
            addressRegion: 'Maharashtra',
            postalCode: '400067',
            addressCountry: 'IN',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 19.2129911,
            longitude: 72.8301628,
        },
        areaServed: [
            { '@type': 'City', name: 'Mumbai' },
            { '@type': 'City', name: 'Pune' },
            { '@type': 'State', name: 'Maharashtra' },
        ],
        knowsAbout: [
            'Sahyadri trekking',
            'fort trek booking',
            'trekking adventure booking',
            'camping trips',
            'Maharashtra outdoor tours',
        ],
        openingHours: 'Mo-Su 09:00-22:00',
        sameAs: [
            'https://www.instagram.com/phoenix_adventures__/',
            'https://www.facebook.com/profile.php?id=61564975211438',
            'https://maps.app.goo.gl/n5uUa7B6FQLKS5aZ6',
        ],
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '139',
            bestRating: '5',
        },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+91-93725-06447',
            email: 'pheonixadventuress@gmail.com',
            contactType: 'reservations',
            areaServed: 'IN',
            availableLanguage: ['en', 'hi', 'mr'],
        },
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Trekking and adventure bookings',
            itemListElement: [
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Sahyadri trek booking',
                        url: `${SITE_URL}/treks`,
                    },
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Camping trip booking',
                        url: `${SITE_URL}/camping`,
                    },
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Adventure tour booking',
                        url: `${SITE_URL}/tours`,
                    },
                },
            ],
        },
    };
}

export function homeGraphJsonLd(extraFaq = []) {
    const qa = [...BOOKING_ANSWERS];
    for (const item of extraFaq) {
        if (!item?.q || !item?.a) continue;
        if (qa.some((row) => row.q === item.q)) continue;
        qa.push(item);
    }

    return {
        '@context': 'https://schema.org',
        '@graph': [
            organizationJsonLd(),
            {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                name: 'Phoenix Adventures',
                url: `${SITE_URL}/`,
                description: HOME_DESCRIPTION,
                publisher: { '@id': `${SITE_URL}/#organization` },
                potentialAction: {
                    '@type': 'SearchAction',
                    target: `${SITE_URL}/search?q={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                },
            },
            {
                '@type': 'FAQPage',
                '@id': `${SITE_URL}/#faq`,
                url: `${SITE_URL}/faq`,
                mainEntity: qa.map((item) => ({
                    '@type': 'Question',
                    name: item.q,
                    acceptedAnswer: { '@type': 'Answer', text: item.a },
                })),
            },
            {
                '@type': 'HowTo',
                name: 'How to book a trekking adventure with Phoenix Adventures',
                description: 'Book a Sahyadri trek, camping weekend, or tour from Mumbai or Pune and pay by UPI.',
                totalTime: 'PT15M',
                step: [
                    { '@type': 'HowToStep', position: 1, name: 'Choose a departure', text: 'Open Treks, Camping, or Tours on phoenixadventures.in and pick a route.' },
                    { '@type': 'HowToStep', position: 2, name: 'Sign in', text: 'Create an account or sign in. Browsing is open; booking needs a login.' },
                    { '@type': 'HowToStep', position: 3, name: 'Select date and seats', text: 'Choose the departure date, pickup city, and number of people.' },
                    { '@type': 'HowToStep', position: 4, name: 'Pay by UPI', text: 'Pay the amount shown to 9372506447@sbi (PHEONIX ADVENTURES LLP).' },
                    { '@type': 'HowToStep', position: 5, name: 'Upload the UTR', text: 'Upload the payment screenshot and UTR. Staff confirm the booking after the bank credit matches.' },
                ],
            },
        ],
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
