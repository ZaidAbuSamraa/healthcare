const readline = require('readline');
const http = require('http');

const API_BASE = 'http://localhost:3000/api';

// Current logged in user
let currentUser = null;
let currentUserType = null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to make HTTP requests
function apiRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve({ error: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

function prompt(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

function clearScreen() {
    console.clear();
}

function printHeader() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    HealthPal CLI                             ║');
    console.log('║           Remote Medical Consultations Platform              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

function printWelcomeMenu() {
    console.log('┌──────────────────────────────────────────────────────────────┐');
    console.log('│                      WELCOME                                 │');
    console.log('├──────────────────────────────────────────────────────────────┤');
    console.log('│  1. Register as Patient                                      │');
    console.log('│  2. Register as Doctor                                       │');
    console.log('│  3. Login as Patient                                         │');
    console.log('│  4. Login as Doctor                                          │');
    console.log('│  0. Exit                                                     │');
    console.log('└──────────────────────────────────────────────────────────────┘');
}

async function registerPatient() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                 PATIENT REGISTRATION                         │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const username = await prompt('Choose a Username: ');
    const password = await prompt('Choose a Password: ');
    const confirmPassword = await prompt('Confirm Password: ');
    
    if (password !== confirmPassword) {
        console.log('\n❌ Passwords do not match. Please try again.');
        return null;
    }
    
    const name = await prompt('Full Name: ');
    const email = await prompt('Email: ');
    const phone = await prompt('Phone: ');
    const dob = await prompt('Date of Birth (YYYY-MM-DD): ');
    
    console.log('\nGender options: male, female, other');
    const gender = await prompt('Gender: ');
    
    console.log('\nLanguage options: arabic, english');
    const language = await prompt('Language Preference: ');
    
    const history = await prompt('Medical History (or press Enter to skip): ');
    
    const result = await apiRequest('POST', '/patients', {
        username,
        password,
        name,
        email,
        phone,
        date_of_birth: dob || null,
        gender: gender || null,
        language_preference: language || 'arabic',
        medical_history: history || null
    });
    
    if (result.success) {
        console.log('\n✅ Registration successful!');
        console.log(`   Username: ${result.data.username}`);
        console.log('   You can now login with your username and password.\n');
        return result.data.id;
    } else {
        console.log(`\n❌ Registration failed: ${result.error}`);
        return null;
    }
}

async function registerDoctor() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                  DOCTOR REGISTRATION                         │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const username = await prompt('Choose a Username: ');
    const password = await prompt('Choose a Password: ');
    const confirmPassword = await prompt('Confirm Password: ');
    
    if (password !== confirmPassword) {
        console.log('\n❌ Passwords do not match. Please try again.');
        return null;
    }
    
    const name = await prompt('Full Name: ');
    const email = await prompt('Email: ');
    const phone = await prompt('Phone: ');
    
    console.log('\nSpecialties available:');
    console.log('  1. general_practice    5. surgery');
    console.log('  2. pediatrics          6. dermatology');
    console.log('  3. mental_health       7. cardiology');
    console.log('  4. internal_medicine   8. neurology');
    const specialty = await prompt('Enter specialty: ');
    
    console.log('\nLanguages (comma-separated, e.g., arabic,english):');
    const languages = await prompt('Languages you speak: ');
    
    const isInternational = await prompt('Are you an international doctor? (yes/no): ');
    const bio = await prompt('Short bio: ');
    const experience = await prompt('Years of experience: ');
    
    const result = await apiRequest('POST', '/doctors', {
        username,
        password,
        name,
        email,
        phone,
        specialty,
        languages,
        is_international: isInternational.toLowerCase() === 'yes',
        availability_status: 'available',
        bio,
        years_of_experience: parseInt(experience) || 0
    });
    
    if (result.success) {
        console.log('\n✅ Registration successful!');
        console.log(`   Username: ${result.data.username}`);
        console.log('   You can now login with your username and password.\n');
        return result.data.id;
    } else {
        console.log(`\n❌ Registration failed: ${result.error}`);
        return null;
    }
}

async function loginPatient() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                    PATIENT LOGIN                             │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const username = await prompt('Username: ');
    const password = await prompt('Password: ');
    
    const result = await apiRequest('POST', '/patients/login', { username, password });
    
    if (result.success) {
        currentUser = result.data;
        currentUserType = 'patient';
        console.log(`\n✅ Welcome back, ${currentUser.name}!\n`);
        return true;
    } else {
        console.log('\n❌ Invalid username or password. Please try again.\n');
        return false;
    }
}

async function loginDoctor() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                     DOCTOR LOGIN                             │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const username = await prompt('Username: ');
    const password = await prompt('Password: ');
    
    const result = await apiRequest('POST', '/doctors/login', { username, password });
    
    if (result.success) {
        currentUser = result.data;
        currentUserType = 'doctor';
        console.log(`\n✅ Welcome back, Dr. ${currentUser.name}!\n`);
        return true;
    } else {
        console.log('\n❌ Invalid username or password. Please try again.\n');
        return false;
    }
}

