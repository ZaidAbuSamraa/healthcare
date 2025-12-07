const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all donations (admin view)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.*, 
                   CASE WHEN d.is_anonymous THEN 'Anonymous' ELSE dn.name END as donor_name,
                   mc.title as case_title,
                   p.name as patient_name
            FROM donations d
            JOIN donors dn ON d.donor_id = dn.id
            JOIN medical_cases mc ON d.case_id = mc.id
            JOIN patients p ON mc.patient_id = p.id
            ORDER BY d.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get recent donations
router.get('/recent', async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const [rows] = await pool.query(`
            SELECT d.id, d.amount, d.currency, d.created_at,
                   CASE WHEN d.is_anonymous THEN 'Anonymous' ELSE dn.name END as donor_name,
                   mc.title as case_title
            FROM donations d
            JOIN donors dn ON d.donor_id = dn.id
            JOIN medical_cases mc ON d.case_id = mc.id
            WHERE d.payment_status = 'completed'
            ORDER BY d.created_at DESC
            LIMIT ?
        `, [parseInt(limit)]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get donation statistics
router.get('/stats', async (req, res) => {
    try {
        const [totalDonations] = await pool.query(`
            SELECT COUNT(*) as total_count, SUM(amount) as total_amount
            FROM donations WHERE payment_status = 'completed'
        `);
        
        const [byTreatmentType] = await pool.query(`
            SELECT mc.treatment_type, COUNT(d.id) as count, SUM(d.amount) as total
            FROM donations d
            JOIN medical_cases mc ON d.case_id = mc.id
            WHERE d.payment_status = 'completed'
            GROUP BY mc.treatment_type
        `);
        
        const [activeCases] = await pool.query(`
            SELECT COUNT(*) as count FROM medical_cases WHERE status = 'active'
        `);
        
        const [fundedCases] = await pool.query(`
            SELECT COUNT(*) as count FROM medical_cases WHERE status IN ('funded', 'completed')
        `);
        
        res.json({ 
            success: true, 
            data: {
                total_donations: totalDonations[0].total_count,
                total_amount: totalDonations[0].total_amount || 0,
                by_treatment_type: byTreatmentType,
                active_cases: activeCases[0].count,
                funded_cases: fundedCases[0].count
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Make a donation
router.post('/', async (req, res) => {
    try {
        const { donor_id, case_id, amount, currency, payment_method, is_anonymous, message } = req.body;
        
        // Check if case exists and is active
        const [caseCheck] = await pool.query(
            'SELECT * FROM medical_cases WHERE id = ? AND status = "active"',
            [case_id]
        );
        
        if (caseCheck.length === 0) {
            return res.status(400).json({ success: false, error: 'Case not found or not accepting donations' });
        }
        
        // Generate transaction ID
        const transaction_id = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // Insert donation
        const [result] = await pool.query(
            `INSERT INTO donations (donor_id, case_id, amount, currency, payment_method, payment_status, transaction_id, is_anonymous, message)
             VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?)`,
            [donor_id, case_id, amount, currency || 'USD', payment_method || 'credit_card', transaction_id, is_anonymous || false, message]
        );
        
        // Update case raised amount
        await pool.query(
            'UPDATE medical_cases SET raised_amount = raised_amount + ? WHERE id = ?',
            [amount, case_id]
        );
        
        // Update donor total
        await pool.query(
            'UPDATE donors SET total_donated = total_donated + ? WHERE id = ?',
            [amount, donor_id]
        );
        
        // Check if case is now fully funded
        const [updatedCase] = await pool.query(
            'SELECT raised_amount, goal_amount FROM medical_cases WHERE id = ?',
            [case_id]
        );
        
        if (updatedCase[0].raised_amount >= updatedCase[0].goal_amount) {
            await pool.query(
                'UPDATE medical_cases SET status = "funded" WHERE id = ?',
                [case_id]
            );
        }
        
        res.status(201).json({ 
            success: true, 
            data: { 
                id: result.insertId, 
                transaction_id,
                amount,
                case_id
            },
            message: 'Thank you for your donation!'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get donation by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.*, 
                   dn.name as donor_name, dn.email as donor_email,
                   mc.title as case_title, mc.treatment_type,
                   p.name as patient_name
            FROM donations d
            JOIN donors dn ON d.donor_id = dn.id
            JOIN medical_cases mc ON d.case_id = mc.id
            JOIN patients p ON mc.patient_id = p.id
            WHERE d.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Donation not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
