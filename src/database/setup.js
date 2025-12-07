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

    await connection.end();
    console.log('\n✓ Database setup completed successfully!');
}

setupDatabase().catch(err => {
    console.error('Database setup failed:', err);
    process.exit(1);
});
