# HealthPal - Remote Medical Consultations & Sponsorship Platform

A digital healthcare platform designed to provide Palestinians with access to medical support, remote consultations, and medical sponsorship system.

## Features

### 🏥 Feature 1: Virtual Clinic Access
- Book online consultations with local or international doctors
- Multiple specialties support
- Low-bandwidth mode (audio-only calls and asynchronous messaging)
- Medical translation support (Arabic ↔ English)

### 💝 Feature 2: Medical Sponsorship System
- **Sponsor a Treatment**: Donors can fund specific medical needs (surgeries, cancer treatments, dialysis, physical rehabilitation)
- **Patient Profiles**: Verified cases with full medical history (with consent), donation goals, and recovery updates
- **Transparency Dashboard**: Shows where donor money went — invoices, receipts, and patient feedback

### 🚚 Feature 3: Medication & Equipment Coordination
- **Volunteer/NGO Registration**: Organizations and individuals can register to help deliver medications
- **Medication Requests**: Patients can request medications with urgency levels (critical, high, medium, low)
- **Delivery Tracking**: Real-time status updates from pending → accepted → in_progress → delivered
- **Equipment Inventory**: Volunteers/donors can list available medical equipment (wheelchairs, oxygen tanks, etc.)
- **Equipment Requests**: Patients can request medical equipment with delivery coordination
- **Rating System**: Patients can rate and provide feedback on deliveries

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (XAMPP recommended)
- npm

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ZaidAbuSamraa/healthcare.git
   cd healthcare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure database:**
   - Make sure MySQL is running (start XAMPP MySQL)
   - Create `.env` file with your database credentials:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=healthpal
     ```

4. **Setup database:**
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
- `POST /api/patients` - Register new patient
- `POST /api/patients/login` - Patient login
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient

### Doctors
- `POST /api/doctors` - Register new doctor
- `POST /api/doctors/login` - Doctor login
- `GET /api/doctors` - List all doctors
- `GET /api/doctors/available` - List available doctors
- `GET /api/doctors/specialty/:specialty` - List doctors by specialty
- `PATCH /api/doctors/:id/availability` - Update doctor availability

### Consultations
- `GET /api/consultations` - List all consultations
- `POST /api/consultations` - Book new consultation
- `PATCH /api/consultations/:id/status` - Update status
- `PATCH /api/consultations/:id/diagnosis` - Add diagnosis/prescription

### Messages
- `GET /api/messages/consultation/:id` - Get messages
- `POST /api/messages` - Send message

### Donors
- `POST /api/donors` - Register new donor
- `POST /api/donors/login` - Donor login
- `GET /api/donors/:id` - Get donor profile
- `GET /api/donors/:id/donations` - Get donor's donation history

### Medical Cases
- `GET /api/cases` - List all active cases
- `GET /api/cases/:id` - Get case details with patient profile
- `POST /api/cases` - Create new medical case (patient)
- `GET /api/cases/patient/:id` - Get patient's cases
- `GET /api/cases/:id/updates` - Get case recovery updates
- `POST /api/cases/:id/updates` - Add case update
- `GET /api/cases/:id/invoices` - Get case invoices

### Donations
- `POST /api/donations` - Make a donation
- `GET /api/donations` - List all donations
- `GET /api/donations/recent` - Get recent donations

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/category/:category` - Get invoices by category

### Volunteers
- `POST /api/volunteers` - Register new volunteer/NGO
- `POST /api/volunteers/login` - Volunteer login
- `GET /api/volunteers` - Get all available volunteers
- `GET /api/volunteers/:id` - Get volunteer by ID
- `GET /api/volunteers/:id/deliveries` - Get volunteer's delivery history
- `PATCH /api/volunteers/:id/availability` - Update volunteer availability
- `GET /api/volunteers/type/:type` - Get volunteers by organization type

### Medication Requests
- `GET /api/medications` - Get all pending medication requests
- `GET /api/medications/pending` - Get pending requests only
- `GET /api/medications/urgent` - Get urgent requests (critical and high)
- `GET /api/medications/:id` - Get request by ID
- `GET /api/medications/patient/:patientId` - Get patient's medication requests
- `POST /api/medications` - Create new medication request
- `PATCH /api/medications/:id/accept` - Accept medication request (by volunteer)
- `PATCH /api/medications/:id/status` - Update request status
- `DELETE /api/medications/:id` - Cancel request (by patient)
- `GET /api/medications/volunteer/:volunteerId` - Get volunteer's accepted requests
- `POST /api/medications/:id/deliver` - Start delivery
- `GET /api/medications/:id/delivery` - Get delivery status
- `PATCH /api/medications/delivery/:deliveryId` - Update delivery status
- `PATCH /api/medications/delivery/:deliveryId/confirm` - Confirm delivery and rate

### Equipment
- `GET /api/equipment` - Get all available equipment
- `GET /api/equipment/type/:type` - Get equipment by type
- `GET /api/equipment/category/:category` - Get equipment by category
- `GET /api/equipment/search/:query` - Search equipment
- `GET /api/equipment/:id` - Get equipment by ID
- `POST /api/equipment` - List new equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment listing
- `GET /api/equipment/volunteer/:volunteerId` - Get volunteer's listed equipment
- `GET /api/equipment/donor/:donorId` - Get donor's listed equipment
- `POST /api/equipment/request` - Request equipment (by patient)
- `GET /api/equipment/requests/patient/:patientId` - Get patient's equipment requests
- `GET /api/equipment/requests/pending` - Get pending equipment requests
- `PATCH /api/equipment/requests/:id/fulfill` - Fulfill equipment request
- `GET /api/equipment/stats/summary` - Get inventory statistics

## Specialties Available
- General Practice
- Pediatrics
- Mental Health
- Internal Medicine
- Surgery
- Dermatology
- Cardiology
- Neurology

## Treatment Types (Sponsorship)
- Surgery
- Cancer Treatment
- Dialysis
- Physical Rehabilitation
- Medication
- Other

## Consultation Types
- **video** - Video call (requires good internet)
- **audio** - Audio only (low-bandwidth mode)
- **message** - Asynchronous messaging

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **CLI**: Node.js readline

## License

ISC
