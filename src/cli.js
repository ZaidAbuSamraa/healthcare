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
    console.log('║     Remote Medical Consultations & Sponsorship Platform      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

function printWelcomeMenu() {
    console.log('┌──────────────────────────────────────────────────────────────┐');
    console.log('│                      WELCOME                                 │');
    console.log('├──────────────────────────────────────────────────────────────┤');
    console.log('│  === Medical Consultations ===                               │');
    console.log('│  1. Register as Patient                                      │');
    console.log('│  2. Register as Doctor                                       │');
    console.log('│  3. Login as Patient                                         │');
    console.log('│  4. Login as Doctor                                          │');
    console.log('│                                                              │');
    console.log('│  === Medical Sponsorship ===                                 │');
    console.log('│  5. Register as Donor                                        │');
    console.log('│  6. Login as Donor                                           │');
    console.log('│                                                              │');
    console.log('│  === Medication Delivery ===                                 │');
    console.log('│  7. Register as Volunteer/NGO                                │');
    console.log('│  8. Login as Volunteer/NGO                                   │');
    console.log('│                                                              │');
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
    console.log('│  === Consultations ===                                       │');
    console.log('│  1. View Available Doctors                                   │');
    console.log('│  2. View Doctors by Specialty                                │');
    console.log('│  3. Book a Consultation                                      │');
    console.log('│  4. View My Consultations                                    │');
    console.log('│  5. View Consultation Details                                │');
    console.log('│  6. Send Message to Doctor                                   │');
    console.log('│  7. View Messages                                            │');
    console.log('│                                                              │');
    console.log('│  === Medical Sponsorship ===                                 │');
    console.log('│  8. Request Medical Sponsorship                              │');
    console.log('│  9. View My Sponsorship Cases                                │');
    console.log('│                                                              │');
    console.log('│  === Medication & Equipment ===                              │');
    console.log('│  10. Request Medication Delivery                             │');
    console.log('│  11. View My Medication Requests                             │');
    console.log('│  12. Browse Available Equipment                              │');
    console.log('│  13. Request Equipment                                       │');
    console.log('│                                                              │');
    console.log('│  === Health Education & Alerts ===                           │');
    console.log('│  14. View Health Guides                                      │');
    console.log('│  15. View Public Health Alerts                               │');
    console.log('│  16. Browse Upcoming Workshops                               │');
    console.log('│  17. Register for Workshop                                   │');
    console.log('│  18. View My Workshop Registrations                          │');
    console.log('│                                                              │');
    console.log('│  === Mental Health & Trauma Support ===                      │');
    console.log('│  19. Request Trauma Counseling                               │');
    console.log('│  20. View My Counseling Sessions                             │');
    console.log('│  21. Browse Support Groups                                   │');
    console.log('│  22. Join Support Group                                      │');
    console.log('│  23. View My Support Groups                                  │');
    console.log('│  24. Start Anonymous Therapy Chat                            │');
    console.log('│  25. View My Anonymous Chats                                 │');
    console.log('│                                                              │');
    console.log('│  26. View My Profile                                         │');
    console.log('│  27. Logout                                                  │');
    console.log('│  0. Exit                                                     │');
    console.log('└──────────────────────────────────────────────────────────────┘');
}

function printDoctorMenu() {
    console.log(`  Logged in as: Dr. ${currentUser.name} (${currentUser.specialty})\n`);
    console.log('┌──────────────────────────────────────────────────────────────┐');
    console.log('│                    DOCTOR MENU                               │');
    console.log('├──────────────────────────────────────────────────────────────┤');
    console.log('│  === Consultations ===                                       │');
    console.log('│  1. View My Consultations                                    │');
    console.log('│  2. View Consultation Details                                │');
    console.log('│  3. Update Consultation Status                               │');
    console.log('│  4. Add Diagnosis/Prescription                               │');
    console.log('│  5. Send Message to Patient                                  │');
    console.log('│  6. View Messages                                            │');
    console.log('│                                                              │');
    console.log('│  === Health Education & Alerts ===                           │');
    console.log('│  7. Create Health Guide                                      │');
    console.log('│  8. View My Health Guides                                    │');
    console.log('│  9. Send Public Health Alert                                 │');
    console.log('│  10. Create Workshop/Webinar                                 │');
    console.log('│  11. View My Workshops                                       │');
    console.log('│                                                              │');
    console.log('│  === Mental Health & Trauma Support ===                      │');
    console.log('│  12. View Counseling Requests                                │');
    console.log('│  13. Manage My Counseling Sessions                           │');
    console.log('│  14. View Waiting Anonymous Chats                            │');
    console.log('│  15. My Active Anonymous Chats                               │');
    console.log('│  16. Create Support Group                                    │');
    console.log('│  17. Moderate My Support Groups                              │');
    console.log('│                                                              │');
    console.log('│  18. Update My Availability                                  │');
    console.log('│  19. View My Profile                                         │');
    console.log('│  20. Logout                                                  │');
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
    } else if (currentUserType === 'doctor') {
        console.log(`  Name: Dr. ${currentUser.name}`);
        console.log(`  Email: ${currentUser.email}`);
        console.log(`  Phone: ${currentUser.phone || 'Not provided'}`);
        console.log(`  Specialty: ${currentUser.specialty}`);
        console.log(`  Languages: ${currentUser.languages}`);
        console.log(`  International: ${currentUser.is_international ? 'Yes' : 'No'}`);
        console.log(`  Status: ${currentUser.availability_status}`);
        console.log(`  Experience: ${currentUser.years_of_experience} years`);
        console.log(`  Bio: ${currentUser.bio || 'Not provided'}`);
    } else if (currentUserType === 'donor') {
        console.log(`  Name: ${currentUser.name}`);
        console.log(`  Email: ${currentUser.email}`);
        console.log(`  Phone: ${currentUser.phone || 'Not provided'}`);
        console.log(`  Country: ${currentUser.country || 'Not provided'}`);
        console.log(`  Organization: ${currentUser.organization || 'Individual'}`);
        console.log(`  Total Donated: $${currentUser.total_donated}`);
        console.log(`  Anonymous: ${currentUser.is_anonymous ? 'Yes' : 'No'}`);
    } else if (currentUserType === 'volunteer') {
        console.log(`  Name: ${currentUser.name}`);
        console.log(`  Email: ${currentUser.email}`);
        console.log(`  Phone: ${currentUser.phone || 'Not provided'}`);
        console.log(`  Type: ${currentUser.organization_type}`);
        console.log(`  Organization: ${currentUser.organization_name || 'N/A'}`);
        console.log(`  Coverage Areas: ${currentUser.coverage_areas || 'Not specified'}`);
        console.log(`  Verified: ${currentUser.is_verified ? 'Yes ✓' : 'Pending'}`);
        console.log(`  Status: ${currentUser.availability_status}`);
        console.log(`  Total Deliveries: ${currentUser.total_deliveries}`);
        console.log(`  Rating: ${currentUser.rating}/5 ⭐`);
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

// Patient Sponsorship Functions
async function requestMedicalSponsorship() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│            REQUEST MEDICAL SPONSORSHIP                       │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const title = await prompt('Case Title (e.g., "Heart Surgery Needed"): ');
    
    console.log('\nSelect Treatment Type:');
    console.log('  1. Surgery');
    console.log('  2. Cancer Treatment');
    console.log('  3. Dialysis');
    console.log('  4. Physical Rehabilitation');
    console.log('  5. Medication');
    console.log('  6. Other');
    
    const typeChoice = await prompt('\nEnter choice (1-6): ');
    const treatmentTypes = {
        '1': 'surgery',
        '2': 'cancer_treatment',
        '3': 'dialysis',
        '4': 'physical_rehabilitation',
        '5': 'medication',
        '6': 'other'
    };
    const treatment_type = treatmentTypes[typeChoice];
    
    if (!treatment_type) {
        console.log('\n❌ Invalid treatment type.');
        return;
    }
    
    const description = await prompt('\nDescribe your medical condition and treatment needs:\n> ');
    
    const goalStr = await prompt('\nFunding Goal Amount ($): ');
    const goal_amount = parseFloat(goalStr);
    
    if (isNaN(goal_amount) || goal_amount <= 0) {
        console.log('\n❌ Invalid amount.');
        return;
    }
    
    console.log('\nUrgency Level:');
    console.log('  1. Low - Can wait several months');
    console.log('  2. Medium - Needed within weeks');
    console.log('  3. High - Needed urgently');
    console.log('  4. Critical - Life-threatening, immediate need');
    
    const urgencyChoice = await prompt('\nEnter choice (1-4): ');
    const urgencyLevels = {
        '1': 'low',
        '2': 'medium',
        '3': 'high',
        '4': 'critical'
    };
    const urgency_level = urgencyLevels[urgencyChoice] || 'medium';
    
    console.log('\n⚠️  CONSENT NOTICE:');
    console.log('  By submitting this request, you consent to sharing your');
    console.log('  medical information with verified donors for transparency.');
    
    const consentInput = await prompt('\nDo you give consent? (yes/no): ');
    const consent_given = consentInput.toLowerCase() === 'yes';
    
    if (!consent_given) {
        console.log('\n❌ Consent is required to submit a sponsorship request.');
        return;
    }
    
    const result = await apiRequest('POST', '/cases', {
        patient_id: currentUser.id,
        title,
        treatment_type,
        description,
        goal_amount,
        urgency_level,
        consent_given
    });
    
    if (result.success) {
        console.log('\n✅ Case created successfully!');
        console.log(`   Case ID: ${result.data.id}`);
        console.log(`   Status: ${result.data.status}`);
        console.log('\n🎉 Your case is now ACTIVE and accepting donations!');
        console.log('   Donors can now view your case and contribute.');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function viewMySponsorshipCases() {
    console.log('\n📊 My Sponsorship Cases:\n');
    
    const result = await apiRequest('GET', `/cases/patient/${currentUser.id}`);
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((c, i) => {
            const statusIcon = c.status === 'active' ? '🟢' : 
                              c.status === 'funded' ? '✅' : 
                              c.status === 'pending_verification' ? '⏳' : 
                              c.status === 'completed' ? '🎉' : '🟡';
            
            console.log(`  ${i + 1}. ${statusIcon} ${c.title}`);
            console.log(`     Type: ${c.treatment_type.replace('_', ' ')}`);
            console.log(`     Goal: $${c.goal_amount} | Raised: $${c.raised_amount} (${c.funding_percentage}%)`);
            console.log(`     Status: ${c.status} | Urgency: ${c.urgency_level}`);
            
            // Progress bar
            const progress = Math.min(100, c.funding_percentage || 0);
            const filled = Math.round(progress / 5);
            const empty = 20 - filled;
            const bar = '█'.repeat(filled) + '░'.repeat(empty);
            console.log(`     Progress: [${bar}] ${progress}%`);
            console.log('');
        });
        
        // Option to add update
        const addUpdate = await prompt('Add a thank you/update to a case? (y/n): ');
        if (addUpdate.toLowerCase() === 'y') {
            await addCaseUpdate(result.data);
        }
    } else {
        console.log('  No sponsorship cases found.');
        console.log('  Use "Request Medical Sponsorship" to create one.');
    }
}

async function addCaseUpdate(cases) {
    console.log('\nSelect a case to update:');
    cases.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.title}`);
    });
    
    const caseChoice = await prompt('\nEnter case number (0 to cancel): ');
    const caseIndex = parseInt(caseChoice) - 1;
    
    if (caseChoice === '0' || isNaN(caseIndex) || caseIndex < 0 || caseIndex >= cases.length) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const selectedCase = cases[caseIndex];
    
    console.log('\nUpdate Type:');
    console.log('  1. Thank You Message');
    console.log('  2. Recovery Update');
    
    const typeChoice = await prompt('Enter choice (1-2): ');
    const update_type = typeChoice === '1' ? 'thank_you' : 'recovery';
    
    const title = await prompt('Update Title: ');
    const content = await prompt('Your message:\n> ');
    
    const result = await apiRequest('POST', `/cases/${selectedCase.id}/updates`, {
        update_type,
        title,
        content,
        created_by_type: 'patient',
        created_by_id: currentUser.id
    });
    
    if (result.success) {
        console.log('\n✅ Update posted successfully!');
        console.log('   Donors will be able to see your message.');
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
                await requestMedicalSponsorship();
                break;
            case '9':
                await viewMySponsorshipCases();
                break;
            case '10':
                await requestMedication();
                break;
            case '11':
                await viewMyMedicationRequests();
                break;
            case '12':
                await browseAvailableEquipment();
                break;
            case '13':
                await requestEquipment();
                break;
            case '14':
                await viewHealthGuides();
                break;
            case '15':
                await viewPublicHealthAlerts();
                break;
            case '16':
                await browseUpcomingWorkshops();
                break;
            case '17':
                await registerForWorkshop();
                break;
            case '18':
                await viewMyWorkshopRegistrations();
                break;
            case '19':
                await requestTraumaCounseling();
                break;
            case '20':
                await viewMyCounselingSessions();
                break;
            case '21':
                await browseSupportGroups();
                break;
            case '22':
                await joinSupportGroup();
                break;
            case '23':
                await viewMySupportGroups();
                break;
            case '24':
                await startAnonymousChat();
                break;
            case '25':
                await viewMyAnonymousChats();
                break;
            case '26':
                await viewMyProfile();
                break;
            case '27':
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
                await createHealthGuide();
                break;
            case '8':
                await viewMyHealthGuides();
                break;
            case '9':
                await sendPublicHealthAlert();
                break;
            case '10':
                await createWorkshop();
                break;
            case '11':
                await viewMyWorkshops();
                break;
            case '12':
                await viewCounselingRequests();
                break;
            case '13':
                await viewCounselingRequests();
                break;
            case '14':
                await viewWaitingAnonymousChats();
                break;
            case '15':
                await viewMyActiveAnonymousChats();
                break;
            case '16':
                await createSupportGroup();
                break;
            case '17':
                await moderateSupportGroups();
                break;
            case '18':
                await updateMyAvailability();
                break;
            case '19':
                await viewMyProfile();
                break;
            case '20':
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

// ============================================
// DONOR FUNCTIONS
// ============================================

async function registerDonor() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                  DONOR REGISTRATION                          │');
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
    const phone = await prompt('Phone (optional): ');
    const country = await prompt('Country: ');
    const organization = await prompt('Organization (optional): ');
    const isAnonymousInput = await prompt('Stay anonymous in donations? (y/n): ');
    const is_anonymous = isAnonymousInput.toLowerCase() === 'y';
    
    const result = await apiRequest('POST', '/donors', {
        username, password, name, email, 
        phone: phone || null, 
        country, 
        organization: organization || null,
        is_anonymous
    });
    
    if (result.success) {
        console.log('\n✅ Registration successful!');
        console.log(`   Welcome, ${name}! You can now login and start donating.`);
        return result.data;
    } else {
        console.log(`\n❌ Registration failed: ${result.error}`);
        return null;
    }
}

async function loginDonor() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                     DONOR LOGIN                              │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const username = await prompt('Username: ');
    const password = await prompt('Password: ');
    
    const result = await apiRequest('POST', '/donors/login', { username, password });
    
    if (result.success) {
        currentUser = result.data;
        currentUserType = 'donor';
        console.log(`\n✅ Welcome back, ${currentUser.name}!`);
        console.log(`   Total donated: $${currentUser.total_donated}`);
        return true;
    } else {
        console.log('\n❌ Invalid username or password. Please try again.\n');
        return false;
    }
}

function printDonorMenu() {
    console.log(`  Logged in as: ${currentUser.name} (Donor)\n`);
    console.log('┌──────────────────────────────────────────────────────────────┐');
    console.log('│                    DONOR MENU                                │');
    console.log('├──────────────────────────────────────────────────────────────┤');
    console.log('│  === Sponsorship ===                                         │');
    console.log('│  1. Browse Medical Cases                                     │');
    console.log('│  2. Make a Donation                                          │');
    console.log('│  3. View My Donations                                        │');
    console.log('│  4. View Case Details & Transparency                         │');
    console.log('│                                                              │');
    console.log('│  === Donate Equipment/Medicine ===                           │');
    console.log('│  5. Donate Equipment/Medicine (List to Inventory)            │');
    console.log('│  6. View My Donated Items                                    │');
    console.log('│                                                              │');
    console.log('│  7. View My Profile                                          │');
    console.log('│  8. Logout                                                   │');
    console.log('│  0. Exit                                                     │');
    console.log('└──────────────────────────────────────────────────────────────┘');
}

async function browseMedicalCases() {
    console.log('\n💊 Active Medical Cases:\n');
    const result = await apiRequest('GET', '/cases');
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((c, i) => {
            const urgencyIcon = c.urgency_level === 'critical' ? '🔴' : 
                               c.urgency_level === 'high' ? '🟠' : 
                               c.urgency_level === 'medium' ? '🟡' : '🟢';
            console.log(`  ${i + 1}. ${urgencyIcon} ${c.title}`);
            console.log(`     Patient: ${c.patient_name} | Type: ${c.treatment_type.replace('_', ' ')}`);
            console.log(`     Goal: $${c.goal_amount} | Raised: $${c.raised_amount} (${c.funding_percentage}%)`);
            console.log(`     Status: ${c.status} | Urgency: ${c.urgency_level}`);
            console.log('');
        });
    } else {
        console.log('  No active cases at the moment.');
    }
}

async function viewUrgentCases() {
    console.log('\n🚨 Urgent Medical Cases:\n');
    const result = await apiRequest('GET', '/cases/urgent');
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((c, i) => {
            const urgencyIcon = c.urgency_level === 'critical' ? '🔴 CRITICAL' : '🟠 HIGH';
            console.log(`  ${i + 1}. ${urgencyIcon}`);
            console.log(`     ${c.title}`);
            console.log(`     Patient: ${c.patient_name}`);
            console.log(`     Needed: $${c.goal_amount - c.raised_amount} more (${c.funding_percentage}% funded)`);
            console.log('');
        });
    } else {
        console.log('  No urgent cases at the moment. Thank you for checking!');
    }
}

async function selectMedicalCase() {
    const result = await apiRequest('GET', '/cases');
    
    if (!result.success || result.data.length === 0) {
        console.log('\n  No active cases available.');
        return null;
    }
    
    console.log('\n💊 Select a Case to Donate:\n');
    result.data.forEach((c, i) => {
        const urgencyIcon = c.urgency_level === 'critical' ? '🔴' : 
                           c.urgency_level === 'high' ? '🟠' : 
                           c.urgency_level === 'medium' ? '🟡' : '🟢';
        console.log(`  ${i + 1}. ${urgencyIcon} ${c.title} - ${c.patient_name}`);
        console.log(`     Needs: $${c.goal_amount - c.raised_amount} more`);
        console.log('');
    });
    
    const choice = await prompt('Select case number (0 to cancel): ');
    const index = parseInt(choice) - 1;
    
    if (choice === '0' || isNaN(index) || index < 0 || index >= result.data.length) {
        return null;
    }
    
    return result.data[index];
}

async function makeDonation() {
    console.log('\n💝 Make a Donation\n');
    
    const medicalCase = await selectMedicalCase();
    if (!medicalCase) {
        console.log('\n  Cancelled.');
        return;
    }
    
    console.log(`\n  Selected: ${medicalCase.title}`);
    console.log(`  Patient: ${medicalCase.patient_name}`);
    console.log(`  Still needed: $${medicalCase.goal_amount - medicalCase.raised_amount}\n`);
    
    const amountStr = await prompt('Enter donation amount ($): ');
    const amount = parseFloat(amountStr);
    
    if (isNaN(amount) || amount <= 0) {
        console.log('\n❌ Invalid amount.');
        return;
    }
    
    console.log('\nPayment Method:');
    console.log('  1. Credit Card');
    console.log('  2. Bank Transfer');
    console.log('  3. PayPal');
    const paymentChoice = await prompt('Select (1-3): ');
    const paymentMethods = { '1': 'credit_card', '2': 'bank_transfer', '3': 'paypal' };
    const payment_method = paymentMethods[paymentChoice] || 'credit_card';
    
    const message = await prompt('Add a message (optional): ');
    const anonInput = await prompt('Donate anonymously? (y/n): ');
    const is_anonymous = anonInput.toLowerCase() === 'y';
    
    const result = await apiRequest('POST', '/donations', {
        donor_id: currentUser.id,
        case_id: medicalCase.id,
        amount,
        payment_method,
        is_anonymous,
        message: message || null
    });
    
    if (result.success) {
        console.log('\n✅ Thank you for your generous donation!');
        console.log(`   Amount: $${amount}`);
        console.log(`   Transaction ID: ${result.data.transaction_id}`);
        currentUser.total_donated = parseFloat(currentUser.total_donated) + amount;
    } else {
        console.log(`\n❌ Donation failed: ${result.error}`);
    }
}

async function viewMyDonations() {
    console.log('\n📜 My Donation History:\n');
    const result = await apiRequest('GET', `/donors/${currentUser.id}/donations`);
    
    if (result.success && result.data.length > 0) {
        let total = 0;
        result.data.forEach((d, i) => {
            console.log(`  ${i + 1}. $${d.amount} to "${d.case_title}"`);
            console.log(`     Patient: ${d.patient_name} | Type: ${d.treatment_type}`);
            console.log(`     Date: ${new Date(d.created_at).toLocaleDateString()}`);
            if (d.message) console.log(`     Message: "${d.message}"`);
            console.log('');
            total += parseFloat(d.amount);
        });
        console.log(`  ─────────────────────────────────`);
        console.log(`  Total Donated: $${total.toFixed(2)}`);
    } else {
        console.log('  No donations yet. Start making a difference today!');
    }
}

async function viewCaseTransparency() {
    const medicalCase = await selectMedicalCase();
    if (!medicalCase) {
        console.log('\n  Cancelled.');
        return;
    }
    
    // Get full case details with patient info
    const caseDetails = await apiRequest('GET', `/cases/${medicalCase.id}`);
    const caseData = caseDetails.success ? caseDetails.data : medicalCase;
    
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│              PATIENT PROFILE & CASE DETAILS                  │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    // Patient Profile
    console.log('  ═══ PATIENT PROFILE ═══');
    console.log(`  � Name: ${caseData.patient_name}`);
    if (caseData.medical_history) {
        console.log(`  � Medical History: ${caseData.medical_history}`);
    }
    console.log('');
    
    // Case details
    console.log('  ═══ CASE DETAILS ═══');
    console.log(`  📋 Case: ${caseData.title}`);
    console.log(`  🏥 Treatment Type: ${caseData.treatment_type.replace('_', ' ')}`);
    console.log(`  � Description: ${caseData.description}`);
    console.log(`  ⚠️  Urgency: ${caseData.urgency_level}`);
    console.log('');
    
    // Funding Progress
    console.log('  ═══ FUNDING PROGRESS ═══');
    console.log(`  💰 Goal: $${caseData.goal_amount}`);
    console.log(`  💵 Raised: $${caseData.raised_amount}`);
    console.log(`  📊 Progress: ${caseData.funding_percentage}%`);
    const progress = Math.min(100, caseData.funding_percentage || 0);
    const filled = Math.round(progress / 5);
    const empty = 20 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    console.log(`  [${bar}]`);
    
    // Get invoices
    console.log('\n  ─── Expenses & Invoices ───');
    const invoices = await apiRequest('GET', `/cases/${medicalCase.id}/invoices`);
    if (invoices.success && invoices.data.length > 0) {
        let totalSpent = 0;
        invoices.data.forEach(inv => {
            console.log(`  • ${inv.title}: $${inv.amount} (${inv.category})`);
            console.log(`    Vendor: ${inv.vendor_name} | Status: ${inv.status}`);
            totalSpent += parseFloat(inv.amount);
        });
        console.log(`  Total Spent: $${totalSpent.toFixed(2)}`);
    } else {
        console.log('  No invoices recorded yet.');
    }
    
    // Get updates
    console.log('\n  ─── Recovery Updates ───');
    const updates = await apiRequest('GET', `/cases/${medicalCase.id}/updates`);
    if (updates.success && updates.data.length > 0) {
        updates.data.forEach(upd => {
            const icon = upd.update_type === 'thank_you' ? '💝' : 
                        upd.update_type === 'recovery' ? '💪' : 
                        upd.update_type === 'medical' ? '🏥' : '💰';
            console.log(`  ${icon} ${upd.title}`);
            console.log(`     ${upd.content}`);
            console.log(`     [${new Date(upd.created_at).toLocaleDateString()}]`);
            console.log('');
        });
    } else {
        console.log('  No updates yet.');
    }
    
    // Get donations
    console.log('\n  ─── Recent Donations ───');
    const donations = await apiRequest('GET', `/cases/${medicalCase.id}/donations`);
    if (donations.success && donations.data.length > 0) {
        donations.data.slice(0, 5).forEach(don => {
            console.log(`  • $${don.amount} from ${don.donor_name}${don.donor_country ? ` (${don.donor_country})` : ''}`);
            if (don.message) console.log(`    "${don.message}"`);
        });
    } else {
        console.log('  No donations yet. Be the first!');
    }
}

async function viewTopDonors() {
    console.log('\n🏆 Top Donors Leaderboard:\n');
    const result = await apiRequest('GET', '/donors/top?limit=10');
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((d, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            console.log(`  ${medal} ${d.name}${d.organization ? ` (${d.organization})` : ''}`);
            console.log(`     Total: $${d.total_donated}${d.country ? ` | ${d.country}` : ''}`);
            console.log('');
        });
    } else {
        console.log('  No donors yet.');
    }
}

async function viewDonationStats() {
    console.log('\n📊 Donation Statistics:\n');
    const result = await apiRequest('GET', '/donations/stats');
    
    if (result.success) {
        const stats = result.data;
        console.log(`  Total Donations: ${stats.total_donations}`);
        console.log(`  Total Amount Raised: $${stats.total_amount || 0}`);
        console.log(`  Active Cases: ${stats.active_cases}`);
        console.log(`  Funded Cases: ${stats.funded_cases}`);
        
        if (stats.by_treatment_type && stats.by_treatment_type.length > 0) {
            console.log('\n  By Treatment Type:');
            stats.by_treatment_type.forEach(t => {
                console.log(`    • ${t.treatment_type.replace('_', ' ')}: $${t.total} (${t.count} donations)`);
            });
        }
    } else {
        console.log('  Could not load statistics.');
    }
}

async function donorMenuLoop() {
    while (currentUser && currentUserType === 'donor') {
        printDonorMenu();
        const choice = await prompt('\nEnter your choice: ');
        
        switch (choice) {
            case '1':
                await browseMedicalCases();
                break;
            case '2':
                await makeDonation();
                break;
            case '3':
                await viewMyDonations();
                break;
            case '4':
                await viewCaseTransparency();
                break;
            case '5':
                await donorListEquipment();
                break;
            case '6':
                await viewDonorEquipmentListings();
                break;
            case '7':
                await viewMyProfile();
                break;
            case '8':
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

// ============================================
// DONOR EQUIPMENT FUNCTIONS
// ============================================

async function donorListEquipment() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│          DONATE EQUIPMENT/MEDICINE TO INVENTORY              │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    console.log('  Thank you for donating! Your contribution helps patients in need.\n');
    
    const item_name = await prompt('Item Name: ');
    
    console.log('\nItem Type:');
    console.log('  1. Oxygen Tank           6. Crutches');
    console.log('  2. Wheelchair            7. Blood Pressure Monitor');
    console.log('  3. Dialysis Machine      8. Glucose Meter');
    console.log('  4. Nebulizer             9. Medication');
    console.log('  5. Hospital Bed          10. Surgical Supplies');
    console.log('  11. PPE (Masks, Gloves)  12. Other');
    
    const typeChoice = await prompt('\nEnter type (1-12): ');
    const types = {
        '1': 'oxygen_tank', '2': 'wheelchair', '3': 'dialysis_machine',
        '4': 'nebulizer', '5': 'hospital_bed', '6': 'crutches',
        '7': 'blood_pressure_monitor', '8': 'glucose_meter', '9': 'medication',
        '10': 'surgical_supplies', '11': 'ppe', '12': 'other'
    };
    const item_type = types[typeChoice] || 'other';
    
    console.log('\nCategory:');
    console.log('  1. Equipment');
    console.log('  2. Medication');
    console.log('  3. Supplies');
    const catChoice = await prompt('Enter category (1-3): ');
    const categories = { '1': 'equipment', '2': 'medication', '3': 'supplies' };
    const category = categories[catChoice] || 'equipment';
    
    const description = await prompt('Description: ');
    const quantity = await prompt('Quantity donating: ');
    
    console.log('\nCondition:');
    console.log('  1. New');
    console.log('  2. Like New');
    console.log('  3. Good');
    console.log('  4. Fair');
    const condChoice = await prompt('Enter condition (1-4): ');
    const conditions = { '1': 'new', '2': 'like_new', '3': 'good', '4': 'fair' };
    const condition_status = conditions[condChoice] || 'good';
    
    const location = await prompt('Pickup/Delivery Location: ');
    const contact_phone = currentUser.phone || await prompt('Contact Phone: ');
    
    const result = await apiRequest('POST', '/equipment', {
        listed_by_type: 'donor',
        listed_by_id: currentUser.id,
        item_name,
        item_type,
        category,
        description,
        quantity: parseInt(quantity) || 1,
        condition_status,
        location,
        is_free: true,
        price: 0,
        contact_phone,
        contact_email: currentUser.email
    });
    
    if (result.success) {
        console.log('\n✅ Equipment/Medicine donated successfully!');
        console.log(`   Item ID: ${result.data.id}`);
        console.log('\n   🙏 Thank you for your generous donation!');
        console.log('   Patients in need can now request this item.');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function viewDonorEquipmentListings() {
    console.log('\n🎁 My Donated Equipment/Medicine:\n');
    
    const result = await apiRequest('GET', `/equipment/donor/${currentUser.id}`);
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((e, i) => {
            const statusIcon = e.is_available && e.available_quantity > 0 ? '🟢 Available' : '🔴 Distributed';
            console.log(`  ${i + 1}. ${e.item_name}`);
            console.log(`     Type: ${e.item_type.replace(/_/g, ' ')} | Category: ${e.category}`);
            console.log(`     Donated: ${e.quantity} | Remaining: ${e.available_quantity}`);
            console.log(`     Status: ${statusIcon}`);
            console.log(`     Location: ${e.location}`);
            console.log('');
        });
        
        const distributed = result.data.reduce((sum, e) => sum + (e.quantity - e.available_quantity), 0);
        console.log(`  ─────────────────────────────────`);
        console.log(`  Total Items Donated: ${result.data.reduce((sum, e) => sum + e.quantity, 0)}`);
        console.log(`  Items Distributed to Patients: ${distributed}`);
    } else {
        console.log('  No donated items yet.');
        console.log('  Use "Donate Equipment/Medicine" to help patients in need!');
    }
}

// ============================================
// PATIENT MEDICATION FUNCTIONS
// ============================================

async function requestMedication() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│              REQUEST MEDICATION/EQUIPMENT                    │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const medication_name = await prompt('Medication/Equipment Name: ');
    
    console.log('\nSelect Type:');
    console.log('  1. Prescription Medication');
    console.log('  2. Over the Counter');
    console.log('  3. Medical Equipment');
    console.log('  4. Medical Supplies');
    
    const typeChoice = await prompt('\nEnter choice (1-4): ');
    const medicationTypes = {
        '1': 'prescription',
        '2': 'over_the_counter',
        '3': 'medical_equipment',
        '4': 'supplies'
    };
    const medication_type = medicationTypes[typeChoice];
    
    if (!medication_type) {
        console.log('\n❌ Invalid type.');
        return;
    }
    
    const quantity = await prompt('Quantity needed: ');
    const description = await prompt('Description/Notes: ');
    
    console.log('\nUrgency Level:');
    console.log('  1. Low - Can wait a few days');
    console.log('  2. Medium - Needed within 1-2 days');
    console.log('  3. High - Needed today');
    console.log('  4. Critical - Life-threatening, immediate need');
    
    const urgencyChoice = await prompt('\nEnter choice (1-4): ');
    const urgencyLevels = { '1': 'low', '2': 'medium', '3': 'high', '4': 'critical' };
    const urgency_level = urgencyLevels[urgencyChoice] || 'medium';
    
    const delivery_address = await prompt('\nDelivery Address: ');
    const delivery_notes = await prompt('Delivery Notes (optional): ');
    
    const result = await apiRequest('POST', '/medications', {
        patient_id: currentUser.id,
        medication_name,
        medication_type,
        quantity,
        description,
        urgency_level,
        delivery_address,
        delivery_notes
    });
    
    if (result.success) {
        console.log('\n✅ Medication request submitted successfully!');
        console.log(`   Request ID: ${result.data.id}`);
        console.log('\n📦 Volunteers and NGOs can now see your request and fulfill it.');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function viewMyMedicationRequests() {
    console.log('\n📦 My Medication Requests:\n');
    
    const result = await apiRequest('GET', `/medications/patient/${currentUser.id}`);
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((r, i) => {
            const statusIcon = r.status === 'delivered' ? '✅' : 
                              r.status === 'in_progress' ? '🚚' : 
                              r.status === 'accepted' ? '👍' : 
                              r.status === 'pending' ? '⏳' : '❌';
            const urgencyIcon = r.urgency_level === 'critical' ? '🔴' : 
                               r.urgency_level === 'high' ? '🟠' : 
                               r.urgency_level === 'medium' ? '🟡' : '🟢';
            
            console.log(`  ${i + 1}. ${statusIcon} ${r.medication_name}`);
            console.log(`     Type: ${r.medication_type.replace('_', ' ')} | Qty: ${r.quantity}`);
            console.log(`     Status: ${r.status} | Urgency: ${urgencyIcon} ${r.urgency_level}`);
            if (r.volunteer_name) {
                console.log(`     Volunteer: ${r.volunteer_name}${r.organization_name ? ` (${r.organization_name})` : ''}`);
            }
            console.log(`     Address: ${r.delivery_address}`);
            console.log('');
        });
        
        // Option to confirm delivery
        const confirm = await prompt('Confirm a delivery? (Enter request number or 0 to skip): ');
        if (confirm !== '0' && confirm !== '') {
            const index = parseInt(confirm) - 1;
            if (index >= 0 && index < result.data.length && result.data[index].status === 'delivered') {
                await confirmDelivery(result.data[index]);
            }
        }
    } else {
        console.log('  No medication requests found.');
    }
}

async function confirmDelivery(request) {
    console.log(`\n📦 Confirming delivery for: ${request.medication_name}`);
    
    const ratingStr = await prompt('Rate the delivery (1-5 stars): ');
    const rating = parseInt(ratingStr);
    
    if (rating < 1 || rating > 5) {
        console.log('\n❌ Invalid rating.');
        return;
    }
    
    const feedback = await prompt('Feedback (optional): ');
    
    // Get delivery ID
    const deliveryResult = await apiRequest('GET', `/medications/${request.id}/delivery`);
    if (!deliveryResult.success) {
        console.log('\n❌ Could not find delivery record.');
        return;
    }
    
    const result = await apiRequest('PATCH', `/medications/delivery/${deliveryResult.data.id}/confirm`, {
        rating,
        feedback
    });
    
    if (result.success) {
        console.log('\n✅ Delivery confirmed! Thank you for your feedback.');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

// ============================================
// VOLUNTEER/NGO FUNCTIONS
// ============================================

async function registerVolunteer() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│             VOLUNTEER/NGO REGISTRATION                       │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const username = await prompt('Choose a Username: ');
    const password = await prompt('Choose a Password: ');
    const confirmPassword = await prompt('Confirm Password: ');
    
    if (password !== confirmPassword) {
        console.log('\n❌ Passwords do not match. Please try again.');
        return null;
    }
    
    const name = await prompt('Full Name / Organization Name: ');
    const email = await prompt('Email: ');
    const phone = await prompt('Phone: ');
    
    console.log('\nOrganization Type:');
    console.log('  1. Individual Volunteer');
    console.log('  2. NGO');
    console.log('  3. Pharmacy');
    console.log('  4. Hospital');
    console.log('  5. Charity Organization');
    
    const typeChoice = await prompt('\nEnter choice (1-5): ');
    const orgTypes = { '1': 'individual', '2': 'ngo', '3': 'pharmacy', '4': 'hospital', '5': 'charity' };
    const organization_type = orgTypes[typeChoice] || 'individual';
    
    let organization_name = null;
    if (organization_type !== 'individual') {
        organization_name = await prompt('Organization Name: ');
    }
    
    const coverage_areas = await prompt('Coverage Areas (e.g., Gaza City, North Gaza): ');
    
    const result = await apiRequest('POST', '/volunteers', {
        username,
        password,
        name,
        email,
        phone,
        organization_name,
        organization_type,
        coverage_areas
    });
    
    if (result.success) {
        console.log('\n✅ Registration successful!');
        console.log(`   Username: ${username}`);
        console.log('\n   You can now login to start helping patients.');
    } else {
        console.log(`\n❌ Registration failed: ${result.error}`);
    }
}

async function loginVolunteer() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                 VOLUNTEER/NGO LOGIN                          │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const username = await prompt('Username: ');
    const password = await prompt('Password: ');
    
    const result = await apiRequest('POST', '/volunteers/login', { username, password });
    
    if (result.success) {
        currentUser = result.data;
        currentUserType = 'volunteer';
        console.log(`\n✅ Welcome back, ${currentUser.name}!`);
        console.log(`   Total deliveries: ${currentUser.total_deliveries} | Rating: ${currentUser.rating}/5`);
        return true;
    } else {
        console.log('\n❌ Invalid username or password. Please try again.\n');
        return false;
    }
}

function printVolunteerMenu() {
    console.log(`  Logged in as: ${currentUser.name} (${currentUser.organization_type})\n`);
    console.log('┌──────────────────────────────────────────────────────────────┐');
    console.log('│                 VOLUNTEER/NGO MENU                           │');
    console.log('├──────────────────────────────────────────────────────────────┤');
    console.log('│  === Medication Delivery ===                                 │');
    console.log('│  1. View Pending Medication Requests                         │');
    console.log('│  2. View Urgent Requests                                     │');
    console.log('│  3. Accept a Request                                         │');
    console.log('│  4. My Accepted Requests                                     │');
    console.log('│  5. Update Delivery Status                                   │');
    console.log('│  6. View My Delivery History                                 │');
    console.log('│                                                              │');
    console.log('│  === Equipment & Inventory ===                               │');
    console.log('│  7. List Equipment/Medicine (Add to Inventory)               │');
    console.log('│  8. View My Inventory Listings                               │');
    console.log('│  9. View Pending Equipment Requests                          │');
    console.log('│  10. Fulfill Equipment Request                               │');
    console.log('│                                                              │');
    console.log('│  === Health Education & Workshops ===                        │');
    console.log('│  11. View Health Guides                                      │');
    console.log('│  12. View Public Health Alerts                               │');
    console.log('│  13. Browse Upcoming Workshops                               │');
    console.log('│  14. Register for Workshop                                   │');
    console.log('│                                                              │');
    console.log('│  === Mental Health Support ===                               │');
    console.log('│  15. Browse Support Groups                                   │');
    console.log('│  16. Join Support Group                                      │');
    console.log('│  17. Moderate Assigned Groups                                │');
    console.log('│                                                              │');
    console.log('│  18. Update My Availability                                  │');
    console.log('│  19. View My Profile                                         │');
    console.log('│  20. Logout                                                  │');
    console.log('│  0. Exit                                                     │');
    console.log('└──────────────────────────────────────────────────────────────┘');
}

async function viewPendingMedicationRequests() {
    console.log('\n📦 Pending Medication Requests:\n');
    
    const result = await apiRequest('GET', '/medications/pending');
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((r, i) => {
            const urgencyIcon = r.urgency_level === 'critical' ? '🔴 CRITICAL' : 
                               r.urgency_level === 'high' ? '🟠 HIGH' : 
                               r.urgency_level === 'medium' ? '🟡 MEDIUM' : '🟢 LOW';
            
            console.log(`  ${i + 1}. ${urgencyIcon}`);
            console.log(`     📦 ${r.medication_name} (${r.medication_type.replace('_', ' ')})`);
            console.log(`     👤 Patient: ${r.patient_name} | Phone: ${r.patient_phone}`);
            console.log(`     📍 ${r.delivery_address}`);
            if (r.delivery_notes) console.log(`     📝 Notes: ${r.delivery_notes}`);
            console.log('');
        });
    } else {
        console.log('  No pending requests. Check back later!');
    }
}

async function viewUrgentMedicationRequests() {
    console.log('\n🚨 Urgent Medication Requests:\n');
    
    const result = await apiRequest('GET', '/medications/urgent');
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((r, i) => {
            const urgencyIcon = r.urgency_level === 'critical' ? '🔴 CRITICAL' : '🟠 HIGH';
            
            console.log(`  ${i + 1}. ${urgencyIcon}`);
            console.log(`     📦 ${r.medication_name} (${r.medication_type.replace('_', ' ')})`);
            console.log(`     👤 Patient: ${r.patient_name} | Phone: ${r.patient_phone}`);
            console.log(`     📍 ${r.delivery_address}`);
            console.log('');
        });
    } else {
        console.log('  No urgent requests at the moment. Great job!');
    }
}

async function acceptMedicationRequest() {
    console.log('\n✋ Accept a Medication Request\n');
    
    // Show pending requests
    const pending = await apiRequest('GET', '/medications/pending');
    
    if (!pending.success || pending.data.length === 0) {
        console.log('  No pending requests available.');
        return;
    }
    
    pending.data.forEach((r, i) => {
        const urgencyIcon = r.urgency_level === 'critical' ? '🔴' : 
                           r.urgency_level === 'high' ? '🟠' : '🟡';
        console.log(`  ${i + 1}. ${urgencyIcon} ${r.medication_name} - ${r.patient_name}`);
        console.log(`     ${r.delivery_address}`);
    });
    
    const choice = await prompt('\nEnter request number to accept (0 to cancel): ');
    const index = parseInt(choice) - 1;
    
    if (choice === '0' || isNaN(index) || index < 0 || index >= pending.data.length) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const request = pending.data[index];
    
    const result = await apiRequest('PATCH', `/medications/${request.id}/accept`, {
        volunteer_id: currentUser.id
    });
    
    if (result.success) {
        console.log('\n✅ Request accepted! You are now responsible for this delivery.');
        console.log(`   Patient: ${request.patient_name}`);
        console.log(`   Phone: ${request.patient_phone}`);
        console.log(`   Address: ${request.delivery_address}`);
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function viewMyAcceptedRequests() {
    console.log('\n📋 My Accepted Requests:\n');
    
    const result = await apiRequest('GET', `/medications/volunteer/${currentUser.id}`);
    
    if (result.success && result.data.length > 0) {
        const active = result.data.filter(r => r.status !== 'delivered' && r.status !== 'cancelled');
        
        if (active.length > 0) {
            active.forEach((r, i) => {
                const statusIcon = r.status === 'in_progress' ? '🚚' : '👍';
                console.log(`  ${i + 1}. ${statusIcon} ${r.medication_name}`);
                console.log(`     Patient: ${r.patient_name} | Phone: ${r.patient_phone}`);
                console.log(`     Status: ${r.status}`);
                console.log(`     Address: ${r.delivery_address}`);
                console.log('');
            });
        } else {
            console.log('  No active requests. Accept one to start helping!');
        }
    } else {
        console.log('  No accepted requests found.');
    }
}

async function updateDeliveryStatus() {
    console.log('\n🚚 Update Delivery Status\n');
    
    // Get active requests
    const requests = await apiRequest('GET', `/medications/volunteer/${currentUser.id}`);
    
    if (!requests.success) {
        console.log('  Error loading requests.');
        return;
    }
    
    const active = requests.data.filter(r => r.status === 'accepted' || r.status === 'in_progress');
    
    if (active.length === 0) {
        console.log('  No active deliveries to update.');
        return;
    }
    
    active.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.medication_name} - ${r.patient_name} (${r.status})`);
    });
    
    const choice = await prompt('\nSelect request to update (0 to cancel): ');
    const index = parseInt(choice) - 1;
    
    if (choice === '0' || isNaN(index) || index < 0 || index >= active.length) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const request = active[index];
    
    console.log('\nSelect new status:');
    console.log('  1. Start Delivery (in transit)');
    console.log('  2. Mark as Delivered');
    console.log('  3. Mark as Failed');
    
    const statusChoice = await prompt('Enter choice: ');
    
    if (request.status === 'accepted' && statusChoice === '1') {
        // Start delivery
        const pickup = await prompt('Pickup Location: ');
        const estimated = await prompt('Estimated Delivery Time (YYYY-MM-DD HH:MM): ');
        
        const result = await apiRequest('POST', `/medications/${request.id}/deliver`, {
            volunteer_id: currentUser.id,
            pickup_location: pickup,
            estimated_delivery: estimated
        });
        
        if (result.success) {
            console.log('\n✅ Delivery started!');
        } else {
            console.log(`\n❌ Error: ${result.error}`);
        }
    } else if (statusChoice === '2' || statusChoice === '3') {
        // Get delivery record
        const delivery = await apiRequest('GET', `/medications/${request.id}/delivery`);
        
        if (!delivery.success) {
            // If no delivery record, create one first
            if (statusChoice === '2') {
                await apiRequest('POST', `/medications/${request.id}/deliver`, {
                    volunteer_id: currentUser.id,
                    pickup_location: 'N/A',
                    estimated_delivery: new Date().toISOString()
                });
            }
        }
        
        const newStatus = statusChoice === '2' ? 'delivered' : 'failed';
        const notes = await prompt('Notes (optional): ');
        
        // Update delivery status
        const deliveryCheck = await apiRequest('GET', `/medications/${request.id}/delivery`);
        if (deliveryCheck.success) {
            await apiRequest('PATCH', `/medications/delivery/${deliveryCheck.data.id}`, {
                status: newStatus,
                notes
            });
        }
        
        console.log(`\n✅ Status updated to: ${newStatus}`);
    }
}

