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

### 📚 Feature 4: Health Education & Public Health Alerts
- **Localized Health Guides**: Simple, visual guides in Arabic on first aid, chronic illness management, nutrition, maternal care, etc.
- **Public Health Alerts**: Real-time updates about disease outbreaks, air quality, water safety, or urgent medical needs
- **Workshops & Webinars**: Community health awareness sessions online (webinars) or in local centers (in-person/hybrid)
- **Bilingual Content**: All content available in Arabic and English
- **Workshop Registration**: Users can register for upcoming workshops and receive materials

### 🧠 Feature 5: Mental Health & Trauma Support
- **Trauma Counseling Portal**: Dedicated section for PTSD, grief, anxiety, depression, and stress counseling, especially for children and war survivors
- **Support Groups**: Moderated online spaces for patients and families to talk about chronic illness, disability, grief, or war trauma
- **Anonymous Therapy Chat**: Accessible one-on-one mental health help without stigma - patients get an anonymous ID
- **Crisis Priority System**: Urgent/crisis cases are prioritized and escalated to senior counselors
- **Session Types**: Video, audio, chat, or in-person counseling options
- **Target Groups**: Adults, children, families, and war survivors
- **Bilingual Support**: All mental health services available in Arabic and English

### 🤝 Feature 6: Partnerships with NGOs & Medical Missions
- **Verified NGO Network**: Integration with medical NGOs doing fieldwork, mobile clinics, and aid drops
- **Mission Scheduling**: International volunteer doctors can list availability; locals can request appointments in advance
- **Surgical Missions Tracker**: Notify communities about upcoming surgery camps and specialist visits
- **Volunteer Doctor Registry**: International doctors can register and specify their availability periods
- **Mission Appointments**: Patients can book appointments for medical missions with queue management
- **Surgery Camp Registration**: Patients can register for surgical camps with screening and scheduling
- **Community Notifications**: Real-time alerts about new missions, surgery camps, and specialist visits
- **Bilingual Support**: All partnership features available in Arabic and English

## Architecture

### Layered MVC Architecture
- **Presentation Layer**: Express.js routes (thin controllers)
- **Service Layer**: Business logic and validation
- **Repository Layer**: Data access abstraction (SQL queries)
- **Middleware Layer**: JWT authentication and authorization

### Authentication & Security
- **JWT Tokens**: Access tokens (1 hour) and refresh tokens (7 days)
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access**: Patient, Doctor, NGO, Admin roles
- **Protected Routes**: Middleware-based authentication

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (XAMPP recommended)
- npm



## API Endpoints

### Authentication (JWT)
- `POST /api/auth/login` - Login (returns JWT tokens) - Body: `{ username, password, userType }`
- `POST /api/auth/register/patient` - Register patient - Returns JWT tokens
- `POST /api/auth/register/doctor` - Register doctor - Returns JWT tokens
- `POST /api/auth/refresh` - Refresh access token - Body: `{ refreshToken }`
- `GET /api/auth/me` - Get current user (protected)

### Patients
- `POST /api/patients` - Register new patient
- `POST /api/patients/login` - Patient login (legacy - use /api/auth/login)
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient

### Doctors
- `POST /api/doctors` - Register new doctor
- `POST /api/doctors/login` - Doctor login (returns JWT) 
- `GET /api/doctors` - List all doctors (public)
- `GET /api/doctors/available` - List available doctors (public)
- `GET /api/doctors/specialty/:specialty` - List doctors by specialty (public)
- `GET /api/doctors/:id` - Get doctor by ID (public)
- `PATCH /api/doctors/:id/availability` - Update availability (protected - owner only)
- `PUT /api/doctors/:id` - Update doctor (protected - owner or admin)
- `DELETE /api/doctors/:id` - Delete doctor (protected - admin only)

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

### Health Guides
- `GET /api/guides` - Get all health guides
- `GET /api/guides/category/:category` - Get guides by category
- `GET /api/guides/search/:query` - Search guides
- `GET /api/guides/:id` - Get guide details
- `GET /api/guides/stats/popular` - Get popular guides
- `GET /api/guides/stats/categories` - Get categories with count
- `POST /api/guides` - Create new guide
- `PUT /api/guides/:id` - Update guide
- `DELETE /api/guides/:id` - Delete guide

