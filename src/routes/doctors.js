const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all doctors
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM doctors ORDER BY name');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get available doctors
router.get('/available', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM doctors WHERE availability_status = "available" ORDER BY name');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get doctors by specialty
router.get('/specialty/:specialty', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM doctors WHERE specialty = ? AND availability_status = "available" ORDER BY name',
            [req.params.specialty]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Login doctor (must be before /:id route)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.query(
            'SELECT * FROM doctors WHERE username = ? AND password = ?',
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

// Create new doctor (register)
router.post('/', async (req, res) => {
    try {
        const { username, password, name, email, phone, specialty, languages, is_international, availability_status, bio, years_of_experience } = req.body;
        const [result] = await pool.query(
            'INSERT INTO doctors (username, password, name, email, phone, specialty, languages, is_international, availability_status, bio, years_of_experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, password, name, email, phone, specialty, languages, is_international || false, availability_status || 'offline', bio, years_of_experience]
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

// Get doctor by ID (must be after /login route)
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update doctor availability
router.patch('/:id/availability', async (req, res) => {
    try {
        const { availability_status } = req.body;
        const [result] = await pool.query(
            'UPDATE doctors SET availability_status = ? WHERE id = ?',
            [availability_status, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }
        res.json({ success: true, message: 'Availability updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update doctor
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, specialty, languages, is_international, availability_status, bio, years_of_experience } = req.body;
        const [result] = await pool.query(
            'UPDATE doctors SET name = ?, email = ?, phone = ?, specialty = ?, languages = ?, is_international = ?, availability_status = ?, bio = ?, years_of_experience = ? WHERE id = ?',
            [name, email, phone, specialty, languages, is_international, availability_status, bio, years_of_experience, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }
        res.json({ success: true, message: 'Doctor updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete doctor
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM doctors WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }
        res.json({ success: true, message: 'Doctor deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
