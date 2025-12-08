const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all pending medication requests (for volunteers to see)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT mr.*, p.name as patient_name, p.phone as patient_phone,
                   v.name as volunteer_name, v.organization_name
            FROM medication_requests mr
            JOIN patients p ON mr.patient_id = p.id
            LEFT JOIN volunteers v ON mr.accepted_by = v.id
            WHERE mr.status IN ('pending', 'accepted', 'in_progress')
            ORDER BY 
                CASE mr.urgency_level 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 
                END,
                mr.created_at ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get pending requests only
router.get('/pending', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT mr.*, p.name as patient_name, p.phone as patient_phone
            FROM medication_requests mr
            JOIN patients p ON mr.patient_id = p.id
            WHERE mr.status = 'pending'
            ORDER BY 
                CASE mr.urgency_level 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 
                END,
                mr.created_at ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get urgent requests (critical and high)
router.get('/urgent', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT mr.*, p.name as patient_name, p.phone as patient_phone
            FROM medication_requests mr
            JOIN patients p ON mr.patient_id = p.id
            WHERE mr.status = 'pending' AND mr.urgency_level IN ('critical', 'high')
            ORDER BY 
                CASE mr.urgency_level WHEN 'critical' THEN 1 ELSE 2 END,
                mr.created_at ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get request by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT mr.*, p.name as patient_name, p.phone as patient_phone, p.medical_history,
                   v.name as volunteer_name, v.organization_name, v.phone as volunteer_phone
            FROM medication_requests mr
            JOIN patients p ON mr.patient_id = p.id
            LEFT JOIN volunteers v ON mr.accepted_by = v.id
            WHERE mr.id = ?
        `, [req.params.id]);
        
        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.status(404).json({ success: false, error: 'Request not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get patient's medication requests
router.get('/patient/:patientId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT mr.*, v.name as volunteer_name, v.organization_name, v.phone as volunteer_phone
            FROM medication_requests mr
            LEFT JOIN volunteers v ON mr.accepted_by = v.id
            WHERE mr.patient_id = ?
            ORDER BY mr.created_at DESC
        `, [req.params.patientId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new medication request (by patient)
router.post('/', async (req, res) => {
    try {
        const { patient_id, medication_name, medication_type, quantity, description, urgency_level, delivery_address, delivery_notes } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO medication_requests (patient_id, medication_name, medication_type, quantity, description, urgency_level, delivery_address, delivery_notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [patient_id, medication_name, medication_type, quantity, description, urgency_level || 'medium', delivery_address, delivery_notes]
        );
        
        res.status(201).json({ 
            success: true, 
            data: { id: result.insertId, status: 'pending' },
            message: 'Medication request submitted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Accept medication request (by volunteer)
router.patch('/:id/accept', async (req, res) => {
    try {
        const { volunteer_id } = req.body;
        
        // Check if already accepted
        const [existing] = await pool.query(
            'SELECT * FROM medication_requests WHERE id = ? AND status = ?',
            [req.params.id, 'pending']
        );
        
        if (existing.length === 0) {
            return res.status(400).json({ success: false, error: 'Request not available or already accepted' });
        }
        
        await pool.query(
            'UPDATE medication_requests SET status = ?, accepted_by = ? WHERE id = ?',
            ['accepted', volunteer_id, req.params.id]
        );
        
        res.json({ success: true, message: 'Request accepted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update request status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        await pool.query(
            'UPDATE medication_requests SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        
        // If delivered, update volunteer's total deliveries
        if (status === 'delivered') {
            const [request] = await pool.query('SELECT accepted_by FROM medication_requests WHERE id = ?', [req.params.id]);
            if (request[0] && request[0].accepted_by) {
                await pool.query(
                    'UPDATE volunteers SET total_deliveries = total_deliveries + 1 WHERE id = ?',
                    [request[0].accepted_by]
                );
            }
        }
        
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancel request (by patient)
router.delete('/:id', async (req, res) => {
    try {
        const [request] = await pool.query(
            'SELECT status FROM medication_requests WHERE id = ?',
            [req.params.id]
        );
        
        if (request.length === 0) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }
        
        if (request[0].status === 'delivered') {
            return res.status(400).json({ success: false, error: 'Cannot cancel delivered request' });
        }
        
        await pool.query(
            'UPDATE medication_requests SET status = ? WHERE id = ?',
            ['cancelled', req.params.id]
        );
        
        res.json({ success: true, message: 'Request cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get volunteer's accepted requests
router.get('/volunteer/:volunteerId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT mr.*, p.name as patient_name, p.phone as patient_phone
            FROM medication_requests mr
            JOIN patients p ON mr.patient_id = p.id
            WHERE mr.accepted_by = ?
            ORDER BY mr.created_at DESC
        `, [req.params.volunteerId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start delivery (create delivery record)
router.post('/:id/deliver', async (req, res) => {
    try {
        const { volunteer_id, pickup_location, estimated_delivery } = req.body;
        
        // Get request details
        const [request] = await pool.query(
            'SELECT * FROM medication_requests WHERE id = ?',
            [req.params.id]
        );
        
        if (request.length === 0) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }
        
        // Update request status
        await pool.query(
            'UPDATE medication_requests SET status = ? WHERE id = ?',
            ['in_progress', req.params.id]
        );
        
        // Create delivery record
        const [result] = await pool.query(
            `INSERT INTO deliveries (request_id, volunteer_id, pickup_location, delivery_location, estimated_delivery) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.params.id, volunteer_id, pickup_location, request[0].delivery_address, estimated_delivery]
        );
        
        res.status(201).json({ 
            success: true, 
            data: { delivery_id: result.insertId },
            message: 'Delivery started'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get delivery status
router.get('/:id/delivery', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.*, v.name as volunteer_name, v.phone as volunteer_phone, v.organization_name
            FROM deliveries d
            JOIN volunteers v ON d.volunteer_id = v.id
            WHERE d.request_id = ?
            ORDER BY d.created_at DESC
            LIMIT 1
        `, [req.params.id]);
        
        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.status(404).json({ success: false, error: 'No delivery found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update delivery status
router.patch('/delivery/:deliveryId', async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        let updateQuery = 'UPDATE deliveries SET status = ?';
        let params = [status];
        
        if (notes) {
            updateQuery += ', notes = ?';
            params.push(notes);
        }
        
        if (status === 'delivered') {
            updateQuery += ', actual_delivery = NOW()';
            
            // Update request status too
            const [delivery] = await pool.query('SELECT request_id FROM deliveries WHERE id = ?', [req.params.deliveryId]);
            if (delivery.length > 0) {
                await pool.query('UPDATE medication_requests SET status = ? WHERE id = ?', ['delivered', delivery[0].request_id]);
            }
        }
        
        updateQuery += ' WHERE id = ?';
        params.push(req.params.deliveryId);
        
        await pool.query(updateQuery, params);
        
        res.json({ success: true, message: 'Delivery status updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Confirm delivery and rate (by patient)
router.patch('/delivery/:deliveryId/confirm', async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        
        await pool.query(
            'UPDATE deliveries SET patient_confirmed = TRUE, rating = ?, feedback = ? WHERE id = ?',
            [rating, feedback, req.params.deliveryId]
        );
        
        // Update volunteer rating
        const [delivery] = await pool.query('SELECT volunteer_id FROM deliveries WHERE id = ?', [req.params.deliveryId]);
        if (delivery.length > 0) {
            const [avgRating] = await pool.query(
                'SELECT AVG(rating) as avg_rating FROM deliveries WHERE volunteer_id = ? AND rating IS NOT NULL',
                [delivery[0].volunteer_id]
            );
            await pool.query(
                'UPDATE volunteers SET rating = ? WHERE id = ?',
                [avgRating[0].avg_rating || 0, delivery[0].volunteer_id]
            );
        }
        
        res.json({ success: true, message: 'Delivery confirmed and rated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
