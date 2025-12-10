const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all published health guides
router.get('/', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id, 
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   ${lang === 'ar' ? 'summary_ar as summary' : 'summary'},
                   category, image_url, author_name, view_count, tags, created_at
            FROM health_guides
            WHERE is_published = TRUE
            ORDER BY created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get guides by category
router.get('/category/:category', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id, 
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   ${lang === 'ar' ? 'summary_ar as summary' : 'summary'},
                   category, image_url, author_name, view_count, created_at
            FROM health_guides
            WHERE category = ? AND is_published = TRUE
            ORDER BY created_at DESC
        `, [req.params.category]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search guides
router.get('/search/:query', async (req, res) => {
    try {
        const searchQuery = `%${req.params.query}%`;
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id, 
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   ${lang === 'ar' ? 'summary_ar as summary' : 'summary'},
                   category, image_url, author_name, created_at
            FROM health_guides
            WHERE (title LIKE ? OR title_ar LIKE ? OR tags LIKE ? OR content LIKE ? OR content_ar LIKE ?)
                  AND is_published = TRUE
            ORDER BY view_count DESC
        `, [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get guide by ID (full content)
router.get('/:id', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        
        // Increment view count
        await pool.query('UPDATE health_guides SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
        
        const [rows] = await pool.query(`
            SELECT id,
                   title, title_ar,
                   ${lang === 'ar' ? 'content_ar as content' : 'content'},
                   ${lang === 'ar' ? 'summary_ar as summary' : 'summary'},
                   category, image_url, video_url, author_type, author_name, 
                   view_count, tags, created_at, updated_at
            FROM health_guides
            WHERE id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Guide not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new health guide (by doctor/admin)
router.post('/', async (req, res) => {
    try {
        const { 
            title, title_ar, category, content, content_ar, 
            summary, summary_ar, image_url, video_url,
            author_type, author_id, author_name, tags 
        } = req.body;
        
        const [result] = await pool.query(`
            INSERT INTO health_guides 
            (title, title_ar, category, content, content_ar, 
             summary, summary_ar, image_url, video_url, 
             author_type, author_id, author_name, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title, title_ar, category, content, content_ar,
            summary, summary_ar, image_url, video_url,
            author_type, author_id, author_name, tags
        ]);
        
        res.status(201).json({ 
            success: true, 
            data: { id: result.insertId },
            message: 'Health guide created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update health guide
router.put('/:id', async (req, res) => {
    try {
        const { 
            title, title_ar, category, content, content_ar, 
            summary, summary_ar, image_url, video_url, tags, is_published 
        } = req.body;
        
        await pool.query(
            `UPDATE health_guides SET
             title = COALESCE(?, title),
             title_ar = COALESCE(?, title_ar),
             category = COALESCE(?, category),
             content = COALESCE(?, content),
             content_ar = COALESCE(?, content_ar),
             summary = COALESCE(?, summary),
             summary_ar = COALESCE(?, summary_ar),
             image_url = COALESCE(?, image_url),
             video_url = COALESCE(?, video_url),
             tags = COALESCE(?, tags),
             is_published = COALESCE(?, is_published)
             WHERE id = ?`,
            [title, title_ar, category, content, content_ar, summary, summary_ar,
             image_url, video_url, tags, is_published, req.params.id]
        );
        
        res.json({ success: true, message: 'Guide updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete health guide
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM health_guides WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Guide deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get popular guides
router.get('/stats/popular', async (req, res) => {
    try {
        const limit = req.query.limit || 5;
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id, 
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   category, view_count, author_name
            FROM health_guides
            WHERE is_published = TRUE
            ORDER BY view_count DESC
            LIMIT ?
        `, [parseInt(limit)]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get categories with count
router.get('/stats/categories', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT category, COUNT(*) as count
            FROM health_guides
            WHERE is_published = TRUE
            GROUP BY category
            ORDER BY count DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
