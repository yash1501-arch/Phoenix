const express = require('express');
const router = express.Router();
const adventureController = require('../controllers/adventureController');
const { uploadImage, uploadAdventure, uploadPDF, uploadImages } = require('../middleware/upload');
const { auth, optionalAuth, adminOnly, clerkOrAdmin } = require('../middleware/auth');

// Get all adventures with filters (public; internal fields hidden unless admin)
router.get('/', optionalAuth, adventureController.getAdventures);

// Get dashboard statistics (admin only)
router.get('/stats', auth, clerkOrAdmin, adventureController.getDashboardStats);

// Professional itinerary PDF (staff) — must be before /:id if pattern conflicts
router.get('/:id/itinerary.pdf', auth, clerkOrAdmin, adventureController.downloadItineraryPdf);

// Get single adventure (public; inactive hidden unless admin)
router.get('/:id', optionalAuth, adventureController.getAdventureById);

// Create new adventure (admin only)
router.post('/', auth, adminOnly, ...uploadAdventure.fields(), adventureController.createAdventure);

// Update adventure (admin only)
router.put('/:id', auth, adminOnly, ...uploadAdventure.fields(), adventureController.updateAdventure);

// Delete adventure (admin only)
router.delete('/:id', auth, adminOnly, adventureController.deleteAdventure);

// AI-powered features (admin only)
router.post('/ai/optimize-itinerary', auth, adminOnly, adventureController.optimizeItinerary);
router.post('/ai/extract-pdf', auth, adminOnly, uploadPDF.single('pdf'), adventureController.extractFromPDF);
router.post('/ai/generate-description', auth, adminOnly, adventureController.generateDescription);

// Upload multiple images (admin only)
router.post('/upload/images', auth, adminOnly, ...uploadImages.array('images', 10), adventureController.uploadImages);

module.exports = router;
