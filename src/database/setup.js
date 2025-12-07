const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    // Connect without database first to create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 3306
    });

    console.log('Connected to MySQL server');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'healthpal'}`);
    console.log('Database created/verified');

    await connection.query(`USE ${process.env.DB_NAME || 'healthpal'}`);

    // Create patients table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS patients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(50),
            date_of_birth DATE,
            gender ENUM('male', 'female', 'other'),
            language_preference ENUM('arabic', 'english') DEFAULT 'arabic',
            medical_history TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log('Patients table created');

    // Create doctors table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS doctors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(50),
            specialty ENUM('general_practice', 'pediatrics', 'mental_health', 'internal_medicine', 'surgery', 'dermatology', 'cardiology', 'neurology') NOT NULL,
            languages SET('arabic', 'english') NOT NULL,
            is_international BOOLEAN DEFAULT FALSE,
            availability_status ENUM('available', 'busy', 'offline') DEFAULT 'offline',
            bio TEXT,
            years_of_experience INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log('Doctors table created');

    // Create consultations table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS consultations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            doctor_id INT NOT NULL,
            consultation_type ENUM('video', 'audio', 'message') NOT NULL,
            status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
            scheduled_at DATETIME,
            started_at DATETIME,
            ended_at DATETIME,
            notes TEXT,
            diagnosis TEXT,
            prescription TEXT,
            requires_translation BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        )
    `);
    console.log('Consultations table created');

    // Create messages table for async consultations
    await connection.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            consultation_id INT NOT NULL,
            sender_type ENUM('patient', 'doctor') NOT NULL,
            sender_id INT NOT NULL,
            content TEXT NOT NULL,
            translated_content TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
        )
    `);
    console.log('Messages table created');

    // ============================================
    // MEDICAL SPONSORSHIP SYSTEM TABLES
    // ============================================

    // Create donors table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS donors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(50),
            country VARCHAR(100),
            organization VARCHAR(255),
            total_donated DECIMAL(12, 2) DEFAULT 0.00,
            is_anonymous BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log('Donors table created');

    // Create medical_cases table (patients needing sponsorship)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS medical_cases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            treatment_type ENUM('surgery', 'cancer_treatment', 'dialysis', 'physical_rehabilitation', 'medication', 'other') NOT NULL,
            description TEXT NOT NULL,
            medical_documents TEXT,
            goal_amount DECIMAL(12, 2) NOT NULL,
            raised_amount DECIMAL(12, 2) DEFAULT 0.00,
            status ENUM('pending_verification', 'verified', 'active', 'funded', 'in_treatment', 'completed', 'cancelled') DEFAULT 'pending_verification',
            urgency_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
            verified_by INT,
            consent_given BOOLEAN DEFAULT FALSE,
            recovery_updates TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (verified_by) REFERENCES doctors(id) ON DELETE SET NULL
        )
    `);
    console.log('Medical cases table created');

    // Create donations table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS donations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            donor_id INT NOT NULL,
            case_id INT NOT NULL,
            amount DECIMAL(12, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'USD',
            payment_method ENUM('credit_card', 'bank_transfer', 'paypal', 'crypto', 'other') DEFAULT 'credit_card',
            payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
            transaction_id VARCHAR(255),
            is_anonymous BOOLEAN DEFAULT FALSE,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE,
            FOREIGN KEY (case_id) REFERENCES medical_cases(id) ON DELETE CASCADE
        )
    `);
    console.log('Donations table created');

    // Create invoices table (for transparency)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            case_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            amount DECIMAL(12, 2) NOT NULL,
            vendor_name VARCHAR(255),
            invoice_date DATE,
            receipt_url TEXT,
            category ENUM('hospital', 'medication', 'equipment', 'therapy', 'transportation', 'other') NOT NULL,
            status ENUM('pending', 'paid', 'verified') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (case_id) REFERENCES medical_cases(id) ON DELETE CASCADE
        )
    `);
    console.log('Invoices table created');

    // Create case_updates table (recovery updates for transparency)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS case_updates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            case_id INT NOT NULL,
            update_type ENUM('medical', 'financial', 'recovery', 'thank_you') NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT,
            created_by_type ENUM('patient', 'doctor', 'admin') NOT NULL,
            created_by_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (case_id) REFERENCES medical_cases(id) ON DELETE CASCADE
        )
    `);
    console.log('Case updates table created');

    // Insert sample doctors (password: password123)
    await connection.query(`
        INSERT IGNORE INTO doctors (username, password, name, email, phone, specialty, languages, is_international, availability_status, bio, years_of_experience) VALUES
        ('dr.ahmad', 'password123', 'Ahmad Hassan', 'ahmad.hassan@healthpal.ps', '+970-599-123456', 'general_practice', 'arabic,english', FALSE, 'available', 'Experienced general practitioner based in Gaza', 10),
        ('dr.sarah', 'password123', 'Sarah Miller', 'sarah.miller@healthpal.org', '+1-555-123456', 'pediatrics', 'english', TRUE, 'available', 'International pediatrician volunteering for HealthPal', 8),
        ('dr.fatima', 'password123', 'Fatima Al-Masri', 'fatima.almasri@healthpal.ps', '+970-598-654321', 'mental_health', 'arabic,english', FALSE, 'available', 'Mental health specialist focusing on trauma care', 12),
        ('dr.james', 'password123', 'James Wilson', 'james.wilson@healthpal.org', '+44-20-12345678', 'internal_medicine', 'english', TRUE, 'offline', 'UK-based internal medicine specialist', 15),
        ('dr.layla', 'password123', 'Layla Nasser', 'layla.nasser@healthpal.ps', '+970-597-111222', 'pediatrics', 'arabic', FALSE, 'available', 'Pediatrician with expertise in child nutrition', 7)
    `);
    console.log('Sample doctors inserted');

    // Insert sample patients (password: password123)
    await connection.query(`
        INSERT IGNORE INTO patients (username, password, name, email, phone, date_of_birth, gender, language_preference, medical_history) VALUES
        ('mohammed', 'password123', 'Mohammed Ali', 'mohammed.ali@email.com', '+970-599-111111', '1985-03-15', 'male', 'arabic', 'Diabetes Type 2'),
        ('amira', 'password123', 'Amira Khalil', 'amira.khalil@email.com', '+970-598-222222', '1992-07-22', 'female', 'arabic', 'No significant history'),
        ('omar', 'password123', 'Omar Saeed', 'omar.saeed@email.com', '+970-597-333333', '2015-11-10', 'male', 'arabic', 'Childhood asthma')
    `);
    console.log('Sample patients inserted');

    // Insert sample donors (password: password123)
    await connection.query(`
        INSERT IGNORE INTO donors (username, password, name, email, phone, country, organization, total_donated, is_anonymous) VALUES
        ('john_donor', 'password123', 'John Smith', 'john.smith@email.com', '+1-555-111222', 'USA', 'Smith Foundation', 5000.00, FALSE),
        ('sarah_helper', 'password123', 'Sarah Johnson', 'sarah.j@email.com', '+44-20-999888', 'UK', NULL, 2500.00, FALSE),
        ('anonymous_donor', 'password123', 'Anonymous', 'anon@email.com', NULL, 'Germany', NULL, 10000.00, TRUE),
        ('ahmed_charity', 'password123', 'Ahmed Khalid', 'ahmed.k@email.com', '+971-50-1234567', 'UAE', 'UAE Medical Aid', 15000.00, FALSE)
    `);
    console.log('Sample donors inserted');

    // Insert sample medical cases
    await connection.query(`
        INSERT IGNORE INTO medical_cases (patient_id, title, treatment_type, description, goal_amount, raised_amount, status, urgency_level, verified_by, consent_given) VALUES
        (1, 'Kidney Dialysis Treatment', 'dialysis', 'Mohammed needs ongoing dialysis treatment due to kidney failure complications from diabetes. Treatment required 3 times per week.', 15000.00, 8500.00, 'active', 'high', 1, TRUE),
        (2, 'Physical Therapy After Accident', 'physical_rehabilitation', 'Amira requires 6 months of intensive physical therapy after a car accident that affected her mobility.', 8000.00, 8000.00, 'funded', 'medium', 1, TRUE),
        (3, 'Pediatric Asthma Treatment', 'medication', 'Omar needs specialized asthma medication and nebulizer equipment for long-term management.', 3000.00, 1200.00, 'active', 'medium', 2, TRUE)
    `);
    console.log('Sample medical cases inserted');

    // Insert sample donations
    await connection.query(`
        INSERT IGNORE INTO donations (donor_id, case_id, amount, currency, payment_method, payment_status, transaction_id, is_anonymous, message) VALUES
        (1, 1, 2500.00, 'USD', 'credit_card', 'completed', 'TXN001234', FALSE, 'Wishing you a speedy recovery!'),
        (2, 1, 1000.00, 'USD', 'paypal', 'completed', 'TXN001235', FALSE, 'Stay strong!'),
        (4, 1, 5000.00, 'USD', 'bank_transfer', 'completed', 'TXN001236', FALSE, 'From UAE Medical Aid with love'),
        (3, 2, 5000.00, 'USD', 'bank_transfer', 'completed', 'TXN001237', TRUE, NULL),
        (1, 2, 3000.00, 'USD', 'credit_card', 'completed', 'TXN001238', FALSE, 'Hope this helps!'),
        (2, 3, 700.00, 'USD', 'paypal', 'completed', 'TXN001239', FALSE, 'For little Omar'),
        (4, 3, 500.00, 'USD', 'credit_card', 'completed', 'TXN001240', FALSE, 'Get well soon!')
    `);
    console.log('Sample donations inserted');

    // Insert sample invoices
    await connection.query(`
        INSERT IGNORE INTO invoices (case_id, title, description, amount, vendor_name, invoice_date, category, status) VALUES
        (1, 'Dialysis Session - Week 1', '3 dialysis sessions at Gaza Medical Center', 1500.00, 'Gaza Medical Center', '2025-01-15', 'hospital', 'paid'),
        (1, 'Dialysis Medications', 'Monthly medication for dialysis support', 800.00, 'Palestine Pharmacy', '2025-01-20', 'medication', 'paid'),
        (2, 'Physical Therapy - Month 1', '12 sessions of physical therapy', 2000.00, 'Rehabilitation Center Gaza', '2025-01-10', 'therapy', 'paid'),
        (2, 'Mobility Equipment', 'Wheelchair and walking aids', 1500.00, 'Medical Equipment Co.', '2025-01-05', 'equipment', 'paid'),
        (3, 'Nebulizer Machine', 'Pediatric nebulizer for home use', 350.00, 'Kids Medical Supplies', '2025-01-25', 'equipment', 'paid'),
        (3, 'Asthma Medications - 3 months', 'Inhalers and preventive medications', 450.00, 'Palestine Pharmacy', '2025-01-26', 'medication', 'paid')
    `);
    console.log('Sample invoices inserted');

    // Insert sample case updates
    await connection.query(`
        INSERT IGNORE INTO case_updates (case_id, update_type, title, content, created_by_type, created_by_id) VALUES
        (1, 'medical', 'Treatment Started', 'Mohammed has started his dialysis treatment. He is responding well to the first sessions.', 'doctor', 1),
        (1, 'thank_you', 'Thank You Donors!', 'I want to thank everyone who donated to my treatment. Your support means the world to me and my family.', 'patient', 1),
        (2, 'recovery', 'Great Progress!', 'Amira has completed her first month of physical therapy. She can now walk short distances with support!', 'doctor', 1),
        (2, 'financial', 'Funding Complete', 'Thanks to generous donors, we have reached our funding goal for Amira treatment.', 'doctor', 1),
        (3, 'medical', 'Equipment Received', 'Omar received his nebulizer and started using it at home. His breathing has improved significantly.', 'doctor', 2)
    `);
    console.log('Sample case updates inserted');

    await connection.end();
    console.log('\n✓ Database setup completed successfully!');
}

setupDatabase().catch(err => {
    console.error('Database setup failed:', err);
    process.exit(1);
});
