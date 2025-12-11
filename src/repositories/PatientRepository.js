const BaseRepository = require('./BaseRepository');
const bcrypt = require('bcryptjs');

class PatientRepository extends BaseRepository {
    constructor() {
        super('patients');
    }

    async findByUsername(username) {
        return this.findOne({ username });
    }

    async findByEmail(email) {
        return this.findOne({ email });
    }

    async createWithHashedPassword(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.create({ ...data, password: hashedPassword });
    }

    async validatePassword(patient, password) {
        if (patient.password.startsWith('$2')) {
            return bcrypt.compare(password, patient.password);
        }
        return patient.password === password;
    }

    async findWithMedicalHistory(id) {
        const patient = await this.findById(id);
        if (!patient) return null;
        
        const consultations = await this.query(
            `SELECT c.*, d.name as doctor_name, d.specialty 
             FROM consultations c 
             JOIN doctors d ON c.doctor_id = d.id 
             WHERE c.patient_id = ? ORDER BY c.created_at DESC`,
            [id]
        );
        
        return { ...patient, consultations };
    }
}

module.exports = new PatientRepository();
