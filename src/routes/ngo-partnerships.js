const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ============================================
// VERIFIED NGO NETWORK
// ============================================

// Get all verified NGOs
router.get('/ngos', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const type = req.query.type;
        
        let query = `SELECT id, 
            ${lang === 'ar' ? 'name_ar as name' : 'name'},
            ${lang === 'ar' ? 'description_ar as description' : 'description'},
            email, phone, website, logo_url, organization_type, specializations,
            operating_regions, headquarters_country, is_verified
            FROM ngos WHERE is_active = TRUE AND is_verified = TRUE`;
        
        const params = [];
        if (type) {
            query += ' AND organization_type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY name';
        
        const [ngos] = await pool.query(query, params);
        res.json(ngos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get NGO by ID
router.get('/ngos/:ngoId', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        
        const [ngos] = await pool.query(
            `SELECT id, 
                ${lang === 'ar' ? 'name_ar as name' : 'name'},
                ${lang === 'ar' ? 'description_ar as description' : 'description'},
                email, phone, website, logo_url, organization_type, specializations,
                operating_regions, headquarters_country, is_verified, verification_date
             FROM ngos WHERE id = ? AND is_active = TRUE`,
            [req.params.ngoId]
        );
        
        if (ngos.length === 0) {
            return res.status(404).json({ error: 'NGO not found' });
        }
        
        res.json(ngos[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register new NGO (pending verification)
router.post('/ngos', async (req, res) => {
    try {
        const { username, password, name, name_ar, email, phone, website, description, description_ar, 
                organization_type, specializations, operating_regions, headquarters_country } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO ngos (username, password, name, name_ar, email, phone, website, description, 
             description_ar, organization_type, specializations, operating_regions, headquarters_country)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, password, name, name_ar, email, phone, website, description, description_ar,
             organization_type, specializations, operating_regions, headquarters_country]
        );
        
        res.status(201).json({ 
            message: 'NGO registered successfully. Pending verification.',
            ngo_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify NGO (admin)
router.patch('/ngos/:ngoId/verify', async (req, res) => {
    try {
        const { verified_by } = req.body;
        
        await pool.query(
            `UPDATE ngos SET is_verified = TRUE, verification_date = CURDATE(), verified_by = ? WHERE id = ?`,
            [verified_by, req.params.ngoId]
        );
        
        res.json({ message: 'NGO verified successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get NGO's missions
router.get('/ngos/:ngoId/missions', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        
        const [missions] = await pool.query(
            `SELECT id, 
                ${lang === 'ar' ? 'title_ar as title' : 'title'},
                ${lang === 'ar' ? 'description_ar as description' : 'description'},
                mission_type, specialties_offered, 
                ${lang === 'ar' ? 'target_area_ar as target_area' : 'target_area'},
                start_date, end_date, status, is_free
             FROM medical_missions WHERE ngo_id = ?
             ORDER BY start_date DESC`,
            [req.params.ngoId]
        );
        
        res.json(missions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// MEDICAL MISSIONS (Mission Scheduling)
// ============================================

// Get all upcoming missions
router.get('/missions', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const type = req.query.type;
        const area = req.query.area;
        const status = req.query.status || 'confirmed,planned,ongoing';
        
        let query = `SELECT mm.id, 
            ${lang === 'ar' ? 'mm.title_ar as title' : 'mm.title'},
            ${lang === 'ar' ? 'mm.description_ar as description' : 'mm.description'},
            mm.mission_type, mm.specialties_offered,
            ${lang === 'ar' ? 'mm.target_area_ar as target_area' : 'mm.target_area'},
            mm.location_details, mm.start_date, mm.end_date, mm.daily_start_time, mm.daily_end_time,
            mm.max_patients_per_day, mm.services_provided, mm.status, mm.is_free, mm.registration_required,
            ${lang === 'ar' ? 'n.name_ar as ngo_name' : 'n.name as ngo_name'}, n.logo_url as ngo_logo
            FROM medical_missions mm
            JOIN ngos n ON mm.ngo_id = n.id
            WHERE mm.status IN (${status.split(',').map(() => '?').join(',')})`;
        
        const params = status.split(',');
        
        if (type) {
            query += ' AND mm.mission_type = ?';
            params.push(type);
        }
        if (area) {
            query += ' AND mm.target_area LIKE ?';
            params.push(`%${area}%`);
        }
        
        query += ' ORDER BY mm.start_date ASC';
        
        const [missions] = await pool.query(query, params);
        res.json(missions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get mission by ID
router.get('/missions/:missionId', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        
        const [missions] = await pool.query(
            `SELECT mm.*, 
                ${lang === 'ar' ? 'mm.title_ar as title' : 'mm.title'},
                ${lang === 'ar' ? 'mm.description_ar as description' : 'mm.description'},
                ${lang === 'ar' ? 'mm.target_area_ar as target_area' : 'mm.target_area'},
                ${lang === 'ar' ? 'n.name_ar as ngo_name' : 'n.name as ngo_name'},
                n.phone as ngo_phone, n.email as ngo_email, n.website as ngo_website
             FROM medical_missions mm
             JOIN ngos n ON mm.ngo_id = n.id
             WHERE mm.id = ?`,
            [req.params.missionId]
        );
        
        if (missions.length === 0) {
            return res.status(404).json({ error: 'Mission not found' });
        }
        
        res.json(missions[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new mission (NGO)
router.post('/missions', async (req, res) => {
    try {
        const { ngo_id, title, title_ar, mission_type, description, description_ar, specialties_offered,
                target_area, target_area_ar, location_details, start_date, end_date, daily_start_time,
                daily_end_time, max_patients_per_day, services_provided, services_provided_ar,
                requirements, contact_name, contact_phone, contact_email, is_free, registration_required } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO medical_missions (ngo_id, title, title_ar, mission_type, description, description_ar,
             specialties_offered, target_area, target_area_ar, location_details, start_date, end_date,
             daily_start_time, daily_end_time, max_patients_per_day, services_provided, services_provided_ar,
             requirements, contact_name, contact_phone, contact_email, is_free, registration_required)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ngo_id, title, title_ar, mission_type, description, description_ar, specialties_offered,
             target_area, target_area_ar, location_details, start_date, end_date, daily_start_time,
             daily_end_time, max_patients_per_day || 50, services_provided, services_provided_ar,
             requirements, contact_name, contact_phone, contact_email, is_free !== false, registration_required !== false]
        );
        
        res.status(201).json({ 
            message: 'Medical mission created successfully',
            mission_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update mission status
router.patch('/missions/:missionId/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        await pool.query(
            'UPDATE medical_missions SET status = ? WHERE id = ?',
            [status, req.params.missionId]
        );
        
        res.json({ message: 'Mission status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// VOLUNTEER DOCTORS (International Doctors Availability)
// ============================================

// Get available volunteer doctors
router.get('/volunteer-doctors', async (req, res) => {
    try {
        const specialty = req.query.specialty;
        const available = req.query.available;
        
        let query = `SELECT vd.id, vd.name, vd.specialty, vd.sub_specialty, vd.country, vd.languages,
                     vd.years_of_experience, vd.bio, vd.available_from, vd.available_to, 
                     vd.can_do_surgery, vd.availability_status, n.name as ngo_name
                     FROM volunteer_doctors vd
                     LEFT JOIN ngos n ON vd.ngo_id = n.id
                     WHERE vd.is_verified = TRUE`;
        
        const params = [];
        
        if (specialty) {
            query += ' AND vd.specialty = ?';
            params.push(specialty);
        }
        if (available === 'true') {
            query += ' AND vd.availability_status = ? AND vd.available_from <= CURDATE() AND vd.available_to >= CURDATE()';
            params.push('available');
        }
        
        query += ' ORDER BY vd.specialty, vd.name';
        
        const [doctors] = await pool.query(query, params);
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get volunteer doctor by ID
router.get('/volunteer-doctors/:doctorId', async (req, res) => {
    try {
        const [doctors] = await pool.query(
            `SELECT vd.*, n.name as ngo_name, n.website as ngo_website
             FROM volunteer_doctors vd
             LEFT JOIN ngos n ON vd.ngo_id = n.id
             WHERE vd.id = ?`,
            [req.params.doctorId]
        );
        
        if (doctors.length === 0) {
            return res.status(404).json({ error: 'Volunteer doctor not found' });
        }
        
        res.json(doctors[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register volunteer doctor availability
router.post('/volunteer-doctors', async (req, res) => {
    try {
        const { doctor_id, ngo_id, name, email, phone, specialty, sub_specialty, country, languages,
                license_number, license_country, years_of_experience, bio, available_from, available_to,
                preferred_regions, can_do_surgery } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO volunteer_doctors (doctor_id, ngo_id, name, email, phone, specialty, sub_specialty,
             country, languages, license_number, license_country, years_of_experience, bio, available_from,
             available_to, preferred_regions, can_do_surgery)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [doctor_id, ngo_id, name, email, phone, specialty, sub_specialty, country, languages,
             license_number, license_country, years_of_experience, bio, available_from, available_to,
             preferred_regions, can_do_surgery || false]
        );
        
        res.status(201).json({ 
            message: 'Volunteer doctor registered. Pending verification.',
            volunteer_doctor_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update volunteer doctor availability
router.patch('/volunteer-doctors/:doctorId/availability', async (req, res) => {
    try {
        const { availability_status, available_from, available_to } = req.body;
        const updates = [];
        const values = [];
        
        if (availability_status) { updates.push('availability_status = ?'); values.push(availability_status); }
        if (available_from) { updates.push('available_from = ?'); values.push(available_from); }
        if (available_to) { updates.push('available_to = ?'); values.push(available_to); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(req.params.doctorId);
        await pool.query(
            `UPDATE volunteer_doctors SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        res.json({ message: 'Availability updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// MISSION APPOINTMENTS (Appointment Booking)
// ============================================

// Book appointment for mission
router.post('/missions/:missionId/appointments', async (req, res) => {
    try {
        const { patient_id, appointment_date, preferred_time, reason_for_visit, 
                medical_history_summary, urgency_level } = req.body;
        
        // Check if mission exists and accepts appointments
        const [mission] = await pool.query(
            'SELECT id, registration_required, start_date, end_date FROM medical_missions WHERE id = ?',
            [req.params.missionId]
        );
        
        if (mission.length === 0) {
            return res.status(404).json({ error: 'Mission not found' });
        }
        
        // Check if appointment date is within mission dates
        if (appointment_date < mission[0].start_date || appointment_date > mission[0].end_date) {
            return res.status(400).json({ error: 'Appointment date must be within mission dates' });
        }
        
        const [result] = await pool.query(
            `INSERT INTO mission_appointments (mission_id, patient_id, appointment_date, preferred_time,
             reason_for_visit, medical_history_summary, urgency_level)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.params.missionId, patient_id, appointment_date, preferred_time || 'any',
             reason_for_visit, medical_history_summary, urgency_level || 'routine']
        );
        
        res.status(201).json({ 
            message: 'Appointment requested successfully',
            appointment_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get mission appointments (for NGO/mission staff)
router.get('/missions/:missionId/appointments', async (req, res) => {
    try {
        const date = req.query.date;
        const status = req.query.status;
        
        let query = `SELECT ma.*, p.name as patient_name, p.phone as patient_phone, 
                     p.gender, p.date_of_birth
                     FROM mission_appointments ma
                     JOIN patients p ON ma.patient_id = p.id
                     WHERE ma.mission_id = ?`;
        
        const params = [req.params.missionId];
        
        if (date) {
            query += ' AND ma.appointment_date = ?';
            params.push(date);
        }
        if (status) {
            query += ' AND ma.status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY ma.appointment_date, FIELD(ma.urgency_level, "urgent", "moderate", "routine"), ma.created_at';
        
        const [appointments] = await pool.query(query, params);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get patient's mission appointments
router.get('/appointments/patient/:patientId', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        
        const [appointments] = await pool.query(
            `SELECT ma.*, 
                ${lang === 'ar' ? 'mm.title_ar as mission_title' : 'mm.title as mission_title'},
                mm.mission_type, mm.location_details,
                ${lang === 'ar' ? 'n.name_ar as ngo_name' : 'n.name as ngo_name'}
             FROM mission_appointments ma
             JOIN medical_missions mm ON ma.mission_id = mm.id
             JOIN ngos n ON mm.ngo_id = n.id
             WHERE ma.patient_id = ?
             ORDER BY ma.appointment_date DESC`,
            [req.params.patientId]
        );
        
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update appointment status
router.patch('/appointments/:appointmentId', async (req, res) => {
    try {
        const { status, queue_number, volunteer_doctor_id, notes } = req.body;
        const updates = [];
        const values = [];
        
        if (status) { updates.push('status = ?'); values.push(status); }
        if (queue_number) { updates.push('queue_number = ?'); values.push(queue_number); }
        if (volunteer_doctor_id) { updates.push('volunteer_doctor_id = ?'); values.push(volunteer_doctor_id); }
        if (notes) { updates.push('notes = ?'); values.push(notes); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(req.params.appointmentId);
        await pool.query(
            `UPDATE mission_appointments SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        res.json({ message: 'Appointment updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit appointment feedback
router.patch('/appointments/:appointmentId/feedback', async (req, res) => {
    try {
        const { rating, patient_feedback } = req.body;
        
        await pool.query(
            'UPDATE mission_appointments SET rating = ?, patient_feedback = ? WHERE id = ?',
            [rating, patient_feedback, req.params.appointmentId]
        );
        
        res.json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SURGICAL CAMPS (Surgical Missions Tracker)
// ============================================

// Get all upcoming surgical camps
router.get('/surgical-camps', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const status = req.query.status;
        
        let query = `SELECT sc.id, 
            ${lang === 'ar' ? 'sc.title_ar as title' : 'sc.title'},
            ${lang === 'ar' ? 'sc.description_ar as description' : 'sc.description'},
            sc.surgery_types, sc.location, sc.hospital_partner, sc.start_date, sc.end_date,
            sc.total_surgeries_planned, sc.surgeries_completed, sc.lead_surgeon, sc.status,
            sc.registration_deadline,
            ${lang === 'ar' ? 'n.name_ar as ngo_name' : 'n.name as ngo_name'}
            FROM surgical_camps sc
            JOIN ngos n ON sc.ngo_id = n.id
            WHERE 1=1`;
        
        const params = [];
        
        if (status) {
            query += ' AND sc.status = ?';
            params.push(status);
        } else {
            query += ' AND sc.status NOT IN ("completed", "cancelled")';
        }
        
        query += ' ORDER BY sc.start_date ASC';
        
        const [camps] = await pool.query(query, params);
        res.json(camps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get surgical camp by ID
router.get('/surgical-camps/:campId', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        
        const [camps] = await pool.query(
            `SELECT sc.*, 
                ${lang === 'ar' ? 'sc.title_ar as title' : 'sc.title'},
                ${lang === 'ar' ? 'sc.description_ar as description' : 'sc.description'},
                ${lang === 'ar' ? 'sc.eligibility_criteria_ar as eligibility_criteria' : 'sc.eligibility_criteria'},
                ${lang === 'ar' ? 'n.name_ar as ngo_name' : 'n.name as ngo_name'},
                n.phone as ngo_phone, n.email as ngo_email
             FROM surgical_camps sc
             JOIN ngos n ON sc.ngo_id = n.id
             WHERE sc.id = ?`,
            [req.params.campId]
        );
        
        if (camps.length === 0) {
            return res.status(404).json({ error: 'Surgical camp not found' });
        }
        
        res.json(camps[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create surgical camp
router.post('/surgical-camps', async (req, res) => {
    try {
        const { mission_id, ngo_id, title, title_ar, surgery_types, description, description_ar,
                location, hospital_partner, start_date, end_date, total_surgeries_planned,
                lead_surgeon, medical_team_size, eligibility_criteria, eligibility_criteria_ar,
                screening_dates, contact_phone, contact_email, registration_deadline } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO surgical_camps (mission_id, ngo_id, title, title_ar, surgery_types, description,
             description_ar, location, hospital_partner, start_date, end_date, total_surgeries_planned,
             lead_surgeon, medical_team_size, eligibility_criteria, eligibility_criteria_ar,
             screening_dates, contact_phone, contact_email, registration_deadline)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [mission_id, ngo_id, title, title_ar, surgery_types, description, description_ar,
             location, hospital_partner, start_date, end_date, total_surgeries_planned,
             lead_surgeon, medical_team_size, eligibility_criteria, eligibility_criteria_ar,
             screening_dates, contact_phone, contact_email, registration_deadline]
        );
        
        res.status(201).json({ 
            message: 'Surgical camp created successfully',
            surgical_camp_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register for surgical camp
router.post('/surgical-camps/:campId/register', async (req, res) => {
    try {
        const { patient_id, surgery_type, condition_description, medical_documents } = req.body;
        
        // Check if camp exists and registration is open
        const [camp] = await pool.query(
            'SELECT id, registration_deadline, status FROM surgical_camps WHERE id = ?',
            [req.params.campId]
        );
        
        if (camp.length === 0) {
            return res.status(404).json({ error: 'Surgical camp not found' });
        }
        
        if (camp[0].registration_deadline && new Date() > new Date(camp[0].registration_deadline)) {
            return res.status(400).json({ error: 'Registration deadline has passed' });
        }
        
        // Check if already registered
        const [existing] = await pool.query(
            'SELECT id FROM surgery_registrations WHERE surgical_camp_id = ? AND patient_id = ?',
            [req.params.campId, patient_id]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already registered for this surgical camp' });
        }
        
        const [result] = await pool.query(
            `INSERT INTO surgery_registrations (surgical_camp_id, patient_id, surgery_type, 
             condition_description, medical_documents)
             VALUES (?, ?, ?, ?, ?)`,
            [req.params.campId, patient_id, surgery_type, condition_description, medical_documents]
        );
        
        res.status(201).json({ 
            message: 'Registration submitted successfully. You will be contacted for screening.',
            registration_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get surgery registrations for a camp
router.get('/surgical-camps/:campId/registrations', async (req, res) => {
    try {
        const status = req.query.status;
        
        let query = `SELECT sr.*, p.name as patient_name, p.phone as patient_phone,
                     p.gender, p.date_of_birth
                     FROM surgery_registrations sr
                     JOIN patients p ON sr.patient_id = p.id
                     WHERE sr.surgical_camp_id = ?`;
        
        const params = [req.params.campId];
        
        if (status) {
            query += ' AND sr.screening_status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY sr.created_at';
        
        const [registrations] = await pool.query(query, params);
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update surgery registration (screening, scheduling)
router.patch('/surgical-camps/registrations/:registrationId', async (req, res) => {
    try {
        const { screening_status, screening_date, screening_notes, surgery_status, 
                surgery_date, surgeon_name, post_op_notes, follow_up_required, follow_up_date } = req.body;
        
        const updates = [];
        const values = [];
        
        if (screening_status) { updates.push('screening_status = ?'); values.push(screening_status); }
        if (screening_date) { updates.push('screening_date = ?'); values.push(screening_date); }
        if (screening_notes) { updates.push('screening_notes = ?'); values.push(screening_notes); }
        if (surgery_status) { updates.push('surgery_status = ?'); values.push(surgery_status); }
        if (surgery_date) { updates.push('surgery_date = ?'); values.push(surgery_date); }
        if (surgeon_name) { updates.push('surgeon_name = ?'); values.push(surgeon_name); }
        if (post_op_notes) { updates.push('post_op_notes = ?'); values.push(post_op_notes); }
        if (follow_up_required !== undefined) { updates.push('follow_up_required = ?'); values.push(follow_up_required); }
        if (follow_up_date) { updates.push('follow_up_date = ?'); values.push(follow_up_date); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(req.params.registrationId);
        await pool.query(
            `UPDATE surgery_registrations SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        // If surgery completed, update surgical camp counter
        if (surgery_status === 'completed') {
            await pool.query(
                `UPDATE surgical_camps sc 
                 SET surgeries_completed = surgeries_completed + 1 
                 WHERE id = (SELECT surgical_camp_id FROM surgery_registrations WHERE id = ?)`,
                [req.params.registrationId]
            );
        }
        
        res.json({ message: 'Registration updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get patient's surgery registrations
router.get('/surgical-camps/patient/:patientId/registrations', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        
        const [registrations] = await pool.query(
            `SELECT sr.*, 
                ${lang === 'ar' ? 'sc.title_ar as camp_title' : 'sc.title as camp_title'},
                sc.location, sc.start_date as camp_start_date, sc.end_date as camp_end_date,
                ${lang === 'ar' ? 'n.name_ar as ngo_name' : 'n.name as ngo_name'}
             FROM surgery_registrations sr
             JOIN surgical_camps sc ON sr.surgical_camp_id = sc.id
             JOIN ngos n ON sc.ngo_id = n.id
             WHERE sr.patient_id = ?
             ORDER BY sr.created_at DESC`,
            [req.params.patientId]
        );
        
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// MISSION NOTIFICATIONS (Community Notifications)
// ============================================

// Get active notifications
router.get('/notifications', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const area = req.query.area;
        const type = req.query.type;
        
        let query = `SELECT id, notification_type,
            ${lang === 'ar' ? 'title_ar as title' : 'title'},
            ${lang === 'ar' ? 'message_ar as message' : 'message'},
            target_area, mission_id, surgical_camp_id, is_urgent, valid_until, created_at
            FROM mission_notifications
            WHERE is_active = TRUE AND (valid_until IS NULL OR valid_until >= CURDATE())`;
        
        const params = [];
        
        if (area) {
            query += ' AND (target_area LIKE ? OR target_area = "All Gaza" OR target_area = "All Palestine")';
            params.push(`%${area}%`);
        }
        if (type) {
            query += ' AND notification_type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY is_urgent DESC, created_at DESC';
        
        const [notifications] = await pool.query(query, params);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create notification
router.post('/notifications', async (req, res) => {
    try {
        const { notification_type, title, title_ar, message, message_ar, target_area,
                mission_id, surgical_camp_id, is_urgent, valid_until } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO mission_notifications (notification_type, title, title_ar, message, message_ar,
             target_area, mission_id, surgical_camp_id, is_urgent, valid_until)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [notification_type, title, title_ar, message, message_ar, target_area,
             mission_id, surgical_camp_id, is_urgent || false, valid_until]
        );
        
        res.status(201).json({ 
            message: 'Notification created successfully',
            notification_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deactivate notification
router.patch('/notifications/:notificationId/deactivate', async (req, res) => {
    try {
        await pool.query(
            'UPDATE mission_notifications SET is_active = FALSE WHERE id = ?',
            [req.params.notificationId]
        );
        
        res.json({ message: 'Notification deactivated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