async function viewMyDeliveryHistory() {
    console.log('\n📜 My Delivery History:\n');
    
    const result = await apiRequest('GET', `/volunteers/${currentUser.id}/deliveries`);
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((d, i) => {
            const statusIcon = d.status === 'delivered' ? '✅' : d.status === 'failed' ? '❌' : '🚚';
            console.log(`  ${i + 1}. ${statusIcon} ${d.medication_name}`);
            console.log(`     Patient: ${d.patient_name}`);
            console.log(`     Status: ${d.status}`);
            if (d.rating) console.log(`     Rating: ${'⭐'.repeat(d.rating)}`);
            if (d.feedback) console.log(`     Feedback: "${d.feedback}"`);
            console.log('');
        });
        
        console.log(`  ─────────────────────────────────`);
        console.log(`  Total Deliveries: ${currentUser.total_deliveries} | Rating: ${currentUser.rating}/5`);
    } else {
        console.log('  No delivery history yet. Start accepting requests!');
    }
}

async function updateVolunteerAvailability() {
    console.log('\n📊 Update Availability\n');
    console.log(`  Current status: ${currentUser.availability_status}\n`);
    console.log('  Options:');
    console.log('    1. available');
    console.log('    2. busy');
    console.log('    3. offline');
    
    const choice = await prompt('\nEnter choice (1-3): ');
    const statuses = { '1': 'available', '2': 'busy', '3': 'offline' };
    const status = statuses[choice];
    
    if (!status) {
        console.log('\n❌ Invalid choice.');
        return;
    }
    
    const result = await apiRequest('PATCH', `/volunteers/${currentUser.id}/availability`, { 
        availability_status: status 
    });
    
    if (result.success) {
        currentUser.availability_status = status;
        console.log(`\n✅ Availability updated to: ${status}`);
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function volunteerMenuLoop() {
    while (currentUser && currentUserType === 'volunteer') {
        printVolunteerMenu();
        const choice = await prompt('\nEnter your choice: ');
        
        switch (choice) {
            case '1':
                await viewPendingMedicationRequests();
                break;
            case '2':
                await viewUrgentMedicationRequests();
                break;
            case '3':
                await acceptMedicationRequest();
                break;
            case '4':
                await viewMyAcceptedRequests();
                break;
            case '5':
                await updateDeliveryStatus();
                break;
            case '6':
                await viewMyDeliveryHistory();
                break;
            case '7':
                await listEquipmentToInventory();
                break;
            case '8':
                await viewMyInventoryListings();
                break;
            case '9':
                await viewPendingEquipmentRequests();
                break;
            case '10':
                await fulfillEquipmentRequest();
                break;
            case '11':
                await viewHealthGuides();
                break;
            case '12':
                await viewPublicHealthAlerts();
                break;
            case '13':
                await browseUpcomingWorkshops();
                break;
            case '14':
                await registerForWorkshop();
                break;
            case '15':
                await browseSupportGroups();
                break;
            case '16':
                await joinSupportGroup();
                break;
            case '17':
                await moderateSupportGroups();
                break;
            case '18':
                await updateVolunteerAvailability();
                break;
            case '19':
                await viewMyProfile();
                break;
            case '20':
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

// ============================================
// EQUIPMENT FUNCTIONS
// ============================================

// Patient Equipment Functions
async function browseAvailableEquipment() {
    console.log('\n🏥 Available Equipment & Medical Supplies:\n');
    
    const result = await apiRequest('GET', '/equipment');
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((e, i) => {
            const condIcon = e.condition_status === 'new' ? '🆕' : 
                            e.condition_status === 'like_new' ? '✨' : 
                            e.condition_status === 'good' ? '👍' : '⚙️';
            const freeIcon = e.is_free ? '🆓 FREE' : `💵 $${e.price}`;
            
            console.log(`  ${i + 1}. ${condIcon} ${e.item_name}`);
            console.log(`     Type: ${e.item_type.replace(/_/g, ' ')} | Category: ${e.category}`);
            console.log(`     Qty Available: ${e.available_quantity} | Condition: ${e.condition_status}`);
            console.log(`     Location: ${e.location}`);
            console.log(`     ${freeIcon} | Listed by: ${e.listed_by_name}${e.organization_name ? ` (${e.organization_name})` : ''}`);
            if (e.description) console.log(`     📝 ${e.description}`);
            console.log('');
        });
        
        console.log('  Use "Request Equipment" to request any item.');
    } else {
        console.log('  No equipment available at the moment.');
    }
}

async function requestEquipment() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                   REQUEST EQUIPMENT                          │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    // Show available equipment
    const available = await apiRequest('GET', '/equipment');
    
    if (available.success && available.data.length > 0) {
        console.log('Available Equipment:');
        available.data.forEach((e, i) => {
            console.log(`  ${i + 1}. ${e.item_name} (${e.available_quantity} available) - ${e.location}`);
        });
        
        const choice = await prompt('\nSelect equipment number (or 0 to request something else): ');
        const index = parseInt(choice) - 1;
        
        let item_name, item_type, equipment_id = null;
        
        if (choice !== '0' && index >= 0 && index < available.data.length) {
            const selected = available.data[index];
            item_name = selected.item_name;
            item_type = selected.item_type;
            equipment_id = selected.id;
        } else {
            item_name = await prompt('\nEquipment/Item Name: ');
            console.log('\nEquipment Type:');
            console.log('  1. Oxygen Tank');
            console.log('  2. Wheelchair');
            console.log('  3. Hospital Bed');
            console.log('  4. Crutches');
            console.log('  5. Nebulizer');
            console.log('  6. Blood Pressure Monitor');
            console.log('  7. Glucose Meter');
            console.log('  8. Other');
            
            const typeChoice = await prompt('Enter type (1-8): ');
            const types = {
                '1': 'oxygen_tank', '2': 'wheelchair', '3': 'hospital_bed',
                '4': 'crutches', '5': 'nebulizer', '6': 'blood_pressure_monitor',
                '7': 'glucose_meter', '8': 'other'
            };
            item_type = types[typeChoice] || 'other';
        }
        
        console.log('\nUrgency Level:');
        console.log('  1. Low - Can wait');
        console.log('  2. Medium - Needed soon');
        console.log('  3. High - Needed urgently');
        console.log('  4. Critical - Immediate need');
        
        const urgencyChoice = await prompt('Enter urgency (1-4): ');
        const urgencies = { '1': 'low', '2': 'medium', '3': 'high', '4': 'critical' };
        const urgency_level = urgencies[urgencyChoice] || 'medium';
        
        const description = await prompt('Additional notes: ');
        const delivery_address = await prompt('Delivery Address: ');
        
        const result = await apiRequest('POST', '/equipment/request', {
            patient_id: currentUser.id,
            equipment_id,
            item_name,
            item_type,
            urgency_level,
            description,
            delivery_address
        });
        
        if (result.success) {
            console.log('\n✅ Equipment request submitted!');
            console.log(`   Request ID: ${result.data.id}`);
            console.log('\n   Volunteers and organizations will see your request.');
        } else {
            console.log(`\n❌ Error: ${result.error}`);
        }
    } else {
        // No equipment available, still allow request
        const item_name = await prompt('Equipment/Item Name: ');
        const description = await prompt('Description: ');
        const delivery_address = await prompt('Delivery Address: ');
        
        const result = await apiRequest('POST', '/equipment/request', {
            patient_id: currentUser.id,
            item_name,
            item_type: 'other',
            urgency_level: 'medium',
            description,
            delivery_address
        });
        
        if (result.success) {
            console.log('\n✅ Equipment request submitted!');
        } else {
            console.log(`\n❌ Error: ${result.error}`);
        }
    }
}

// Volunteer Equipment Functions
async function listEquipmentToInventory() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│            LIST EQUIPMENT/MEDICINE TO INVENTORY              │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const item_name = await prompt('Item Name: ');
    
    console.log('\nItem Type:');
    console.log('  1. Oxygen Tank           6. Crutches');
    console.log('  2. Wheelchair            7. Blood Pressure Monitor');
    console.log('  3. Dialysis Machine      8. Glucose Meter');
    console.log('  4. Nebulizer             9. Medication');
    console.log('  5. Hospital Bed          10. Surgical Supplies');
    console.log('  11. PPE (Masks, Gloves)  12. Other');
    
    const typeChoice = await prompt('\nEnter type (1-12): ');
    const types = {
        '1': 'oxygen_tank', '2': 'wheelchair', '3': 'dialysis_machine',
        '4': 'nebulizer', '5': 'hospital_bed', '6': 'crutches',
        '7': 'blood_pressure_monitor', '8': 'glucose_meter', '9': 'medication',
        '10': 'surgical_supplies', '11': 'ppe', '12': 'other'
    };
    const item_type = types[typeChoice] || 'other';
    
    console.log('\nCategory:');
    console.log('  1. Equipment');
    console.log('  2. Medication');
    console.log('  3. Supplies');
    const catChoice = await prompt('Enter category (1-3): ');
    const categories = { '1': 'equipment', '2': 'medication', '3': 'supplies' };
    const category = categories[catChoice] || 'equipment';
    
    const description = await prompt('Description: ');
    const quantity = await prompt('Quantity available: ');
    
    console.log('\nCondition:');
    console.log('  1. New');
    console.log('  2. Like New');
    console.log('  3. Good');
    console.log('  4. Fair');
    const condChoice = await prompt('Enter condition (1-4): ');
    const conditions = { '1': 'new', '2': 'like_new', '3': 'good', '4': 'fair' };
    const condition_status = conditions[condChoice] || 'good';
    
    const location = await prompt('Location (e.g., Gaza City, Hospital name): ');
    
    const isFreeInput = await prompt('Is this free? (yes/no): ');
    const is_free = isFreeInput.toLowerCase() === 'yes';
    let price = 0;
    if (!is_free) {
        price = parseFloat(await prompt('Price ($): ')) || 0;
    }
    
    const contact_phone = await prompt('Contact Phone: ');
    
    const result = await apiRequest('POST', '/equipment', {
        listed_by_type: 'volunteer',
        listed_by_id: currentUser.id,
        item_name,
        item_type,
        category,
        description,
        quantity: parseInt(quantity) || 1,
        condition_status,
        location,
        is_free,
        price,
        contact_phone
    });
    
    if (result.success) {
        console.log('\n✅ Equipment listed successfully!');
        console.log(`   Item ID: ${result.data.id}`);
        console.log('\n   Patients can now see and request this item.');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

async function viewMyInventoryListings() {
    console.log('\n📦 My Inventory Listings:\n');
    
    const result = await apiRequest('GET', `/equipment/volunteer/${currentUser.id}`);
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((e, i) => {
            const statusIcon = e.is_available ? '🟢' : '🔴';
            console.log(`  ${i + 1}. ${statusIcon} ${e.item_name}`);
            console.log(`     Type: ${e.item_type.replace(/_/g, ' ')} | Category: ${e.category}`);
            console.log(`     Total: ${e.quantity} | Available: ${e.available_quantity}`);
            console.log(`     Condition: ${e.condition_status} | ${e.is_free ? 'FREE' : `$${e.price}`}`);
            console.log(`     Location: ${e.location}`);
            console.log('');
        });
    } else {
        console.log('  No listings yet. Add equipment/medicine to help patients!');
    }
}

async function viewPendingEquipmentRequests() {
    console.log('\n📋 Pending Equipment Requests:\n');
    
    const result = await apiRequest('GET', '/equipment/requests/pending');
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((r, i) => {
            const urgencyIcon = r.urgency_level === 'critical' ? '🔴 CRITICAL' : 
                               r.urgency_level === 'high' ? '🟠 HIGH' : 
                               r.urgency_level === 'medium' ? '🟡 MEDIUM' : '🟢 LOW';
            
            console.log(`  ${i + 1}. ${urgencyIcon}`);
            console.log(`     🏥 ${r.item_name}${r.item_type ? ` (${r.item_type})` : ''}`);
            console.log(`     👤 Patient: ${r.patient_name} | Phone: ${r.patient_phone}`);
            console.log(`     📍 ${r.delivery_address}`);
            if (r.description) console.log(`     📝 ${r.description}`);
            console.log('');
        });
    } else {
        console.log('  No pending equipment requests. Great job!');
    }
}

async function fulfillEquipmentRequest() {
    console.log('\n✋ Fulfill Equipment Request\n');
    
    const pending = await apiRequest('GET', '/equipment/requests/pending');
    
    if (!pending.success || pending.data.length === 0) {
        console.log('  No pending requests available.');
        return;
    }
    
    pending.data.forEach((r, i) => {
        const urgencyIcon = r.urgency_level === 'critical' ? '🔴' : 
                           r.urgency_level === 'high' ? '🟠' : '🟡';
        console.log(`  ${i + 1}. ${urgencyIcon} ${r.item_name} - ${r.patient_name}`);
    });
    
    const choice = await prompt('\nSelect request to fulfill (0 to cancel): ');
    const index = parseInt(choice) - 1;
    
    if (choice === '0' || isNaN(index) || index < 0 || index >= pending.data.length) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const request = pending.data[index];
    
    // Check if we have matching inventory
    const myInventory = await apiRequest('GET', `/equipment/volunteer/${currentUser.id}`);
    let equipment_id = null;
    
    if (myInventory.success && myInventory.data.length > 0) {
        console.log('\nYour available inventory:');
        myInventory.data.filter(e => e.available_quantity > 0).forEach((e, i) => {
            console.log(`  ${i + 1}. ${e.item_name} (${e.available_quantity} available)`);
        });
        
        const invChoice = await prompt('Select from inventory (0 to fulfill without inventory): ');
        const invIndex = parseInt(invChoice) - 1;
        
        if (invChoice !== '0' && invIndex >= 0 && invIndex < myInventory.data.length) {
            equipment_id = myInventory.data[invIndex].id;
        }
    }
    
    const result = await apiRequest('PATCH', `/equipment/requests/${request.id}/fulfill`, {
        fulfilled_by_type: 'volunteer',
        fulfilled_by_id: currentUser.id,
        equipment_id
    });
    
    if (result.success) {
        console.log('\n✅ Request fulfilled successfully!');
        console.log(`   Patient: ${request.patient_name}`);
        console.log(`   Phone: ${request.patient_phone}`);
        console.log(`   Address: ${request.delivery_address}`);
        console.log('\n   Please arrange delivery to the patient.');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

// ============================================
// FEATURE 4: HEALTH EDUCATION & ALERTS FUNCTIONS
// ============================================

// View Health Guides (for patients and volunteers)
async function viewHealthGuides() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                    HEALTH GUIDES                             │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    // Handle language preference (patients have it, volunteers may not)
    const lang = (currentUser.language_preference === 'arabic') ? 'ar' : 'en';
    
    console.log('  Select category:');
    console.log('    1. All Guides');
    console.log('    2. First Aid');
    console.log('    3. Chronic Illness');
    console.log('    4. Nutrition');
    console.log('    5. Maternal Care');
    console.log('    6. Child Health');
    console.log('    7. Mental Health');
    console.log('    8. Hygiene');
    console.log('    9. Search Guides');
    
    const choice = await prompt('\nEnter choice: ');
    
    let result;
    const categories = {
        '2': 'first_aid', '3': 'chronic_illness', '4': 'nutrition',
        '5': 'maternal_care', '6': 'child_health', '7': 'mental_health', '8': 'hygiene'
    };
    
    if (choice === '1') {
        result = await apiRequest('GET', `/guides?lang=${lang}`);
    } else if (choice === '9') {
        const query = await prompt('Search term: ');
        result = await apiRequest('GET', `/guides/search/${query}?lang=${lang}`);
    } else if (categories[choice]) {
        result = await apiRequest('GET', `/guides/category/${categories[choice]}?lang=${lang}`);
    } else {
        console.log('\n❌ Invalid choice.');
        return;
    }
    
    if (result.success && result.data.length > 0) {
        console.log('\n📚 Health Guides:\n');
        result.data.forEach((g, i) => {
            console.log(`  ${i + 1}. 📖 ${g.title}`);
            console.log(`     Category: ${g.category.replace('_', ' ')} | By: ${g.author_name}`);
            if (g.summary) console.log(`     ${g.summary}`);
            console.log(`     Views: ${g.view_count} 👁️`);
            console.log('');
        });
        
        const viewChoice = await prompt('Enter guide number to read full content (0 to skip): ');
        if (viewChoice !== '0' && viewChoice !== '') {
            const index = parseInt(viewChoice) - 1;
            if (index >= 0 && index < result.data.length) {
                await viewGuideDetails(result.data[index].id, lang);
            }
        }
    } else {
        console.log('\n  No guides found.');
    }
}

async function viewGuideDetails(guideId, lang) {
    const result = await apiRequest('GET', `/guides/${guideId}?lang=${lang}`);
    
    if (result.success) {
        const g = result.data;
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log(`║  📖 ${g.title}`);
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        console.log(`  Category: ${g.category.replace('_', ' ')}`);
        console.log(`  Author: ${g.author_name}`);
        console.log(`  Views: ${g.view_count}\n`);
        console.log('  ─── Content ───\n');
        console.log(`  ${g.content}\n`);
        if (g.video_url) console.log(`  🎬 Video: ${g.video_url}`);
    }
}

// View Public Health Alerts (for patients and volunteers)
async function viewPublicHealthAlerts() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                 PUBLIC HEALTH ALERTS                         │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    // Handle language preference (patients have it, volunteers may not)
    const lang = (currentUser.language_preference === 'arabic') ? 'ar' : 'en';
    
    console.log('  Filter by:');
    console.log('    1. All Active Alerts');
    console.log('    2. Urgent Only (Emergency/Critical)');
    console.log('    3. Disease Outbreaks');
    console.log('    4. Water Safety');
    console.log('    5. Vaccination Campaigns');
    
    const choice = await prompt('\nEnter choice: ');
    
    let result;
    switch (choice) {
        case '1':
            result = await apiRequest('GET', `/alerts?lang=${lang}`);
            break;
        case '2':
            result = await apiRequest('GET', `/alerts/urgent?lang=${lang}`);
            break;
        case '3':
            result = await apiRequest('GET', `/alerts/type/disease_outbreak?lang=${lang}`);
            break;
        case '4':
            result = await apiRequest('GET', `/alerts/type/water_safety?lang=${lang}`);
            break;
        case '5':
            result = await apiRequest('GET', `/alerts/type/vaccination?lang=${lang}`);
            break;
        default:
            result = await apiRequest('GET', `/alerts?lang=${lang}`);
    }
    
    if (result.success && result.data.length > 0) {
        console.log('\n🚨 Active Alerts:\n');
        result.data.forEach((a, i) => {
            const severityIcon = a.severity === 'emergency' ? '🔴 EMERGENCY' :
                                a.severity === 'critical' ? '🟠 CRITICAL' :
                                a.severity === 'warning' ? '🟡 WARNING' : 'ℹ️ INFO';
            
            console.log(`  ${i + 1}. ${severityIcon}`);
            console.log(`     📢 ${a.title}`);
            console.log(`     Type: ${a.alert_type.replace('_', ' ')}`);
            console.log(`     ${a.content}`);
            if (a.affected_areas) console.log(`     📍 Areas: ${a.affected_areas}`);
            if (a.recommendations) console.log(`     ✅ Recommendations: ${a.recommendations}`);
            console.log('');
        });
    } else {
        console.log('\n  ✅ No active alerts. Stay safe!');
    }
}

// Browse Upcoming Workshops (for patients and volunteers)
async function browseUpcomingWorkshops() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                  UPCOMING WORKSHOPS                          │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    // Handle language preference (patients have it, volunteers may not)
    const lang = (currentUser.language_preference === 'arabic') ? 'ar' : 'en';
    
    console.log('  Filter by:');
    console.log('    1. All Upcoming');
    console.log('    2. Webinars (Online)');
    console.log('    3. In-Person');
    console.log('    4. Hybrid');
    
    const choice = await prompt('\nEnter choice: ');
    
    let result;
    switch (choice) {
        case '2':
            result = await apiRequest('GET', `/workshops/type/webinar?lang=${lang}`);
            break;
        case '3':
            result = await apiRequest('GET', `/workshops/type/in_person?lang=${lang}`);
            break;
        case '4':
            result = await apiRequest('GET', `/workshops/type/hybrid?lang=${lang}`);
            break;
        default:
            result = await apiRequest('GET', `/workshops?lang=${lang}`);
    }
    
    if (result.success && result.data.length > 0) {
        console.log('\n📅 Upcoming Workshops & Webinars:\n');
        result.data.forEach((w, i) => {
            const typeIcon = w.workshop_type === 'webinar' ? '💻' :
                            w.workshop_type === 'in_person' ? '🏢' : '🔄';
            const spotsLeft = w.max_participants - w.current_participants;
            
            console.log(`  ${i + 1}. ${typeIcon} ${w.title}`);
            console.log(`     Category: ${w.category.replace('_', ' ')} | Type: ${w.workshop_type}`);
            console.log(`     Instructor: ${w.instructor_name}`);
            console.log(`     📅 ${new Date(w.scheduled_date).toLocaleString()}`);
            console.log(`     ⏱️ Duration: ${w.duration_minutes} minutes`);
            if (w.location) console.log(`     📍 Location: ${w.location}`);
            if (w.online_link) console.log(`     🔗 Online: ${w.online_link}`);
            console.log(`     👥 Spots: ${spotsLeft} remaining (${w.current_participants}/${w.max_participants})`);
            console.log(`     ${w.is_free ? '🆓 FREE' : `💵 $${w.price}`}`);
            console.log('');
        });
    } else {
        console.log('\n  No upcoming workshops at the moment.');
    }
}

// Register for Workshop (for patients and volunteers)
async function registerForWorkshop() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                REGISTER FOR WORKSHOP                         │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    // Handle language preference (patients have it, volunteers may not)
    const lang = (currentUser.language_preference === 'arabic') ? 'ar' : 'en';
    const workshops = await apiRequest('GET', `/workshops?lang=${lang}`);
    
    if (!workshops.success || workshops.data.length === 0) {
        console.log('  No upcoming workshops available.');
        return;
    }
    
    console.log('  Available Workshops:\n');
    workshops.data.forEach((w, i) => {
        const spotsLeft = w.max_participants - w.current_participants;
        console.log(`  ${i + 1}. ${w.title}`);
        console.log(`     📅 ${new Date(w.scheduled_date).toLocaleString()} | Spots: ${spotsLeft} left`);
    });
    
    const choice = await prompt('\nSelect workshop number (0 to cancel): ');
    const index = parseInt(choice) - 1;
    
    if (choice === '0' || isNaN(index) || index < 0 || index >= workshops.data.length) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const workshop = workshops.data[index];
    
    const result = await apiRequest('POST', `/workshops/${workshop.id}/register`, {
        participant_type: currentUserType,
        participant_id: currentUser.id
    });
    
    if (result.success) {
        console.log('\n✅ Successfully registered for workshop!');
        console.log(`   Workshop: ${workshop.title}`);
        console.log(`   Date: ${new Date(workshop.scheduled_date).toLocaleString()}`);
        if (workshop.online_link) console.log(`   Join link: ${workshop.online_link}`);
        if (workshop.location) console.log(`   Location: ${workshop.location}`);
        console.log(`\n   Registration ID: ${result.data.registration_id}`);
    } else {
        console.log(`\n❌ Registration failed: ${result.error}`);
    }
}

