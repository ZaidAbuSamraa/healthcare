-- User Privacy and Data Security Tables

-- Data Access Logs
CREATE TABLE IF NOT EXISTS data_access_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    user_role ENUM('patient', 'doctor', 'donor', 'volunteer', 'ngo', 'admin') NOT NULL,
    data_type VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_data_type (data_type)
);

-- User Consents
CREATE TABLE IF NOT EXISTS user_consents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    user_type ENUM('patient', 'doctor', 'donor', 'volunteer', 'ngo') NOT NULL,
    consent_type ENUM('data_sharing', 'medical_research', 'marketing', 'third_party', 'anonymized_data') NOT NULL,
    consent_token VARCHAR(255) UNIQUE NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT FALSE,
    purpose TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATETIME,
    revoked_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_consent (user_id, user_type),
    INDEX idx_consent_type (consent_type),
    INDEX idx_active (is_active)
);

-- Data Export Requests
CREATE TABLE IF NOT EXISTS data_export_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    user_type ENUM('patient', 'doctor', 'donor', 'volunteer', 'ngo') NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    download_url TEXT,
    requested_at DATETIME NOT NULL,
    completed_at DATETIME,
    expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_export (user_id, user_type),
    INDEX idx_status (status)
);

-- Data Deletion Requests (Right to be Forgotten)
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    user_type ENUM('patient', 'doctor', 'donor', 'volunteer', 'ngo') NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    processed_by INT,
    requested_at DATETIME NOT NULL,
    processed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_deletion (user_id, user_type),
    INDEX idx_status (status)
);

-- Privacy Settings
CREATE TABLE IF NOT EXISTS privacy_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    user_type ENUM('patient', 'doctor', 'donor', 'volunteer', 'ngo') NOT NULL,
    share_profile BOOLEAN DEFAULT FALSE,
    share_medical_history BOOLEAN DEFAULT FALSE,
    allow_research_use BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_settings (user_id, user_type)
);

-- Encrypted Sensitive Data Storage
CREATE TABLE IF NOT EXISTS encrypted_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    data_type VARCHAR(100) NOT NULL,
    encrypted_data TEXT NOT NULL,
    iv VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_data (user_id, data_type)
);

-- Security Incidents Log
CREATE TABLE IF NOT EXISTS security_incidents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    incident_type ENUM('unauthorized_access', 'data_breach', 'suspicious_activity', 'failed_login') NOT NULL,
    user_id INT,
    ip_address VARCHAR(45),
    description TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    status ENUM('detected', 'investigating', 'resolved', 'false_positive') DEFAULT 'detected',
    detected_at DATETIME NOT NULL,
    resolved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_incident_type (incident_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status)
);

-- Two-Factor Authentication
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    user_type ENUM('patient', 'doctor', 'donor', 'volunteer', 'ngo', 'admin') NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    backup_codes TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    verified_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_2fa (user_id, user_type)
);

-- Session Management
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    user_type ENUM('patient', 'doctor', 'donor', 'volunteer', 'ngo', 'admin') NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity DATETIME,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_session (user_id, user_type),
    INDEX idx_session_token (session_token),
    INDEX idx_active (is_active)
);
