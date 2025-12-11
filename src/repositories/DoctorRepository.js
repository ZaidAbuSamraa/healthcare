const BaseRepository = require('./BaseRepository');
const bcrypt = require('bcryptjs');

class DoctorRepository extends BaseRepository {
    constructor() {
        super('doctors');
    }

    async findAvailable() {
        return this.query(
            'SELECT * FROM doctors WHERE availability_status = ? ORDER BY name',
            ['available']
        );
    }

    async findBySpecialty(specialty) {
        return this.query(
            'SELECT * FROM doctors WHERE specialty = ? AND availability_status = ? ORDER BY name',
            [specialty, 'available']
        );
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

    async validatePassword(doctor, password) {
        // Check if password is hashed (bcrypt hashes start with $2)
        if (doctor.password.startsWith('$2')) {
            return bcrypt.compare(password, doctor.password);
        }
        // Fallback for plain text passwords (legacy)
        return doctor.password === password;
    }

    async updateAvailability(id, status) {
        return this.update(id, { availability_status: status });
    }
}

module.exports = new DoctorRepository();
