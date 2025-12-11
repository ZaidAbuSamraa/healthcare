const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ============================================
// TRAUMA COUNSELING PORTAL
// ============================================

// Get available mental health counselors
router.get('/counselors', async (req, res) => {
    try {
        const [counselors] = await pool.query(
            `SELECT id, name, bio, languages, availability_status, years_of_experience 
             FROM doctors 
             WHERE specialty = 'mental_health' AND availability_status = 'available'`
        );
        res.json(counselors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Request trauma counseling session
router.post('/counseling/request', async (req, res) => {
    try {
        const { patient_id, counselor_id, session_type, target_group, session_mode, urgency_level, notes } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO trauma_counseling_sessions 
             (patient_id, counselor_id, session_type, target_group, session_mode, urgency_level, notes, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'requested')`,
            [patient_id, counselor_id, session_type, target_group || 'adult', session_mode || 'video', urgency_level || 'medium', notes]
        );
        
        res.status(201).json({ 
            message: 'Counseling session requested successfully',
            session_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get patient's counseling sessions
router.get('/counseling/patient/:patientId', async (req, res) => {
    try {
        const [sessions] = await pool.query(
            `SELECT tcs.*, d.name as counselor_name, d.specialty
             FROM trauma_counseling_sessions tcs
             JOIN doctors d ON tcs.counselor_id = d.id
             WHERE tcs.patient_id = ?
             ORDER BY tcs.created_at DESC`,
            [req.params.patientId]
        );
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get counselor's sessions (for doctors)
router.get('/counseling/counselor/:counselorId', async (req, res) => {
    try {
        const [sessions] = await pool.query(
            `SELECT tcs.*, p.name as patient_name, p.gender, p.date_of_birth
             FROM trauma_counseling_sessions tcs
             JOIN patients p ON tcs.patient_id = p.id
             WHERE tcs.counselor_id = ?
             ORDER BY 
                CASE tcs.urgency_level 
                    WHEN 'crisis' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 
                END,
                tcs.created_at DESC`,
            [req.params.counselorId]
        );
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update counseling session (schedule, status, notes)
router.patch('/counseling/:sessionId', async (req, res) => {
    try {
        const { status, scheduled_at, counselor_notes, follow_up_recommended } = req.body;
        const updates = [];
        const values = [];
        
        if (status) { updates.push('status = ?'); values.push(status); }
        if (scheduled_at) { updates.push('scheduled_at = ?'); values.push(scheduled_at); }
        if (counselor_notes) { updates.push('counselor_notes = ?'); values.push(counselor_notes); }
        if (follow_up_recommended !== undefined) { updates.push('follow_up_recommended = ?'); values.push(follow_up_recommended); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(req.params.sessionId);
        await pool.query(
            `UPDATE trauma_counseling_sessions SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        res.json({ message: 'Session updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SUPPORT GROUPS
// ============================================

// Get all active support groups
router.get('/support-groups', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const type = req.query.type;
        
        let query = `SELECT id, 
            ${lang === 'ar' ? 'name_ar as name' : 'name'},
            ${lang === 'ar' ? 'description_ar as description' : 'description'},
            group_type, target_audience, moderator_name, 
            max_members, current_members, meeting_schedule, meeting_link, language
            FROM support_groups WHERE is_active = TRUE`;
        
        const params = [];
        if (type) {
            query += ' AND group_type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY current_members DESC';
        
        const [groups] = await pool.query(query, params);
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get support group by ID with members count
router.get('/support-groups/:groupId', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        
        const [groups] = await pool.query(
            `SELECT id, 
                ${lang === 'ar' ? 'name_ar as name' : 'name'},
                ${lang === 'ar' ? 'description_ar as description' : 'description'},
                group_type, target_audience, moderator_type, moderator_name,
                max_members, current_members, meeting_schedule, meeting_link, language, is_private
             FROM support_groups WHERE id = ?`,
            [req.params.groupId]
        );
        
        if (groups.length === 0) {
            return res.status(404).json({ error: 'Support group not found' });
        }
        
        res.json(groups[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Join a support group
router.post('/support-groups/:groupId/join', async (req, res) => {
    try {
        const { member_type, member_id, display_name, is_anonymous } = req.body;
        
        // Check if already a member
        const [existing] = await pool.query(
            `SELECT id FROM support_group_members 
             WHERE group_id = ? AND member_id = ? AND member_type = ? AND status IN ('pending', 'approved')`,
            [req.params.groupId, member_id, member_type]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already a member of this group' });
        }
        
        // Check if group is full
        const [group] = await pool.query(
            'SELECT max_members, current_members, is_private FROM support_groups WHERE id = ?',
            [req.params.groupId]
        );
        
        if (group.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        if (group[0].current_members >= group[0].max_members) {
            return res.status(400).json({ error: 'Group is full' });
        }
        
        const status = group[0].is_private ? 'pending' : 'approved';
        
        const [result] = await pool.query(
            `INSERT INTO support_group_members (group_id, member_type, member_id, display_name, is_anonymous, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.params.groupId, member_type, member_id, display_name, is_anonymous || false, status]
        );
        
        // Update member count if approved
        if (status === 'approved') {
            await pool.query(
                'UPDATE support_groups SET current_members = current_members + 1 WHERE id = ?',
                [req.params.groupId]
            );
        }
        
        res.status(201).json({ 
            message: status === 'approved' ? 'Successfully joined the group' : 'Join request submitted for approval',
            member_id: result.insertId,
            status
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get group messages
router.get('/support-groups/:groupId/messages', async (req, res) => {
    try {
        const [messages] = await pool.query(
            `SELECT sgm.*, sm.display_name, sm.is_anonymous
             FROM support_group_messages sgm
             JOIN support_group_members sm ON sgm.member_id = sm.id
             WHERE sgm.group_id = ? AND sgm.is_moderated = FALSE
             ORDER BY sgm.created_at DESC
             LIMIT 50`,
            [req.params.groupId]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Post message to group
router.post('/support-groups/:groupId/messages', async (req, res) => {
    try {
        const { member_id, content } = req.body;
        
        // Verify member is approved
        const [member] = await pool.query(
            'SELECT id FROM support_group_members WHERE id = ? AND group_id = ? AND status = ?',
            [member_id, req.params.groupId, 'approved']
        );
        
        if (member.length === 0) {
            return res.status(403).json({ error: 'Not an approved member of this group' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO support_group_messages (group_id, member_id, content) VALUES (?, ?, ?)',
            [req.params.groupId, member_id, content]
        );
        
        res.status(201).json({ message: 'Message posted', message_id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's group memberships
router.get('/support-groups/member/:memberType/:memberId', async (req, res) => {
    try {
        const [memberships] = await pool.query(
            `SELECT sgm.*, sg.name, sg.name_ar, sg.group_type, sg.meeting_schedule, sg.meeting_link
             FROM support_group_members sgm
             JOIN support_groups sg ON sgm.group_id = sg.id
             WHERE sgm.member_type = ? AND sgm.member_id = ? AND sgm.status = 'approved'`,
            [req.params.memberType, req.params.memberId]
        );
        res.json(memberships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ANONYMOUS THERAPY CHAT
// ============================================

// Generate anonymous ID
function generateAnonymousId() {
    return 'ANON-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Start anonymous therapy chat
router.post('/anonymous-chat/start', async (req, res) => {
    try {
        const { patient_id, concern_type, priority, initial_message } = req.body;
        
        const anonymous_id = generateAnonymousId();
        
        const [result] = await pool.query(
            `INSERT INTO anonymous_therapy_chats (anonymous_id, patient_id, concern_type, priority, status)
             VALUES (?, ?, ?, ?, 'waiting')`,
            [anonymous_id, patient_id || null, concern_type, priority || 'normal']
        );
        
        // Add initial message if provided
        if (initial_message) {
            await pool.query(
                'INSERT INTO anonymous_chat_messages (chat_id, sender_type, content) VALUES (?, ?, ?)',
                [result.insertId, 'patient', initial_message]
            );
        }
        
        res.status(201).json({ 
            message: 'Anonymous chat started. A counselor will join shortly.',
            chat_id: result.insertId,
            anonymous_id
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get waiting chats (for counselors)
router.get('/anonymous-chat/waiting', async (req, res) => {
    try {
        const [chats] = await pool.query(
            `SELECT id, anonymous_id, concern_type, priority, created_at
             FROM anonymous_therapy_chats
             WHERE status = 'waiting'
             ORDER BY 
                CASE priority WHEN 'crisis' THEN 1 WHEN 'urgent' THEN 2 ELSE 3 END,
                created_at ASC`
        );
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Counselor accepts a chat
router.post('/anonymous-chat/:chatId/accept', async (req, res) => {
    try {
        const { counselor_id } = req.body;
        
        await pool.query(
            `UPDATE anonymous_therapy_chats 
             SET counselor_id = ?, status = 'active', started_at = NOW()
             WHERE id = ? AND status = 'waiting'`,
            [counselor_id, req.params.chatId]
        );
        
        res.json({ message: 'Chat accepted. You can now communicate with the patient.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get chat messages
router.get('/anonymous-chat/:chatId/messages', async (req, res) => {
    try {
        const [messages] = await pool.query(
            `SELECT id, sender_type, content, is_read, created_at
             FROM anonymous_chat_messages
             WHERE chat_id = ?
             ORDER BY created_at ASC`,
            [req.params.chatId]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send message in chat
router.post('/anonymous-chat/:chatId/messages', async (req, res) => {
    try {
        const { sender_type, content } = req.body;
        
        const [result] = await pool.query(
            'INSERT INTO anonymous_chat_messages (chat_id, sender_type, content) VALUES (?, ?, ?)',
            [req.params.chatId, sender_type, content]
        );
        
        res.status(201).json({ message: 'Message sent', message_id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// End/close chat
router.post('/anonymous-chat/:chatId/close', async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        
        await pool.query(
            `UPDATE anonymous_therapy_chats 
             SET status = 'closed', ended_at = NOW(), counselor_rating = ?, feedback = ?
             WHERE id = ?`,
            [rating, feedback, req.params.chatId]
        );
        
        res.json({ message: 'Chat closed. Thank you for using our service.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get patient's active chats
router.get('/anonymous-chat/patient/:patientId', async (req, res) => {
    try {
        const [chats] = await pool.query(
            `SELECT atc.*, d.name as counselor_name
             FROM anonymous_therapy_chats atc
             LEFT JOIN doctors d ON atc.counselor_id = d.id
             WHERE atc.patient_id = ?
             ORDER BY atc.created_at DESC`,
            [req.params.patientId]
        );
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get counselor's active chats
router.get('/anonymous-chat/counselor/:counselorId', async (req, res) => {
    try {
        const [chats] = await pool.query(
            `SELECT id, anonymous_id, concern_type, priority, status, started_at
             FROM anonymous_therapy_chats
             WHERE counselor_id = ? AND status = 'active'
             ORDER BY started_at DESC`,
            [req.params.counselorId]
        );
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Escalate chat (for crisis situations)
router.post('/anonymous-chat/:chatId/escalate', async (req, res) => {
    try {
        const { reason } = req.body;
        
        await pool.query(
            `UPDATE anonymous_therapy_chats 
             SET is_escalated = TRUE, escalation_reason = ?, priority = 'crisis'
             WHERE id = ?`,
            [reason, req.params.chatId]
        );
        
        res.json({ message: 'Chat escalated to crisis level. Senior counselor will be notified.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new support group (for doctors/volunteers)
router.post('/support-groups', async (req, res) => {
    try {
        const { name, name_ar, description, description_ar, group_type, target_audience, 
                moderator_type, moderator_id, moderator_name, max_members, 
                meeting_schedule, meeting_link, language, is_private } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO support_groups 
             (name, name_ar, description, description_ar, group_type, target_audience,
              moderator_type, moderator_id, moderator_name, max_members, 
              meeting_schedule, meeting_link, language, is_private)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, name_ar, description, description_ar, group_type, target_audience || 'all',
             moderator_type, moderator_id, moderator_name, max_members || 50,
             meeting_schedule, meeting_link, language || 'arabic', is_private || false]
        );
        
        res.status(201).json({ 
            message: 'Support group created successfully',
            group_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
