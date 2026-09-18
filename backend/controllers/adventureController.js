const aiService = require('../services/aiService');
const { getConvexClient } = require('../utils/convexClient');
const { applyBrochureFields } = require('../utils/parseBrochureFields');
const { pickAdventureFields } = require('../utils/sanitizeAdventurePayload');
const { normalizePricingOptions } = require('../utils/tourPricing');

const normalizeDepartureCities = (input) => {
    const list = Array.isArray(input) ? input : [];
    return [...new Set(
        list
            .map((c) => String(c || '').trim().toLowerCase())
            .filter((c) => c === 'mumbai' || c === 'pune')
    )];
};
const {
  cacheGet,
  cacheSet,
  CACHE_KEYS,
  invalidateAdventureCache,
} = require('../utils/cache');
const logger = require('../utils/logger');
const { isStaffRole } = require('../utils/roles');
require('dotenv').config();

const LIST_CACHE_TTL = Number(process.env.CACHE_TTL_ADVENTURES || 120);
const DETAIL_CACHE_TTL = Number(process.env.CACHE_TTL_ADVENTURE_DETAIL || 180);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const safeJsonParse = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch (err) {
        logger.warn('Failed to JSON.parse field, using fallback:', err.message);
        return fallback;
    }
};

const normalizeDate = (d) => {
    if (typeof d !== 'string' || !DATE_RE.test(d)) return null;
    const dt = new Date(`${d}T00:00:00.000Z`);
    if (Number.isNaN(dt.getTime())) return null;
    return d;
};

const normalizeAvailableDates = (input) => {
    if (!Array.isArray(input)) return [];
    const seen = new Set();
    const out = [];
    for (const raw of input) {
        const d = normalizeDate(raw);
        if (d && !seen.has(d)) {
            seen.add(d);
            out.push(d);
        }
    }
    out.sort();
    return out;
};