function printPatientMenu() {
    console.log(`  Logged in as: ${currentUser.name} (Patient)\n`);
    console.log('┌──────────────────────────────────────────────────────────────┐');
    console.log('│                    PATIENT MENU                              │');
    console.log('├──────────────────────────────────────────────────────────────┤');
    console.log('│  1. View Available Doctors                                   │');
    console.log('│  2. View Doctors by Specialty                                │');
    console.log('│  3. Book a Consultation                                      │');
    console.log('│  4. View My Consultations                                    │');
    console.log('│  5. View Consultation Details                                │');
    console.log('│  6. Send Message to Doctor                                   │');
    console.log('│  7. View Messages                                            │');
    console.log('│  8. View My Profile                                          │');
    console.log('│  9. Logout                                                   │');
    console.log('│  0. Exit                                                     │');
    console.log('└──────────────────────────────────────────────────────────────┘');
}

function printDoctorMenu() {
    console.log(`  Logged in as: Dr. ${currentUser.name} (${currentUser.specialty})\n`);
    console.log('┌──────────────────────────────────────────────────────────────┐');
    console.log('│                    DOCTOR MENU                               │');
    console.log('├──────────────────────────────────────────────────────────────┤');
    console.log('│  1. View My Consultations                                    │');
    console.log('│  2. View Consultation Details                                │');
    console.log('│  3. Update Consultation Status                               │');
    console.log('│  4. Add Diagnosis/Prescription                               │');
    console.log('│  5. Send Message to Patient                                  │');
    console.log('│  6. View Messages                                            │');
    console.log('│  7. Update My Availability                                   │');
    console.log('│  8. View My Profile                                          │');
    console.log('│  9. Logout                                                   │');
    console.log('│  0. Exit                                                     │');
    console.log('└──────────────────────────────────────────────────────────────┘');
}

async function viewAvailableDoctors() {
    console.log('\n📋 Available Doctors:\n');
    const result = await apiRequest('GET', '/doctors/available');
    if (result.success && result.data.length > 0) {
        result.data.forEach((doc, i) => {
            console.log(`  ${i + 1}. Dr. ${doc.name}`);
            console.log(`     Specialty: ${doc.specialty.replace('_', ' ')}`);
            console.log(`     Languages: ${doc.languages}`);
            console.log(`     International: ${doc.is_international ? 'Yes' : 'No'}`);
            console.log(`     Experience: ${doc.years_of_experience} years`);
            console.log('');
        });
    } else {
        console.log('  No available doctors at the moment.');
    }
}

async function viewDoctorsBySpecialty() {
    console.log('\n🔍 Available Specialties:');
    console.log('  1. general_practice');
    console.log('  2. pediatrics');
    console.log('  3. mental_health');
    console.log('  4. internal_medicine');
    console.log('  5. surgery');
    console.log('  6. dermatology');
    console.log('  7. cardiology');
    console.log('  8. neurology\n');
    
    const specialty = await prompt('Enter specialty name: ');
    const result = await apiRequest('GET', `/doctors/specialty/${specialty}`);
    
    console.log(`\n📋 Doctors in ${specialty}:\n`);
    if (result.success && result.data.length > 0) {
        result.data.forEach((doc, i) => {
            console.log(`  ${i + 1}. Dr. ${doc.name} (${doc.languages})`);
        });
    } else {
        console.log('  No available doctors in this specialty.');
    }
}

