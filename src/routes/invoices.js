const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all invoices
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT i.*, mc.title as case_title, p.name as patient_name
            FROM invoices i
            JOIN medical_cases mc ON i.case_id = mc.id
            JOIN patients p ON mc.patient_id = p.id
            ORDER BY i.invoice_date DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get invoices by category
router.get('/category/:category', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT i.*, mc.title as case_title
            FROM invoices i
            JOIN medical_cases mc ON i.case_id = mc.id
            WHERE i.category = ?
            ORDER BY i.invoice_date DESC
        `, [req.params.category]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get invoice statistics (transparency dashboard)
router.get('/stats', async (req, res) => {
    try {
        const [totalSpent] = await pool.query(`
            SELECT SUM(amount) as total FROM invoices WHERE status IN ('paid', 'verified')
        `);
        
        const [byCategory] = await pool.query(`
            SELECT category, SUM(amount) as total, COUNT(*) as count
            FROM invoices
            WHERE status IN ('paid', 'verified')
            GROUP BY category
        `);
        
        const [byMonth] = await pool.query(`
            SELECT DATE_FORMAT(invoice_date, '%Y-%m') as month, SUM(amount) as total
            FROM invoices
            WHERE status IN ('paid', 'verified')
            GROUP BY DATE_FORMAT(invoice_date, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `);
        
        res.json({ 
            success: true, 
            data: {
                total_spent: totalSpent[0].total || 0,
                by_category: byCategory,
                by_month: byMonth
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT i.*, mc.title as case_title, p.name as patient_name
            FROM invoices i
            JOIN medical_cases mc ON i.case_id = mc.id
            JOIN patients p ON mc.patient_id = p.id
            WHERE i.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new invoice
router.post('/', async (req, res) => {
    try {
        const { case_id, title, description, amount, vendor_name, invoice_date, receipt_url, category } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO invoices (case_id, title, description, amount, vendor_name, invoice_date, receipt_url, category)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [case_id, title, description, amount, vendor_name, invoice_date, receipt_url, category]
        );
        
        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update invoice status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const [result] = await pool.query(
            'UPDATE invoices SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }
        res.json({ success: true, message: `Invoice status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }
        res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