const filterFutureDates = (dates) => {
    if (!Array.isArray(dates)) return [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const cutoff = today.toISOString().slice(0, 10);
    return dates.filter((d) => typeof d === 'string' && d >= cutoff);
};

const normalizeAdvancePerPerson = (adventureData) => {
    if (adventureData.advance_per_person === undefined || adventureData.advance_per_person === '') {
        delete adventureData.advance_per_person;
        return null;
    }
    const adv = Number(adventureData.advance_per_person);
    if (!Number.isFinite(adv) || adv < 0) {
        return 'Advance per person must be a valid non-negative number';
    }
    const price = Number(adventureData.price);
    if (Number.isFinite(price) && adv > price) {
        return 'Advance per person cannot exceed base price';
    }
    adventureData.advance_per_person = adv;
    return null;
};

const attachAvailableDates = (adventure, { includeAllDates } = {}) => {
    if (!adventure) return adventure;
    const all = normalizeAvailableDates(adventure.available_dates);
    return {
        ...adventure,
        available_dates: includeAllDates ? all : filterFutureDates(all),
    };
};

const stripInternalFields = (adventure, isAdmin) => {
    if (!adventure || isAdmin) return adventure;
    const { confirmation_pdf_url, ...rest } = adventure;
    return rest;
};

const isRequestAdmin = async (req) => {
    if (!req.user?.id) return false;
    const dbUser = await getConvexClient().getUserById(req.user.id);
    return isStaffRole(dbUser?.role);
};

function datesKey(dates) {
    return (Array.isArray(dates) ? dates : []).slice().sort().join(',');
}

function notifyAvailabilityChange(previous, next) {
    try {
        const { enqueue, JOBS } = require('../utils/jobQueue');
        const prevDates = datesKey(previous?.available_dates);
        const nextDates = datesKey(next?.available_dates);
        const datesAdded = nextDates && nextDates !== prevDates && nextDates.length > prevDates.length;
        const capacityUp = Number(next?.max_participants || 0) > Number(previous?.max_participants || 0);
        if (!datesAdded && !capacityUp) return;

        const adventureId = String(next._id || next.id || previous?._id || '');
        const title = next.title || previous?.title || 'Adventure';
        const datesText = (Array.isArray(next.available_dates) ? next.available_dates : []).join(', ') || 'new dates';

        getConvexClient().listWaitlistForAdventure(adventureId).then((waiting) => {
            if (waiting?.length) {
                enqueue(JOBS.WAITLIST_NOTIFY, {
                    entries: waiting,
                    adventureTitle: title,
                    datesText,
                    adventureId,
                }).catch((err) => logger.warn('waitlist notify enqueue failed:', err.message));
            }
        }).catch((err) => logger.warn('waitlist lookup failed:', err.message));

        if (datesAdded) {
            getConvexClient().getWishlistByAdventure(adventureId).then((wish) => {
                if (wish?.length) {
                    enqueue(JOBS.WISHLIST_DATES, {
                        entries: wish,
                        adventureTitle: title,
                        datesText,
                        adventureId,
                    }).catch((err) => logger.warn('wishlist dates enqueue failed:', err.message));
                }
            }).catch((err) => logger.warn('wishlist lookup failed:', err.message));
        }
    } catch (err) {
        logger.warn('notifyAvailabilityChange failed:', err.message);
    }
}

const applyConfirmationPdf = (adventureData, req) => {
    if (req.confirmationPdf?.secure_url) {
        adventureData.confirmation_pdf_url = req.confirmationPdf.secure_url;
    }
    if (adventureData.remove_confirmation_pdf === 'true') {
        adventureData.confirmation_pdf_url = null;
    }
    delete adventureData.remove_confirmation_pdf;
};

/**
 * Get all adventures with pagination and filters
 */
const getAdventures = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, difficulty, location, search, category, includeAllDates } = req.query;
        const includeAll = includeAllDates === 'true' || includeAllDates === '1';
        const effectiveStatus = status || (includeAll ? undefined : 'active');
        const isAdmin = await isRequestAdmin(req);

        // Cache only public (non-admin) list reads — admin includeAllDates bypasses cache
        const cacheable = !isAdmin && !includeAll;
        const cacheKey = cacheable
            ? `${CACHE_KEYS.adventuresList}${[page, limit, effectiveStatus, difficulty, location, category, search || ''].join(':')}`
            : null;

        if (cacheKey) {
            const cached = await cacheGet(cacheKey);
            if (cached) {
                res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
                res.set('X-Cache', 'HIT');
                return res.json(cached);
            }
        }

        const convexFilters = { page: parseInt(page), limit: parseInt(limit), status: effectiveStatus, difficulty, location, category };
        const result = await getConvexClient().getAdventures(convexFilters);

        if (result && Array.isArray(result.data)) {
            result.data = result.data
                .map((a) => attachAvailableDates(a, { includeAllDates: includeAll }))
                .map((a) => stripInternalFields(a, isAdmin));

            if (search) {
                const lower = search.toLowerCase();
                result.data = result.data.filter((a) =>
                    (a.title || '').toLowerCase().includes(lower)
                    || (a.location || '').toLowerCase().includes(lower)
                    || (a.description || '').toLowerCase().includes(lower)
                );
            }
        }

        if (cacheKey) {
            await cacheSet(cacheKey, result, LIST_CACHE_TTL);
            res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
            res.set('X-Cache', 'MISS');
        } else {
            res.set('Cache-Control', 'private, no-store');
        }

        res.json(result);
    } catch (error) {
        logger.error('Error fetching adventures:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch adventures' });
    }
};

/**
 * Get single adventure by ID
 */
const getAdventureById = async (req, res) => {
    try {
        const { id } = req.params;
        const includeAll = req.query.includeAllDates === 'true' || req.query.includeAllDates === '1';
        const isAdmin = await isRequestAdmin(req);
        const cacheable = !isAdmin && !includeAll;
        const cacheKey = cacheable ? `${CACHE_KEYS.adventureById}${id}` : null;

        if (cacheKey) {
            const cached = await cacheGet(cacheKey);
            if (cached) {
                res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=180');
                res.set('X-Cache', 'HIT');
                return res.json(cached);
            }
        }

        const result = await getConvexClient().getAdventureById(id);

        if (!result) {
            return res.status(404).json({ success: false, message: 'Adventure not found' });
        }

        if (result.status !== 'active' && !isAdmin) {
            return res.status(404).json({ success: false, message: 'Adventure not found' });
        }

        const payload = {
            success: true,
            data: stripInternalFields(
                attachAvailableDates(result, { includeAllDates: includeAll }),
                isAdmin
            ),
        };

        if (cacheKey) {
            await cacheSet(cacheKey, payload, DETAIL_CACHE_TTL);
            res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=180');
            res.set('X-Cache', 'MISS');
        } else {
            res.set('Cache-Control', 'private, no-store');
        }

        res.json(payload);
    } catch (error) {
        logger.error('Error fetching adventure:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch adventure' });
    }
};

