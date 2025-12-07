const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Simple translation simulation (Arabic ↔ English)
// In production, this would integrate with a real translation API
function simulateTranslation(text, fromLang, toLang) {
    // This is a placeholder - in production, use Google Translate API or similar
    return `[Translated from ${fromLang} to ${toLang}]: ${text}`;
}

// Get messages for a consultation
router.get('/consultation/:consultationId', async (req, res) => {
    try {
        const [messages] = await pool.query(`
            SELECT m.*, 
                   CASE 
                       WHEN m.sender_type = 'patient' THEN p.name
                       ELSE d.name
                   END as sender_name
            FROM messages m
            LEFT JOIN patients p ON m.sender_type = 'patient' AND m.sender_id = p.id
            LEFT JOIN doctors d ON m.sender_type = 'doctor' AND m.sender_id = d.id
            WHERE m.consultation_id = ?
            ORDER BY m.created_at ASC
        `, [req.params.consultationId]);
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send a message (async consultation)
router.post('/', async (req, res) => {
    try {
        const { consultation_id, sender_type, sender_id, content } = req.body;
        
        // Get consultation details to check if translation is needed
        const [consultation] = await pool.query(`
            SELECT c.requires_translation, p.language_preference as patient_lang, d.languages as doctor_langs
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            JOIN doctors d ON c.doctor_id = d.id
            WHERE c.id = ?
        `, [consultation_id]);
        
        if (consultation.length === 0) {
            return res.status(404).json({ success: false, error: 'Consultation not found' });
        }
        
        let translatedContent = null;
        
        // If translation is required, translate the message
        if (consultation[0].requires_translation) {
            const fromLang = sender_type === 'patient' ? consultation[0].patient_lang : 'english';
            const toLang = sender_type === 'patient' ? 'english' : consultation[0].patient_lang;
            translatedContent = simulateTranslation(content, fromLang, toLang);
        }
        
        const [result] = await pool.query(
            'INSERT INTO messages (consultation_id, sender_type, sender_id, content, translated_content) VALUES (?, ?, ?, ?, ?)',
            [consultation_id, sender_type, sender_id, content, translatedContent]
        );
        
        res.status(201).json({ 
            success: true, 
            data: { 
                id: result.insertId, 
                consultation_id, 
                sender_type, 
                sender_id, 
                content,
                translated_content: translatedContent
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark messages as read
router.patch('/read/:consultationId', async (req, res) => {
    try {
        const { reader_type } = req.body; // 'patient' or 'doctor'
        const oppositeType = reader_type === 'patient' ? 'doctor' : 'patient';
        
        await pool.query(
            'UPDATE messages SET is_read = TRUE WHERE consultation_id = ? AND sender_type = ?',
            [req.params.consultationId, oppositeType]
        );
        
        res.json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get unread message count for a consultation
router.get('/unread/:consultationId/:readerType', async (req, res) => {
    try {
        const oppositeType = req.params.readerType === 'patient' ? 'doctor' : 'patient';
        const [result] = await pool.query(
            'SELECT COUNT(*) as unread_count FROM messages WHERE consultation_id = ? AND sender_type = ? AND is_read = FALSE',
            [req.params.consultationId, oppositeType]
        );
        res.json({ success: true, data: { unread_count: result[0].unread_count } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
