const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const privacyService = require('../services/PrivacySecurityService');
const privacyRepo = require('../repositories/privacyRepo');

router.post('/consent', authenticateToken, async (req, res) => {
    try {
        const { consent_type, granted, purpose, expires_in_days } = req.body;
        
        if (!consent_type || granted === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const consentToken = privacyService.generateConsentToken();
        const expiresAt = expires_in_days 
            ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
            : null;

        const consentData = {
            user_id: req.user.id,
            user_type: req.user.userType,
            consent_type,
            consent_token: consentToken,
            granted,
            purpose: purpose || null,
            expires_at: expiresAt
        };

        const consentId = await privacyRepo.createConsent(consentData);

        res.status(201).json({
            success: true,
            message: 'Consent recorded successfully',
            consent_id: consentId,
            consent_token: consentToken
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/consent', authenticateToken, async (req, res) => {
    try {
        const consents = await privacyRepo.getUserConsents(req.user.id);
        res.json({
            success: true,
            consents: consents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/consent/:id', authenticateToken, async (req, res) => {
    try {
        const consentId = req.params.id;
        const revoked = await privacyRepo.revokeConsent(consentId, req.user.id);

        if (!revoked) {
            return res.status(404).json({ error: 'Consent not found' });
        }

        res.json({
            success: true,
            message: 'Consent revoked successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/access-logs', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const logs = await privacyRepo.getDataAccessLogs(req.user.id, limit);

        res.json({
            success: true,
            count: logs.length,
            logs: logs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/data-export', authenticateToken, async (req, res) => {
    try {
        const requestId = await privacyRepo.createDataExportRequest(
            req.user.id,
            req.user.userType
        );

        res.status(201).json({
            success: true,
            message: 'Data export request created. You will receive an email when ready.',
            request_id: requestId,
            estimated_time: '24-48 hours'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/data-export/:requestId', authenticateToken, async (req, res) => {
    try {
        const request = await privacyRepo.getDataExportRequest(
            req.params.requestId,
            req.user.id
        );

        if (!request) {
            return res.status(404).json({ error: 'Export request not found' });
        }

        res.json({
            success: true,
            request: request
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/data-deletion', authenticateToken, async (req, res) => {
    try {
        const { reason } = req.body;

        const requestId = await privacyRepo.createDataDeletionRequest(
            req.user.id,
            req.user.userType,
            reason || 'User requested account deletion'
        );

        res.status(201).json({
            success: true,
            message: 'Data deletion request submitted. Our team will review it within 7 days.',
            request_id: requestId,
            note: 'Medical records will be retained as required by law (7 years)'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/data-deletion/requests', authenticateToken, async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const status = req.query.status;
        const requests = await privacyRepo.getDataDeletionRequests(status);

        res.json({
            success: true,
            count: requests.length,
            requests: requests
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/data-deletion/:requestId', authenticateToken, async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { status } = req.body;
        const updated = await privacyRepo.updateDeletionRequestStatus(
            req.params.requestId,
            status,
            req.user.id
        );

        if (!updated) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({
            success: true,
            message: 'Deletion request status updated'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/settings', authenticateToken, async (req, res) => {
    try {
        const settings = await privacyRepo.getPrivacySettings(
            req.user.id,
            req.user.userType
        );

        res.json({
            success: true,
            settings: settings || {
                share_profile: false,
                share_medical_history: false,
                allow_research_use: false,
                marketing_consent: false
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const { share_profile, share_medical_history, allow_research_use, marketing_consent } = req.body;

        const settings = {
            share_profile: share_profile !== undefined ? share_profile : false,
            share_medical_history: share_medical_history !== undefined ? share_medical_history : false,
            allow_research_use: allow_research_use !== undefined ? allow_research_use : false,
            marketing_consent: marketing_consent !== undefined ? marketing_consent : false
        };

        await privacyRepo.updatePrivacySettings(
            req.user.id,
            req.user.userType,
            settings
        );

        res.json({
            success: true,
            message: 'Privacy settings updated successfully',
            settings: settings
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/anonymize', authenticateToken, async (req, res) => {
    try {
        const anonymousId = privacyService.anonymizePatientId(req.user.id);

        res.json({
            success: true,
            anonymous_id: anonymousId,
            message: 'Use this ID for anonymous services'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/privacy-report', authenticateToken, async (req, res) => {
    try {
        const report = privacyService.generatePrivacyReport(req.user.id);

        res.json({
            success: true,
            report: report
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/encrypt-data', authenticateToken, async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { data, data_type } = req.body;

        if (!data || !data_type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const encrypted = privacyService.encryptSensitiveData(JSON.stringify(data));
        
        const dataId = await privacyRepo.storeEncryptedData(
            req.user.id,
            data_type,
            encrypted.encryptedData,
            encrypted.iv
        );

        res.json({
            success: true,
            message: 'Data encrypted and stored successfully',
            data_id: dataId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/validate-access', authenticateToken, async (req, res) => {
    try {
        const { data_type } = req.body;

        const hasAccess = privacyService.validateDataAccessPermission(
            req.user.userType,
            data_type
        );

        const accessLog = privacyService.logDataAccess(
            req.user.id,
            req.user.userType,
            data_type,
            hasAccess ? 'access_granted' : 'access_denied',
            req.ip
        );

        await privacyRepo.logDataAccess(accessLog);

        res.json({
            success: true,
            has_access: hasAccess,
            message: hasAccess ? 'Access granted' : 'Access denied'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
