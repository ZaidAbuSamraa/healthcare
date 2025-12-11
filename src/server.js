const express = require('express');
require('dotenv').config();

// Feature 1: Remote Medical Consultations
const patientsRouter = require('./routes/patients');
const doctorsRouter = require('./routes/doctors');
const consultationsRouter = require('./routes/consultations');
const messagesRouter = require('./routes/messages');

// Feature 2: Medical Sponsorship System
const donorsRouter = require('./routes/donors');
const medicalCasesRouter = require('./routes/medical-cases');
const donationsRouter = require('./routes/donations');
const invoicesRouter = require('./routes/invoices');

// Feature 3: Medication & Equipment Coordination
const volunteersRouter = require('./routes/volunteers');
const medicationRequestsRouter = require('./routes/medication-requests');
const equipmentRouter = require('./routes/equipment');

// Feature 4: Health Education & Public Health Alerts
const healthGuidesRouter = require('./routes/health-guides');
const alertsRouter = require('./routes/alerts');
const workshopsRouter = require('./routes/workshops');

// Feature 5: Mental Health & Trauma Support
const mentalHealthRouter = require('./routes/mental-health');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Feature 1 Routes: Remote Medical Consultations
app.use('/api/patients', patientsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/consultations', consultationsRouter);
app.use('/api/messages', messagesRouter);

// Feature 2 Routes: Medical Sponsorship System
app.use('/api/donors', donorsRouter);
app.use('/api/cases', medicalCasesRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/invoices', invoicesRouter);

// Feature 3 Routes: Medication & Equipment Coordination
app.use('/api/volunteers', volunteersRouter);
app.use('/api/medications', medicationRequestsRouter);
app.use('/api/equipment', equipmentRouter);

// Feature 4 Routes: Health Education & Public Health Alerts
app.use('/api/guides', healthGuidesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/workshops', workshopsRouter);

// Feature 5 Routes: Mental Health & Trauma Support
app.use('/api/mental-health', mentalHealthRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'HealthPal API is running' });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'HealthPal API',
        version: '3.0.0',
        description: 'Remote Medical Consultations, Medical Sponsorship, Medication Coordination & Health Education Platform',
        features: {
            feature1: 'Remote Medical Consultations',
            feature2: 'Medical Sponsorship System',
            feature3: 'Medication & Equipment Coordination',
            feature4: 'Health Education & Public Health Alerts',
            feature5: 'Mental Health & Trauma Support'
        },
        endpoints: {
            // Feature 1: Remote Medical Consultations
            patients: {
                'GET /api/patients': 'List all patients',
                'GET /api/patients/:id': 'Get patient by ID',
                'POST /api/patients': 'Register new patient',
                'POST /api/patients/login': 'Patient login',
                'PUT /api/patients/:id': 'Update patient',
                'DELETE /api/patients/:id': 'Delete patient'
            },
            doctors: {
                'GET /api/doctors': 'List all doctors',
                'GET /api/doctors/available': 'List available doctors',
                'GET /api/doctors/specialty/:specialty': 'List doctors by specialty',
                'GET /api/doctors/:id': 'Get doctor by ID',
                'POST /api/doctors': 'Register new doctor',
                'POST /api/doctors/login': 'Doctor login',
                'PATCH /api/doctors/:id/availability': 'Update doctor availability',
                'PUT /api/doctors/:id': 'Update doctor',
                'DELETE /api/doctors/:id': 'Delete doctor'
            },
            consultations: {
                'GET /api/consultations': 'List all consultations',
                'GET /api/consultations/:id': 'Get consultation by ID',
                'GET /api/consultations/patient/:patientId': 'Get patient consultations',
                'GET /api/consultations/doctor/:doctorId': 'Get doctor consultations',
                'POST /api/consultations': 'Book new consultation',
                'PATCH /api/consultations/:id/status': 'Update consultation status',
                'PATCH /api/consultations/:id/diagnosis': 'Add diagnosis/prescription',
                'DELETE /api/consultations/:id': 'Cancel consultation'
            },
            messages: {
                'GET /api/messages/consultation/:consultationId': 'Get consultation messages',
                'POST /api/messages': 'Send message'
            },
            // Feature 2: Medical Sponsorship System
            donors: {
                'GET /api/donors': 'List all donors',
                'GET /api/donors/top': 'Get top donors leaderboard',
                'GET /api/donors/:id': 'Get donor by ID',
                'GET /api/donors/:id/donations': 'Get donor donation history',
                'POST /api/donors': 'Register new donor',
                'POST /api/donors/login': 'Donor login',
                'PUT /api/donors/:id': 'Update donor',
                'DELETE /api/donors/:id': 'Delete donor'
            },
            medical_cases: {
                'GET /api/cases': 'List all active medical cases',
                'GET /api/cases/type/:type': 'Get cases by treatment type',
                'GET /api/cases/urgent': 'Get urgent cases',
                'GET /api/cases/:id': 'Get case details',
                'GET /api/cases/:id/donations': 'Get case donations',
                'GET /api/cases/:id/updates': 'Get case updates',
                'GET /api/cases/:id/invoices': 'Get case invoices',
                'GET /api/cases/patient/:patientId': 'Get patient cases',
                'POST /api/cases': 'Create new medical case',
                'POST /api/cases/:id/updates': 'Add case update',
                'PATCH /api/cases/:id/verify': 'Verify case (doctor)',
                'PATCH /api/cases/:id/status': 'Update case status'
            },
            donations: {
                'GET /api/donations': 'List all donations',
                'GET /api/donations/recent': 'Get recent donations',
                'GET /api/donations/stats': 'Get donation statistics',
                'GET /api/donations/:id': 'Get donation by ID',
                'POST /api/donations': 'Make a donation'
            },
            invoices: {
                'GET /api/invoices': 'List all invoices',
                'GET /api/invoices/category/:category': 'Get invoices by category',
                'GET /api/invoices/stats': 'Get invoice statistics',
                'GET /api/invoices/:id': 'Get invoice by ID',
                'POST /api/invoices': 'Create new invoice',
                'PATCH /api/invoices/:id/status': 'Update invoice status',
                'DELETE /api/invoices/:id': 'Delete invoice'
            },
            // Feature 3: Medication & Equipment Coordination
            volunteers: {
                'GET /api/volunteers': 'List available volunteers/NGOs',
                'GET /api/volunteers/:id': 'Get volunteer by ID',
                'GET /api/volunteers/:id/deliveries': 'Get volunteer delivery history',
                'GET /api/volunteers/type/:type': 'Get volunteers by type',
                'POST /api/volunteers': 'Register new volunteer/NGO',
                'POST /api/volunteers/login': 'Volunteer login',
                'PATCH /api/volunteers/:id/availability': 'Update availability'
            },
            medication_requests: {
                'GET /api/medications': 'List all medication requests',
                'GET /api/medications/pending': 'List pending requests',
                'GET /api/medications/urgent': 'List urgent requests',
                'GET /api/medications/:id': 'Get request details',
                'GET /api/medications/patient/:patientId': 'Get patient requests',
                'GET /api/medications/volunteer/:volunteerId': 'Get volunteer accepted requests',
                'POST /api/medications': 'Create medication request',
                'PATCH /api/medications/:id/accept': 'Accept request (volunteer)',
                'PATCH /api/medications/:id/status': 'Update request status',
                'POST /api/medications/:id/deliver': 'Start delivery',
                'GET /api/medications/:id/delivery': 'Get delivery status',
                'PATCH /api/medications/delivery/:deliveryId': 'Update delivery status',
                'PATCH /api/medications/delivery/:deliveryId/confirm': 'Confirm delivery & rate',
                'DELETE /api/medications/:id': 'Cancel request'
            },
            equipment_inventory: {
                'GET /api/equipment': 'List all available equipment',
                'GET /api/equipment/type/:type': 'Get equipment by type',
                'GET /api/equipment/category/:category': 'Get equipment by category',
                'GET /api/equipment/search/:query': 'Search equipment',
                'GET /api/equipment/:id': 'Get equipment details',
                'GET /api/equipment/volunteer/:volunteerId': 'Get volunteer listings',
                'GET /api/equipment/donor/:donorId': 'Get donor donated items',
                'GET /api/equipment/stats/summary': 'Get inventory statistics',
                'POST /api/equipment': 'List new equipment',
                'PUT /api/equipment/:id': 'Update equipment listing',
                'DELETE /api/equipment/:id': 'Remove equipment listing',
                'POST /api/equipment/request': 'Request equipment (patient)',
                'GET /api/equipment/requests/patient/:patientId': 'Get patient equipment requests',
                'GET /api/equipment/requests/pending': 'Get pending requests (volunteer)',
                'PATCH /api/equipment/requests/:id/fulfill': 'Fulfill equipment request'
            },
            // Feature 4: Health Education & Public Health Alerts
            health_guides: {
                'GET /api/guides': 'List all health guides',
                'GET /api/guides/category/:category': 'Get guides by category',
                'GET /api/guides/search/:query': 'Search guides',
                'GET /api/guides/:id': 'Get guide details',
                'GET /api/guides/stats/popular': 'Get popular guides',
                'GET /api/guides/stats/categories': 'Get categories with count',
                'POST /api/guides': 'Create new guide',
                'PUT /api/guides/:id': 'Update guide',
                'DELETE /api/guides/:id': 'Delete guide'
            },
            public_alerts: {
                'GET /api/alerts': 'List all active alerts',
                'GET /api/alerts/type/:type': 'Get alerts by type',
                'GET /api/alerts/severity/:severity': 'Get alerts by severity',
                'GET /api/alerts/urgent': 'Get emergency/critical alerts',
                'GET /api/alerts/area/:area': 'Get alerts by area',
                'GET /api/alerts/:id': 'Get alert details',
                'POST /api/alerts': 'Create new alert',
                'PUT /api/alerts/:id': 'Update alert',
                'PATCH /api/alerts/:id/deactivate': 'Deactivate alert',
                'DELETE /api/alerts/:id': 'Delete alert'
            },
            workshops: {
                'GET /api/workshops': 'List upcoming workshops',
                'GET /api/workshops/type/:type': 'Get workshops by type',
                'GET /api/workshops/category/:category': 'Get workshops by category',
                'GET /api/workshops/archive/completed': 'Get completed workshops with recordings',
                'GET /api/workshops/:id': 'Get workshop details',
                'GET /api/workshops/:id/registrations': 'Get workshop registrations',
                'POST /api/workshops': 'Create new workshop',
                'POST /api/workshops/:id/register': 'Register for workshop',
                'PUT /api/workshops/:id': 'Update workshop',
                'PATCH /api/workshops/:id/status': 'Update workshop status',
                'DELETE /api/workshops/:id': 'Delete workshop',
                'DELETE /api/workshops/:id/register/:registrationId': 'Cancel registration',
                'PATCH /api/workshops/registrations/:registrationId/attend': 'Mark attendance',
                'PATCH /api/workshops/registrations/:registrationId/feedback': 'Submit feedback'
            }
        },
        enums: {
            treatment_types: ['surgery', 'cancer_treatment', 'dialysis', 'physical_rehabilitation', 'medication', 'other'],
            case_status: ['pending_verification', 'verified', 'active', 'funded', 'in_treatment', 'completed', 'cancelled'],
            urgency_levels: ['low', 'medium', 'high', 'critical'],
            invoice_categories: ['hospital', 'medication', 'equipment', 'therapy', 'transportation', 'other'],
            specialties: ['general_practice', 'pediatrics', 'mental_health', 'internal_medicine', 'surgery', 'dermatology', 'cardiology', 'neurology'],
            consultation_types: ['video', 'audio', 'message'],
            medication_types: ['prescription', 'over_the_counter', 'medical_equipment', 'supplies'],
            organization_types: ['ngo', 'pharmacy', 'hospital', 'individual', 'charity'],
            delivery_status: ['picked_up', 'in_transit', 'delivered', 'failed'],
            request_status: ['pending', 'accepted', 'in_progress', 'delivered', 'cancelled'],
            equipment_types: ['oxygen_tank', 'wheelchair', 'dialysis_machine', 'nebulizer', 'hospital_bed', 'crutches', 'blood_pressure_monitor', 'glucose_meter', 'medication', 'surgical_supplies', 'ppe', 'other'],
            equipment_categories: ['equipment', 'medication', 'supplies'],
            condition_status: ['new', 'like_new', 'good', 'fair', 'for_parts'],
            // Feature 4 enums
            guide_categories: ['first_aid', 'chronic_illness', 'nutrition', 'maternal_care', 'child_health', 'mental_health', 'hygiene', 'emergency', 'medication', 'other'],
            alert_types: ['disease_outbreak', 'air_quality', 'water_safety', 'urgent_medical', 'vaccination', 'emergency', 'general'],
            alert_severity: ['info', 'warning', 'critical', 'emergency'],
            workshop_types: ['webinar', 'in_person', 'hybrid'],
            workshop_status: ['upcoming', 'ongoing', 'completed', 'cancelled']
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════════╗`);
    console.log(`║     HealthPal API Server                   ║`);
    console.log(`║     Remote Medical Consultations           ║`);
    console.log(`╠════════════════════════════════════════════╣`);
    console.log(`║  Server running on: http://localhost:${PORT}  ║`);
    console.log(`║  API Docs: http://localhost:${PORT}/api       ║`);
    console.log(`╚════════════════════════════════════════════╝\n`);
});

module.exports = app;
