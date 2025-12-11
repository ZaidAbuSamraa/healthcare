const express = require('express');
const router = express.Router();
const { doctorService } = require('../services');
const { authService } = require('../services');
const { authenticate, authorize } = require('../middleware/auth');

// Get all doctors (public)
router.get('/', async (req, res) => {
    try {
        const doctors = await doctorService.getAllDoctors();
        res.json({ success: true, data: doctors });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get available doctors (public)
router.get('/available', async (req, res) => {
    try {
        const doctors = await doctorService.getAvailableDoctors();
        res.json({ success: true, data: doctors });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get doctors by specialty (public)
router.get('/specialty/:specialty', async (req, res) => {
    try {
        const doctors = await doctorService.getDoctorsBySpecialty(req.params.specialty);
        res.json({ success: true, data: doctors });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Login doctor - returns JWT tokens
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password, 'doctor');
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
});

// Register new doctor
router.post('/', async (req, res) => {
    try {
        const doctor = await doctorService.createDoctor(req.body);
        res.status(201).json({ success: true, data: doctor });
    } catch (error) {
        const status = error.message.includes('exists') ? 400 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

// Get doctor by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const doctor = await doctorService.getDoctorById(req.params.id);
        res.json({ success: true, data: doctor });
    } catch (error) {
        const status = error.message.includes('not found') ? 404 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

// Update doctor availability (protected - doctor only)
router.patch('/:id/availability', authenticate, async (req, res) => {
    try {
        const result = await doctorService.updateAvailability(
            parseInt(req.params.id), 
            req.body.availability_status,
            req.user
        );
        res.json({ success: true, data: result });
    } catch (error) {
        const status = error.message.includes('permission') ? 403 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

// Update doctor (protected - owner or admin)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const doctor = await doctorService.updateDoctor(
            parseInt(req.params.id), 
            req.body, 
            req.user
        );
        res.json({ success: true, data: doctor });
    } catch (error) {
        const status = error.message.includes('not found') ? 404 : 
                       error.message.includes('only update') ? 403 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

// Delete doctor (protected - admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const result = await doctorService.deleteDoctor(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        const status = error.message.includes('not found') ? 404 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

module.exports = router;
