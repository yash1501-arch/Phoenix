const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth, adminOnly } = require('../middleware/auth');
const { getConvexClient } = require('../utils/convexClient');
const logger = require('../utils/logger');

// ── Public endpoints ──────────────────────────────────────────────

// GET /api/blog — published posts
router.get('/', async (req, res) => {
    try {
        const { category, limit } = req.query;
        const posts = await getConvexClient().getPublishedPosts({
            category: category || undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        // Strip full content from list view for payload size
        const summaries = (posts || []).map(({ content, ...rest }) => rest);
        res.json({ success: true, data: summaries });
    } catch (error) {
        logger.error('blog.list error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
});

// GET /api/blog/post/:slug — single published post with content
router.get('/post/:slug', async (req, res) => {
    try {
        const post = await getConvexClient().getBlogPostBySlug(req.params.slug);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        res.json({ success: true, data: post });
    } catch (error) {
        logger.error('blog.getBySlug error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch post' });
    }
});

// ── Admin endpoints ───────────────────────────────────────────────

// GET /api/blog/admin/all — all posts incl. drafts
router.get('/admin/all', auth, adminOnly, async (req, res) => {
    try {
        const posts = await getConvexClient().getBlogPosts();
        res.json({ success: true, data: posts });
    } catch (error) {
        logger.error('blog.adminList error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
});

// GET /api/blog/admin/:id — single post for editing
router.get('/admin/:id', auth, adminOnly, async (req, res) => {
    try {
        const post = await getConvexClient().getBlogPostById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        res.json({ success: true, data: post });
    } catch (error) {
        logger.error('blog.adminGet error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch post' });
    }
});

// POST /api/blog/admin — create
router.post('/admin', [
    auth, adminOnly,
    check('title', 'Title is required').not().isEmpty().trim().isLength({ max: 200 }),
    check('excerpt', 'Excerpt is required').not().isEmpty().trim().isLength({ max: 500 }),
    check('content', 'Content is required').not().isEmpty().isLength({ max: 50000 }),
    check('category', 'Category is required').not().isEmpty(),
    check('author', 'Author is required').not().isEmpty().trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    try {
        const { title, slug, excerpt, content, category, cover_image, tags, author, published } = req.body;
        const id = await getConvexClient().createBlogPost({
            title, slug, excerpt, content, category, cover_image,
            tags: Array.isArray(tags) ? tags : [],
            author,
            published: published === true || published === 'true',
        });
        res.status(201).json({ success: true, data: { id }, message: 'Post created' });
    } catch (error) {
        logger.error('blog.create error:', error);
        const msg = error.message?.includes('Slug') ? error.message : 'Failed to create post';
        res.status(500).json({ success: false, message: msg });
    }
});

// PUT /api/blog/admin/:id — update
router.put('/admin/:id', auth, adminOnly, async (req, res) => {
    try {
        const { title, excerpt, content, category, cover_image, tags, author, published } = req.body;
        await getConvexClient().updateBlogPost(req.params.id, {
            ...(title !== undefined && { title }),
            ...(excerpt !== undefined && { excerpt }),
            ...(content !== undefined && { content }),
            ...(category !== undefined && { category }),
            ...(cover_image !== undefined && { cover_image }),
            ...(tags !== undefined && { tags }),
            ...(author !== undefined && { author }),
            ...(published !== undefined && { published: published === true || published === 'true' }),
        });
        res.json({ success: true, message: 'Post updated' });
    } catch (error) {
        logger.error('blog.update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update post' });
    }
});

// DELETE /api/blog/admin/:id
router.delete('/admin/:id', auth, adminOnly, async (req, res) => {
    try {
        await getConvexClient().deleteBlogPost(req.params.id);
        res.json({ success: true, message: 'Post deleted' });
    } catch (error) {
        logger.error('blog.delete error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete post' });
    }
});

module.exports = router;
