const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all patients
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Login patient (must be before /:id route)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.query(
            'SELECT * FROM patients WHERE username = ? AND password = ?',
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

// Create new patient (register)
router.post('/', async (req, res) => {
    try {
        const { username, password, name, email, phone, date_of_birth, gender, language_preference, medical_history } = req.body;
        const [result] = await pool.query(
            'INSERT INTO patients (username, password, name, email, phone, date_of_birth, gender, language_preference, medical_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, password, name, email, phone, date_of_birth, gender, language_preference || 'arabic', medical_history]
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

// Get patient by ID (must be after /login route)
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Patient not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update patient
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, date_of_birth, gender, language_preference, medical_history } = req.body;
        const [result] = await pool.query(
            'UPDATE patients SET name = ?, email = ?, phone = ?, date_of_birth = ?, gender = ?, language_preference = ?, medical_history = ? WHERE id = ?',
            [name, email, phone, date_of_birth, gender, language_preference, medical_history, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Patient not found' });
        }
        res.json({ success: true, message: 'Patient updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete patient
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Patient not found' });
        }
        res.json({ success: true, message: 'Patient deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
