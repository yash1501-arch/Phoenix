const aiService = require('../services/aiService');
const { getConvexClient } = require('../utils/convexClient');
const logger = require('../utils/logger');
require('dotenv').config();

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

const attachAvailableDates = (adventure, { includeAllDates } = {}) => {
    if (!adventure) return adventure;
    const all = normalizeAvailableDates(adventure.available_dates);
    return {
        ...adventure,
        available_dates: includeAllDates ? all : filterFutureDates(all),
    };
};

/**
 * Get all adventures with pagination and filters
 */
const getAdventures = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, difficulty, location, search, category, includeAllDates } = req.query;
        const includeAll = includeAllDates === 'true' || includeAllDates === '1';

        const result = await getConvexClient().getAdventures({
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            difficulty,
            location,
            search,
            category,
        });

        if (result && Array.isArray(result.data)) {
            result.data = result.data.map((a) => attachAvailableDates(a, { includeAllDates: includeAll }));

            if (search || category) {
                const lower = (search || '').toLowerCase();
                result.data = result.data.filter((a) => {
                    const matchesSearch = !lower
                        || (a.title || '').toLowerCase().includes(lower)
                        || (a.location || '').toLowerCase().includes(lower)
                        || (a.description || '').toLowerCase().includes(lower);
                    const matchesCategory = !category || (a.category || '').toLowerCase().includes(category.toLowerCase());
                    return matchesSearch && matchesCategory;
                });
            }
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

        const result = await getConvexClient().getAdventureById(id);

        if (!result) {
            return res.status(404).json({ success: false, message: 'Adventure not found' });
        }

        res.json({ success: true, data: attachAvailableDates(result, { includeAllDates: includeAll }) });
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
            adventureData.image_url = req.file.path;
        }

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
        if (adventureData.available_dates !== undefined) {
            const parsed = safeJsonParse(adventureData.available_dates, []);
            const normalized = normalizeAvailableDates(parsed);
            if (normalized.length === 0) {
                return res.status(400).json({ success: false, message: 'At least one valid available date is required' });
            }
            adventureData.available_dates = normalized;
        }

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

        if (adventureData.endurance_level === '') delete adventureData.endurance_level;
        if (!adventureData.image_url) delete adventureData.image_url;
        if (adventureData.rating === '') delete adventureData.rating;
        if (adventureData.reviews_count === '') delete adventureData.reviews_count;

        const result = await getConvexClient().createAdventure(adventureData);

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
            adventureData.image_url = req.file.path;
        }

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
        if (adventureData.available_dates !== undefined) {
            const parsed = safeJsonParse(adventureData.available_dates, undefined);
            if (parsed === undefined || parsed === null) {
                delete adventureData.available_dates;
            } else {
                adventureData.available_dates = normalizeAvailableDates(parsed);
            }
        }

        if (adventureData.price !== undefined && adventureData.price !== '') {
            const price = Number(adventureData.price);
            if (Number.isFinite(price) && price >= 0) {
                adventureData.price = price;
            } else {
                return res.status(400).json({ success: false, message: 'Price must be a valid number' });
            }
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

        if (adventureData.endurance_level === '') delete adventureData.endurance_level;
        if (adventureData.image_url === '') delete adventureData.image_url;

        const result = await getConvexClient().updateAdventure(id, adventureData);

        if (!result) {
            return res.status(404).json({ success: false, message: 'Adventure not found' });
        }

        res.json({
            success: true,
            message: 'Adventure updated successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error updating adventure:', error);
        res.status(500).json({ success: false, message: 'Failed to update adventure' });
    }
};

/**
 * Delete adventure
 */
const deleteAdventure = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getConvexClient().deleteAdventure(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Adventure not found' });
        }
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
        res.json({ success: true, data: extractedData });
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
        const imageUrls = req.files.map(file => `/uploads/images/${file.filename}`);
        res.json({ success: true, data: imageUrls });
    } catch (error) {
        logger.error('Error uploading images:', error);
        res.status(500).json({ success: false, message: 'Failed to upload images' });
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
    normalizeAvailableDates,
    filterFutureDates,
};
