const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all upcoming workshops
router.get('/', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id,
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   ${lang === 'ar' ? 'description_ar as description' : 'description'},
                   workshop_type, category, instructor_name, instructor_title,
                   scheduled_date, duration_minutes, location, online_link,
                   max_participants, current_participants, is_free, price,
                   language, status
            FROM workshops
            WHERE status IN ('upcoming', 'ongoing')
            ORDER BY scheduled_date ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get workshops by type (webinar, in_person, hybrid)
router.get('/type/:type', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id,
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   ${lang === 'ar' ? 'description_ar as description' : 'description'},
                   workshop_type, category, instructor_name,
                   scheduled_date, duration_minutes, location, online_link,
                   max_participants, current_participants, is_free, status
            FROM workshops
            WHERE workshop_type = ? AND status IN ('upcoming', 'ongoing')
            ORDER BY scheduled_date ASC
        `, [req.params.type]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get workshops by category
router.get('/category/:category', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id,
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   ${lang === 'ar' ? 'description_ar as description' : 'description'},
                   workshop_type, category, instructor_name,
                   scheduled_date, duration_minutes, is_free, status
            FROM workshops
            WHERE category = ? AND status IN ('upcoming', 'ongoing')
            ORDER BY scheduled_date ASC
        `, [req.params.category]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get workshop by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM workshops WHERE id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Workshop not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new workshop
router.post('/', async (req, res) => {
    try {
        const { 
            title, title_ar, description, description_ar, workshop_type, category,
            instructor_name, instructor_title, instructor_id, instructor_type,
            scheduled_date, duration_minutes, location, online_link,
            max_participants, is_free, price, language
        } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO workshops 
             (title, title_ar, description, description_ar, workshop_type, category,
              instructor_name, instructor_title, instructor_id, instructor_type,
              scheduled_date, duration_minutes, location, online_link,
              max_participants, is_free, price, language)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, title_ar, description, description_ar, workshop_type, category,
             instructor_name, instructor_title, instructor_id, instructor_type || 'doctor',
             scheduled_date, duration_minutes || 60, location, online_link,
             max_participants || 100, is_free !== false, price || 0, language || 'arabic']
        );
        
        res.status(201).json({ 
            success: true, 
            data: { id: result.insertId },
            message: 'Workshop created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update workshop
router.put('/:id', async (req, res) => {
    try {
        const { 
            title, title_ar, description, description_ar, workshop_type, category,
            instructor_name, instructor_title, scheduled_date, duration_minutes,
            location, online_link, max_participants, is_free, price, language, status,
            recording_url, materials_url
        } = req.body;
        
        await pool.query(
            `UPDATE workshops SET
             title = COALESCE(?, title),
             title_ar = COALESCE(?, title_ar),
             description = COALESCE(?, description),
             description_ar = COALESCE(?, description_ar),
             workshop_type = COALESCE(?, workshop_type),
             category = COALESCE(?, category),
             instructor_name = COALESCE(?, instructor_name),
             instructor_title = COALESCE(?, instructor_title),
             scheduled_date = COALESCE(?, scheduled_date),
             duration_minutes = COALESCE(?, duration_minutes),
             location = COALESCE(?, location),
             online_link = COALESCE(?, online_link),
             max_participants = COALESCE(?, max_participants),
             is_free = COALESCE(?, is_free),
             price = COALESCE(?, price),
             language = COALESCE(?, language),
             status = COALESCE(?, status),
             recording_url = COALESCE(?, recording_url),
             materials_url = COALESCE(?, materials_url)
             WHERE id = ?`,
            [title, title_ar, description, description_ar, workshop_type, category,
             instructor_name, instructor_title, scheduled_date, duration_minutes,
             location, online_link, max_participants, is_free, price, language, status,
             recording_url, materials_url, req.params.id]
        );
        
        res.json({ success: true, message: 'Workshop updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update workshop status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query(
            'UPDATE workshops SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        res.json({ success: true, message: 'Workshop status updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete workshop
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM workshops WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Workshop deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Register for a workshop
router.post('/:id/register', async (req, res) => {
    try {
        const { participant_type, participant_id, guest_name, guest_email, guest_phone } = req.body;
        
        // Check if workshop exists and has space
        const [workshop] = await pool.query(
            'SELECT max_participants, current_participants, status FROM workshops WHERE id = ?',
            [req.params.id]
        );
        
        if (workshop.length === 0) {
            return res.status(404).json({ success: false, error: 'Workshop not found' });
        }
        
        if (workshop[0].status !== 'upcoming') {
            return res.status(400).json({ success: false, error: 'Registration is closed for this workshop' });
        }
        
        if (workshop[0].current_participants >= workshop[0].max_participants) {
            return res.status(400).json({ success: false, error: 'Workshop is full' });
        }
        
        // Check for duplicate registration
        const [existing] = await pool.query(
            `SELECT id FROM workshop_registrations 
             WHERE workshop_id = ? AND 
             ((participant_type = ? AND participant_id = ?) OR guest_email = ?)`,
            [req.params.id, participant_type, participant_id, guest_email]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Already registered for this workshop' });
        }
        
        // Register participant
        const [result] = await pool.query(
            `INSERT INTO workshop_registrations 
             (workshop_id, participant_type, participant_id, guest_name, guest_email, guest_phone)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.params.id, participant_type, participant_id, guest_name, guest_email, guest_phone]
        );
        
        // Update participant count
        await pool.query(
            'UPDATE workshops SET current_participants = current_participants + 1 WHERE id = ?',
            [req.params.id]
        );
        
        res.status(201).json({ 
            success: true, 
            data: { registration_id: result.insertId },
            message: 'Successfully registered for workshop'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get workshop registrations
router.get('/:id/registrations', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT wr.*, 
                   CASE 
                       WHEN wr.participant_type = 'patient' THEN p.name
                       WHEN wr.participant_type = 'volunteer' THEN v.name
                       ELSE wr.guest_name
                   END as participant_name,
                   CASE 
                       WHEN wr.participant_type = 'patient' THEN p.email
                       WHEN wr.participant_type = 'volunteer' THEN v.email
                       ELSE wr.guest_email
                   END as participant_email
            FROM workshop_registrations wr
            LEFT JOIN patients p ON wr.participant_type = 'patient' AND wr.participant_id = p.id
            LEFT JOIN volunteers v ON wr.participant_type = 'volunteer' AND wr.participant_id = v.id
            WHERE wr.workshop_id = ?
            ORDER BY wr.registered_at DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancel registration
router.delete('/:id/register/:registrationId', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM workshop_registrations WHERE id = ? AND workshop_id = ?',
            [req.params.registrationId, req.params.id]
        );
        
        if (result.affectedRows > 0) {
            await pool.query(
                'UPDATE workshops SET current_participants = current_participants - 1 WHERE id = ? AND current_participants > 0',
                [req.params.id]
            );
        }
        
        res.json({ success: true, message: 'Registration cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark attendance
router.patch('/registrations/:registrationId/attend', async (req, res) => {
    try {
        await pool.query(
            'UPDATE workshop_registrations SET attended = TRUE WHERE id = ?',
            [req.params.registrationId]
        );
        res.json({ success: true, message: 'Attendance marked' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit feedback
router.patch('/registrations/:registrationId/feedback', async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        await pool.query(
            'UPDATE workshop_registrations SET rating = ?, feedback = ? WHERE id = ?',
            [rating, feedback, req.params.registrationId]
        );
        res.json({ success: true, message: 'Feedback submitted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get completed workshops (with recordings)
router.get('/archive/completed', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const [rows] = await pool.query(`
            SELECT id,
                   ${lang === 'ar' ? 'title_ar as title' : 'title'},
                   ${lang === 'ar' ? 'description_ar as description' : 'description'},
                   workshop_type, category, instructor_name,
                   scheduled_date, duration_minutes, recording_url, materials_url
            FROM workshops
            WHERE status = 'completed' AND recording_url IS NOT NULL
            ORDER BY scheduled_date DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
