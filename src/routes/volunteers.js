const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Register new volunteer/NGO
router.post('/', async (req, res) => {
    try {
        const { username, password, name, email, phone, organization_name, organization_type, coverage_areas } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO volunteers (username, password, name, email, phone, organization_name, organization_type, coverage_areas) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, password, name, email, phone, organization_name, organization_type || 'individual', coverage_areas]
        );
        
        res.status(201).json({ 
            success: true, 
            data: { id: result.insertId, username, name, organization_type: organization_type || 'individual' },
            message: 'Volunteer registered successfully'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, error: 'Username or email already exists' });
        } else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Volunteer login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.query(
            'SELECT * FROM volunteers WHERE username = ? AND password = ?',
            [username, password]
        );
        
        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all available volunteers
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM volunteers 
            WHERE availability_status = 'available' AND is_verified = TRUE
            ORDER BY rating DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get volunteer by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM volunteers WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.status(404).json({ success: false, error: 'Volunteer not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get volunteer's delivery history
router.get('/:id/deliveries', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.*, mr.medication_name, mr.medication_type, mr.urgency_level,
                   p.name as patient_name
            FROM deliveries d
            JOIN medication_requests mr ON d.request_id = mr.id
            JOIN patients p ON mr.patient_id = p.id
            WHERE d.volunteer_id = ?
            ORDER BY d.created_at DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update volunteer availability
router.patch('/:id/availability', async (req, res) => {
    try {
        const { availability_status } = req.body;
        await pool.query(
            'UPDATE volunteers SET availability_status = ? WHERE id = ?',
            [availability_status, req.params.id]
        );
        res.json({ success: true, message: 'Availability updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get volunteers by organization type
router.get('/type/:type', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM volunteers 
            WHERE organization_type = ? AND is_verified = TRUE
            ORDER BY rating DESC
        `, [req.params.type]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