// View My Workshop Registrations (for patients)
async function viewMyWorkshopRegistrations() {
    console.log('\n📋 My Workshop Registrations:\n');
    
    // We need to get all workshops and check registrations
    // Since there's no direct endpoint for user registrations, we'll fetch workshops
    const workshops = await apiRequest('GET', '/workshops');
    
    if (!workshops.success || workshops.data.length === 0) {
        console.log('  No workshops found.');
        return;
    }
    
    let myRegistrations = [];
    
    for (const workshop of workshops.data) {
        const regs = await apiRequest('GET', `/workshops/${workshop.id}/registrations`);
        if (regs.success) {
            const myReg = regs.data.find(r => 
                r.participant_type === currentUserType && r.participant_id === currentUser.id
            );
            if (myReg) {
                myRegistrations.push({ workshop, registration: myReg });
            }
        }
    }
    
    if (myRegistrations.length > 0) {
        myRegistrations.forEach((item, i) => {
            const w = item.workshop;
            const r = item.registration;
            const statusIcon = r.attended ? '✅ Attended' : '📅 Upcoming';
            
            console.log(`  ${i + 1}. ${statusIcon} ${w.title}`);
            console.log(`     Date: ${new Date(w.scheduled_date).toLocaleString()}`);
            console.log(`     Type: ${w.workshop_type} | Instructor: ${w.instructor_name}`);
            if (w.online_link) console.log(`     Join: ${w.online_link}`);
            if (w.location) console.log(`     Location: ${w.location}`);
            console.log('');
        });
    } else {
        console.log('  You have not registered for any workshops yet.');
        console.log('  Use "Browse Upcoming Workshops" to find and register!');
    }
}

