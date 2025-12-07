# HealthPal - Remote Medical Consultations Platform

A digital healthcare platform designed to provide Palestinians with access to medical support and remote consultations.

## Features

- **Virtual Clinic Access**: Book online consultations with local or international doctors
- **Multiple Specialties**: General practice, pediatrics, mental health, internal medicine, surgery, dermatology, cardiology, neurology
- **Low-Bandwidth Mode**: Supports audio-only calls and asynchronous messaging
- **Medical Translation**: Integrated translation support (Arabic ↔ English)

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (XAMPP recommended)
- npm

## Installation

1. **Install dependencies:**
   ```bash
   cd c:\xampp\htdocs\healthcaree
   npm install
   ```

2. **Configure database:**
   - Make sure MySQL is running (start XAMPP MySQL)
   - Edit `.env` file if needed (default uses root with no password)

3. **Setup database:**
   ```bash
   npm run setup-db
   ```

## Running the Application

### Start the API Server
```bash
npm run server
```
The API will be available at `http://localhost:3000`

### Start the CLI Interface
In a new terminal:
```bash
npm run cli
```

## API Endpoints

### Patients
- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Doctors
- `GET /api/doctors` - List all doctors
- `GET /api/doctors/available` - List available doctors
- `GET /api/doctors/specialty/:specialty` - List doctors by specialty
- `PATCH /api/doctors/:id/availability` - Update doctor availability

### Consultations
- `GET /api/consultations` - List all consultations
- `POST /api/consultations` - Book new consultation
- `PATCH /api/consultations/:id/status` - Update status
- `PATCH /api/consultations/:id/diagnosis` - Add diagnosis/prescription

### Messages (Async Consultations)
- `GET /api/messages/consultation/:id` - Get messages
- `POST /api/messages` - Send message

## Specialties Available
- general_practice
- pediatrics
- mental_health
- internal_medicine
- surgery
- dermatology
- cardiology
- neurology

## Consultation Types
- **video** - Video call (requires good internet)
- **audio** - Audio only (low-bandwidth mode)
- **message** - Asynchronous messaging

## Sample Data

The database setup includes sample doctors and patients for testing:

### Doctors
1. Dr. Ahmad Hassan - General Practice (Arabic, English)
2. Dr. Sarah Miller - Pediatrics (English) - International
3. Dr. Fatima Al-Masri - Mental Health (Arabic, English)
4. Dr. James Wilson - Internal Medicine (English) - International
5. Dr. Layla Nasser - Pediatrics (Arabic)

### Patients
1. Mohammed Ali
2. Amira Khalil
3. Omar Saeed

## License

ISC
