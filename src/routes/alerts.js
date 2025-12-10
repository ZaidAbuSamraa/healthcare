const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all active alerts
router.get('/', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id,
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   alert_type, severity,
                   ${lang === 'ar' ? 'content_ar as content' : 'content'},
                   affected_areas,
                   ${lang === 'ar' ? 'recommendations_ar as recommendations' : 'recommendations'},
                   source, start_date, end_date, created_at
            FROM public_health_alerts
            WHERE is_active = TRUE AND (end_date IS NULL OR end_date > NOW())
            ORDER BY 
                CASE severity 
                    WHEN 'emergency' THEN 1 
                    WHEN 'critical' THEN 2 
                    WHEN 'warning' THEN 3 
                    ELSE 4 
                END,
                created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get alerts by type
router.get('/type/:type', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id,
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   alert_type, severity,
                   ${lang === 'ar' ? 'content_ar as content' : 'content'},
                   affected_areas, source, created_at
            FROM public_health_alerts
            WHERE alert_type = ? AND is_active = TRUE
            ORDER BY severity DESC, created_at DESC
        `, [req.params.type]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get alerts by severity
router.get('/severity/:severity', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id,
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   alert_type, severity,
                   ${lang === 'ar' ? 'content_ar as content' : 'content'},
                   affected_areas, source, created_at
            FROM public_health_alerts
            WHERE severity = ? AND is_active = TRUE
            ORDER BY created_at DESC
        `, [req.params.severity]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get emergency/critical alerts only
router.get('/urgent', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id,
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   alert_type, severity,
                   ${lang === 'ar' ? 'content_ar as content' : 'content'},
                   affected_areas,
                   ${lang === 'ar' ? 'recommendations_ar as recommendations' : 'recommendations'},
                   source, created_at
            FROM public_health_alerts
            WHERE severity IN ('emergency', 'critical') AND is_active = TRUE
            ORDER BY severity DESC, created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get alert by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM public_health_alerts WHERE id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Alert not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new alert (admin/doctor/organization)
router.post('/', async (req, res) => {
    try {
        const { 
            title, title_ar, alert_type, severity, content, content_ar,
            affected_areas, recommendations, recommendations_ar, source,
            end_date, created_by_type, created_by_id
        } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO public_health_alerts 
             (title, title_ar, alert_type, severity, content, content_ar,
              affected_areas, recommendations, recommendations_ar, source,
              end_date, created_by_type, created_by_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, title_ar, alert_type, severity || 'info', content, content_ar,
             affected_areas, recommendations, recommendations_ar, source,
             end_date, created_by_type, created_by_id]
        );
        
        res.status(201).json({ 
            success: true, 
            data: { id: result.insertId },
            message: 'Alert created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update alert
router.put('/:id', async (req, res) => {
    try {
        const { 
            title, title_ar, alert_type, severity, content, content_ar,
            affected_areas, recommendations, recommendations_ar, 
            source, is_active, end_date
        } = req.body;
        
        await pool.query(
            `UPDATE public_health_alerts SET
             title = COALESCE(?, title),
             title_ar = COALESCE(?, title_ar),
             alert_type = COALESCE(?, alert_type),
             severity = COALESCE(?, severity),
             content = COALESCE(?, content),
             content_ar = COALESCE(?, content_ar),
             affected_areas = COALESCE(?, affected_areas),
             recommendations = COALESCE(?, recommendations),
             recommendations_ar = COALESCE(?, recommendations_ar),
             source = COALESCE(?, source),
             is_active = COALESCE(?, is_active),
             end_date = COALESCE(?, end_date)
             WHERE id = ?`,
            [title, title_ar, alert_type, severity, content, content_ar,
             affected_areas, recommendations, recommendations_ar, 
             source, is_active, end_date, req.params.id]
        );
        
        res.json({ success: true, message: 'Alert updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Deactivate alert
router.patch('/:id/deactivate', async (req, res) => {
    try {
        await pool.query(
            'UPDATE public_health_alerts SET is_active = FALSE, end_date = NOW() WHERE id = ?',
            [req.params.id]
        );
        res.json({ success: true, message: 'Alert deactivated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete alert
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM public_health_alerts WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Alert deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get alerts by area
router.get('/area/:area', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const areaQuery = `%${req.params.area}%`;
        const [rows] = await pool.query(`
            SELECT id,
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   alert_type, severity,
                   ${lang === 'ar' ? 'content_ar as content' : 'content'},
                   affected_areas, source, created_at
            FROM public_health_alerts
            WHERE affected_areas LIKE ? AND is_active = TRUE
            ORDER BY severity DESC, created_at DESC
        `, [areaQuery]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
