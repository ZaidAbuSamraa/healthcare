const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all available equipment
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ei.*, 
                   CASE 
                       WHEN ei.listed_by_type = 'volunteer' THEN v.name 
                       WHEN ei.listed_by_type = 'donor' THEN d.name
                       ELSE 'Anonymous'
                   END as listed_by_name,
                   CASE 
                       WHEN ei.listed_by_type = 'volunteer' THEN v.organization_name 
                       WHEN ei.listed_by_type = 'donor' THEN 'Private Donor'
                       ELSE NULL
                   END as organization_name
            FROM equipment_inventory ei
            LEFT JOIN volunteers v ON ei.listed_by_type = 'volunteer' AND ei.listed_by_id = v.id
            LEFT JOIN donors d ON ei.listed_by_type = 'donor' AND ei.listed_by_id = d.id
            WHERE ei.is_available = TRUE AND ei.available_quantity > 0
            ORDER BY ei.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get equipment by type
router.get('/type/:type', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ei.*, 
                   CASE WHEN ei.listed_by_type = 'volunteer' THEN v.name ELSE 'Anonymous' END as listed_by_name,
                   v.organization_name
            FROM equipment_inventory ei
            LEFT JOIN volunteers v ON ei.listed_by_type = 'volunteer' AND ei.listed_by_id = v.id
            WHERE ei.item_type = ? AND ei.is_available = TRUE AND ei.available_quantity > 0
            ORDER BY ei.created_at DESC
        `, [req.params.type]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get equipment by category
router.get('/category/:category', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ei.*, 
                   CASE WHEN ei.listed_by_type = 'volunteer' THEN v.name ELSE 'Anonymous' END as listed_by_name,
                   v.organization_name
            FROM equipment_inventory ei
            LEFT JOIN volunteers v ON ei.listed_by_type = 'volunteer' AND ei.listed_by_id = v.id
            WHERE ei.category = ? AND ei.is_available = TRUE AND ei.available_quantity > 0
            ORDER BY ei.created_at DESC
        `, [req.params.category]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search equipment
router.get('/search/:query', async (req, res) => {
    try {
        const searchQuery = `%${req.params.query}%`;
        const [rows] = await pool.query(`
            SELECT ei.*, 
                   CASE WHEN ei.listed_by_type = 'volunteer' THEN v.name ELSE 'Anonymous' END as listed_by_name,
                   v.organization_name
            FROM equipment_inventory ei
            LEFT JOIN volunteers v ON ei.listed_by_type = 'volunteer' AND ei.listed_by_id = v.id
            WHERE (ei.item_name LIKE ? OR ei.description LIKE ?) 
                  AND ei.is_available = TRUE AND ei.available_quantity > 0
            ORDER BY ei.created_at DESC
        `, [searchQuery, searchQuery]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get equipment by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ei.*, 
                   CASE WHEN ei.listed_by_type = 'volunteer' THEN v.name ELSE 'Anonymous' END as listed_by_name,
                   v.organization_name, v.phone as volunteer_phone
            FROM equipment_inventory ei
            LEFT JOIN volunteers v ON ei.listed_by_type = 'volunteer' AND ei.listed_by_id = v.id
            WHERE ei.id = ?
        `, [req.params.id]);
        
        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.status(404).json({ success: false, error: 'Equipment not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// List new equipment (by volunteer/NGO)
router.post('/', async (req, res) => {
    try {
        const { 
            listed_by_type, listed_by_id, item_name, item_type, category,
            description, quantity, condition_status, expiry_date, location,
            is_free, price, contact_phone, contact_email, notes 
        } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO equipment_inventory 
             (listed_by_type, listed_by_id, item_name, item_type, category, description, 
              quantity, available_quantity, condition_status, expiry_date, location, 
              is_free, price, contact_phone, contact_email, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [listed_by_type, listed_by_id, item_name, item_type, category, description,
             quantity || 1, quantity || 1, condition_status || 'good', expiry_date, location,
             is_free !== false, price || 0, contact_phone, contact_email, notes]
        );
        
        res.status(201).json({ 
            success: true, 
            data: { id: result.insertId },
            message: 'Equipment listed successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update equipment
router.put('/:id', async (req, res) => {
    try {
        const { quantity, available_quantity, is_available, description, location, notes } = req.body;
        
        await pool.query(
            `UPDATE equipment_inventory SET 
             quantity = COALESCE(?, quantity),
             available_quantity = COALESCE(?, available_quantity),
             is_available = COALESCE(?, is_available),
             description = COALESCE(?, description),
             location = COALESCE(?, location),
             notes = COALESCE(?, notes)
             WHERE id = ?`,
            [quantity, available_quantity, is_available, description, location, notes, req.params.id]
        );
        
        res.json({ success: true, message: 'Equipment updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete equipment listing
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM equipment_inventory WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Equipment listing removed' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get volunteer's listed equipment
router.get('/volunteer/:volunteerId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM equipment_inventory
            WHERE listed_by_type = 'volunteer' AND listed_by_id = ?
            ORDER BY created_at DESC
        `, [req.params.volunteerId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get donor's listed equipment
router.get('/donor/:donorId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM equipment_inventory
            WHERE listed_by_type = 'donor' AND listed_by_id = ?
            ORDER BY created_at DESC
        `, [req.params.donorId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Request equipment (by patient)
router.post('/request', async (req, res) => {
    try {
        const { patient_id, equipment_id, item_name, item_type, urgency_level, description, delivery_address } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO equipment_requests 
             (patient_id, equipment_id, item_name, item_type, urgency_level, description, delivery_address) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [patient_id, equipment_id, item_name, item_type, urgency_level || 'medium', description, delivery_address]
        );
        
        res.status(201).json({ 
            success: true, 
            data: { id: result.insertId, status: 'pending' },
            message: 'Equipment request submitted'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get patient's equipment requests
router.get('/requests/patient/:patientId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT er.*, ei.location as equipment_location, 
                   v.name as fulfilled_by_name
            FROM equipment_requests er
            LEFT JOIN equipment_inventory ei ON er.equipment_id = ei.id
            LEFT JOIN volunteers v ON er.fulfilled_by_type = 'volunteer' AND er.fulfilled_by_id = v.id
            WHERE er.patient_id = ?
            ORDER BY er.created_at DESC
        `, [req.params.patientId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get pending equipment requests (for volunteers)
router.get('/requests/pending', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT er.*, p.name as patient_name, p.phone as patient_phone
            FROM equipment_requests er
            JOIN patients p ON er.patient_id = p.id
            WHERE er.status = 'pending'
            ORDER BY 
                CASE er.urgency_level 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 
                END,
                er.created_at ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fulfill equipment request
router.patch('/requests/:id/fulfill', async (req, res) => {
    try {
        const { fulfilled_by_type, fulfilled_by_id, equipment_id } = req.body;
        
        // Update request status
        await pool.query(
            `UPDATE equipment_requests SET status = 'fulfilled', 
             fulfilled_by_type = ?, fulfilled_by_id = ?, equipment_id = ?
             WHERE id = ?`,
            [fulfilled_by_type, fulfilled_by_id, equipment_id, req.params.id]
        );
        
        // Decrease available quantity if equipment was from inventory
        if (equipment_id) {
            await pool.query(
                `UPDATE equipment_inventory SET available_quantity = available_quantity - 1,
                 is_available = CASE WHEN available_quantity - 1 <= 0 THEN FALSE ELSE TRUE END
                 WHERE id = ?`,
                [equipment_id]
            );
        }
        
        res.json({ success: true, message: 'Request fulfilled' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get inventory statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const [byType] = await pool.query(`
            SELECT item_type, COUNT(*) as count, SUM(available_quantity) as total_available
            FROM equipment_inventory
            WHERE is_available = TRUE
            GROUP BY item_type
        `);
        
        const [byCategory] = await pool.query(`
            SELECT category, COUNT(*) as count, SUM(available_quantity) as total_available
            FROM equipment_inventory
            WHERE is_available = TRUE
            GROUP BY category
        `);
        
        const [totals] = await pool.query(`
            SELECT 
                COUNT(*) as total_listings,
                SUM(available_quantity) as total_items,
                COUNT(DISTINCT listed_by_id) as total_contributors
            FROM equipment_inventory
            WHERE is_available = TRUE
        `);
        
        res.json({ 
            success: true, 
            data: {
                by_type: byType,
                by_category: byCategory,
                totals: totals[0]
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
