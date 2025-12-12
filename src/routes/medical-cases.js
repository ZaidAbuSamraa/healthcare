const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all active medical cases (for donors to browse)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT mc.*, 
                   p.name as patient_name,
                   d.name as verified_by_name,
                   ROUND((mc.raised_amount / mc.goal_amount) * 100, 1) as funding_percentage
            FROM medical_cases mc
            JOIN patients p ON mc.patient_id = p.id
            LEFT JOIN doctors d ON mc.verified_by = d.id
            WHERE mc.status IN ('active', 'verified')
            ORDER BY mc.urgency_level DESC, mc.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get cases by treatment type
router.get('/type/:type', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT mc.*, 
                   p.name as patient_name,
                   ROUND((mc.raised_amount / mc.goal_amount) * 100, 1) as funding_percentage
            FROM medical_cases mc
            JOIN patients p ON mc.patient_id = p.id
            WHERE mc.treatment_type = ? AND mc.status IN ('active', 'verified')
            ORDER BY mc.urgency_level DESC
        `, [req.params.type]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get urgent cases
router.get('/urgent', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT mc.*, 
                   p.name as patient_name,
                   ROUND((mc.raised_amount / mc.goal_amount) * 100, 1) as funding_percentage
            FROM medical_cases mc
            JOIN patients p ON mc.patient_id = p.id
            WHERE mc.urgency_level IN ('high', 'critical') AND mc.status = 'active'
            ORDER BY mc.urgency_level DESC, mc.created_at ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get patient's cases
router.get('/patient/:patientId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT mc.*, 
                   ROUND((mc.raised_amount / mc.goal_amount) * 100, 1) as funding_percentage
            FROM medical_cases mc
            WHERE mc.patient_id = ?
            ORDER BY mc.created_at DESC
        `, [req.params.patientId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get case by ID with full details
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT mc.*, 
                   p.name as patient_name, p.medical_history,
                   d.name as verified_by_name, d.specialty as verified_by_specialty,
                   ROUND((mc.raised_amount / mc.goal_amount) * 100, 1) as funding_percentage
            FROM medical_cases mc
            JOIN patients p ON mc.patient_id = p.id
            LEFT JOIN doctors d ON mc.verified_by = d.id
            WHERE mc.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Medical case not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get case donations
router.get('/:id/donations', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.id, d.amount, d.currency, d.message, d.created_at,
                   CASE WHEN d.is_anonymous THEN 'Anonymous' ELSE dn.name END as donor_name,
                   CASE WHEN d.is_anonymous THEN NULL ELSE dn.country END as donor_country
            FROM donations d
            JOIN donors dn ON d.donor_id = dn.id
            WHERE d.case_id = ? AND d.payment_status = 'completed'
            ORDER BY d.created_at DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get case updates (transparency)
router.get('/:id/updates', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM case_updates
            WHERE case_id = ?
            ORDER BY created_at DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get case invoices (transparency)
router.get('/:id/invoices', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM invoices
            WHERE case_id = ?
            ORDER BY invoice_date DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new medical case (by patient) - immediately active for donations
router.post('/', async (req, res) => {
    try {
        const { patient_id, title, treatment_type, description, goal_amount, urgency_level, consent_given } = req.body;
        
        if (!consent_given) {
            return res.status(400).json({ success: false, error: 'Patient consent is required' });
        }
        
        const [result] = await pool.query(
            `INSERT INTO medical_cases (patient_id, title, treatment_type, description, goal_amount, urgency_level, consent_given, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
            [patient_id, title, treatment_type, description, goal_amount, urgency_level || 'medium', consent_given]
        );
        
        res.status(201).json({ 
            success: true, 
            data: { id: result.insertId, status: 'active' },
            message: 'Case is now active and accepting donations!'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify case (by doctor)
router.patch('/:id/verify', async (req, res) => {
    try {
        const { doctor_id } = req.body;
        const [result] = await pool.query(
            `UPDATE medical_cases SET status = 'active', verified_by = ? WHERE id = ? AND status = 'pending_verification'`,
            [doctor_id, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Case not found or already verified' });
        }
        res.json({ success: true, message: 'Case verified and now active for donations' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update case status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const [result] = await pool.query(
            'UPDATE medical_cases SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }
        res.json({ success: true, message: `Case status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add case update
router.post('/:id/updates', async (req, res) => {
    try {
        const { update_type, title, content, image_url, created_by_type, created_by_id } = req.body;
        const [result] = await pool.query(
            `INSERT INTO case_updates (case_id, update_type, title, content, image_url, created_by_type, created_by_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.params.id, update_type, title, content, image_url, created_by_type, created_by_id]
        );
        
        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add invoice to case
router.post('/:id/invoices', async (req, res) => {
    try {
        const { title, description, amount, vendor_name, invoice_date, receipt_url, category, status } = req.body;
        const [result] = await pool.query(
            `INSERT INTO invoices (case_id, title, description, amount, vendor_name, invoice_date, receipt_url, category, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.params.id, title, description, amount, vendor_name, invoice_date, receipt_url, category, status || 'pending']
        );
        
        res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Invoice added successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
