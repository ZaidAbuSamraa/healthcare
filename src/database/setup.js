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

    // Create volunteers table (NGOs and volunteers)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS volunteers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(20),
            organization_name VARCHAR(100),
            organization_type ENUM('ngo', 'pharmacy', 'hospital', 'individual', 'charity') DEFAULT 'individual',
            coverage_areas TEXT,
            is_verified BOOLEAN DEFAULT FALSE,
            availability_status ENUM('available', 'busy', 'offline') DEFAULT 'available',
            total_deliveries INT DEFAULT 0,
            rating DECIMAL(3, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('Volunteers table created');

    // Create medication_requests table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS medication_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            medication_name VARCHAR(255) NOT NULL,
            medication_type ENUM('prescription', 'over_the_counter', 'medical_equipment', 'supplies') NOT NULL,
            quantity VARCHAR(100),
            description TEXT,
            prescription_image VARCHAR(255),
            urgency_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
            status ENUM('pending', 'accepted', 'in_progress', 'delivered', 'cancelled') DEFAULT 'pending',
            delivery_address TEXT NOT NULL,
            delivery_notes TEXT,
            accepted_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (accepted_by) REFERENCES volunteers(id) ON DELETE SET NULL
        )
    `);
    console.log('Medication requests table created');

    // Create deliveries table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS deliveries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            request_id INT NOT NULL,
            volunteer_id INT NOT NULL,
            status ENUM('picked_up', 'in_transit', 'delivered', 'failed') DEFAULT 'picked_up',
            pickup_location VARCHAR(255),
            delivery_location VARCHAR(255),
            estimated_delivery DATETIME,
            actual_delivery DATETIME,
            notes TEXT,
            patient_confirmed BOOLEAN DEFAULT FALSE,
            rating INT,
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES medication_requests(id) ON DELETE CASCADE,
            FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
        )
    `);
    console.log('Deliveries table created');

    // Create equipment_inventory table (Crowdsourced Inventory)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS equipment_inventory (
            id INT AUTO_INCREMENT PRIMARY KEY,
            listed_by_type ENUM('volunteer', 'donor', 'hospital', 'pharmacy') NOT NULL,
            listed_by_id INT NOT NULL,
            item_name VARCHAR(255) NOT NULL,
            item_type ENUM('oxygen_tank', 'wheelchair', 'dialysis_machine', 'nebulizer', 'hospital_bed', 'crutches', 'blood_pressure_monitor', 'glucose_meter', 'medication', 'surgical_supplies', 'ppe', 'other') NOT NULL,
            category ENUM('equipment', 'medication', 'supplies') NOT NULL,
            description TEXT,
            quantity INT NOT NULL DEFAULT 1,
            available_quantity INT NOT NULL DEFAULT 1,
            condition_status ENUM('new', 'like_new', 'good', 'fair', 'for_parts') DEFAULT 'good',
            expiry_date DATE,
            location VARCHAR(255) NOT NULL,
            is_available BOOLEAN DEFAULT TRUE,
            is_free BOOLEAN DEFAULT TRUE,
            price DECIMAL(10, 2) DEFAULT 0.00,
            contact_phone VARCHAR(20),
            contact_email VARCHAR(100),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log('Equipment inventory table created');

    // Create equipment_requests table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS equipment_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            equipment_id INT,
            item_name VARCHAR(255) NOT NULL,
            item_type VARCHAR(100),
            urgency_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
            description TEXT,
            status ENUM('pending', 'matched', 'fulfilled', 'cancelled') DEFAULT 'pending',
            fulfilled_by_type ENUM('volunteer', 'donor') NULL,
            fulfilled_by_id INT NULL,
            delivery_address TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (equipment_id) REFERENCES equipment_inventory(id) ON DELETE SET NULL
        )
    `);
    console.log('Equipment requests table created');

    // ============================================
    // FEATURE 4: HEALTH EDUCATION & PUBLIC HEALTH ALERTS
    // ============================================

    // Create health_guides table (Localized Health Guides)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS health_guides (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255) NOT NULL,
            category ENUM('first_aid', 'chronic_illness', 'nutrition', 'maternal_care', 'child_health', 'mental_health', 'hygiene', 'emergency', 'medication', 'other') NOT NULL,
            content TEXT NOT NULL,
            content_ar TEXT NOT NULL,
            summary VARCHAR(500),
            summary_ar VARCHAR(500),
            image_url VARCHAR(255),
            video_url VARCHAR(255),
            author_type ENUM('doctor', 'admin', 'organization') NOT NULL,
            author_id INT,
            author_name VARCHAR(255),
            is_published BOOLEAN DEFAULT TRUE,
            view_count INT DEFAULT 0,
            tags VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log('Health guides table created');

    // Create public_health_alerts table (Real-time alerts)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS public_health_alerts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255) NOT NULL,
            alert_type ENUM('disease_outbreak', 'air_quality', 'water_safety', 'urgent_medical', 'vaccination', 'emergency', 'general') NOT NULL,
            severity ENUM('info', 'warning', 'critical', 'emergency') DEFAULT 'info',
            content TEXT NOT NULL,
            content_ar TEXT NOT NULL,
            affected_areas TEXT,
            recommendations TEXT,
            recommendations_ar TEXT,
            source VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_date DATETIME,
            created_by_type ENUM('admin', 'doctor', 'organization') NOT NULL,
            created_by_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log('Public health alerts table created');

    // Create workshops table (Workshops & Webinars)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS workshops (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            description_ar TEXT NOT NULL,
            workshop_type ENUM('webinar', 'in_person', 'hybrid') NOT NULL,
            category ENUM('first_aid', 'chronic_illness', 'nutrition', 'maternal_care', 'child_health', 'mental_health', 'hygiene', 'emergency', 'general') NOT NULL,
            instructor_name VARCHAR(255) NOT NULL,
            instructor_title VARCHAR(255),
            instructor_id INT,
            instructor_type ENUM('doctor', 'volunteer', 'external') DEFAULT 'doctor',
            scheduled_date DATETIME NOT NULL,
            duration_minutes INT DEFAULT 60,
            location VARCHAR(255),
            online_link VARCHAR(255),
            max_participants INT DEFAULT 100,
            current_participants INT DEFAULT 0,
            is_free BOOLEAN DEFAULT TRUE,
            price DECIMAL(10, 2) DEFAULT 0.00,
            language ENUM('arabic', 'english', 'both') DEFAULT 'arabic',
            status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
            recording_url VARCHAR(255),
            materials_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log('Workshops table created');

    // Create workshop_registrations table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS workshop_registrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workshop_id INT NOT NULL,
            participant_type ENUM('patient', 'volunteer', 'guest') NOT NULL,
            participant_id INT,
            guest_name VARCHAR(255),
            guest_email VARCHAR(255),
            guest_phone VARCHAR(50),
            attended BOOLEAN DEFAULT FALSE,
            feedback TEXT,
            rating INT,
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE
        )
    `);
    console.log('Workshop registrations table created');

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

    // Insert sample volunteers (password: password123)
    await connection.query(`
        INSERT IGNORE INTO volunteers (username, password, name, email, phone, organization_name, organization_type, coverage_areas, is_verified, availability_status, total_deliveries, rating) VALUES
        ('gaza_pharmacy', 'password123', 'Gaza Central Pharmacy', 'gaza.pharmacy@email.com', '+970-599-444555', 'Gaza Central Pharmacy', 'pharmacy', 'Gaza City, North Gaza', TRUE, 'available', 45, 4.80),
        ('red_crescent', 'password123', 'Palestine Red Crescent', 'prc@redcrescent.ps', '+970-598-888999', 'Palestine Red Crescent Society', 'ngo', 'All Gaza Strip', TRUE, 'available', 120, 4.95),
        ('volunteer_ahmad', 'password123', 'Ahmad Volunteer', 'ahmad.vol@email.com', '+970-597-666777', NULL, 'individual', 'Gaza City, Rimal', TRUE, 'available', 23, 4.60),
        ('medical_aid', 'password123', 'Medical Aid Palestine', 'contact@medicalaid.ps', '+970-599-111000', 'Medical Aid for Palestinians', 'charity', 'All Gaza Strip, West Bank', TRUE, 'available', 89, 4.90)
    `);
    console.log('Sample volunteers inserted');

    // Insert sample medication requests
    await connection.query(`
        INSERT IGNORE INTO medication_requests (patient_id, medication_name, medication_type, quantity, description, urgency_level, status, delivery_address, delivery_notes, accepted_by) VALUES
        (1, 'Insulin Lantus', 'prescription', '3 boxes', 'Insulin for diabetes management, needed urgently', 'high', 'delivered', 'Gaza City, Al-Rimal, Street 5', 'Call before arrival', 1),
        (2, 'Paracetamol 500mg', 'over_the_counter', '2 boxes', 'For pain management', 'low', 'pending', 'Gaza City, Al-Zahra, Building 12', 'Leave at reception', NULL),
        (3, 'Nebulizer Masks (Pediatric)', 'medical_equipment', '5 pieces', 'Replacement masks for home nebulizer', 'medium', 'in_progress', 'North Gaza, Beit Lahia', 'Urgent for child', 3)
    `);
    console.log('Sample medication requests inserted');

    // Insert sample deliveries
    await connection.query(`
        INSERT IGNORE INTO deliveries (request_id, volunteer_id, status, pickup_location, delivery_location, estimated_delivery, actual_delivery, patient_confirmed, rating, feedback) VALUES
        (1, 1, 'delivered', 'Gaza Central Pharmacy', 'Gaza City, Al-Rimal, Street 5', '2025-01-20 14:00:00', '2025-01-20 13:45:00', TRUE, 5, 'Very fast delivery, thank you!')
    `);
    console.log('Sample deliveries inserted');

    // Insert sample equipment inventory (Crowdsourced Inventory)
    await connection.query(`
        INSERT IGNORE INTO equipment_inventory (listed_by_type, listed_by_id, item_name, item_type, category, description, quantity, available_quantity, condition_status, location, is_available, is_free, contact_phone) VALUES
        ('volunteer', 1, 'Portable Oxygen Concentrator', 'oxygen_tank', 'equipment', '5L portable oxygen concentrator, fully functional', 2, 2, 'good', 'Gaza City, Al-Rimal', TRUE, TRUE, '+970-599-444555'),
        ('volunteer', 2, 'Manual Wheelchair', 'wheelchair', 'equipment', 'Standard manual wheelchair, foldable', 5, 3, 'good', 'Gaza Central Hospital', TRUE, TRUE, '+970-598-888999'),
        ('volunteer', 2, 'Crutches (Adjustable)', 'crutches', 'equipment', 'Aluminum adjustable crutches, pairs available', 10, 8, 'like_new', 'Gaza Central Hospital', TRUE, TRUE, '+970-598-888999'),
        ('volunteer', 1, 'Blood Pressure Monitor', 'blood_pressure_monitor', 'equipment', 'Digital automatic blood pressure monitor', 3, 3, 'new', 'Gaza City Pharmacy', TRUE, TRUE, '+970-599-444555'),
        ('volunteer', 4, 'Nebulizer Machine', 'nebulizer', 'equipment', 'Compressor nebulizer for respiratory treatments', 4, 2, 'good', 'Medical Aid Office, Gaza', TRUE, TRUE, '+970-599-111000'),
        ('volunteer', 1, 'Insulin (Lantus)', 'medication', 'medication', 'Lantus insulin pens, expiry 2025-06', 20, 15, 'new', 'Gaza Central Pharmacy', TRUE, TRUE, '+970-599-444555'),
        ('volunteer', 4, 'Surgical Masks (Box)', 'ppe', 'supplies', 'Box of 50 surgical masks', 100, 80, 'new', 'Medical Aid Warehouse', TRUE, TRUE, '+970-599-111000'),
        ('volunteer', 2, 'Hospital Bed (Manual)', 'hospital_bed', 'equipment', 'Manual hospital bed with side rails', 2, 1, 'fair', 'Red Crescent Storage', TRUE, TRUE, '+970-598-888999'),
        ('volunteer', 3, 'Glucose Meter Kit', 'glucose_meter', 'equipment', 'Complete glucose monitoring kit with strips', 5, 5, 'new', 'Gaza City, Rimal District', TRUE, TRUE, '+970-597-666777'),
        ('donor', 1, 'Oxygen Concentrator (Portable)', 'oxygen_tank', 'equipment', 'Donated portable oxygen concentrator, 3L capacity', 1, 1, 'like_new', 'Gaza City - Available for pickup', TRUE, TRUE, '+1-555-0101'),
        ('donor', 2, 'Diabetic Testing Supplies', 'medication', 'medication', 'Glucose test strips and lancets, 100 count boxes', 10, 10, 'new', 'Can deliver to Gaza', TRUE, TRUE, '+1-555-0102'),
        ('donor', 3, 'First Aid Kits', 'surgical_supplies', 'supplies', 'Complete first aid kits for home use', 25, 25, 'new', 'Available at donation center', TRUE, TRUE, 'anonymous'),
        ('donor', 4, 'Walking Canes', 'crutches', 'equipment', 'Adjustable aluminum walking canes', 8, 8, 'new', 'Charity Foundation Office', TRUE, TRUE, '+972-50-1234567')
    `);
    console.log('Sample equipment inventory inserted');

    // Insert sample health guides
    await connection.query(`
        INSERT IGNORE INTO health_guides (title, title_ar, category, content, content_ar, summary, summary_ar, author_type, author_name, tags) VALUES
        ('First Aid Basics', 'أساسيات الإسعافات الأولية', 'first_aid', 
         'Learn the essential first aid techniques including CPR, wound care, and emergency response. Always ensure scene safety before providing help.',
         'تعلم تقنيات الإسعافات الأولية الأساسية بما في ذلك الإنعاش القلبي الرئوي والعناية بالجروح والاستجابة للطوارئ. تأكد دائماً من سلامة المكان قبل تقديم المساعدة.',
         'Essential first aid techniques for emergencies',
         'تقنيات الإسعافات الأولية الأساسية للطوارئ',
         'doctor', 'Dr. Ahmad Hassan', 'first_aid,emergency,cpr'),
        ('Managing Diabetes', 'إدارة مرض السكري', 'chronic_illness',
         'Diabetes management includes monitoring blood sugar levels, taking medications as prescribed, eating a balanced diet, and regular exercise.',
         'تشمل إدارة مرض السكري مراقبة مستويات السكر في الدم وتناول الأدوية حسب الوصفة الطبية واتباع نظام غذائي متوازن وممارسة التمارين الرياضية بانتظام.',
         'Complete guide to managing diabetes daily',
         'دليل شامل لإدارة مرض السكري يومياً',
         'doctor', 'Dr. Ahmad Hassan', 'diabetes,chronic,nutrition'),
        ('Maternal Care During Pregnancy', 'رعاية الأم أثناء الحمل', 'maternal_care',
         'Prenatal care is essential for a healthy pregnancy. Regular checkups, proper nutrition, and avoiding harmful substances are key.',
         'الرعاية قبل الولادة ضرورية لحمل صحي. الفحوصات المنتظمة والتغذية السليمة وتجنب المواد الضارة أمور أساسية.',
         'Essential prenatal care guide for expecting mothers',
         'دليل الرعاية الأساسية للأمهات الحوامل',
         'doctor', 'Dr. Layla Nasser', 'pregnancy,maternal,prenatal'),
        ('Child Nutrition Guide', 'دليل تغذية الطفل', 'child_health',
         'Proper nutrition is vital for child development. Include proteins, vitamins, and minerals in daily meals. Breastfeeding is recommended for the first 6 months.',
         'التغذية السليمة ضرورية لنمو الطفل. تضمين البروتينات والفيتامينات والمعادن في الوجبات اليومية. يُنصح بالرضاعة الطبيعية خلال الأشهر الستة الأولى.',
         'Nutrition guide for healthy child development',
         'دليل التغذية لنمو صحي للأطفال',
         'doctor', 'Dr. Sarah Miller', 'nutrition,children,development'),
        ('Mental Health Awareness', 'التوعية بالصحة النفسية', 'mental_health',
         'Mental health is as important as physical health. Recognize signs of stress, anxiety, and depression. Seek help when needed.',
         'الصحة النفسية لا تقل أهمية عن الصحة الجسدية. تعرف على علامات التوتر والقلق والاكتئاب. اطلب المساعدة عند الحاجة.',
         'Understanding and maintaining mental health',
         'فهم الصحة النفسية والحفاظ عليها',
         'doctor', 'Dr. Fatima Al-Masri', 'mental_health,stress,anxiety'),
        ('Hand Hygiene and Infection Prevention', 'نظافة اليدين والوقاية من العدوى', 'hygiene',
         'Proper handwashing with soap for 20 seconds is the most effective way to prevent infections. Wash hands before eating and after using the bathroom.',
         'غسل اليدين بالصابون لمدة 20 ثانية هو أكثر الطرق فعالية للوقاية من العدوى. اغسل يديك قبل الأكل وبعد استخدام الحمام.',
         'Proper handwashing techniques to prevent infections',
         'تقنيات غسل اليدين الصحيحة للوقاية من العدوى',
         'organization', 'Ministry of Health', 'hygiene,infection,prevention')
    `);
    console.log('Sample health guides inserted');

    // Insert sample public health alerts
    await connection.query(`
        INSERT IGNORE INTO public_health_alerts (title, title_ar, alert_type, severity, content, content_ar, affected_areas, recommendations, recommendations_ar, source, created_by_type) VALUES
        ('Respiratory Illness Outbreak', 'تفشي أمراض الجهاز التنفسي', 'disease_outbreak', 'warning',
         'Increased cases of respiratory illness reported in Gaza City. Please take precautions.',
         'تم الإبلاغ عن زيادة في حالات أمراض الجهاز التنفسي في مدينة غزة. يرجى اتخاذ الاحتياطات.',
         'Gaza City, North Gaza',
         'Wear masks in crowded areas, wash hands frequently, avoid contact with sick individuals',
         'ارتداء الكمامات في الأماكن المزدحمة، غسل اليدين بشكل متكرر، تجنب الاتصال بالمرضى',
         'Ministry of Health', 'admin'),
        ('Water Quality Advisory', 'تحذير بشأن جودة المياه', 'water_safety', 'critical',
         'Water quality issues detected in Khan Yunis area. Boil water before drinking.',
         'تم اكتشاف مشاكل في جودة المياه في منطقة خان يونس. يجب غلي الماء قبل الشرب.',
         'Khan Yunis, Rafah',
         'Boil all drinking water for at least 1 minute. Use bottled water if available.',
         'غلي جميع مياه الشرب لمدة دقيقة واحدة على الأقل. استخدم المياه المعبأة إذا توفرت.',
         'Water Authority', 'admin'),
        ('Vaccination Campaign', 'حملة التطعيم', 'vaccination', 'info',
         'Free polio vaccination campaign for children under 5 years starting next week.',
         'حملة تطعيم مجانية ضد شلل الأطفال للأطفال دون سن الخامسة تبدأ الأسبوع القادم.',
         'All Gaza Strip',
         'Bring children to nearest health center. Bring vaccination card.',
         'أحضر الأطفال إلى أقرب مركز صحي. أحضر بطاقة التطعيم.',
         'UNICEF & Ministry of Health', 'organization'),
        ('Urgent Blood Donation Needed', 'حاجة عاجلة للتبرع بالدم', 'urgent_medical', 'emergency',
         'Blood banks are running low. All blood types needed urgently.',
         'بنوك الدم تنفد. جميع فصائل الدم مطلوبة بشكل عاجل.',
         'All Gaza Strip',
         'Visit nearest hospital blood bank. Donation takes only 15 minutes.',
         'قم بزيارة أقرب بنك دم في المستشفى. التبرع يستغرق 15 دقيقة فقط.',
         'Gaza Blood Bank', 'admin')
    `);
    console.log('Sample public health alerts inserted');

    // Insert sample workshops
    await connection.query(`
        INSERT IGNORE INTO workshops (title, title_ar, description, description_ar, workshop_type, category, instructor_name, instructor_title, instructor_type, scheduled_date, duration_minutes, location, online_link, max_participants, language, status) VALUES
        ('First Aid Training', 'تدريب الإسعافات الأولية', 
         'Learn essential first aid skills including CPR, wound care, and emergency response.',
         'تعلم مهارات الإسعافات الأولية الأساسية بما في ذلك الإنعاش القلبي الرئوي والعناية بالجروح والاستجابة للطوارئ.',
         'in_person', 'first_aid', 'Dr. Ahmad Hassan', 'General Practitioner', 'doctor',
         '2025-02-15 10:00:00', 120, 'Gaza Community Center', NULL, 30, 'arabic', 'upcoming'),
        ('Managing Stress and Anxiety', 'إدارة التوتر والقلق',
         'Online webinar about coping mechanisms for stress and anxiety in difficult times.',
         'ندوة عبر الإنترنت حول آليات التعامل مع التوتر والقلق في الأوقات الصعبة.',
         'webinar', 'mental_health', 'Dr. Fatima Al-Masri', 'Mental Health Specialist', 'doctor',
         '2025-02-10 18:00:00', 90, NULL, 'https://meet.healthpal.ps/mental-health-101', 100, 'arabic', 'upcoming'),
        ('Child Nutrition Workshop', 'ورشة تغذية الطفل',
         'Learn about proper nutrition for children of all ages.',
         'تعرف على التغذية السليمة للأطفال من جميع الأعمار.',
         'hybrid', 'nutrition', 'Dr. Layla Nasser', 'Pediatrician', 'doctor',
         '2025-02-20 14:00:00', 60, 'Gaza Medical Center', 'https://meet.healthpal.ps/nutrition', 50, 'both', 'upcoming'),
        ('Diabetes Management Class', 'فصل إدارة مرض السكري',
         'Monthly support group and education session for diabetes patients.',
         'مجموعة دعم شهرية وجلسة تثقيفية لمرضى السكري.',
         'in_person', 'chronic_illness', 'Dr. Ahmad Hassan', 'General Practitioner', 'doctor',
         '2025-02-05 11:00:00', 90, 'Gaza Health Clinic', NULL, 25, 'arabic', 'upcoming'),
        ('Maternal Health Webinar', 'ندوة صحة الأم',
         'Prenatal care and healthy pregnancy practices for expecting mothers.',
         'الرعاية السابقة للولادة وممارسات الحمل الصحي للأمهات الحوامل.',
         'webinar', 'maternal_care', 'Dr. Sarah Miller', 'Pediatrician', 'doctor',
         '2025-02-25 16:00:00', 75, NULL, 'https://meet.healthpal.ps/maternal-care', 80, 'both', 'upcoming')
    `);
    console.log('Sample workshops inserted');

    await connection.end();
    console.log('\n✓ Database setup completed successfully!');
}

setupDatabase().catch(err => {
    console.error('Database setup failed:', err);
    process.exit(1);
});