/**
 * Create new adventure
 */
const createAdventure = async (req, res) => {
    try {
        const adventureData = req.body;

        if (req.file) {
            adventureData.image_url = req.file.secure_url || req.file.path;
        }

        applyConfirmationPdf(adventureData, req);

        if (adventureData.included !== undefined) {
            adventureData.included = safeJsonParse(adventureData.included, []);
        }
        if (adventureData.excluded !== undefined) {
            adventureData.excluded = safeJsonParse(adventureData.excluded, []);
        }
        if (adventureData.itinerary !== undefined) {
            adventureData.itinerary = safeJsonParse(adventureData.itinerary, []);
        }
        if (adventureData.images !== undefined) {
            adventureData.images = safeJsonParse(adventureData.images, []);
        }
        if (adventureData.pricing_options !== undefined) {
            adventureData.pricing_options = normalizePricingOptions(
                safeJsonParse(adventureData.pricing_options, [])
            );
        }
        if (adventureData.departure_cities !== undefined) {
            adventureData.departure_cities = normalizeDepartureCities(
                safeJsonParse(adventureData.departure_cities, [])
            );
        }
        if (adventureData.available_dates !== undefined) {
            const parsed = safeJsonParse(adventureData.available_dates, []);
            const normalized = normalizeAvailableDates(parsed);
            if (normalized.length === 0) {
                return res.status(400).json({ success: false, message: 'At least one valid available date is required' });
            }
            adventureData.available_dates = normalized;
        }
        if (adventureData.meal_options !== undefined) {
            adventureData.meal_options = safeJsonParse(adventureData.meal_options, []);
        }
        if (adventureData.contact_phones !== undefined) {
            adventureData.contact_phones = safeJsonParse(adventureData.contact_phones, []);
        }

        applyBrochureFields(adventureData);

        if (adventureData.price !== undefined && adventureData.price !== '') {
            const price = Number(adventureData.price);
            if (Number.isFinite(price) && price >= 0) {
                adventureData.price = price;
            } else {
                return res.status(400).json({ success: false, message: 'Price must be a valid number' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Price is required' });
        }
        const advErr = normalizeAdvancePerPerson(adventureData);
        if (advErr) {
            return res.status(400).json({ success: false, message: advErr });
        }
        if (String(adventureData.category || '').toLowerCase() !== 'tour') {
            delete adventureData.advance_per_person;
        }
        if (adventureData.max_participants !== undefined && adventureData.max_participants !== '') {
            const maxParticipants = Number(adventureData.max_participants);
            if (Number.isFinite(maxParticipants) && maxParticipants > 0) {
                adventureData.max_participants = maxParticipants;
            } else {
                return res.status(400).json({ success: false, message: 'Max participants must be a valid positive number' });
            }
        } else {
            delete adventureData.max_participants;
        }

        if (adventureData.category === '') delete adventureData.category;
        if (adventureData.endurance_level === '') delete adventureData.endurance_level;
        if (adventureData.base_village === '') delete adventureData.base_village;
        if (adventureData.elevation === '') delete adventureData.elevation;
        if (adventureData.region === '') delete adventureData.region;
        if (adventureData.price_note === '') delete adventureData.price_note;
        if (!adventureData.image_url) delete adventureData.image_url;
        if (adventureData.rating === '') delete adventureData.rating;
        if (adventureData.reviews_count === '') delete adventureData.reviews_count;

        const result = await getConvexClient().createAdventure(pickAdventureFields(adventureData));
        await invalidateAdventureCache();

        getConvexClient().logAudit({
            actor_id: req.user.id,
            actor_email: req.user.email,
            action: 'adventure.create',
            target_type: 'adventure',
            target_id: result._id || result.id,
            metadata: { title: adventureData.title },
        }).catch((err) => logger.error('Audit log failed:', err.message));

        res.status(201).json({
            success: true,
            message: 'Adventure created successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error creating adventure:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create adventure. ' + (error.message || error.toString())
        });
    }
};

/**
 * Update adventure
 */
const updateAdventure = async (req, res) => {
    try {
        const { id } = req.params;
        const adventureData = req.body;

        if (req.file) {
            adventureData.image_url = req.file.secure_url || req.file.path;
        }

        applyConfirmationPdf(adventureData, req);

        if (adventureData.included !== undefined) {
            adventureData.included = safeJsonParse(adventureData.included, undefined);
        }
        if (adventureData.excluded !== undefined) {
            adventureData.excluded = safeJsonParse(adventureData.excluded, undefined);
        }
        if (adventureData.itinerary !== undefined) {
            adventureData.itinerary = safeJsonParse(adventureData.itinerary, undefined);
        }
        if (adventureData.images !== undefined) {
            adventureData.images = safeJsonParse(adventureData.images, undefined);
        }
        if (adventureData.pricing_options !== undefined) {
            adventureData.pricing_options = normalizePricingOptions(
                safeJsonParse(adventureData.pricing_options, [])
            );
        }
        if (adventureData.departure_cities !== undefined) {
            adventureData.departure_cities = normalizeDepartureCities(
                safeJsonParse(adventureData.departure_cities, [])
            );
        }
        if (adventureData.available_dates !== undefined) {
            const parsed = safeJsonParse(adventureData.available_dates, undefined);
            if (parsed === undefined || parsed === null) {
                delete adventureData.available_dates;
            } else {
                adventureData.available_dates = normalizeAvailableDates(parsed);
            }
        }
        if (adventureData.meal_options !== undefined) {
            adventureData.meal_options = safeJsonParse(adventureData.meal_options, []);
        }
        if (adventureData.contact_phones !== undefined) {
            adventureData.contact_phones = safeJsonParse(adventureData.contact_phones, []);
        }

        applyBrochureFields(adventureData);

        if (adventureData.price !== undefined && adventureData.price !== '') {
            const price = Number(adventureData.price);
            if (Number.isFinite(price) && price >= 0) {
                adventureData.price = price;
            } else {
                return res.status(400).json({ success: false, message: 'Price must be a valid number' });
            }
        }
        if (adventureData.advance_per_person !== undefined) {
            const advErr = normalizeAdvancePerPerson(adventureData);
            if (advErr) {
                return res.status(400).json({ success: false, message: advErr });
            }
        }
        const effectiveCategory = String(
            adventureData.category !== undefined ? adventureData.category : ''
        ).toLowerCase();
        if (effectiveCategory && effectiveCategory !== 'tour') {
            delete adventureData.advance_per_person;
        }
        if (adventureData.max_participants !== undefined && adventureData.max_participants !== '') {
            const maxParticipants = Number(adventureData.max_participants);
            if (Number.isFinite(maxParticipants) && maxParticipants > 0) {
                adventureData.max_participants = maxParticipants;
            } else {
                delete adventureData.max_participants;
            }
        } else {
            delete adventureData.max_participants;
        }

        if (adventureData.category === '') delete adventureData.category;
        if (adventureData.endurance_level === '') delete adventureData.endurance_level;
        if (adventureData.base_village === '') delete adventureData.base_village;
        if (adventureData.elevation === '') delete adventureData.elevation;
        if (adventureData.region === '') delete adventureData.region;
        if (adventureData.price_note === '') delete adventureData.price_note;
        if (adventureData.image_url === '') delete adventureData.image_url;

        const previous = await getConvexClient().getAdventureById(id);
        const result = await getConvexClient().updateAdventure(id, pickAdventureFields(adventureData));

        if (!result) {
            return res.status(404).json({ success: false, message: 'Adventure not found' });
        }

        await invalidateAdventureCache();
        notifyAvailabilityChange(previous, { ...previous, ...pickAdventureFields(adventureData), _id: id });

        getConvexClient().logAudit({
            actor_id: req.user.id,
            actor_email: req.user.email,
            action: 'adventure.update',
            target_type: 'adventure',
            target_id: id,
            metadata: { title: previous?.title || adventureData.title },
        }).catch((err) => logger.error('Audit log failed:', err.message));

        res.json({
            success: true,
            message: 'Adventure updated successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error updating adventure:', error);
        let message = error?.message || 'Failed to update adventure';
        if (/ArgumentValidationError|does not match validator/i.test(message)) {
            message =
                'Could not save adventure — one or more fields have an invalid format (often itinerary or meal options). '
                + 'Please review the day-by-day itinerary and try again.';
        }
        res.status(500).json({ success: false, message });
    }
};

/**
 * Delete adventure
 */
const deleteAdventure = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await getConvexClient().getAdventureById(id);
        const result = await getConvexClient().deleteAdventure(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Adventure not found' });
        }
        await invalidateAdventureCache();
        getConvexClient().logAudit({
            actor_id: req.user.id,
            actor_email: req.user.email,
            action: 'adventure.delete',
            target_type: 'adventure',
            target_id: id,
            metadata: { title: existing?.title },
        }).catch((err) => logger.error('Audit log failed:', err.message));
        res.json({ success: true, message: 'Adventure deleted successfully' });
    } catch (error) {
        logger.error('Error deleting adventure:', error);
        res.status(500).json({ success: false, message: 'Failed to delete adventure' });
    }
};

const optimizeItinerary = async (req, res) => {
    try {
        const { rawItinerary, adventureDetails } = req.body;
        if (!rawItinerary) {
            return res.status(400).json({ success: false, message: 'Raw itinerary is required' });
        }
        const optimizedItinerary = await aiService.optimizeItinerary(rawItinerary, adventureDetails || {});
        res.json({ success: true, data: optimizedItinerary });
    } catch (error) {
        logger.error('Error optimizing itinerary:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const extractFromPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'PDF file is required' });
        }
        const pdfBuffer = req.file.buffer;
        const extractedData = await aiService.extractFromPDF(pdfBuffer);
        const { _parser, _warning, ...data } = extractedData;
        res.json({
            success: true,
            data,
            meta: {
                parser: _parser || 'unknown',
                warning: _warning || null,
            },
        });
    } catch (error) {
        logger.error('Error extracting from PDF:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const generateDescription = async (req, res) => {
    try {
        const adventureDetails = req.body;
        if (!adventureDetails.title || !adventureDetails.location) {
            return res.status(400).json({ success: false, message: 'Title and location are required' });
        }
        const description = await aiService.generateDescription(adventureDetails);
        res.json({ success: true, data: { description } });
    } catch (error) {
        logger.error('Error generating description:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const uploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No images uploaded' });
        }
        // Cloudinary upload middleware sets secure_url / path to the CDN URL
        // never invent local /uploads/... paths (those 404 and break the gallery).
        const imageUrls = req.files.map((file) => {
            const url = file.secure_url || file.path || file.url;
            if (!url) {
                throw new Error('Upload succeeded but no image URL was returned');
            }
            return url;
        });
        res.json({ success: true, data: imageUrls });
    } catch (error) {
        logger.error('Error uploading images:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to upload images' });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const result = await getConvexClient().getDashboardStats();
        res.json({ success: true, data: result });
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics' });
    }
};

/**
 * Download a professional detailed itinerary PDF for admin ops / leaders.
 */
const downloadItineraryPdf = async (req, res) => {
    try {
        const adventure = await getConvexClient().getAdventureById(req.params.id);
        if (!adventure) {
            return res.status(404).json({ success: false, message: 'Adventure not found' });
        }

        const { buildItineraryPdf } = require('../utils/itineraryPdf');
        const { parseAvailableDates, filterUpcomingDepartures, normalizeDepartureDate } = require('../utils/adventureDates');
        let previewDeparture =
          normalizeDepartureDate(req.query.departure_date || req.query.departure) || null;
        if (!previewDeparture) {
          const upcoming = filterUpcomingDepartures(parseAvailableDates(adventure));
          previewDeparture = upcoming[0] || null;
        }
        const { buffer, filename } = await buildItineraryPdf(adventure, {
          audience: previewDeparture ? 'customer' : 'ops',
          departureDate: previewDeparture,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
    } catch (error) {
        logger.error('Error generating itinerary PDF:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate itinerary PDF',
        });
    }
};

module.exports = {
    getAdventures,
    getAdventureById,
    createAdventure,
    updateAdventure,
    deleteAdventure,
    optimizeItinerary,
    extractFromPDF,
    generateDescription,
    uploadImages,
    getDashboardStats,
    downloadItineraryPdf,
    normalizeAvailableDates,
    filterFutureDates,
};