// ============================================
// DOCTOR HEALTH EDUCATION FUNCTIONS
// ============================================

// Create Health Guide (for doctors)
async function createHealthGuide() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                  CREATE HEALTH GUIDE                         │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const title = await prompt('Title (English): ');
    const title_ar = await prompt('Title (Arabic): ');
    
    console.log('\nSelect Category:');
    console.log('  1. First Aid');
    console.log('  2. Chronic Illness');
    console.log('  3. Nutrition');
    console.log('  4. Maternal Care');
    console.log('  5. Child Health');
    console.log('  6. Mental Health');
    console.log('  7. Hygiene');
    console.log('  8. Emergency');
    console.log('  9. Medication');
    
    const catChoice = await prompt('Enter category (1-9): ');
    const categories = {
        '1': 'first_aid', '2': 'chronic_illness', '3': 'nutrition',
        '4': 'maternal_care', '5': 'child_health', '6': 'mental_health',
        '7': 'hygiene', '8': 'emergency', '9': 'medication'
    };
    const category = categories[catChoice] || 'other';
    
    console.log('\nEnter content (English):');
    const content = await prompt('> ');
    
    console.log('\nEnter content (Arabic):');
    const content_ar = await prompt('> ');
    
    const summary = await prompt('\nBrief summary (English): ');
    const summary_ar = await prompt('Brief summary (Arabic): ');
    
    const tags = await prompt('Tags (comma-separated): ');
    
    const result = await apiRequest('POST', '/guides', {
        title,
        title_ar,
        category,
        content,
        content_ar,
        summary,
        summary_ar,
        author_type: 'doctor',
        author_id: currentUser.id,
        author_name: `Dr. ${currentUser.name}`,
        tags
    });
    
    if (result.success) {
        console.log('\n✅ Health guide created successfully!');
        console.log(`   Guide ID: ${result.data.id}`);
        console.log('   Patients can now view this guide.');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

// View Doctor's Guides
async function viewMyHealthGuides() {
    console.log('\n📚 My Health Guides:\n');
    
    const result = await apiRequest('GET', '/guides');
    
    if (result.success && result.data.length > 0) {
        const myGuides = result.data.filter(g => 
            g.author_name && g.author_name.includes(currentUser.name)
        );
        
        if (myGuides.length > 0) {
            myGuides.forEach((g, i) => {
                console.log(`  ${i + 1}. 📖 ${g.title}`);
                console.log(`     Category: ${g.category.replace('_', ' ')}`);
                console.log(`     Views: ${g.view_count} 👁️`);
                console.log('');
            });
        } else {
            console.log('  You have not created any guides yet.');
        }
    } else {
        console.log('  No guides found.');
    }
}

// Send Public Health Alert (for doctors)
async function sendPublicHealthAlert() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                SEND PUBLIC HEALTH ALERT                      │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const title = await prompt('Alert Title (English): ');
    const title_ar = await prompt('Alert Title (Arabic): ');
    
    console.log('\nAlert Type:');
    console.log('  1. Disease Outbreak');
    console.log('  2. Air Quality');
    console.log('  3. Water Safety');
    console.log('  4. Urgent Medical');
    console.log('  5. Vaccination Campaign');
    console.log('  6. Emergency');
    console.log('  7. General');
    
    const typeChoice = await prompt('Enter type (1-7): ');
    const types = {
        '1': 'disease_outbreak', '2': 'air_quality', '3': 'water_safety',
        '4': 'urgent_medical', '5': 'vaccination', '6': 'emergency', '7': 'general'
    };
    const alert_type = types[typeChoice] || 'general';
    
    console.log('\nSeverity Level:');
    console.log('  1. Info (ℹ️)');
    console.log('  2. Warning (🟡)');
    console.log('  3. Critical (🟠)');
    console.log('  4. Emergency (🔴)');
    
    const sevChoice = await prompt('Enter severity (1-4): ');
    const severities = { '1': 'info', '2': 'warning', '3': 'critical', '4': 'emergency' };
    const severity = severities[sevChoice] || 'info';
    
    console.log('\nAlert Content (English):');
    const content = await prompt('> ');
    
    console.log('\nAlert Content (Arabic):');
    const content_ar = await prompt('> ');
    
    const affected_areas = await prompt('\nAffected Areas (e.g., Gaza City, Khan Yunis): ');
    
    console.log('\nRecommendations (English):');
    const recommendations = await prompt('> ');
    
    console.log('\nRecommendations (Arabic):');
    const recommendations_ar = await prompt('> ');
    
    const result = await apiRequest('POST', '/alerts', {
        title,
        title_ar,
        alert_type,
        severity,
        content,
        content_ar,
        affected_areas,
        recommendations,
        recommendations_ar,
        source: `Dr. ${currentUser.name} - ${currentUser.specialty}`,
        created_by_type: 'doctor',
        created_by_id: currentUser.id
    });
    
    if (result.success) {
        console.log('\n✅ Alert sent successfully!');
        console.log(`   Alert ID: ${result.data.id}`);
        console.log('   This alert is now visible to all patients and volunteers.');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

// Create Workshop/Webinar (for doctors)
async function createWorkshop() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                CREATE WORKSHOP/WEBINAR                       │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const title = await prompt('Title (English): ');
    const title_ar = await prompt('Title (Arabic): ');
    
    console.log('\nDescription (English):');
    const description = await prompt('> ');
    
    console.log('\nDescription (Arabic):');
    const description_ar = await prompt('> ');
    
    console.log('\nWorkshop Type:');
    console.log('  1. Webinar (Online only)');
    console.log('  2. In-Person');
    console.log('  3. Hybrid (Both)');
    
    const typeChoice = await prompt('Enter type (1-3): ');
    const types = { '1': 'webinar', '2': 'in_person', '3': 'hybrid' };
    const workshop_type = types[typeChoice] || 'webinar';
    
    console.log('\nCategory:');
    console.log('  1. First Aid');
    console.log('  2. Chronic Illness');
    console.log('  3. Nutrition');
    console.log('  4. Maternal Care');
    console.log('  5. Child Health');
    console.log('  6. Mental Health');
    console.log('  7. General');
    
    const catChoice = await prompt('Enter category (1-7): ');
    const categories = {
        '1': 'first_aid', '2': 'chronic_illness', '3': 'nutrition',
        '4': 'maternal_care', '5': 'child_health', '6': 'mental_health', '7': 'general'
    };
    const category = categories[catChoice] || 'general';
    
    const scheduled_date = await prompt('\nDate & Time (YYYY-MM-DD HH:MM): ');
    const duration_minutes = await prompt('Duration (minutes): ');
    
    let location = null;
    let online_link = null;
    
    if (workshop_type === 'in_person' || workshop_type === 'hybrid') {
        location = await prompt('Location: ');
    }
    if (workshop_type === 'webinar' || workshop_type === 'hybrid') {
        online_link = await prompt('Online Meeting Link: ');
    }
    
    const max_participants = await prompt('Maximum Participants: ');
    
    console.log('\nLanguage:');
    console.log('  1. Arabic');
    console.log('  2. English');
    console.log('  3. Both');
    const langChoice = await prompt('Enter choice (1-3): ');
    const languages = { '1': 'arabic', '2': 'english', '3': 'both' };
    const language = languages[langChoice] || 'arabic';
    
    const result = await apiRequest('POST', '/workshops', {
        title,
        title_ar,
        description,
        description_ar,
        workshop_type,
        category,
        instructor_name: `Dr. ${currentUser.name}`,
        instructor_title: currentUser.specialty.replace('_', ' '),
        instructor_id: currentUser.id,
        instructor_type: 'doctor',
        scheduled_date,
        duration_minutes: parseInt(duration_minutes) || 60,
        location,
        online_link,
        max_participants: parseInt(max_participants) || 100,
        is_free: true,
        language
    });
    
    if (result.success) {
        console.log('\n✅ Workshop created successfully!');
        console.log(`   Workshop ID: ${result.data.id}`);
        console.log('   Patients and volunteers can now register.');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

// View Doctor's Workshops
async function viewMyWorkshops() {
    console.log('\n📅 My Workshops:\n');
    
    const result = await apiRequest('GET', '/workshops');
    
    if (result.success && result.data.length > 0) {
        const myWorkshops = result.data.filter(w => w.instructor_id === currentUser.id);
        
        if (myWorkshops.length > 0) {
            for (const w of myWorkshops) {
                const statusIcon = w.status === 'completed' ? '✅' :
                                  w.status === 'ongoing' ? '🔴 LIVE' :
                                  w.status === 'cancelled' ? '❌' : '📅';
                
                console.log(`  ${statusIcon} ${w.title}`);
                console.log(`     Type: ${w.workshop_type} | Category: ${w.category}`);
                console.log(`     Date: ${new Date(w.scheduled_date).toLocaleString()}`);
                console.log(`     Registered: ${w.current_participants}/${w.max_participants}`);
                console.log(`     Status: ${w.status}`);
                
                // Get registrations
                const regs = await apiRequest('GET', `/workshops/${w.id}/registrations`);
                if (regs.success && regs.data.length > 0) {
                    console.log(`     📋 Registrations: ${regs.data.length}`);
                }
                console.log('');
            }
        } else {
            console.log('  You have not created any workshops yet.');
        }
    } else {
        console.log('  No workshops found.');
    }
}

// ============================================
// FEATURE 5: MENTAL HEALTH & TRAUMA SUPPORT FUNCTIONS
// ============================================

// Request Trauma Counseling (for patients)
async function requestTraumaCounseling() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│              REQUEST TRAUMA COUNSELING                       │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    // Get available mental health counselors
    const counselors = await apiRequest('GET', '/mental-health/counselors');
    
    if (!counselors.success || counselors.data.length === 0) {
        console.log('  No mental health counselors available at the moment.');
        console.log('  Please try again later or contact emergency services if urgent.');
        return;
    }
    
    console.log('  Available Mental Health Counselors:\n');
    counselors.data.forEach((c, i) => {
        console.log(`  ${i + 1}. Dr. ${c.name}`);
        console.log(`     Experience: ${c.years_of_experience} years | Languages: ${c.languages}`);
        if (c.bio) console.log(`     ${c.bio}`);
        console.log('');
    });
    
    const counselorChoice = await prompt('Select counselor (number): ');
    const counselorIndex = parseInt(counselorChoice) - 1;
    
    if (isNaN(counselorIndex) || counselorIndex < 0 || counselorIndex >= counselors.data.length) {
        console.log('\n❌ Invalid selection.');
        return;
    }
    
    const counselor = counselors.data[counselorIndex];
    
    console.log('\n  Session Type:');
    console.log('    1. PTSD (Post-Traumatic Stress)');
    console.log('    2. Grief Counseling');
    console.log('    3. Anxiety');
    console.log('    4. Depression');
    console.log('    5. War Trauma');
    console.log('    6. Child Trauma');
    console.log('    7. Family Support');
    console.log('    8. General Mental Health');
    
    const typeChoice = await prompt('\nSelect type (1-8): ');
    const sessionTypes = {
        '1': 'ptsd', '2': 'grief', '3': 'anxiety', '4': 'depression',
        '5': 'war_trauma', '6': 'child_trauma', '7': 'family_support', '8': 'general'
    };
    const session_type = sessionTypes[typeChoice] || 'general';
    
    console.log('\n  Target Group:');
    console.log('    1. Adult');
    console.log('    2. Child');
    console.log('    3. Family');
    console.log('    4. War Survivor');
    
    const groupChoice = await prompt('\nSelect group (1-4): ');
    const targetGroups = { '1': 'adult', '2': 'child', '3': 'family', '4': 'war_survivor' };
    const target_group = targetGroups[groupChoice] || 'adult';
    
    console.log('\n  Session Mode:');
    console.log('    1. Video Call');
    console.log('    2. Audio Only');
    console.log('    3. Chat/Message');
    console.log('    4. In-Person (if available)');
    
    const modeChoice = await prompt('\nSelect mode (1-4): ');
    const sessionModes = { '1': 'video', '2': 'audio', '3': 'chat', '4': 'in_person' };
    const session_mode = sessionModes[modeChoice] || 'video';
    
    console.log('\n  Urgency Level:');
    console.log('    1. Low - Can wait');
    console.log('    2. Medium - Within a few days');
    console.log('    3. High - As soon as possible');
    console.log('    4. Crisis - Need immediate help');
    
    const urgencyChoice = await prompt('\nSelect urgency (1-4): ');
    const urgencyLevels = { '1': 'low', '2': 'medium', '3': 'high', '4': 'crisis' };
    const urgency_level = urgencyLevels[urgencyChoice] || 'medium';
    
    const notes = await prompt('\nBriefly describe what you would like help with:\n> ');
    
    const result = await apiRequest('POST', '/mental-health/counseling/request', {
        patient_id: currentUser.id,
        counselor_id: counselor.id,
        session_type,
        target_group,
        session_mode,
        urgency_level,
        notes
    });
    
    if (result.success) {
        console.log('\n✅ Counseling session requested successfully!');
        console.log(`   Session ID: ${result.data.session_id}`);
        console.log(`   Counselor: Dr. ${counselor.name}`);
        console.log('   The counselor will contact you to schedule the session.');
        if (urgency_level === 'crisis') {
            console.log('\n   ⚠️  CRISIS FLAG: Your request has been marked as urgent.');
            console.log('   A counselor will reach out as soon as possible.');
        }
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

// View My Counseling Sessions (for patients)
async function viewMyCounselingSessions() {
    console.log('\n🧠 My Counseling Sessions:\n');
    
    const result = await apiRequest('GET', `/mental-health/counseling/patient/${currentUser.id}`);
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((s, i) => {
            const statusIcon = s.status === 'completed' ? '✅' :
                              s.status === 'scheduled' ? '📅' :
                              s.status === 'in_progress' ? '🔴' :
                              s.status === 'cancelled' ? '❌' : '⏳';
            const urgencyIcon = s.urgency_level === 'crisis' ? '🆘' :
                               s.urgency_level === 'high' ? '🔴' :
                               s.urgency_level === 'medium' ? '🟡' : '🟢';
            
            console.log(`  ${i + 1}. ${statusIcon} ${s.session_type.replace('_', ' ').toUpperCase()}`);
            console.log(`     Counselor: Dr. ${s.counselor_name}`);
            console.log(`     Status: ${s.status} | Urgency: ${urgencyIcon} ${s.urgency_level}`);
            console.log(`     Mode: ${s.session_mode}`);
            if (s.scheduled_at) {
                console.log(`     Scheduled: ${new Date(s.scheduled_at).toLocaleString()}`);
            }
            if (s.counselor_notes) {
                console.log(`     📝 Notes: ${s.counselor_notes}`);
            }
            if (s.follow_up_recommended) {
                console.log(`     ⚠️  Follow-up recommended`);
            }
            console.log('');
        });
    } else {
        console.log('  You have no counseling sessions yet.');
        console.log('  Use "Request Trauma Counseling" to get started.');
    }
}

// Browse Support Groups
async function browseSupportGroups() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                    SUPPORT GROUPS                            │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const lang = (currentUser.language_preference === 'arabic') ? 'ar' : 'en';
    
    console.log('  Filter by type:');
    console.log('    1. All Groups');
    console.log('    2. War Trauma Survivors');
    console.log('    3. Chronic Illness');
    console.log('    4. Grief & Loss');
    console.log('    5. Disability Support');
    console.log('    6. Caregiver Support');
    console.log('    7. Mental Health');
    console.log('    8. Parent Support');
    
    const choice = await prompt('\nEnter choice: ');
    
    const groupTypes = {
        '2': 'war_trauma', '3': 'chronic_illness', '4': 'grief_loss',
        '5': 'disability', '6': 'caregiver', '7': 'mental_health', '8': 'parent_support'
    };
    
    let url = `/mental-health/support-groups?lang=${lang}`;
    if (groupTypes[choice]) {
        url += `&type=${groupTypes[choice]}`;
    }
    
    const result = await apiRequest('GET', url);
    
    if (result.success && result.data.length > 0) {
        console.log('\n👥 Support Groups:\n');
        result.data.forEach((g, i) => {
            const spotsLeft = g.max_members - g.current_members;
            console.log(`  ${i + 1}. 💬 ${g.name}`);
            console.log(`     Type: ${g.group_type.replace('_', ' ')} | For: ${g.target_audience}`);
            console.log(`     Moderator: ${g.moderator_name}`);
            console.log(`     📅 ${g.meeting_schedule}`);
            console.log(`     👥 Members: ${g.current_members}/${g.max_members} (${spotsLeft} spots left)`);
            console.log(`     🌐 Language: ${g.language}`);
            if (g.meeting_link) console.log(`     🔗 ${g.meeting_link}`);
            console.log('');
        });
    } else {
        console.log('\n  No support groups found.');
    }
}

// Join Support Group
async function joinSupportGroup() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                  JOIN SUPPORT GROUP                          │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const lang = (currentUser.language_preference === 'arabic') ? 'ar' : 'en';
    const groups = await apiRequest('GET', `/mental-health/support-groups?lang=${lang}`);
    
    if (!groups.success || groups.data.length === 0) {
        console.log('  No support groups available.');
        return;
    }
    
    console.log('  Available Groups:\n');
    groups.data.forEach((g, i) => {
        const spotsLeft = g.max_members - g.current_members;
        console.log(`  ${i + 1}. ${g.name} (${spotsLeft} spots left)`);
        console.log(`     Type: ${g.group_type.replace('_', ' ')}`);
    });
    
    const choice = await prompt('\nSelect group to join (0 to cancel): ');
    const index = parseInt(choice) - 1;
    
    if (choice === '0' || isNaN(index) || index < 0 || index >= groups.data.length) {
        console.log('\n  Cancelled.');
        return;
    }
    
    const group = groups.data[index];
    
    const displayName = await prompt('Display name in group (or press Enter for your name): ');
    const anonChoice = await prompt('Stay anonymous? (y/n): ');
    const is_anonymous = anonChoice.toLowerCase() === 'y';
    
    const result = await apiRequest('POST', `/mental-health/support-groups/${group.id}/join`, {
        member_type: currentUserType,
        member_id: currentUser.id,
        display_name: displayName || currentUser.name,
        is_anonymous
    });
    
    if (result.success) {
        console.log('\n✅ ' + result.data.message);
        console.log(`   Group: ${group.name}`);
        if (group.meeting_schedule) console.log(`   Meetings: ${group.meeting_schedule}`);
        if (group.meeting_link) console.log(`   Join link: ${group.meeting_link}`);
    } else {
        console.log(`\n❌ ${result.error}`);
    }
}

// View My Support Groups
async function viewMySupportGroups() {
    console.log('\n👥 My Support Groups:\n');
    
    const result = await apiRequest('GET', `/mental-health/support-groups/member/${currentUserType}/${currentUser.id}`);
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((m, i) => {
            console.log(`  ${i + 1}. 💬 ${m.name}`);
            console.log(`     Type: ${m.group_type.replace('_', ' ')}`);
            console.log(`     Role: ${m.role}`);
            if (m.meeting_schedule) console.log(`     📅 ${m.meeting_schedule}`);
            if (m.meeting_link) console.log(`     🔗 ${m.meeting_link}`);
            console.log('');
        });
    } else {
        console.log('  You have not joined any support groups yet.');
        console.log('  Use "Browse Support Groups" to find groups to join.');
    }
}

