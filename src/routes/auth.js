const express = require('express');
const router = express.Router();
const { authService } = require('../services');
const { authenticate } = require('../middleware/auth');

// Login (supports doctor, patient, ngo)
router.post('/login', async (req, res) => {
    try {
        const { username, password, userType = 'patient' } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password required' });
        }
        
        const result = await authService.login(username, password, userType);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
});

// Register patient
router.post('/register/patient', async (req, res) => {
    try {
        const result = await authService.registerPatient(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Register doctor
router.post('/register/doctor', async (req, res) => {
    try {
        const result = await authService.registerDoctor(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ success: false, error: 'Refresh token required' });
        }
        
        const tokens = await authService.refreshToken(refreshToken);
        res.json({ success: true, data: tokens });
    } catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
});

// Get current user (protected route example)
router.get('/me', authenticate, async (req, res) => {
    res.json({ success: true, data: req.user });
});

module.exports = router;