### Public Health Alerts
- `GET /api/alerts` - Get all active alerts
- `GET /api/alerts/type/:type` - Get alerts by type
- `GET /api/alerts/severity/:severity` - Get alerts by severity
- `GET /api/alerts/urgent` - Get emergency/critical alerts
- `GET /api/alerts/area/:area` - Get alerts by area
- `GET /api/alerts/:id` - Get alert details
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id` - Update alert
- `PATCH /api/alerts/:id/deactivate` - Deactivate alert
- `DELETE /api/alerts/:id` - Delete alert

### Workshops
- `GET /api/workshops` - Get upcoming workshops
- `GET /api/workshops/type/:type` - Get workshops by type (webinar, in_person, hybrid)
- `GET /api/workshops/category/:category` - Get workshops by category
- `GET /api/workshops/archive/completed` - Get completed workshops with recordings
- `GET /api/workshops/:id` - Get workshop details
- `GET /api/workshops/:id/registrations` - Get workshop registrations
- `POST /api/workshops` - Create new workshop
- `POST /api/workshops/:id/register` - Register for workshop
- `PUT /api/workshops/:id` - Update workshop
- `PATCH /api/workshops/:id/status` - Update workshop status
- `DELETE /api/workshops/:id` - Delete workshop
- `DELETE /api/workshops/:id/register/:registrationId` - Cancel registration
- `PATCH /api/workshops/registrations/:registrationId/attend` - Mark attendance
- `PATCH /api/workshops/registrations/:registrationId/feedback` - Submit feedback

### Mental Health & Trauma Support
- `GET /api/mental-health/counselors` - Get available mental health counselors
- `POST /api/mental-health/counseling/request` - Request trauma counseling session
- `GET /api/mental-health/counseling/patient/:patientId` - Get patient's counseling sessions
- `GET /api/mental-health/counseling/counselor/:counselorId` - Get counselor's sessions
- `PATCH /api/mental-health/counseling/:sessionId` - Update counseling session
- `GET /api/mental-health/support-groups` - Get all support groups
- `GET /api/mental-health/support-groups/:groupId` - Get support group details
- `POST /api/mental-health/support-groups` - Create support group
- `POST /api/mental-health/support-groups/:groupId/join` - Join support group
- `GET /api/mental-health/support-groups/:groupId/messages` - Get group messages
- `POST /api/mental-health/support-groups/:groupId/messages` - Post message to group
- `GET /api/mental-health/support-groups/member/:memberType/:memberId` - Get user's groups
- `POST /api/mental-health/anonymous-chat/start` - Start anonymous therapy chat
- `GET /api/mental-health/anonymous-chat/waiting` - Get waiting chats (for counselors)
- `POST /api/mental-health/anonymous-chat/:chatId/accept` - Accept anonymous chat
- `GET /api/mental-health/anonymous-chat/:chatId/messages` - Get chat messages
- `POST /api/mental-health/anonymous-chat/:chatId/messages` - Send chat message
- `POST /api/mental-health/anonymous-chat/:chatId/close` - Close chat session
- `POST /api/mental-health/anonymous-chat/:chatId/escalate` - Escalate to crisis level
- `GET /api/mental-health/anonymous-chat/patient/:patientId` - Get patient's chats
- `GET /api/mental-health/anonymous-chat/counselor/:counselorId` - Get counselor's active chats

### NGO Partnerships & Medical Missions
#### Verified NGO Network
- `GET /api/partnerships/ngos` - List all verified NGOs
- `GET /api/partnerships/ngos/:ngoId` - Get NGO by ID
- `POST /api/partnerships/ngos` - Register new NGO
- `PATCH /api/partnerships/ngos/:ngoId/verify` - Verify NGO (admin)
- `GET /api/partnerships/ngos/:ngoId/missions` - Get NGO's missions

#### Medical Missions
- `GET /api/partnerships/missions` - List upcoming missions
- `GET /api/partnerships/missions/:missionId` - Get mission details
- `POST /api/partnerships/missions` - Create new mission
- `PATCH /api/partnerships/missions/:missionId/status` - Update mission status
- `POST /api/partnerships/missions/:missionId/appointments` - Book appointment
- `GET /api/partnerships/missions/:missionId/appointments` - Get mission appointments

#### Volunteer Doctors
- `GET /api/partnerships/volunteer-doctors` - List volunteer doctors
- `GET /api/partnerships/volunteer-doctors/:doctorId` - Get volunteer doctor details
- `POST /api/partnerships/volunteer-doctors` - Register volunteer doctor
- `PATCH /api/partnerships/volunteer-doctors/:doctorId/availability` - Update availability

#### Mission Appointments
- `GET /api/partnerships/appointments/patient/:patientId` - Get patient appointments
- `PATCH /api/partnerships/appointments/:appointmentId` - Update appointment
- `PATCH /api/partnerships/appointments/:appointmentId/feedback` - Submit feedback

#### Surgical Camps
- `GET /api/partnerships/surgical-camps` - List surgical camps
- `GET /api/partnerships/surgical-camps/:campId` - Get camp details
- `POST /api/partnerships/surgical-camps` - Create surgical camp
- `POST /api/partnerships/surgical-camps/:campId/register` - Register for surgery
- `GET /api/partnerships/surgical-camps/:campId/registrations` - Get registrations
- `PATCH /api/partnerships/surgical-camps/registrations/:registrationId` - Update registration
- `GET /api/partnerships/surgical-camps/patient/:patientId/registrations` - Get patient registrations

#### Community Notifications
- `GET /api/partnerships/notifications` - Get active notifications
- `POST /api/partnerships/notifications` - Create notification
- `PATCH /api/partnerships/notifications/:notificationId/deactivate` - Deactivate notification

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

## Health Guide Categories
- First Aid
- Chronic Illness
- Nutrition
- Maternal Care
- Child Health
- Mental Health
- Hygiene
- Emergency
- Medication

## Alert Types
- Disease Outbreak
- Air Quality
- Water Safety
- Urgent Medical
- Vaccination
- Emergency
- General

## Alert Severity Levels
- **info** - Informational
- **warning** - Warning
- **critical** - Critical
- **emergency** - Emergency

## Workshop Types
- **webinar** - Online only
- **in_person** - Physical location
- **hybrid** - Both online and in-person

## Counseling Session Types
- PTSD (Post-Traumatic Stress)
- Grief Counseling
- Anxiety
- Depression
- War Trauma
- Child Trauma
- Family Support
- General Mental Health

## Support Group Types
- Chronic Illness
- Disability
- Grief & Loss
- War Trauma
- Caregiver Support
- Mental Health
- Parent Support
- General

## Target Groups (Counseling)
- **adult** - Adult patients
- **child** - Children (with parent/guardian)
- **family** - Family counseling sessions
- **war_survivor** - War trauma survivors

## Anonymous Chat Priorities
- **normal** - Standard priority
- **urgent** - Needs help soon
- **crisis** - Immediate help needed (escalated)

## NGO Types
- Medical NGO
- Humanitarian
- Relief
- Development
- International
- Local

## Mission Types
- Mobile Clinic
- Surgery Camp
- Vaccination Drive
- Specialist Visit
- Aid Distribution
- Training
- General Outreach

## Surgery Types
- General
- Orthopedic
- Cardiac
- Ophthalmology
- Pediatric
- Reconstructive
- Emergency
- Dental

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Architecture**: Layered MVC (Repository + Service patterns)
- **CLI**: Node.js readline

## Project Structure
```
src/
├── middleware/          # Authentication & authorization
├── repositories/        # Data access layer (SQL queries)
├── services/           # Business logic layer
├── routes/             # API endpoints (controllers)
├── config/             # Database configuration
└── database/           # Database setup & migrations
```

## License

ISC
