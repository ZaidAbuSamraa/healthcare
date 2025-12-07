const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all consultations
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, 
                   p.name as patient_name, p.email as patient_email,
                   d.name as doctor_name, d.specialty as doctor_specialty
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            JOIN doctors d ON c.doctor_id = d.id
            ORDER BY c.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get consultation by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, 
                   p.name as patient_name, p.email as patient_email, p.language_preference as patient_language,
                   d.name as doctor_name, d.specialty as doctor_specialty, d.languages as doctor_languages
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            JOIN doctors d ON c.doctor_id = d.id
            WHERE c.id = ?
        `, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Consultation not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get consultations by patient
router.get('/patient/:patientId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, d.name as doctor_name, d.specialty as doctor_specialty
            FROM consultations c
            JOIN doctors d ON c.doctor_id = d.id
            WHERE c.patient_id = ?
            ORDER BY c.created_at DESC
        `, [req.params.patientId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get consultations by doctor
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, p.name as patient_name
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            WHERE c.doctor_id = ?
            ORDER BY c.created_at DESC
        `, [req.params.doctorId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Book a new consultation
router.post('/', async (req, res) => {
    try {
        const { patient_id, doctor_id, consultation_type, scheduled_at, notes } = req.body;
        
        // Check if doctor is available
        const [doctor] = await pool.query('SELECT * FROM doctors WHERE id = ?', [doctor_id]);
        if (doctor.length === 0) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }
        
        // Check if patient exists
        const [patient] = await pool.query('SELECT * FROM patients WHERE id = ?', [patient_id]);
        if (patient.length === 0) {
            return res.status(404).json({ success: false, error: 'Patient not found' });
        }
        
        // Determine if translation is required
        const patientLang = patient[0].language_preference;
        const doctorLangs = doctor[0].languages;
        const requiresTranslation = !doctorLangs.includes(patientLang);
        
        const [result] = await pool.query(
            'INSERT INTO consultations (patient_id, doctor_id, consultation_type, scheduled_at, notes, requires_translation) VALUES (?, ?, ?, ?, ?, ?)',
            [patient_id, doctor_id, consultation_type, scheduled_at, notes, requiresTranslation]
        );
        
        res.status(201).json({ 
            success: true, 
            data: { 
                id: result.insertId, 
                patient_id, 
                doctor_id, 
                consultation_type, 
                scheduled_at,
                requires_translation: requiresTranslation,
                status: 'pending'
            },
            message: requiresTranslation ? 'Consultation booked. Translation support will be provided.' : 'Consultation booked successfully.'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update consultation status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updates = { status };
        
        if (status === 'in_progress') {
            updates.started_at = new Date();
        } else if (status === 'completed') {
            updates.ended_at = new Date();
        }
        
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), req.params.id];
        
        const [result] = await pool.query(
            `UPDATE consultations SET ${setClause} WHERE id = ?`,
            values
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Consultation not found' });
        }
        res.json({ success: true, message: `Consultation ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add diagnosis and prescription
router.patch('/:id/diagnosis', async (req, res) => {
    try {
        const { diagnosis, prescription } = req.body;
        const [result] = await pool.query(
            'UPDATE consultations SET diagnosis = ?, prescription = ? WHERE id = ?',
            [diagnosis, prescription, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Consultation not found' });
        }
        res.json({ success: true, message: 'Diagnosis and prescription added' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancel consultation
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE consultations SET status = "cancelled" WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Consultation not found' });
        }
        res.json({ success: true, message: 'Consultation cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
