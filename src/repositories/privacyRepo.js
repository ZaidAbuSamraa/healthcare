const db = require('../config/db');

class PrivacyRepository {
    async logDataAccess(accessLog) {
        const query = `
            INSERT INTO data_access_logs 
            (user_id, user_role, data_type, action, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            accessLog.user_id,
            accessLog.user_role,
            accessLog.data_type,
            accessLog.action,
            accessLog.ip_address,
            accessLog.timestamp
        ]);
        return result;
    }

    async getUserConsents(userId) {
        const query = `
            SELECT * FROM user_consents 
            WHERE user_id = ? AND is_active = 1
            ORDER BY created_at DESC
        `;
        const [consents] = await db.execute(query, [userId]);
        return consents;
    }

    async createConsent(consentData) {
        const query = `
            INSERT INTO user_consents 
            (user_id, user_type, consent_type, consent_token, granted, purpose, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            consentData.user_id,
            consentData.user_type,
            consentData.consent_type,
            consentData.consent_token,
            consentData.granted,
            consentData.purpose,
            consentData.expires_at
        ]);
        return result.insertId;
    }

    async revokeConsent(consentId, userId) {
        const query = `
            UPDATE user_consents 
            SET is_active = 0, revoked_at = NOW()
            WHERE id = ? AND user_id = ?
        `;
        const [result] = await db.execute(query, [consentId, userId]);
        return result.affectedRows > 0;
    }

    async getDataAccessLogs(userId, limit = 50) {
        const query = `
            SELECT * FROM data_access_logs 
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        `;
        const [logs] = await db.execute(query, [userId, limit]);
        return logs;
    }

    async createDataExportRequest(userId, userType) {
        const query = `
            INSERT INTO data_export_requests 
            (user_id, user_type, status, requested_at)
            VALUES (?, ?, 'pending', NOW())
        `;
        const [result] = await db.execute(query, [userId, userType]);
        return result.insertId;
    }

    async getDataExportRequest(requestId, userId) {
        const query = `
            SELECT * FROM data_export_requests 
            WHERE id = ? AND user_id = ?
        `;
        const [requests] = await db.execute(query, [requestId, userId]);
        return requests[0];
    }

    async updateDataExportStatus(requestId, status, downloadUrl = null) {
        const query = `
            UPDATE data_export_requests 
            SET status = ?, download_url = ?, completed_at = NOW()
            WHERE id = ?
        `;
        const [result] = await db.execute(query, [status, downloadUrl, requestId]);
        return result.affectedRows > 0;
    }

    async createDataDeletionRequest(userId, userType, reason) {
        const query = `
            INSERT INTO data_deletion_requests 
            (user_id, user_type, reason, status, requested_at)
            VALUES (?, ?, ?, 'pending', NOW())
        `;
        const [result] = await db.execute(query, [userId, userType, reason]);
        return result.insertId;
    }

    async getDataDeletionRequests(status = null) {
        let query = `SELECT * FROM data_deletion_requests`;
        const params = [];
        
        if (status) {
            query += ` WHERE status = ?`;
            params.push(status);
        }
        
        query += ` ORDER BY requested_at DESC`;
        const [requests] = await db.execute(query, params);
        return requests;
    }

    async updateDeletionRequestStatus(requestId, status, processedBy) {
        const query = `
            UPDATE data_deletion_requests 
            SET status = ?, processed_by = ?, processed_at = NOW()
            WHERE id = ?
        `;
        const [result] = await db.execute(query, [status, processedBy, requestId]);
        return result.affectedRows > 0;
    }

    async getPrivacySettings(userId, userType) {
        const query = `
            SELECT * FROM privacy_settings 
            WHERE user_id = ? AND user_type = ?
        `;
        const [settings] = await db.execute(query, [userId, userType]);
        return settings[0];
    }

    async updatePrivacySettings(userId, userType, settings) {
        const query = `
            INSERT INTO privacy_settings 
            (user_id, user_type, share_profile, share_medical_history, 
             allow_research_use, marketing_consent, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            share_profile = VALUES(share_profile),
            share_medical_history = VALUES(share_medical_history),
            allow_research_use = VALUES(allow_research_use),
            marketing_consent = VALUES(marketing_consent),
            updated_at = NOW()
        `;
        const [result] = await db.execute(query, [
            userId,
            userType,
            settings.share_profile,
            settings.share_medical_history,
            settings.allow_research_use,
            settings.marketing_consent
        ]);
        return result;
    }

    async getEncryptedData(userId, dataType) {
        const query = `
            SELECT * FROM encrypted_data 
            WHERE user_id = ? AND data_type = ?
        `;
        const [data] = await db.execute(query, [userId, dataType]);
        return data[0];
    }

    async storeEncryptedData(userId, dataType, encryptedData, iv) {
        const query = `
            INSERT INTO encrypted_data 
            (user_id, data_type, encrypted_data, iv, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        const [result] = await db.execute(query, [userId, dataType, encryptedData, iv]);
        return result.insertId;
    }
}

module.exports = new PrivacyRepository();
