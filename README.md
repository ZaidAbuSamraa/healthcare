<div align="center">

# 🏥 HealthPal

### Remote Medical Consultations & Sponsorship Platform

*A comprehensive digital healthcare platform designed to provide Palestinians with access to medical support, remote consultations, and medical sponsorship system.*

**Developed by: Zaid Abu Samra (ID: 12113004)**

[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [API Documentation](#-api-documentation) • [Architecture](#-architecture)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
  - [Virtual Clinic Access](#1-virtual-clinic-access)
  - [Medical Sponsorship System](#2-medical-sponsorship-system)
  - [Medication & Equipment Coordination](#3-medication--equipment-coordination)
  - [Health Education & Public Health Alerts](#4-health-education--public-health-alerts)
  - [Mental Health & Trauma Support](#5-mental-health--trauma-support)
  - [NGO Partnerships & Medical Missions](#6-ngo-partnerships--medical-missions)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
-

---

## 🌟 Overview

HealthPal is a digital healthcare platform that bridges the gap between medical professionals, patients, and donors. Built with a focus on accessibility and transparency, it provides:

- 🏥 **Remote Medical Consultations** with local and international doctors
- 💝 **Transparent Sponsorship System** for medical treatments
- 🚚 **Medication & Equipment Delivery** coordination
- 📚 **Health Education** resources in multiple languages
- 🧠 **Mental Health Support** for trauma and crisis situations
- 🤝 **NGO Integration** for medical missions and surgical camps

---

## ✨ Features

### 1. Virtual Clinic Access

<details>
<summary><b>🏥 Online Medical Consultations</b></summary>

- **Multi-Specialty Support**: Access to various medical specialties
- **Flexible Consultation Modes**:
  - 📹 Video calls (high-bandwidth)
  - 🎙️ Audio-only calls (low-bandwidth mode)
  - 💬 Asynchronous messaging
- **Translation Services**: Arabic ↔ English medical translation
- **Doctor Availability**: Real-time availability tracking

</details>

### 2. Medical Sponsorship System

<details>
<summary><b>💝 Transparent Funding for Medical Treatments</b></summary>

#### For Donors
- **Sponsor Specific Treatments**: Fund surgeries, cancer treatments, dialysis, rehabilitation
- **Transparency Dashboard**: View invoices, receipts, and patient feedback
- **Donation History**: Track all contributions and their impact

#### For Patients
- **Verified Medical Cases**: Create detailed case profiles with medical history
- **Donation Goals**: Set and track funding targets
- **Recovery Updates**: Share progress with donors

</details>

### 3. Medication & Equipment Coordination

<details>
<summary><b>🚚 Community-Driven Medical Supply Network</b></summary>

#### Medication Delivery
- **Request System**: Patients can request medications with urgency levels
  - 🔴 Critical
  - 🟠 High
  - 🟡 Medium
  - 🟢 Low
- **Volunteer Network**: NGOs and individuals coordinate deliveries
- **Real-time Tracking**: Status updates from pending → delivered
- **Rating System**: Quality assurance through patient feedback

#### Medical Equipment
- **Equipment Inventory**: Wheelchairs, oxygen tanks, and more
- **Request & Fulfill**: Patients request, volunteers/donors provide
- **Delivery Coordination**: Organized pickup and delivery

</details>

### 4. Health Education & Public Health Alerts

<details>
<summary><b>📚 Localized Health Information & Community Awareness</b></summary>

#### Health Guides
- **Categories**: First aid, chronic illness, nutrition, maternal care, child health
- **Bilingual Content**: Available in Arabic and English
- **Visual Guides**: Simple, accessible format

#### Public Health Alerts
- **Real-time Updates**: Disease outbreaks, air quality, water safety
- **Severity Levels**: Info, Warning, Critical, Emergency
- **Area-Specific**: Location-based alert filtering

#### Workshops & Webinars
- **Online & In-Person**: Flexible attendance options
- **Registration System**: Easy sign-up and material distribution
- **Archive Access**: Recordings of past sessions

</details>

### 5. Mental Health & Trauma Support

<details>
<summary><b>🧠 Comprehensive Mental Health Services</b></summary>

#### Trauma Counseling
- **Specialized Support**: PTSD, grief, anxiety, depression, war trauma
- **Session Types**: Video, audio, chat, or in-person
- **Target Groups**: Adults, children, families, war survivors
- **Crisis Priority**: Urgent cases escalated to senior counselors

#### Support Groups
- **Moderated Spaces**: Safe communities for shared experiences
- **Topics**: Chronic illness, disability, grief, war trauma, caregiver support
- **Anonymous Participation**: Privacy-focused design

#### Anonymous Therapy Chat
- **Stigma-Free Access**: Anonymous ID system
- **One-on-One Sessions**: Private counseling
- **Crisis Escalation**: Immediate help for emergencies

</details>

### 6. NGO Partnerships & Medical Missions

<details>
<summary><b>🤝 Coordinated Medical Outreach Programs</b></summary>

#### Verified NGO Network
- **Organization Registry**: Medical NGOs, humanitarian groups, relief organizations
- **Verification System**: Admin-approved partnerships
- **Mission Coordination**: Fieldwork, mobile clinics, aid distribution

#### Medical Missions
- **Mission Types**: Mobile clinics, vaccination drives, specialist visits
- **Appointment Booking**: Queue management for mission visits
- **Community Notifications**: Real-time alerts about upcoming missions

#### Surgical Camps
- **Camp Registration**: Patient screening and scheduling
- **Surgery Types**: General, orthopedic, cardiac, ophthalmology, pediatric, reconstructive
- **Volunteer Doctors**: International medical professionals

</details>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v14 or higher
- **MySQL Server** (XAMPP recommended)
- **npm** package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/healthcaree.git

# Navigate to project directory
cd healthcaree

# Install dependencies
npm install

# Set up database
# Import the database schema from src/database/

# Start the server
npm start
```

---

## 🏗️ Architecture

### Layered MVC Architecture

```
┌─────────────────────────────────────┐
│     Presentation Layer (Routes)     │  ← Express.js Controllers
├─────────────────────────────────────┤
│      Service Layer (Business)       │  ← Business Logic & Validation
├─────────────────────────────────────┤
│   Repository Layer (Data Access)    │  ← SQL Queries & Abstractions
├─────────────────────────────────────┤
│         Database (MySQL)            │  ← Data Storage
└─────────────────────────────────────┘
```

### Security & Authentication

| Feature | Implementation |
|---------|---------------|
| **Authentication** | JWT (JSON Web Tokens) |
| **Access Tokens** | 1 hour expiration |
| **Refresh Tokens** | 7 days expiration |
| **Password Security** | bcrypt hashing |
| **Authorization** | Role-based access control |
| **Roles** | Patient, Doctor, NGO, Admin |



---

## 📚 API Documentation

### 🔐 Authentication & Authorization

<details>
<summary><b>Authentication Endpoints</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/login` | Login with credentials | ❌ |
| `POST` | `/api/auth/register/patient` | Register new patient | ❌ |
| `POST` | `/api/auth/register/doctor` | Register new doctor | ❌ |
| `POST` | `/api/auth/refresh` | Refresh access token | ❌ |
| `GET` | `/api/auth/me` | Get current user info | ✅ |

**Login Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "userType": "patient|doctor|donor|volunteer|ngo"
}
```

</details>

### 👥 User Management

<details>
<summary><b>Patients</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/patients` | Register new patient | ❌ |
| `GET` | `/api/patients/:id` | Get patient by ID | ✅ |
| `PUT` | `/api/patients/:id` | Update patient profile | ✅ Owner |

</details>

<details>
<summary><b>Doctors</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/doctors` | List all doctors | ❌ |
| `GET` | `/api/doctors/available` | List available doctors | ❌ |
| `GET` | `/api/doctors/specialty/:specialty` | Filter by specialty | ❌ |
| `GET` | `/api/doctors/:id` | Get doctor details | ❌ |
| `PATCH` | `/api/doctors/:id/availability` | Update availability | ✅ Owner |
| `PUT` | `/api/doctors/:id` | Update profile | ✅ Owner/Admin |
| `DELETE` | `/api/doctors/:id` | Delete doctor | ✅ Admin |

</details>

<details>
<summary><b>Donors</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/donors` | Register new donor | ❌ |
| `POST` | `/api/donors/login` | Donor login | ❌ |
| `GET` | `/api/donors/:id` | Get donor profile | ✅ |
| `GET` | `/api/donors/:id/donations` | Get donation history | ✅ Owner |

</details>

<details>
<summary><b>Volunteers & NGOs</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/volunteers` | Register volunteer/NGO | ❌ |
| `POST` | `/api/volunteers/login` | Volunteer login | ❌ |
| `GET` | `/api/volunteers` | List available volunteers | ❌ |
| `GET` | `/api/volunteers/:id` | Get volunteer details | ❌ |
| `GET` | `/api/volunteers/:id/deliveries` | Get delivery history | ✅ Owner |
| `PATCH` | `/api/volunteers/:id/availability` | Update availability | ✅ Owner |
| `GET` | `/api/volunteers/type/:type` | Filter by organization type | ❌ |

</details>

### 🏥 Medical Services

<details>
<summary><b>Consultations</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/consultations` | List consultations | ✅ |
| `POST` | `/api/consultations` | Book consultation | ✅ Patient |
| `PATCH` | `/api/consultations/:id/status` | Update status | ✅ Doctor |
| `PATCH` | `/api/consultations/:id/diagnosis` | Add diagnosis | ✅ Doctor |

</details>

<details>
<summary><b>Messages</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/messages/consultation/:id` | Get consultation messages | ✅ |
| `POST` | `/api/messages` | Send message | ✅ |

</details>

### 💝 Sponsorship System

<details>
<summary><b>Medical Cases</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/cases` | List active cases | ❌ |
| `GET` | `/api/cases/:id` | Get case details | ❌ |
| `POST` | `/api/cases` | Create medical case | ✅ Patient |
| `GET` | `/api/cases/patient/:id` | Get patient's cases | ✅ |
| `GET` | `/api/cases/:id/updates` | Get recovery updates | ❌ |
| `POST` | `/api/cases/:id/updates` | Add case update | ✅ Patient |
| `GET` | `/api/cases/:id/invoices` | Get case invoices | ✅ |

</details>

<details>
<summary><b>Donations & Invoices</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/donations` | Make donation | ✅ Donor |
| `GET` | `/api/donations` | List all donations | ✅ Admin |
| `GET` | `/api/donations/recent` | Get recent donations | ❌ |
| `GET` | `/api/invoices` | List invoices | ✅ Admin |
| `POST` | `/api/invoices` | Create invoice | ✅ Admin |
| `GET` | `/api/invoices/category/:category` | Filter by category | ✅ |

</details>

### 🚚 Medication & Equipment

<details>
<summary><b>Medication Requests</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/medications` | Get all requests | ✅ Volunteer |
| `GET` | `/api/medications/pending` | Get pending requests | ✅ Volunteer |
| `GET` | `/api/medications/urgent` | Get urgent requests | ✅ Volunteer |
| `GET` | `/api/medications/:id` | Get request details | ✅ |
| `GET` | `/api/medications/patient/:patientId` | Get patient's requests | ✅ Patient |
| `POST` | `/api/medications` | Create request | ✅ Patient |
| `PATCH` | `/api/medications/:id/accept` | Accept request | ✅ Volunteer |
| `PATCH` | `/api/medications/:id/status` | Update status | ✅ |
| `DELETE` | `/api/medications/:id` | Cancel request | ✅ Patient |
| `POST` | `/api/medications/:id/deliver` | Start delivery | ✅ Volunteer |
| `GET` | `/api/medications/:id/delivery` | Get delivery status | ✅ |
| `PATCH` | `/api/medications/delivery/:deliveryId` | Update delivery | ✅ Volunteer |
| `PATCH` | `/api/medications/delivery/:deliveryId/confirm` | Confirm & rate | ✅ Patient |

</details>

<details>
<summary><b>Medical Equipment</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/equipment` | List available equipment | ❌ |
| `GET` | `/api/equipment/type/:type` | Filter by type | ❌ |
| `GET` | `/api/equipment/category/:category` | Filter by category | ❌ |
| `GET` | `/api/equipment/search/:query` | Search equipment | ❌ |
| `GET` | `/api/equipment/:id` | Get equipment details | ❌ |
| `POST` | `/api/equipment` | List new equipment | ✅ Volunteer/Donor |
| `PUT` | `/api/equipment/:id` | Update equipment | ✅ Owner |
| `DELETE` | `/api/equipment/:id` | Delete listing | ✅ Owner |
| `POST` | `/api/equipment/request` | Request equipment | ✅ Patient |
| `GET` | `/api/equipment/requests/pending` | Get pending requests | ✅ Volunteer |
| `PATCH` | `/api/equipment/requests/:id/fulfill` | Fulfill request | ✅ Volunteer |
| `GET` | `/api/equipment/stats/summary` | Get statistics | ✅ Admin |

</details>

### 📚 Health Education

<details>
<summary><b>Health Guides</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/guides` | List all guides | ❌ |
| `GET` | `/api/guides/category/:category` | Filter by category | ❌ |
| `GET` | `/api/guides/search/:query` | Search guides | ❌ |
| `GET` | `/api/guides/:id` | Get guide details | ❌ |
| `GET` | `/api/guides/stats/popular` | Get popular guides | ❌ |
| `POST` | `/api/guides` | Create guide | ✅ Admin |
| `PUT` | `/api/guides/:id` | Update guide | ✅ Admin |
| `DELETE` | `/api/guides/:id` | Delete guide | ✅ Admin |

</details>

<details>
<summary><b>Public Health Alerts</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/alerts` | Get active alerts | ❌ |
| `GET` | `/api/alerts/type/:type` | Filter by type | ❌ |
| `GET` | `/api/alerts/severity/:severity` | Filter by severity | ❌ |
| `GET` | `/api/alerts/urgent` | Get emergency alerts | ❌ |
| `GET` | `/api/alerts/area/:area` | Filter by area | ❌ |
| `POST` | `/api/alerts` | Create alert | ✅ Admin |
| `PUT` | `/api/alerts/:id` | Update alert | ✅ Admin |
| `PATCH` | `/api/alerts/:id/deactivate` | Deactivate alert | ✅ Admin |

</details>

<details>
<summary><b>Workshops & Webinars</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/workshops` | Get upcoming workshops | ❌ |
| `GET` | `/api/workshops/type/:type` | Filter by type | ❌ |
| `GET` | `/api/workshops/category/:category` | Filter by category | ❌ |
| `GET` | `/api/workshops/archive/completed` | Get completed workshops | ❌ |
| `GET` | `/api/workshops/:id` | Get workshop details | ❌ |
| `POST` | `/api/workshops` | Create workshop | ✅ Admin |
| `POST` | `/api/workshops/:id/register` | Register for workshop | ✅ |
| `PUT` | `/api/workshops/:id` | Update workshop | ✅ Admin |
| `DELETE` | `/api/workshops/:id/register/:registrationId` | Cancel registration | ✅ |
| `PATCH` | `/api/workshops/registrations/:registrationId/attend` | Mark attendance | ✅ Admin |
| `PATCH` | `/api/workshops/registrations/:registrationId/feedback` | Submit feedback | ✅ |

</details>

### 🧠 Mental Health Services

<details>
<summary><b>Trauma Counseling</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/mental-health/counselors` | List counselors | ❌ |
| `POST` | `/api/mental-health/counseling/request` | Request session | ✅ Patient |
| `GET` | `/api/mental-health/counseling/patient/:patientId` | Get patient sessions | ✅ Patient |
| `GET` | `/api/mental-health/counseling/counselor/:counselorId` | Get counselor sessions | ✅ Counselor |
| `PATCH` | `/api/mental-health/counseling/:sessionId` | Update session | ✅ Counselor |

</details>

<details>
<summary><b>Support Groups</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/mental-health/support-groups` | List groups | ❌ |
| `GET` | `/api/mental-health/support-groups/:groupId` | Get group details | ✅ Member |
| `POST` | `/api/mental-health/support-groups` | Create group | ✅ Counselor |
| `POST` | `/api/mental-health/support-groups/:groupId/join` | Join group | ✅ |
| `GET` | `/api/mental-health/support-groups/:groupId/messages` | Get messages | ✅ Member |
| `POST` | `/api/mental-health/support-groups/:groupId/messages` | Post message | ✅ Member |

</details>

<details>
<summary><b>Anonymous Therapy Chat</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/mental-health/anonymous-chat/start` | Start chat | ✅ Patient |
| `GET` | `/api/mental-health/anonymous-chat/waiting` | Get waiting chats | ✅ Counselor |
| `POST` | `/api/mental-health/anonymous-chat/:chatId/accept` | Accept chat | ✅ Counselor |
| `GET` | `/api/mental-health/anonymous-chat/:chatId/messages` | Get messages | ✅ |
| `POST` | `/api/mental-health/anonymous-chat/:chatId/messages` | Send message | ✅ |
| `POST` | `/api/mental-health/anonymous-chat/:chatId/close` | Close session | ✅ |
| `POST` | `/api/mental-health/anonymous-chat/:chatId/escalate` | Escalate to crisis | ✅ Counselor |

</details>

### 🤝 NGO Partnerships

<details>
<summary><b>NGO Network & Medical Missions</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/partnerships/ngos` | List verified NGOs | ❌ |
| `GET` | `/api/partnerships/ngos/:ngoId` | Get NGO details | ❌ |
| `POST` | `/api/partnerships/ngos` | Register NGO | ❌ |
| `PATCH` | `/api/partnerships/ngos/:ngoId/verify` | Verify NGO | ✅ Admin |
| `GET` | `/api/partnerships/missions` | List missions | ❌ |
| `GET` | `/api/partnerships/missions/:missionId` | Get mission details | ❌ |
| `POST` | `/api/partnerships/missions` | Create mission | ✅ NGO |
| `POST` | `/api/partnerships/missions/:missionId/appointments` | Book appointment | ✅ Patient |

</details>

<details>
<summary><b>Surgical Camps</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/partnerships/surgical-camps` | List camps | ❌ |
| `GET` | `/api/partnerships/surgical-camps/:campId` | Get camp details | ❌ |
| `POST` | `/api/partnerships/surgical-camps` | Create camp | ✅ NGO |
| `POST` | `/api/partnerships/surgical-camps/:campId/register` | Register for surgery | ✅ Patient |
| `GET` | `/api/partnerships/surgical-camps/:campId/registrations` | Get registrations | ✅ NGO |
| `PATCH` | `/api/partnerships/surgical-camps/registrations/:registrationId` | Update registration | ✅ NGO |

</details>

<details>
<summary><b>Volunteer Doctors & Notifications</b></summary>

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/partnerships/volunteer-doctors` | List volunteer doctors | ❌ |
| `POST` | `/api/partnerships/volunteer-doctors` | Register volunteer | ❌ |
| `PATCH` | `/api/partnerships/volunteer-doctors/:doctorId/availability` | Update availability | ✅ Doctor |
| `GET` | `/api/partnerships/notifications` | Get notifications | ❌ |
| `POST` | `/api/partnerships/notifications` | Create notification | ✅ Admin |
| `PATCH` | `/api/partnerships/notifications/:notificationId/deactivate` | Deactivate | ✅ Admin |

</details>

---

## 📋 Reference Data

### Medical Specialties

<details>
<summary><b>Available Specialties</b></summary>

| Specialty | Description |
|-----------|-------------|
| General Practice | Primary care and general health |
| Pediatrics | Child healthcare |
| Mental Health | Psychological and psychiatric care |
| Internal Medicine | Adult internal organ systems |
| Surgery | Surgical procedures |
| Dermatology | Skin conditions |
| Cardiology | Heart and cardiovascular |
| Neurology | Nervous system disorders |

</details>

### Treatment & Consultation Types

<details>
<summary><b>Sponsorship Treatment Types</b></summary>

- 🏥 **Surgery** - Surgical procedures
- 🎗️ **Cancer Treatment** - Oncology and chemotherapy
- 💉 **Dialysis** - Kidney treatment
- 🦾 **Physical Rehabilitation** - Physical therapy
- 💊 **Medication** - Prescription drugs
- ➕ **Other** - Additional medical needs

</details>

<details>
<summary><b>Consultation Modes</b></summary>

| Type | Description | Bandwidth |
|------|-------------|-----------|
| 📹 **Video** | Video call consultation | High |
| 🎙️ **Audio** | Audio-only call | Low |
| 💬 **Message** | Asynchronous messaging | Minimal |

</details>

### Health Education

<details>
<summary><b>Health Guide Categories</b></summary>

| Category | Focus Area |
|----------|-----------|
| 🚑 First Aid | Emergency response |
| 🏥 Chronic Illness | Long-term condition management |
| 🥗 Nutrition | Diet and healthy eating |
| 🤰 Maternal Care | Pregnancy and childbirth |
| 👶 Child Health | Pediatric care |
| 🧠 Mental Health | Psychological wellbeing |
| 🧼 Hygiene | Sanitation and cleanliness |
| ⚠️ Emergency | Crisis situations |
| 💊 Medication | Drug information |

</details>

<details>
<summary><b>Alert System</b></summary>

**Alert Types:**
- 🦠 Disease Outbreak
- 🌫️ Air Quality
- 💧 Water Safety
- 🚨 Urgent Medical
- 💉 Vaccination
- ⚠️ Emergency
- ℹ️ General

**Severity Levels:**

| Level | Icon | Description |
|-------|------|-------------|
| Info | ℹ️ | Informational updates |
| Warning | ⚠️ | Caution advised |
| Critical | 🔴 | Serious concern |
| Emergency | 🚨 | Immediate action required |

</details>

<details>
<summary><b>Workshop Types</b></summary>

| Type | Format | Location |
|------|--------|----------|
| 🌐 **Webinar** | Online only | Virtual |
| 🏢 **In-Person** | Physical attendance | On-site |
| 🔄 **Hybrid** | Both options | Virtual + On-site |

</details>

### Mental Health Services

<details>
<summary><b>Counseling Session Types</b></summary>

- 💔 **PTSD** - Post-Traumatic Stress Disorder
- 😢 **Grief Counseling** - Loss and bereavement
- 😰 **Anxiety** - Anxiety disorders
- 😔 **Depression** - Depressive disorders
- 💥 **War Trauma** - Conflict-related trauma
- 👧 **Child Trauma** - Pediatric trauma care
- 👨‍👩‍👧 **Family Support** - Family counseling
- 🧠 **General Mental Health** - Overall wellbeing

</details>

<details>
<summary><b>Support Group Categories</b></summary>

| Category | Focus |
|----------|-------|
| Chronic Illness | Long-term health conditions |
| Disability | Physical/mental disabilities |
| Grief & Loss | Bereavement support |
| War Trauma | Conflict survivors |
| Caregiver Support | Family caregivers |
| Mental Health | Psychological support |
| Parent Support | Parenting challenges |
| General | Open discussion |

</details>

<details>
<summary><b>Target Groups & Priorities</b></summary>

**Target Groups:**
- 👨 **Adult** - Adult patients
- 👧 **Child** - Children (with guardian)
- 👨‍👩‍👧 **Family** - Family sessions
- 💥 **War Survivor** - Trauma survivors

**Anonymous Chat Priorities:**

| Priority | Response Time | Description |
|----------|--------------|-------------|
| 🟢 Normal | Standard | Regular support |
| 🟡 Urgent | Soon | Needs help quickly |
| 🔴 Crisis | Immediate | Emergency escalation |

</details>

### NGO & Partnership Types

<details>
<summary><b>Organization & Mission Types</b></summary>

**NGO Types:**
- 🏥 Medical NGO
- 🤝 Humanitarian
- 🆘 Relief
- 📈 Development
- 🌍 International
- 📍 Local

**Mission Types:**
- 🚑 Mobile Clinic
- 🏥 Surgery Camp
- 💉 Vaccination Drive
- 👨‍⚕️ Specialist Visit
- 📦 Aid Distribution
- 📚 Training
- 🤝 General Outreach

**Surgery Types:**
- General, Orthopedic, Cardiac
- Ophthalmology, Pediatric
- Reconstructive, Emergency, Dental

</details>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express.js |
| **Database** | MySQL 8.0+ |
| **Authentication** | JWT (jsonwebtoken) |
| **Security** | bcryptjs |
| **Architecture** | Layered MVC |
| **Patterns** | Repository + Service |

</div>

---

## 📁 Project Structure

```
healthcaree/
│
├── src/
│   ├── middleware/          # 🔒 Authentication & authorization
│   │   └── auth.js          # JWT verification & role checks
│   │
│   ├── repositories/        # 💾 Data access layer
│   │   ├── patientRepo.js
│   │   ├── doctorRepo.js
│   │   ├── donorRepo.js
│   │   └── ...
│   │
│   ├── services/           # 💼 Business logic layer
│   │   ├── authService.js
│   │   ├── consultationService.js
│   │   └── ...
│   │
│   ├── routes/             # 🛣️ API endpoints (controllers)
│   │   ├── auth.js
│   │   ├── patients.js
│   │   ├── doctors.js
│   │   ├── consultations.js
│   │   ├── medical-cases.js
│   │   ├── medications.js
│   │   ├── equipment.js
│   │   ├── health-guides.js
│   │   ├── mental-health.js
│   │   └── partnerships.js
│   │
│   ├── config/             # ⚙️ Configuration
│   │   └── db.js           # Database connection
│   │
│   └── database/           # 🗄️ Database setup
│       └── schema.sql      # Database migrations
│
├── package.json            # 📦 Dependencies
├── server.js              # 🚀 Application entry point
└── README.md              # 📖 Documentation

```

---

<div align="center">



</div>