// Start Anonymous Therapy Chat
async function startAnonymousChat() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│              ANONYMOUS THERAPY CHAT                          │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    console.log('  🔒 Your identity is protected. You will receive an anonymous ID.');
    console.log('  💬 A counselor will join your chat as soon as one is available.\n');
    
    console.log('  What concern brings you here today?');
    console.log('    1. Anxiety');
    console.log('    2. Depression');
    console.log('    3. Trauma');
    console.log('    4. Grief');
    console.log('    5. Stress');
    console.log('    6. Relationship Issues');
    console.log('    7. Addiction');
    console.log('    8. Other');
    
    const concernChoice = await prompt('\nSelect concern (1-8): ');
    const concernTypes = {
        '1': 'anxiety', '2': 'depression', '3': 'trauma', '4': 'grief',
        '5': 'stress', '6': 'relationship', '7': 'addiction', '8': 'other'
    };
    const concern_type = concernTypes[concernChoice] || 'other';
    
    console.log('\n  How urgent is your need?');
    console.log('    1. Normal - I can wait');
    console.log('    2. Urgent - I need help soon');
    console.log('    3. Crisis - I need immediate help');
    
    const priorityChoice = await prompt('\nSelect priority (1-3): ');
    const priorities = { '1': 'normal', '2': 'urgent', '3': 'crisis' };
    const priority = priorities[priorityChoice] || 'normal';
    
    const initial_message = await prompt('\nShare what\'s on your mind (optional):\n> ');
    
    const result = await apiRequest('POST', '/mental-health/anonymous-chat/start', {
        patient_id: currentUser.id,
        concern_type,
        priority,
        initial_message: initial_message || null
    });
    
    if (result.success) {
        console.log('\n✅ Anonymous chat started!');
        console.log(`   Your Anonymous ID: ${result.data.anonymous_id}`);
        console.log(`   Chat ID: ${result.data.chat_id}`);
        console.log('\n   A counselor will join your chat soon.');
        console.log('   You can check "View My Anonymous Chats" for responses.');
        
        if (priority === 'crisis') {
            console.log('\n   ⚠️  CRISIS FLAG: Your chat has been prioritized.');
            console.log('   If you\'re in immediate danger, please call emergency services.');
        }
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

// View My Anonymous Chats
async function viewMyAnonymousChats() {
    console.log('\n💬 My Anonymous Chats:\n');
    
    const result = await apiRequest('GET', `/mental-health/anonymous-chat/patient/${currentUser.id}`);
    
    if (result.success && result.data.length > 0) {
        for (const chat of result.data) {
            const statusIcon = chat.status === 'active' ? '🟢 Active' :
                              chat.status === 'waiting' ? '⏳ Waiting for counselor' :
                              chat.status === 'closed' ? '✅ Closed' : '🔴 Escalated';
            
            console.log(`  Chat ID: ${chat.id} | ${chat.anonymous_id}`);
            console.log(`  Status: ${statusIcon}`);
            console.log(`  Concern: ${chat.concern_type}`);
            if (chat.counselor_name) console.log(`  Counselor: ${chat.counselor_name}`);
            
            // Show recent messages
            if (chat.status === 'active' || chat.status === 'waiting') {
                const messages = await apiRequest('GET', `/mental-health/anonymous-chat/${chat.id}/messages`);
                if (messages.success && messages.data.length > 0) {
                    console.log('  Recent messages:');
                    messages.data.slice(-3).forEach(m => {
                        const sender = m.sender_type === 'patient' ? 'You' : 'Counselor';
                        console.log(`    ${sender}: ${m.content.substring(0, 50)}...`);
                    });
                    
                    // Option to send message
                    const sendMsg = await prompt('\n  Send a message? (y/n): ');
                    if (sendMsg.toLowerCase() === 'y') {
                        const content = await prompt('  Your message: ');
                        await apiRequest('POST', `/mental-health/anonymous-chat/${chat.id}/messages`, {
                            sender_type: 'patient',
                            content
                        });
                        console.log('  ✅ Message sent!');
                    }
                }
            }
            console.log('');
        }
    } else {
        console.log('  You have no anonymous chats.');
        console.log('  Use "Start Anonymous Therapy Chat" to begin.');
    }
}

// ============================================
// DOCTOR MENTAL HEALTH FUNCTIONS
// ============================================

// View Counseling Requests (for doctors)
async function viewCounselingRequests() {
    console.log('\n🧠 Counseling Requests:\n');
    
    const result = await apiRequest('GET', `/mental-health/counseling/counselor/${currentUser.id}`);
    
    if (result.success && result.data.length > 0) {
        const pending = result.data.filter(s => s.status === 'requested' || s.status === 'scheduled');
        
        if (pending.length > 0) {
            console.log('  === Pending/Scheduled Sessions ===\n');
            pending.forEach((s, i) => {
                const urgencyIcon = s.urgency_level === 'crisis' ? '🆘 CRISIS' :
                                   s.urgency_level === 'high' ? '🔴 HIGH' :
                                   s.urgency_level === 'medium' ? '🟡 MEDIUM' : '🟢 LOW';
                
                console.log(`  ${i + 1}. ${urgencyIcon} - ${s.session_type.replace('_', ' ')}`);
                console.log(`     Patient: ${s.patient_name} (${s.target_group})`);
                console.log(`     Mode: ${s.session_mode} | Status: ${s.status}`);
                if (s.notes) console.log(`     Patient notes: ${s.notes}`);
                if (s.scheduled_at) console.log(`     Scheduled: ${new Date(s.scheduled_at).toLocaleString()}`);
                console.log('');
            });
            
            const action = await prompt('Enter session number to manage (0 to skip): ');
            const index = parseInt(action) - 1;
            
            if (action !== '0' && index >= 0 && index < pending.length) {
                await manageCounselingSession(pending[index]);
            }
        } else {
            console.log('  No pending counseling requests.');
        }
    } else {
        console.log('  No counseling sessions found.');
    }
}

// Manage Counseling Session
async function manageCounselingSession(session) {
    console.log(`\n  Managing session for ${session.patient_name}`);
    console.log('  Actions:');
    console.log('    1. Schedule session');
    console.log('    2. Mark as in progress');
    console.log('    3. Complete session (add notes)');
    console.log('    4. Cancel session');
    
    const action = await prompt('\nSelect action: ');
    
    let updates = {};
    
    switch (action) {
        case '1':
            const dateTime = await prompt('Schedule date/time (YYYY-MM-DD HH:MM): ');
            updates = { status: 'scheduled', scheduled_at: dateTime };
            break;
        case '2':
            updates = { status: 'in_progress' };
            break;
        case '3':
            const notes = await prompt('Session notes: ');
            const followUp = await prompt('Recommend follow-up? (y/n): ');
            updates = { 
                status: 'completed', 
                counselor_notes: notes,
                follow_up_recommended: followUp.toLowerCase() === 'y'
            };
            break;
        case '4':
            updates = { status: 'cancelled' };
            break;
        default:
            console.log('Invalid action.');
            return;
    }
    
    const result = await apiRequest('PATCH', `/mental-health/counseling/${session.id}`, updates);
    
    if (result.success) {
        console.log('\n✅ Session updated successfully!');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

// View Waiting Anonymous Chats (for doctors)
async function viewWaitingAnonymousChats() {
    console.log('\n💬 Waiting Anonymous Chats:\n');
    
    const result = await apiRequest('GET', '/mental-health/anonymous-chat/waiting');
    
    if (result.success && result.data.length > 0) {
        result.data.forEach((c, i) => {
            const priorityIcon = c.priority === 'crisis' ? '🆘 CRISIS' :
                                c.priority === 'urgent' ? '🔴 URGENT' : '🟢 NORMAL';
            
            console.log(`  ${i + 1}. ${priorityIcon} | ${c.anonymous_id}`);
            console.log(`     Concern: ${c.concern_type}`);
            console.log(`     Waiting since: ${new Date(c.created_at).toLocaleString()}`);
            console.log('');
        });
        
        const accept = await prompt('Enter chat number to accept (0 to skip): ');
        const index = parseInt(accept) - 1;
        
        if (accept !== '0' && index >= 0 && index < result.data.length) {
            const chat = result.data[index];
            const acceptResult = await apiRequest('POST', `/mental-health/anonymous-chat/${chat.id}/accept`, {
                counselor_id: currentUser.id
            });
            
            if (acceptResult.success) {
                console.log('\n✅ Chat accepted! You can now communicate with the patient.');
                
                // Show messages and allow response
                const messages = await apiRequest('GET', `/mental-health/anonymous-chat/${chat.id}/messages`);
                if (messages.success && messages.data.length > 0) {
                    console.log('\n  Chat history:');
                    messages.data.forEach(m => {
                        const sender = m.sender_type === 'patient' ? 'Patient' : 'You';
                        console.log(`    ${sender}: ${m.content}`);
                    });
                }
                
                const response = await prompt('\nYour response: ');
                if (response) {
                    await apiRequest('POST', `/mental-health/anonymous-chat/${chat.id}/messages`, {
                        sender_type: 'counselor',
                        content: response
                    });
                    console.log('✅ Message sent!');
                }
            }
        }
    } else {
        console.log('  No chats waiting for counselors.');
    }
}

// View Doctor's Active Anonymous Chats
async function viewMyActiveAnonymousChats() {
    console.log('\n💬 My Active Anonymous Chats:\n');
    
    const result = await apiRequest('GET', `/mental-health/anonymous-chat/counselor/${currentUser.id}`);
    
    if (result.success && result.data.length > 0) {
        for (const chat of result.data) {
            console.log(`  Chat: ${chat.anonymous_id}`);
            console.log(`  Concern: ${chat.concern_type} | Priority: ${chat.priority}`);
            console.log(`  Started: ${new Date(chat.started_at).toLocaleString()}`);
            
            const messages = await apiRequest('GET', `/mental-health/anonymous-chat/${chat.id}/messages`);
            if (messages.success && messages.data.length > 0) {
                console.log('  Recent:');
                messages.data.slice(-3).forEach(m => {
                    const sender = m.sender_type === 'patient' ? 'Patient' : 'You';
                    console.log(`    ${sender}: ${m.content.substring(0, 60)}...`);
                });
            }
            
            const action = await prompt('\n  (r)eply, (c)lose, (e)scalate, (s)kip: ');
            
            if (action === 'r') {
                const response = await prompt('  Your message: ');
                await apiRequest('POST', `/mental-health/anonymous-chat/${chat.id}/messages`, {
                    sender_type: 'counselor',
                    content: response
                });
                console.log('  ✅ Sent!');
            } else if (action === 'c') {
                await apiRequest('POST', `/mental-health/anonymous-chat/${chat.id}/close`, {});
                console.log('  ✅ Chat closed.');
            } else if (action === 'e') {
                const reason = await prompt('  Escalation reason: ');
                await apiRequest('POST', `/mental-health/anonymous-chat/${chat.id}/escalate`, { reason });
                console.log('  ⚠️  Chat escalated to crisis level.');
            }
            console.log('');
        }
    } else {
        console.log('  No active chats.');
    }
}

// Create Support Group (for doctors)
async function createSupportGroup() {
    console.log('\n┌──────────────────────────────────────────────────────────────┐');
    console.log('│                 CREATE SUPPORT GROUP                         │');
    console.log('└──────────────────────────────────────────────────────────────┘\n');
    
    const name = await prompt('Group Name (English): ');
    const name_ar = await prompt('Group Name (Arabic): ');
    
    console.log('\nDescription (English):');
    const description = await prompt('> ');
    
    console.log('\nDescription (Arabic):');
    const description_ar = await prompt('> ');
    
    console.log('\nGroup Type:');
    console.log('  1. Chronic Illness');
    console.log('  2. Disability');
    console.log('  3. Grief & Loss');
    console.log('  4. War Trauma');
    console.log('  5. Caregiver Support');
    console.log('  6. Mental Health');
    console.log('  7. Parent Support');
    console.log('  8. General');
    
    const typeChoice = await prompt('Select type (1-8): ');
    const groupTypes = {
        '1': 'chronic_illness', '2': 'disability', '3': 'grief_loss', '4': 'war_trauma',
        '5': 'caregiver', '6': 'mental_health', '7': 'parent_support', '8': 'general'
    };
    const group_type = groupTypes[typeChoice] || 'general';
    
    console.log('\nTarget Audience:');
    console.log('  1. Patients');
    console.log('  2. Families');
    console.log('  3. Caregivers');
    console.log('  4. All');
    
    const audChoice = await prompt('Select audience (1-4): ');
    const audiences = { '1': 'patients', '2': 'families', '3': 'caregivers', '4': 'all' };
    const target_audience = audiences[audChoice] || 'all';
    
    const meeting_schedule = await prompt('Meeting Schedule (e.g., "Sundays 7 PM"): ');
    const meeting_link = await prompt('Meeting Link: ');
    const max_members = await prompt('Max Members (default 50): ');
    
    const result = await apiRequest('POST', '/mental-health/support-groups', {
        name,
        name_ar,
        description,
        description_ar,
        group_type,
        target_audience,
        moderator_type: 'doctor',
        moderator_id: currentUser.id,
        moderator_name: `Dr. ${currentUser.name}`,
        max_members: parseInt(max_members) || 50,
        meeting_schedule,
        meeting_link,
        language: 'both'
    });
    
    if (result.success) {
        console.log('\n✅ Support group created successfully!');
        console.log(`   Group ID: ${result.data.group_id}`);
        console.log('   Patients can now join this group.');
    } else {
        console.log(`\n❌ Error: ${result.error}`);
    }
}

// Moderate My Support Groups (for doctors)
async function moderateSupportGroups() {
    console.log('\n👥 My Support Groups (Moderator):\n');
    
    const result = await apiRequest('GET', '/mental-health/support-groups');
    
    if (result.success && result.data.length > 0) {
        const myGroups = result.data.filter(g => g.moderator_id === currentUser.id);
        
        if (myGroups.length > 0) {
            myGroups.forEach((g, i) => {
                console.log(`  ${i + 1}. ${g.name}`);
                console.log(`     Type: ${g.group_type} | Members: ${g.current_members}/${g.max_members}`);
                console.log(`     Schedule: ${g.meeting_schedule}`);
                console.log('');
            });
        } else {
            console.log('  You are not moderating any support groups.');
        }
    } else {
        console.log('  No support groups found.');
    }
}

// ============================================
// MAIN FUNCTION
// ============================================

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
            case '5':
                await registerDonor();
                break;
            case '6':
                if (await loginDonor()) {
                    await prompt('\nPress Enter to continue...');
                    clearScreen();
                    printHeader();
                    await donorMenuLoop();
                }
                break;
            case '7':
                await registerVolunteer();
                break;
            case '8':
                if (await loginVolunteer()) {
                    await prompt('\nPress Enter to continue...');
                    clearScreen();
                    printHeader();
                    await volunteerMenuLoop();
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
