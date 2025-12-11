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

    // ============================================
    // FEATURE 5: MENTAL HEALTH & TRAUMA SUPPORT
    // ============================================

    // Create trauma_counseling_sessions table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS trauma_counseling_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            counselor_id INT NOT NULL,
            session_type ENUM('ptsd', 'grief', 'anxiety', 'depression', 'war_trauma', 'child_trauma', 'family_support', 'general') NOT NULL,
            target_group ENUM('adult', 'child', 'family', 'war_survivor') DEFAULT 'adult',
            status ENUM('requested', 'scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'requested',
            scheduled_at DATETIME,
            duration_minutes INT DEFAULT 60,
            session_mode ENUM('video', 'audio', 'chat', 'in_person') DEFAULT 'video',
            notes TEXT,
            counselor_notes TEXT,
            follow_up_recommended BOOLEAN DEFAULT FALSE,
            urgency_level ENUM('low', 'medium', 'high', 'crisis') DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (counselor_id) REFERENCES doctors(id) ON DELETE CASCADE
        )
    `);
    console.log('Trauma counseling sessions table created');

    // Create support_groups table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS support_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            name_ar VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            description_ar TEXT NOT NULL,
            group_type ENUM('chronic_illness', 'disability', 'grief_loss', 'war_trauma', 'caregiver', 'mental_health', 'parent_support', 'general') NOT NULL,
            target_audience ENUM('patients', 'families', 'caregivers', 'all') DEFAULT 'all',
            moderator_type ENUM('doctor', 'volunteer', 'peer') NOT NULL,
            moderator_id INT,
            moderator_name VARCHAR(255),
            max_members INT DEFAULT 50,
            current_members INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            meeting_schedule VARCHAR(255),
            meeting_link VARCHAR(255),
            language ENUM('arabic', 'english', 'both') DEFAULT 'arabic',
            is_private BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log('Support groups table created');

    // Create support_group_members table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS support_group_members (
            id INT AUTO_INCREMENT PRIMARY KEY,
            group_id INT NOT NULL,
            member_type ENUM('patient', 'family_member', 'caregiver') NOT NULL,
            member_id INT,
            display_name VARCHAR(255) NOT NULL,
            is_anonymous BOOLEAN DEFAULT FALSE,
            status ENUM('pending', 'approved', 'removed', 'left') DEFAULT 'pending',
            role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES support_groups(id) ON DELETE CASCADE
        )
    `);
    console.log('Support group members table created');

    // Create support_group_messages table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS support_group_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            group_id INT NOT NULL,
            member_id INT NOT NULL,
            content TEXT NOT NULL,
            is_pinned BOOLEAN DEFAULT FALSE,
            is_moderated BOOLEAN DEFAULT FALSE,
            moderated_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES support_groups(id) ON DELETE CASCADE,
            FOREIGN KEY (member_id) REFERENCES support_group_members(id) ON DELETE CASCADE
        )
    `);
    console.log('Support group messages table created');

    // Create anonymous_therapy_chats table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS anonymous_therapy_chats (
            id INT AUTO_INCREMENT PRIMARY KEY,
            anonymous_id VARCHAR(100) NOT NULL,
            patient_id INT,
            counselor_id INT,
            concern_type ENUM('anxiety', 'depression', 'trauma', 'grief', 'stress', 'relationship', 'addiction', 'other') NOT NULL,
            status ENUM('waiting', 'active', 'closed', 'escalated') DEFAULT 'waiting',
            priority ENUM('normal', 'urgent', 'crisis') DEFAULT 'normal',
            started_at TIMESTAMP NULL,
            ended_at TIMESTAMP NULL,
            counselor_rating INT,
            feedback TEXT,
            is_escalated BOOLEAN DEFAULT FALSE,
            escalation_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
            FOREIGN KEY (counselor_id) REFERENCES doctors(id) ON DELETE SET NULL
        )
    `);
    console.log('Anonymous therapy chats table created');

    // Create anonymous_chat_messages table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS anonymous_chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            chat_id INT NOT NULL,
            sender_type ENUM('patient', 'counselor') NOT NULL,
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES anonymous_therapy_chats(id) ON DELETE CASCADE
        )
    `);
    console.log('Anonymous chat messages table created');

    // ============================================
    // FEATURE 6: PARTNERSHIPS WITH NGOs & MEDICAL MISSIONS
    // ============================================

    // Create ngos table (Verified NGO Network)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS ngos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            name_ar VARCHAR(255),
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(50),
            website VARCHAR(255),
            logo_url VARCHAR(500),
            description TEXT,
            description_ar TEXT,
            organization_type ENUM('medical_ngo', 'humanitarian', 'relief', 'development', 'international', 'local') NOT NULL,
            specializations SET('primary_care', 'surgery', 'pediatrics', 'mental_health', 'emergency', 'rehabilitation', 'maternal_care', 'nutrition', 'vaccination') NOT NULL,
            operating_regions TEXT,
            headquarters_country VARCHAR(100),
            is_verified BOOLEAN DEFAULT FALSE,
            verification_date DATE,
            verified_by INT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log('NGOs table created');

    // Create medical_missions table (Mission Scheduling)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS medical_missions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ngo_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255),
            mission_type ENUM('mobile_clinic', 'surgery_camp', 'vaccination_drive', 'specialist_visit', 'aid_distribution', 'training', 'general_outreach') NOT NULL,
            description TEXT,
            description_ar TEXT,
            specialties_offered SET('general_practice', 'pediatrics', 'surgery', 'mental_health', 'internal_medicine', 'dermatology', 'cardiology', 'ophthalmology', 'orthopedics', 'gynecology', 'dental') NOT NULL,
            target_area VARCHAR(255) NOT NULL,
            target_area_ar VARCHAR(255),
            location_details TEXT,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            daily_start_time TIME,
            daily_end_time TIME,
            max_patients_per_day INT DEFAULT 50,
            services_provided TEXT,
            services_provided_ar TEXT,
            requirements TEXT,
            status ENUM('planned', 'confirmed', 'ongoing', 'completed', 'cancelled', 'postponed') DEFAULT 'planned',
            contact_name VARCHAR(255),
            contact_phone VARCHAR(50),
            contact_email VARCHAR(255),
            is_free BOOLEAN DEFAULT TRUE,
            registration_required BOOLEAN DEFAULT TRUE,
            language SET('arabic', 'english') DEFAULT 'arabic',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
        )
    `);
    console.log('Medical missions table created');

    // Create volunteer_doctors table (International volunteer doctors availability)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS volunteer_doctors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            doctor_id INT,
            ngo_id INT,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            specialty ENUM('general_practice', 'pediatrics', 'surgery', 'mental_health', 'internal_medicine', 'dermatology', 'cardiology', 'ophthalmology', 'orthopedics', 'gynecology', 'dental', 'anesthesiology') NOT NULL,
            sub_specialty VARCHAR(255),
            country VARCHAR(100),
            languages SET('arabic', 'english', 'french', 'spanish', 'german') NOT NULL,
            license_number VARCHAR(100),
            license_country VARCHAR(100),
            years_of_experience INT,
            bio TEXT,
            available_from DATE,
            available_to DATE,
            preferred_regions TEXT,
            can_do_surgery BOOLEAN DEFAULT FALSE,
            availability_status ENUM('available', 'on_mission', 'unavailable') DEFAULT 'available',
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
            FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE SET NULL
        )
    `);
    console.log('Volunteer doctors table created');

    // Create mission_appointments table (Appointment booking for missions)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS mission_appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mission_id INT NOT NULL,
            patient_id INT NOT NULL,
            volunteer_doctor_id INT,
            appointment_date DATE NOT NULL,
            preferred_time ENUM('morning', 'afternoon', 'evening', 'any') DEFAULT 'any',
            reason_for_visit TEXT NOT NULL,
            medical_history_summary TEXT,
            urgency_level ENUM('routine', 'moderate', 'urgent') DEFAULT 'routine',
            status ENUM('requested', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show') DEFAULT 'requested',
            queue_number INT,
            notes TEXT,
            patient_feedback TEXT,
            rating INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (mission_id) REFERENCES medical_missions(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (volunteer_doctor_id) REFERENCES volunteer_doctors(id) ON DELETE SET NULL
        )
    `);
    console.log('Mission appointments table created');

    // Create surgical_camps table (Surgical Missions Tracker)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS surgical_camps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mission_id INT NOT NULL,
            ngo_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255),
            surgery_types SET('general', 'orthopedic', 'cardiac', 'ophthalmology', 'pediatric', 'reconstructive', 'emergency', 'dental') NOT NULL,
            description TEXT,
            description_ar TEXT,
            location VARCHAR(255) NOT NULL,
            hospital_partner VARCHAR(255),
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            total_surgeries_planned INT,
            surgeries_completed INT DEFAULT 0,
            lead_surgeon VARCHAR(255),
            medical_team_size INT,
            eligibility_criteria TEXT,
            eligibility_criteria_ar TEXT,
            pre_screening_required BOOLEAN DEFAULT TRUE,
            screening_dates TEXT,
            status ENUM('announced', 'screening', 'ongoing', 'completed', 'cancelled') DEFAULT 'announced',
            contact_phone VARCHAR(50),
            contact_email VARCHAR(255),
            registration_deadline DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (mission_id) REFERENCES medical_missions(id) ON DELETE CASCADE,
            FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
        )
    `);
    console.log('Surgical camps table created');

    // Create surgery_registrations table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS surgery_registrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            surgical_camp_id INT NOT NULL,
            patient_id INT NOT NULL,
            surgery_type VARCHAR(100) NOT NULL,
            condition_description TEXT NOT NULL,
            medical_documents TEXT,
            screening_status ENUM('pending', 'scheduled', 'screened', 'approved', 'rejected') DEFAULT 'pending',
            screening_date DATE,
            screening_notes TEXT,
            surgery_status ENUM('waiting', 'scheduled', 'completed', 'cancelled', 'postponed') DEFAULT 'waiting',
            surgery_date DATE,
            surgeon_name VARCHAR(255),
            post_op_notes TEXT,
            follow_up_required BOOLEAN DEFAULT FALSE,
            follow_up_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (surgical_camp_id) REFERENCES surgical_camps(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
    `);
    console.log('Surgery registrations table created');

    // Create mission_notifications table (Community notifications)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS mission_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            notification_type ENUM('new_mission', 'surgery_camp', 'specialist_visit', 'aid_drop', 'schedule_change', 'reminder') NOT NULL,
            title VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255),
            message TEXT NOT NULL,
            message_ar TEXT,
            target_area VARCHAR(255),
            mission_id INT,
            surgical_camp_id INT,
            is_urgent BOOLEAN DEFAULT FALSE,
            valid_until DATE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mission_id) REFERENCES medical_missions(id) ON DELETE SET NULL,
            FOREIGN KEY (surgical_camp_id) REFERENCES surgical_camps(id) ON DELETE SET NULL
        )
    `);
    console.log('Mission notifications table created');

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

    // Insert sample support groups for Feature 5
    await connection.query(`
        INSERT IGNORE INTO support_groups (name, name_ar, description, description_ar, group_type, target_audience, moderator_type, moderator_id, moderator_name, max_members, meeting_schedule, meeting_link, language) VALUES
        ('War Trauma Survivors', 'الناجون من صدمات الحرب',
         'A safe space for adults dealing with war-related trauma, PTSD, and anxiety. Share experiences and support each other.',
         'مساحة آمنة للبالغين الذين يتعاملون مع صدمات الحرب واضطراب ما بعد الصدمة والقلق. شارك تجاربك وادعم بعضكم البعض.',
         'war_trauma', 'patients', 'doctor', 3, 'Dr. Fatima Al-Masri', 30, 'Sundays & Wednesdays 7 PM', 'https://meet.healthpal.ps/trauma-support', 'arabic'),
        ('Parents of Chronically Ill Children', 'آباء الأطفال المصابين بأمراض مزمنة',
         'Support group for parents and caregivers of children with chronic illnesses. Share tips and emotional support.',
         'مجموعة دعم للآباء ومقدمي الرعاية للأطفال المصابين بأمراض مزمنة. شارك النصائح والدعم العاطفي.',
         'parent_support', 'families', 'doctor', 5, 'Dr. Layla Nasser', 40, 'Tuesdays 6 PM', 'https://meet.healthpal.ps/parent-support', 'arabic'),
        ('Grief and Loss Support', 'دعم الحزن والفقدان',
         'For those who have lost loved ones. A compassionate space to share grief and healing.',
         'لمن فقدوا أحباءهم. مساحة رحيمة لمشاركة الحزن والشفاء.',
         'grief_loss', 'all', 'doctor', 3, 'Dr. Fatima Al-Masri', 25, 'Mondays 8 PM', 'https://meet.healthpal.ps/grief-support', 'both'),
        ('Youth Mental Wellness', 'الصحة النفسية للشباب',
         'Support group for teenagers and young adults dealing with stress, anxiety, and life challenges.',
         'مجموعة دعم للمراهقين والشباب الذين يتعاملون مع التوتر والقلق وتحديات الحياة.',
         'mental_health', 'patients', 'volunteer', 1, 'Volunteer Team', 35, 'Thursdays 5 PM', 'https://meet.healthpal.ps/youth-wellness', 'arabic'),
        ('Diabetes Support Circle', 'دائرة دعم مرضى السكري',
         'Connect with others managing diabetes. Share tips, recipes, and emotional support.',
         'تواصل مع الآخرين الذين يديرون مرض السكري. شارك النصائح والوصفات والدعم العاطفي.',
         'chronic_illness', 'patients', 'peer', NULL, 'Peer Moderators', 50, 'Saturdays 4 PM', 'https://meet.healthpal.ps/diabetes-circle', 'arabic')
    `);
    console.log('Sample support groups inserted');

    // Insert sample NGOs for Feature 6
    await connection.query(`
        INSERT IGNORE INTO ngos (username, password, name, name_ar, email, phone, website, description, description_ar, organization_type, specializations, operating_regions, headquarters_country, is_verified, is_active) VALUES
        ('msf_gaza', 'password123', 'Médecins Sans Frontières', 'أطباء بلا حدود', 'msf.gaza@msf.org', '+970-599-100100', 'https://www.msf.org', 
         'International medical humanitarian organization providing emergency medical care worldwide.',
         'منظمة طبية إنسانية دولية تقدم الرعاية الطبية الطارئة حول العالم.',
         'international', 'primary_care,surgery,emergency,mental_health', 'Gaza Strip, West Bank', 'France', TRUE, TRUE),
        ('map_org', 'password123', 'Medical Aid for Palestinians', 'المعونة الطبية للفلسطينيين', 'contact@map.org.uk', '+44-20-12345678', 'https://www.map.org.uk',
         'UK-based charity working for the health and dignity of Palestinians.',
         'جمعية خيرية مقرها المملكة المتحدة تعمل من أجل صحة وكرامة الفلسطينيين.',
         'medical_ngo', 'primary_care,pediatrics,mental_health,rehabilitation', 'All Palestine', 'UK', TRUE, TRUE),
        ('mercy_corps', 'password123', 'Mercy Corps', 'مرسي كوربس', 'gaza@mercycorps.org', '+970-598-200200', 'https://www.mercycorps.org',
         'Global humanitarian organization providing relief and development assistance.',
         'منظمة إنسانية عالمية تقدم المساعدة الإغاثية والتنموية.',
         'humanitarian', 'primary_care,nutrition,mental_health', 'Gaza Strip', 'USA', TRUE, TRUE),
        ('pcrf', 'password123', 'Palestine Children Relief Fund', 'صندوق إغاثة أطفال فلسطين', 'info@pcrf.net', '+970-597-300300', 'https://www.pcrf.net',
         'Providing free medical care to Palestinian children.',
         'تقديم الرعاية الطبية المجانية للأطفال الفلسطينيين.',
         'medical_ngo', 'pediatrics,surgery,rehabilitation', 'Palestine', 'USA', TRUE, TRUE)
    `);
    console.log('Sample NGOs inserted');

    // Insert sample medical missions
    await connection.query(`
        INSERT IGNORE INTO medical_missions (ngo_id, title, title_ar, mission_type, description, description_ar, specialties_offered, target_area, target_area_ar, location_details, start_date, end_date, daily_start_time, daily_end_time, max_patients_per_day, services_provided, status, contact_name, contact_phone, is_free, registration_required) VALUES
        (1, 'Mobile Clinic - North Gaza', 'عيادة متنقلة - شمال غزة', 'mobile_clinic',
         'Free medical consultations, basic medications, and referrals for specialized care.',
         'استشارات طبية مجانية، أدوية أساسية، وتحويلات للرعاية المتخصصة.',
         'general_practice,pediatrics,internal_medicine', 'North Gaza', 'شمال غزة', 'Beit Lahia Community Center',
         '2025-02-01', '2025-02-05', '09:00:00', '16:00:00', 80,
         'General checkups, blood pressure monitoring, diabetes screening, child health', 'confirmed', 'Dr. Mohammed Saleh', '+970-599-111222', TRUE, TRUE),
        (2, 'Mental Health Specialist Visit', 'زيارة أخصائي صحة نفسية', 'specialist_visit',
         'Specialized mental health consultations for trauma survivors and families.',
         'استشارات صحة نفسية متخصصة للناجين من الصدمات والعائلات.',
         'mental_health', 'Gaza City', 'مدينة غزة', 'Al-Shifa Hospital, Mental Health Wing',
         '2025-02-10', '2025-02-14', '10:00:00', '17:00:00', 30,
         'PTSD treatment, grief counseling, family therapy, child psychology', 'planned', 'Sarah Ahmed', '+970-598-222333', TRUE, TRUE),
        (4, 'Pediatric Surgery Camp', 'معسكر جراحة الأطفال', 'surgery_camp',
         'Free pediatric surgeries for children with congenital conditions and injuries.',
         'جراحات أطفال مجانية للأطفال ذوي الحالات الخلقية والإصابات.',
         'pediatrics,surgery', 'Gaza City', 'مدينة غزة', 'Al-Rantisi Children Hospital',
         '2025-03-01', '2025-03-10', '08:00:00', '18:00:00', 20,
         'Cleft palate repair, hernia repair, orthopedic corrections', 'announced', 'Dr. John Smith', '+1-555-444555', TRUE, TRUE),
        (3, 'Vaccination Drive - Rafah', 'حملة تطعيم - رفح', 'vaccination_drive',
         'Catch-up vaccination campaign for children under 5 years.',
         'حملة تطعيم تعويضية للأطفال دون الخامسة.',
         'pediatrics', 'Rafah', 'رفح', 'Multiple locations in Rafah',
         '2025-02-20', '2025-02-25', '08:00:00', '14:00:00', 200,
         'Polio, MMR, DTP, Hepatitis B vaccines', 'planned', 'Vaccination Team', '+970-599-333444', TRUE, FALSE)
    `);
    console.log('Sample medical missions inserted');

    // Insert sample volunteer doctors
    await connection.query(`
        INSERT IGNORE INTO volunteer_doctors (doctor_id, ngo_id, name, email, phone, specialty, sub_specialty, country, languages, years_of_experience, bio, available_from, available_to, preferred_regions, can_do_surgery, availability_status, is_verified) VALUES
        (2, 2, 'Dr. Sarah Miller', 'sarah.miller@healthpal.org', '+1-555-123456', 'pediatrics', 'Pediatric Cardiology', 'USA', 'english', 8, 
         'International pediatrician with experience in humanitarian missions.', '2025-02-01', '2025-03-31', 'Gaza Strip', FALSE, 'available', TRUE),
        (NULL, 1, 'Dr. Pierre Dubois', 'pierre.dubois@msf.org', '+33-1-12345678', 'surgery', 'Trauma Surgery', 'France', 'english,french', 15,
         'MSF surgeon with extensive experience in conflict zones.', '2025-02-15', '2025-04-15', 'Gaza Strip, West Bank', TRUE, 'available', TRUE),
        (NULL, 4, 'Dr. Emily Watson', 'emily.watson@pcrf.net', '+1-555-666777', 'surgery', 'Pediatric Orthopedics', 'UK', 'english', 12,
         'Specialized in pediatric orthopedic surgeries and corrections.', '2025-03-01', '2025-03-15', 'Gaza City', TRUE, 'available', TRUE),
        (4, 2, 'Dr. James Wilson', 'james.wilson@healthpal.org', '+44-20-12345678', 'internal_medicine', 'Cardiology', 'UK', 'english', 15,
         'UK-based internal medicine specialist volunteering remotely.', '2025-01-01', '2025-06-30', 'All Palestine', FALSE, 'available', TRUE)
    `);
    console.log('Sample volunteer doctors inserted');

    // Insert sample surgical camps
    await connection.query(`
        INSERT IGNORE INTO surgical_camps (mission_id, ngo_id, title, title_ar, surgery_types, description, description_ar, location, hospital_partner, start_date, end_date, total_surgeries_planned, lead_surgeon, medical_team_size, eligibility_criteria, eligibility_criteria_ar, status, contact_phone, contact_email, registration_deadline) VALUES
        (3, 4, 'PCRF Pediatric Surgery Camp March 2025', 'معسكر جراحة الأطفال مارس 2025',
         'pediatric,orthopedic,general',
         'Free surgical interventions for children with various conditions including cleft palate, hernias, and orthopedic issues.',
         'تدخلات جراحية مجانية للأطفال الذين يعانون من حالات مختلفة بما في ذلك الشفة المشقوقة والفتق ومشاكل العظام.',
         'Gaza City', 'Al-Rantisi Children Hospital', '2025-03-01', '2025-03-10', 50, 'Dr. Emily Watson', 12,
         'Children under 18 years, Palestinian ID required, medical records needed',
         'الأطفال دون 18 عاماً، هوية فلسطينية مطلوبة، السجلات الطبية مطلوبة',
         'announced', '+1-555-444555', 'surgery@pcrf.net', '2025-02-15')
    `);
    console.log('Sample surgical camps inserted');

    // Insert sample mission notifications
    await connection.query(`
        INSERT IGNORE INTO mission_notifications (notification_type, title, title_ar, message, message_ar, target_area, mission_id, is_urgent, valid_until, is_active) VALUES
        ('new_mission', 'Mobile Clinic Coming to North Gaza!', 'عيادة متنقلة قادمة إلى شمال غزة!',
         'Free medical consultations available Feb 1-5 at Beit Lahia Community Center. Walk-ins welcome!',
         'استشارات طبية مجانية متاحة من 1-5 فبراير في مركز بيت لاهيا المجتمعي. الحضور المباشر مرحب به!',
         'North Gaza', 1, FALSE, '2025-02-05', TRUE),
        ('surgery_camp', 'Pediatric Surgery Registration Open', 'التسجيل مفتوح لجراحات الأطفال',
         'PCRF is offering free pediatric surgeries in March. Register by Feb 15. Limited spots available.',
         'صندوق إغاثة أطفال فلسطين يقدم جراحات أطفال مجانية في مارس. سجل قبل 15 فبراير. الأماكن محدودة.',
         'All Gaza', 3, TRUE, '2025-02-15', TRUE),
        ('specialist_visit', 'Mental Health Specialists Available', 'أخصائيو صحة نفسية متاحون',
         'MAP mental health team will be at Al-Shifa Hospital Feb 10-14. Book appointments now.',
         'فريق الصحة النفسية من المعونة الطبية سيكون في مستشفى الشفاء من 10-14 فبراير. احجز موعدك الآن.',
         'Gaza City', 2, FALSE, '2025-02-14', TRUE)
    `);
    console.log('Sample mission notifications inserted');

    await connection.end();
    console.log('\n✓ Database setup completed successfully!');
}

setupDatabase().catch(err => {
    console.error('Database setup failed:', err);
    process.exit(1);
});
