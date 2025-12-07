const express = require('express');
require('dotenv').config();

const patientsRouter = require('./routes/patients');
const doctorsRouter = require('./routes/doctors');
const consultationsRouter = require('./routes/consultations');
const messagesRouter = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/patients', patientsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/consultations', consultationsRouter);
app.use('/api/messages', messagesRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'HealthPal API is running' });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'HealthPal API',
        version: '1.0.0',
        description: 'Remote Medical Consultations API',
        endpoints: {
            patients: {
                'GET /api/patients': 'List all patients',
                'GET /api/patients/:id': 'Get patient by ID',
                'POST /api/patients': 'Create new patient',
                'PUT /api/patients/:id': 'Update patient',
                'DELETE /api/patients/:id': 'Delete patient'
            },
            doctors: {
                'GET /api/doctors': 'List all doctors',
                'GET /api/doctors/available': 'List available doctors',
                'GET /api/doctors/specialty/:specialty': 'List doctors by specialty',
                'GET /api/doctors/:id': 'Get doctor by ID',
                'POST /api/doctors': 'Create new doctor',
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
                'POST /api/messages': 'Send message',
                'PATCH /api/messages/read/:consultationId': 'Mark messages as read',
                'GET /api/messages/unread/:consultationId/:readerType': 'Get unread count'
            }
        },
        specialties: [
            'general_practice', 'pediatrics', 'mental_health', 
            'internal_medicine', 'surgery', 'dermatology', 
            'cardiology', 'neurology'
        ],
        consultation_types: ['video', 'audio', 'message']
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