async function bookConsultation() {
    console.log('\n📅 Book a Consultation\n');
    
    // Show available doctors
    const doctors = await apiRequest('GET', '/doctors/available');
    if (!doctors.success || doctors.data.length === 0) {
        console.log('No doctors available. Please try again later.');
        return;
    }
    
    console.log('Available Doctors:');
    doctors.data.forEach((doc, i) => {
        console.log(`  ${doc.id}. Dr. ${doc.name} - ${doc.specialty} (${doc.languages})`);
    });
    
    const patientId = await prompt('\nEnter your Patient ID: ');
    const doctorId = await prompt('Enter Doctor ID: ');
    
    console.log('\nConsultation Types:');
    console.log('  1. video - Video call (requires good internet)');
    console.log('  2. audio - Audio only (low-bandwidth mode)');
    console.log('  3. message - Asynchronous messaging');
    
    const consultationType = await prompt('Enter consultation type: ');
    const scheduledAt = await prompt('Enter date/time (YYYY-MM-DD HH:MM): ');
    const notes = await prompt('Enter any notes for the doctor: ');
    
    const result = await apiRequest('POST', '/consultations', {
        patient_id: parseInt(patientId),
        doctor_id: parseInt(doctorId),
        consultation_type: consultationType,
        scheduled_at: scheduledAt,
        notes: notes
    });
    
    if (result.success) {
        console.log('\n✅ Consultation booked successfully!');
        console.log(`   Consultation ID: ${result.data.id}`);
        console.log(`   Status: ${result.data.status}`);
        if (result.data.requires_translation) {
            console.log('   📝 Translation support will be provided.');
        }
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function viewMyConsultations() {
    const patientId = await prompt('\nEnter your Patient ID: ');
    const result = await apiRequest('GET', `/consultations/patient/${patientId}`);
    
    console.log('\n📋 Your Consultations:\n');
    if (result.success && result.data.length > 0) {
        result.data.forEach((c, i) => {
            console.log(`  ${i + 1}. ID: ${c.id} | Dr. ${c.doctor_name} (${c.doctor_specialty})`);
            console.log(`     Type: ${c.consultation_type} | Status: ${c.status}`);
            console.log(`     Scheduled: ${c.scheduled_at || 'Not scheduled'}`);
            console.log('');
        });
    } else {
        console.log('  No consultations found.');
    }
}

async function viewConsultationDetails() {
    const consultationId = await prompt('\nEnter Consultation ID: ');
    const result = await apiRequest('GET', `/consultations/${consultationId}`);
    
    if (result.success) {
        const c = result.data;
        console.log('\n┌──────────────────────────────────────────────────────────────┐');
        console.log('│                  CONSULTATION DETAILS                        │');
        console.log('└──────────────────────────────────────────────────────────────┘');
        console.log(`  ID: ${c.id}`);
        console.log(`  Patient: ${c.patient_name}`);
        console.log(`  Doctor: Dr. ${c.doctor_name} (${c.doctor_specialty})`);
        console.log(`  Type: ${c.consultation_type}`);
        console.log(`  Status: ${c.status}`);
        console.log(`  Scheduled: ${c.scheduled_at || 'Not scheduled'}`);
        console.log(`  Translation Required: ${c.requires_translation ? 'Yes' : 'No'}`);
        if (c.diagnosis) console.log(`  Diagnosis: ${c.diagnosis}`);
        if (c.prescription) console.log(`  Prescription: ${c.prescription}`);
        if (c.notes) console.log(`  Notes: ${c.notes}`);
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function sendMessage() {
    console.log('\n💬 Send Message (Async Consultation)\n');
    
    const consultationId = await prompt('Enter Consultation ID: ');
    console.log('Sender type: 1. patient  2. doctor');
    const senderTypeChoice = await prompt('Enter choice (1 or 2): ');
    const senderType = senderTypeChoice === '1' ? 'patient' : 'doctor';
    const senderId = await prompt(`Enter your ${senderType} ID: `);
    const content = await prompt('Enter your message: ');
    
    const result = await apiRequest('POST', '/messages', {
        consultation_id: parseInt(consultationId),
        sender_type: senderType,
        sender_id: parseInt(senderId),
        content: content
    });
    
    if (result.success) {
        console.log('\n✅ Message sent successfully!');
        if (result.data.translated_content) {
            console.log(`📝 Translated: ${result.data.translated_content}`);
        }
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function viewMessages() {
    const consultationId = await prompt('\nEnter Consultation ID: ');
    const result = await apiRequest('GET', `/messages/consultation/${consultationId}`);
    
    console.log('\n💬 Messages:\n');
    if (result.success && result.data.length > 0) {
        result.data.forEach(msg => {
            const sender = msg.sender_type === 'patient' ? '👤 Patient' : '👨‍⚕️ Doctor';
            console.log(`  ${sender} (${msg.sender_name}):`);
            console.log(`    "${msg.content}"`);
            if (msg.translated_content) {
                console.log(`    📝 ${msg.translated_content}`);
            }
            console.log(`    [${new Date(msg.created_at).toLocaleString()}]`);
            console.log('');
        });
    } else {
        console.log('  No messages found.');
    }
}

async function updateConsultationStatus() {
    const consultationId = await prompt('\nEnter Consultation ID: ');
    console.log('\nStatus options:');
    console.log('  1. confirmed');
    console.log('  2. in_progress');
    console.log('  3. completed');
    console.log('  4. cancelled');
    
    const status = await prompt('Enter new status: ');
    
    const result = await apiRequest('PATCH', `/consultations/${consultationId}/status`, { status });
    
    if (result.success) {
        console.log(`\n✅ Consultation status updated to: ${status}`);
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function addDiagnosis() {
    console.log('\n📋 Add Diagnosis/Prescription\n');
    
    const consultationId = await prompt('Enter Consultation ID: ');
    const diagnosis = await prompt('Enter diagnosis: ');
    const prescription = await prompt('Enter prescription: ');
    
    const result = await apiRequest('PATCH', `/consultations/${consultationId}/diagnosis`, {
        diagnosis,
        prescription
    });
    
    if (result.success) {
        console.log('\n✅ Diagnosis and prescription added successfully!');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}


async function viewAllPatients() {
    const result = await apiRequest('GET', '/patients');
    
    console.log('\n👥 All Patients:\n');
    if (result.success && result.data.length > 0) {
        result.data.forEach((p, i) => {
            console.log(`  ${p.id}. ${p.name} (${p.email})`);
            console.log(`     Language: ${p.language_preference} | Gender: ${p.gender}`);
            console.log('');
        });
    } else {
        console.log('  No patients registered.');
    }
}

async function viewAllDoctors() {
    const result = await apiRequest('GET', '/doctors');
    
    console.log('\n👨‍⚕️ All Doctors:\n');
    if (result.success && result.data.length > 0) {
        result.data.forEach((doc, i) => {
            console.log(`  ${doc.id}. Dr. ${doc.name}`);
            console.log(`     Specialty: ${doc.specialty}`);
            console.log(`     Languages: ${doc.languages}`);
            console.log(`     Status: ${doc.availability_status}`);
            console.log(`     International: ${doc.is_international ? 'Yes' : 'No'}`);
            console.log('');
        });
    } else {
        console.log('  No doctors registered.');
    }
}

// Helper function to select consultation from list
async function selectPatientConsultation() {
    const result = await apiRequest('GET', `/consultations/patient/${currentUser.id}`);
    
    if (!result.success || result.data.length === 0) {
        console.log('\n  No consultations found.');
        return null;
    }
    
    console.log('\n📋 Your Consultations:\n');
    result.data.forEach((c, i) => {
        console.log(`  ${i + 1}. Dr. ${c.doctor_name} (${c.doctor_specialty})`);
        console.log(`     Type: ${c.consultation_type} | Status: ${c.status}`);
        console.log('');
    });
    
    const choice = await prompt('Select consultation number (0 to cancel): ');
    const index = parseInt(choice) - 1;
    
    if (choice === '0' || isNaN(index) || index < 0 || index >= result.data.length) {
        return null;
    }
    
    return result.data[index];
}

async function selectDoctorConsultation() {
    const result = await apiRequest('GET', `/consultations/doctor/${currentUser.id}`);
    
    if (!result.success || result.data.length === 0) {
        console.log('\n  No consultations found.');
        return null;
    }
    
    console.log('\n📋 Your Consultations:\n');
    result.data.forEach((c, i) => {
        console.log(`  ${i + 1}. Patient: ${c.patient_name}`);
        console.log(`     Type: ${c.consultation_type} | Status: ${c.status}`);
        console.log('');
    });
    
    const choice = await prompt('Select consultation number (0 to cancel): ');
    const index = parseInt(choice) - 1;
    
    if (choice === '0' || isNaN(index) || index < 0 || index >= result.data.length) {
        return null;
    }
    
    return result.data[index];
}

// Patient-specific functions using currentUser
async function patientViewMyConsultations() {
    const result = await apiRequest('GET', `/consultations/patient/${currentUser.id}`);
    
    console.log('\n📋 Your Consultations:\n');
    if (result.success && result.data.length > 0) {
        result.data.forEach((c, i) => {
            console.log(`  ${i + 1}. Dr. ${c.doctor_name} (${c.doctor_specialty})`);
            console.log(`     Type: ${c.consultation_type} | Status: ${c.status}`);
            console.log(`     Scheduled: ${c.scheduled_at || 'Not scheduled'}`);
            console.log('');
        });
    } else {
        console.log('  No consultations found.');
    }
}

async function patientBookConsultation() {
    console.log('\n📅 Book a Consultation\n');
    
    const doctors = await apiRequest('GET', '/doctors/available');
    if (!doctors.success || doctors.data.length === 0) {
        console.log('No doctors available. Please try again later.');
        return;
    }
    
    console.log('Available Doctors:');
    doctors.data.forEach((doc) => {
        console.log(`  ${doc.id}. Dr. ${doc.name} - ${doc.specialty} (${doc.languages})`);
    });
    
    const doctorId = await prompt('\nEnter Doctor ID: ');
    
    console.log('\nConsultation Types:');
    console.log('  1. video - Video call (requires good internet)');
    console.log('  2. audio - Audio only (low-bandwidth mode)');
    console.log('  3. message - Asynchronous messaging');
    
    const consultationType = await prompt('Enter consultation type: ');
    const scheduledAt = await prompt('Enter date/time (YYYY-MM-DD HH:MM): ');
    const notes = await prompt('Enter any notes for the doctor: ');
    
    const result = await apiRequest('POST', '/consultations', {
        patient_id: currentUser.id,
        doctor_id: parseInt(doctorId),
        consultation_type: consultationType,
        scheduled_at: scheduledAt,
        notes: notes
    });
    
    if (result.success) {
        console.log('\n✅ Consultation booked successfully!');
        console.log(`   Consultation ID: ${result.data.id}`);
        console.log(`   Status: ${result.data.status}`);
        if (result.data.requires_translation) {
            console.log('   📝 Translation support will be provided.');
        }
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function patientSendMessage() {
    console.log('\n💬 Send Message to Doctor\n');
    
    const consultation = await selectPatientConsultation();
    if (!consultation) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const content = await prompt('Enter your message: ');
    
    const result = await apiRequest('POST', '/messages', {
        consultation_id: consultation.id,
        sender_type: 'patient',
        sender_id: currentUser.id,
        content: content
    });
    
    if (result.success) {
        console.log('\n✅ Message sent successfully!');
        if (result.data.translated_content) {
            console.log(`📝 Translated: ${result.data.translated_content}`);
        }
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function patientViewConsultationDetails() {
    const consultation = await selectPatientConsultation();
    if (!consultation) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const result = await apiRequest('GET', `/consultations/${consultation.id}`);
    
    if (result.success) {
        const c = result.data;
        console.log('\n┌──────────────────────────────────────────────────────────────┐');
        console.log('│                  CONSULTATION DETAILS                        │');
        console.log('└──────────────────────────────────────────────────────────────┘');
        console.log(`  Doctor: Dr. ${c.doctor_name} (${c.doctor_specialty})`);
        console.log(`  Type: ${c.consultation_type}`);
        console.log(`  Status: ${c.status}`);
        console.log(`  Scheduled: ${c.scheduled_at || 'Not scheduled'}`);
        console.log(`  Translation Required: ${c.requires_translation ? 'Yes' : 'No'}`);
        if (c.diagnosis) console.log(`  Diagnosis: ${c.diagnosis}`);
        if (c.prescription) console.log(`  Prescription: ${c.prescription}`);
        if (c.notes) console.log(`  Notes: ${c.notes}`);
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function patientViewMessages() {
    const consultation = await selectPatientConsultation();
    if (!consultation) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const result = await apiRequest('GET', `/messages/consultation/${consultation.id}`);
    
    console.log(`\n💬 Messages with Dr. ${consultation.doctor_name}:\n`);
    if (result.success && result.data.length > 0) {
        result.data.forEach(msg => {
            const sender = msg.sender_type === 'patient' ? '👤 You' : '👨‍⚕️ Doctor';
            console.log(`  ${sender}:`);
            console.log(`    "${msg.content}"`);
            if (msg.translated_content) {
                console.log(`    📝 ${msg.translated_content}`);
            }
            console.log(`    [${new Date(msg.created_at).toLocaleString()}]`);
            console.log('');
        });
    } else {
        console.log('  No messages yet.');
    }
}

async function viewMyProfile() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                      MY PROFILE                              │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    if (currentUserType === 'patient') {
        console.log(`  Name: ${currentUser.name}`);
        console.log(`  Email: ${currentUser.email}`);
        console.log(`  Phone: ${currentUser.phone || 'Not provided'}`);
        console.log(`  Date of Birth: ${currentUser.date_of_birth || 'Not provided'}`);
        console.log(`  Gender: ${currentUser.gender || 'Not provided'}`);
        console.log(`  Language: ${currentUser.language_preference}`);
        console.log(`  Medical History: ${currentUser.medical_history || 'None'}`);
    } else {
        console.log(`  Name: Dr. ${currentUser.name}`);
        console.log(`  Email: ${currentUser.email}`);
        console.log(`  Phone: ${currentUser.phone || 'Not provided'}`);
        console.log(`  Specialty: ${currentUser.specialty}`);
        console.log(`  Languages: ${currentUser.languages}`);
        console.log(`  International: ${currentUser.is_international ? 'Yes' : 'No'}`);
        console.log(`  Status: ${currentUser.availability_status}`);
        console.log(`  Experience: ${currentUser.years_of_experience} years`);
        console.log(`  Bio: ${currentUser.bio || 'Not provided'}`);
    }
}

// Doctor-specific functions
async function doctorViewMyConsultations() {
    const result = await apiRequest('GET', `/consultations/doctor/${currentUser.id}`);
    
    console.log('\n📋 Your Consultations:\n');
    if (result.success && result.data.length > 0) {
        result.data.forEach((c, i) => {
            console.log(`  ${i + 1}. Patient: ${c.patient_name}`);
            console.log(`     Type: ${c.consultation_type} | Status: ${c.status}`);
            console.log(`     Scheduled: ${c.scheduled_at || 'Not scheduled'}`);
            console.log('');
        });
    } else {
        console.log('  No consultations found.');
    }
}

async function doctorViewConsultationDetails() {
    const consultation = await selectDoctorConsultation();
    if (!consultation) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const result = await apiRequest('GET', `/consultations/${consultation.id}`);
    
    if (result.success) {
        const c = result.data;
        console.log('\n┌──────────────────────────────────────────────────────────────┐');
        console.log('│                  CONSULTATION DETAILS                        │');
        console.log('└──────────────────────────────────────────────────────────────┘');
        console.log(`  Patient: ${c.patient_name}`);
        console.log(`  Type: ${c.consultation_type}`);
        console.log(`  Status: ${c.status}`);
        console.log(`  Scheduled: ${c.scheduled_at || 'Not scheduled'}`);
        console.log(`  Translation Required: ${c.requires_translation ? 'Yes' : 'No'}`);
        if (c.diagnosis) console.log(`  Diagnosis: ${c.diagnosis}`);
        if (c.prescription) console.log(`  Prescription: ${c.prescription}`);
        if (c.notes) console.log(`  Patient Notes: ${c.notes}`);
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function doctorSendMessage() {
    console.log('\n💬 Send Message to Patient\n');
    
    const consultation = await selectDoctorConsultation();
    if (!consultation) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const content = await prompt('Enter your message: ');
    
    const result = await apiRequest('POST', '/messages', {
        consultation_id: consultation.id,
        sender_type: 'doctor',
        sender_id: currentUser.id,
        content: content
    });
    
    if (result.success) {
        console.log('\n✅ Message sent successfully!');
        if (result.data.translated_content) {
            console.log(`📝 Translated: ${result.data.translated_content}`);
        }
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function doctorViewMessages() {
    const consultation = await selectDoctorConsultation();
    if (!consultation) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const result = await apiRequest('GET', `/messages/consultation/${consultation.id}`);
    
    console.log(`\n💬 Messages with ${consultation.patient_name}:\n`);
    if (result.success && result.data.length > 0) {
        result.data.forEach(msg => {
            const sender = msg.sender_type === 'doctor' ? '👨‍⚕️ You' : '👤 Patient';
            console.log(`  ${sender}:`);
            console.log(`    "${msg.content}"`);
            if (msg.translated_content) {
                console.log(`    📝 ${msg.translated_content}`);
            }
            console.log(`    [${new Date(msg.created_at).toLocaleString()}]`);
            console.log('');
        });
    } else {
        console.log('  No messages yet.');
    }
}

async function doctorUpdateConsultationStatus() {
    const consultation = await selectDoctorConsultation();
    if (!consultation) {
        console.log('\n  Cancelled.');
        return;
    }
    
    console.log(`\n  Patient: ${consultation.patient_name}`);
    console.log(`  Current status: ${consultation.status}\n`);
    console.log('  Select new status:');
    console.log('    1. confirmed');
    console.log('    2. in_progress');
    console.log('    3. completed');
    console.log('    4. cancelled');
    console.log('    0. Cancel');
    
    const choice = await prompt('\nEnter choice (1-4): ');
    
    const statusMap = {
        '1': 'confirmed',
        '2': 'in_progress',
        '3': 'completed',
        '4': 'cancelled'
    };
    
    const status = statusMap[choice];
    if (!status) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const result = await apiRequest('PATCH', `/consultations/${consultation.id}/status`, { status });
    
    if (result.success) {
        console.log(`\n✅ Consultation status updated to: ${status}`);
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function doctorAddDiagnosis() {
    console.log('\n📋 Add Diagnosis/Prescription\n');
    
    const consultation = await selectDoctorConsultation();
    if (!consultation) {
        console.log('\n  Cancelled.');
        return;
    }
    
    console.log(`\n  Patient: ${consultation.patient_name}`);
    const diagnosis = await prompt('Enter diagnosis: ');
    const prescription = await prompt('Enter prescription: ');
    
    const result = await apiRequest('PATCH', `/consultations/${consultation.id}/diagnosis`, {
        diagnosis,
        prescription
    });
    
    if (result.success) {
        console.log('\n✅ Diagnosis and prescription added successfully!');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function updateMyAvailability() {
    console.log('\n📊 Update Availability\n');
    console.log(`  Current status: ${currentUser.availability_status}\n`);
    console.log('  Options:');
    console.log('    1. available');
    console.log('    2. busy');
    console.log('    3. offline');
    
    const status = await prompt('\nEnter new status: ');
    
    const result = await apiRequest('PATCH', `/doctors/${currentUser.id}/availability`, { 
        availability_status: status 
    });
    
    if (result.success) {
        currentUser.availability_status = status;
        console.log(`\n✅ Availability updated to: ${status}`);
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function patientMenuLoop() {
    while (currentUser && currentUserType === 'patient') {
        printPatientMenu();
        const choice = await prompt('\nEnter your choice: ');
        
        switch (choice) {
            case '1':
                await viewAvailableDoctors();
                break;
            case '2':
                await viewDoctorsBySpecialty();
                break;
            case '3':
                await patientBookConsultation();
                break;
            case '4':
                await patientViewMyConsultations();
                break;
            case '5':
                await patientViewConsultationDetails();
                break;
            case '6':
                await patientSendMessage();
                break;
            case '7':
                await patientViewMessages();
                break;
            case '8':
                await viewMyProfile();
                break;
            case '9':
                currentUser = null;
                currentUserType = null;
                console.log('\n✅ Logged out successfully.\n');
                return;
            case '0':
                console.log('\n👋 Thank you for using HealthPal. Stay healthy!\n');
                rl.close();
                process.exit(0);
            default:
                console.log('\n⚠️  Invalid choice. Please try again.');
        }
        
        await prompt('\nPress Enter to continue...');
        clearScreen();
        printHeader();
    }
}

async function doctorMenuLoop() {
    while (currentUser && currentUserType === 'doctor') {
        printDoctorMenu();
        const choice = await prompt('\nEnter your choice: ');
        
        switch (choice) {
            case '1':
                await doctorViewMyConsultations();
                break;
            case '2':
                await doctorViewConsultationDetails();
                break;
            case '3':
                await doctorUpdateConsultationStatus();
                break;
            case '4':
                await doctorAddDiagnosis();
                break;
            case '5':
                await doctorSendMessage();
                break;
            case '6':
                await doctorViewMessages();
                break;
            case '7':
                await updateMyAvailability();
                break;
            case '8':
                await viewMyProfile();
                break;
            case '9':
                currentUser = null;
                currentUserType = null;
                console.log('\n✅ Logged out successfully.\n');
                return;
            case '0':
                console.log('\n👋 Thank you for using HealthPal. Stay healthy!\n');
                rl.close();
                process.exit(0);
            default:
                console.log('\n⚠️  Invalid choice. Please try again.');
        }
        
        await prompt('\nPress Enter to continue...');
        clearScreen();
        printHeader();
    }
}

async function main() {
    clearScreen();
    printHeader();
    
    console.log('Checking API connection...');
    try {
        const health = await apiRequest('GET', '/health');
        if (health.status === 'ok') {
            console.log('✅ Connected to HealthPal API\n');
        }
    } catch (error) {
        console.log('❌ Cannot connect to API. Make sure the server is running:');
        console.log('   npm run server\n');
        rl.close();
        return;
    }
    
    // Main welcome loop
    while (true) {
        printWelcomeMenu();
        const choice = await prompt('\nEnter your choice: ');
        
        switch (choice) {
            case '1':
                await registerPatient();
                break;
            case '2':
                await registerDoctor();
                break;
            case '3':
                if (await loginPatient()) {
                    await prompt('\nPress Enter to continue...');
                    clearScreen();
                    printHeader();
                    await patientMenuLoop();
                }
                break;
            case '4':
                if (await loginDoctor()) {
                    await prompt('\nPress Enter to continue...');
                    clearScreen();
                    printHeader();
                    await doctorMenuLoop();
                }
                break;
            case '0':
                console.log('\n👋 Thank you for using HealthPal. Stay healthy!\n');
                rl.close();
                process.exit(0);
            default:
                console.log('\n⚠️  Invalid choice. Please try again.');
        }
        
        await prompt('\nPress Enter to continue...');
        clearScreen();
        printHeader();
    }
}

main().catch(console.error);
