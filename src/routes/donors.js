const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all donors (public info only)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, name, country, organization, total_donated, is_anonymous, created_at
            FROM donors 
            WHERE is_anonymous = FALSE
            ORDER BY total_donated DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get top donors (leaderboard)
router.get('/top', async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const [rows] = await pool.query(`
            SELECT id, 
                   CASE WHEN is_anonymous THEN 'Anonymous Donor' ELSE name END as name,
                   country, organization, total_donated
            FROM donors 
            ORDER BY total_donated DESC
            LIMIT ?
        `, [parseInt(limit)]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Login donor
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.query(
            'SELECT * FROM donors WHERE username = ? AND password = ?',
            [username, password]
        );
        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Register new donor
router.post('/', async (req, res) => {
    try {
        const { username, password, name, email, phone, country, organization, is_anonymous } = req.body;
        const [result] = await pool.query(
            'INSERT INTO donors (username, password, name, email, phone, country, organization, is_anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [username, password, name, email, phone, country, organization, is_anonymous || false]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, username, name, email } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, error: 'Username or email already exists' });
        } else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Get donor by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM donors WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Donor not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get donor's donation history
router.get('/:id/donations', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.*, mc.title as case_title, mc.treatment_type, p.name as patient_name
            FROM donations d
            JOIN medical_cases mc ON d.case_id = mc.id
            JOIN patients p ON mc.patient_id = p.id
            WHERE d.donor_id = ?
            ORDER BY d.created_at DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update donor profile
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, country, organization, is_anonymous } = req.body;
        const [result] = await pool.query(
            'UPDATE donors SET name = ?, email = ?, phone = ?, country = ?, organization = ?, is_anonymous = ? WHERE id = ?',
            [name, email, phone, country, organization, is_anonymous, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Donor not found' });
        }
        res.json({ success: true, message: 'Donor updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete donor
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM donors WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Donor not found' });
        }
        res.json({ success: true, message: 'Donor deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
