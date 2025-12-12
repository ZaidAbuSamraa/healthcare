const crypto = require('crypto');

class PrivacySecurityService {
    constructor() {
        this.encryptionAlgorithm = 'aes-256-cbc';
        this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
        this.iv = crypto.randomBytes(16);
    }

    encryptSensitiveData(data) {
        try {
            const cipher = crypto.createCipheriv(this.encryptionAlgorithm, this.encryptionKey, this.iv);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return {
                encryptedData: encrypted,
                iv: this.iv.toString('hex')
            };
        } catch (error) {
            throw new Error('Encryption failed: ' + error.message);
        }
    }

    decryptSensitiveData(encryptedData, ivHex) {
        try {
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, this.encryptionKey, iv);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    hashData(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    anonymizePatientId(patientId) {
        const hash = this.hashData(patientId.toString());
        return 'ANON_' + hash.substring(0, 16).toUpperCase();
    }

    maskEmail(email) {
        const [username, domain] = email.split('@');
        const maskedUsername = username.substring(0, 2) + '***' + username.substring(username.length - 1);
        return maskedUsername + '@' + domain;
    }

    maskPhoneNumber(phone) {
        if (!phone || phone.length < 4) return '***';
        return '***' + phone.substring(phone.length - 4);
    }

    generateConsentToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    validateDataAccessPermission(userRole, dataType) {
        const permissions = {
            patient: ['own_medical_records', 'own_consultations', 'own_donations'],
            doctor: ['assigned_patients', 'consultations', 'medical_records'],
            admin: ['all_data', 'system_logs', 'user_management'],
            donor: ['own_donations', 'case_updates'],
            volunteer: ['assigned_deliveries', 'equipment_requests']
        };

        return permissions[userRole]?.includes(dataType) || false;
    }

    sanitizeOutput(data, userRole) {
        const sanitized = { ...data };
        
        if (userRole !== 'admin' && userRole !== 'doctor') {
            if (sanitized.national_id) delete sanitized.national_id;
            if (sanitized.medical_history) sanitized.medical_history = '[REDACTED]';
        }

        if (sanitized.email) sanitized.email = this.maskEmail(sanitized.email);
        if (sanitized.phone) sanitized.phone = this.maskPhoneNumber(sanitized.phone);

        return sanitized;
    }

    logDataAccess(userId, userRole, dataType, action, ipAddress) {
        return {
            user_id: userId,
            user_role: userRole,
            data_type: dataType,
            action: action,
            ip_address: ipAddress,
            timestamp: new Date().toISOString(),
            status: 'logged'
        };
    }

    validateGDPRCompliance(dataRetentionDays, lastAccessDate) {
        const maxRetentionDays = 365 * 7;
        const daysSinceAccess = Math.floor((Date.now() - new Date(lastAccessDate)) / (1000 * 60 * 60 * 24));
        
        return {
            compliant: dataRetentionDays <= maxRetentionDays && daysSinceAccess <= 365,
            retention_days: dataRetentionDays,
            days_since_access: daysSinceAccess,
            action_required: daysSinceAccess > 365 ? 'Archive or delete inactive data' : 'None'
        };
    }

    generatePrivacyReport(userId) {
        return {
            user_id: userId,
            report_date: new Date().toISOString(),
            data_categories: [
                'Personal Information',
                'Medical Records',
                'Consultation History',
                'Donation Records',
                'Communication Logs'
            ],
            rights: [
                'Right to Access',
                'Right to Rectification',
                'Right to Erasure',
                'Right to Data Portability',
                'Right to Object'
            ],
            retention_policy: '7 years for medical records, 3 years for other data',
            contact: 'privacy@healthpal.ps'
        };
    }
}

module.exports = new PrivacySecurityService();
