const { doctorRepository } = require('../repositories');

class DoctorService {
    async getAllDoctors() {
        return doctorRepository.findAll({}, 'name');
    }

    async getAvailableDoctors() {
        return doctorRepository.findAvailable();
    }

    async getDoctorsBySpecialty(specialty) {
        if (!specialty) {
            throw new Error('Specialty is required');
        }
        return doctorRepository.findBySpecialty(specialty);
    }

    async getDoctorById(id) {
        const doctor = await doctorRepository.findById(id);
        if (!doctor) {
            throw new Error('Doctor not found');
        }
        // Remove password from response
        const { password: _, ...doctorWithoutPassword } = doctor;
        return doctorWithoutPassword;
    }

    async createDoctor(data) {
        // Validate required fields
        const required = ['username', 'password', 'name', 'email', 'specialty'];
        for (const field of required) {
            if (!data[field]) {
                throw new Error(`${field} is required`);
            }
        }
        
        // Check if username exists
        const existing = await doctorRepository.findByUsername(data.username);
        if (existing) {
            throw new Error('Username already exists');
        }
        
        const doctor = await doctorRepository.createWithHashedPassword(data);
        const { password: _, ...doctorWithoutPassword } = doctor;
        return doctorWithoutPassword;
    }

    async updateDoctor(id, data, requestingUser) {
        // Check if doctor exists
        const doctor = await doctorRepository.findById(id);
        if (!doctor) {
            throw new Error('Doctor not found');
        }
        
        // Only allow self-update or admin
        if (requestingUser.role !== 'admin' && requestingUser.id !== id) {
            throw new Error('You can only update your own profile');
        }
        
        // Don't allow password update through this method
        delete data.password;
        delete data.id;
        
        await doctorRepository.update(id, data);
        return this.getDoctorById(id);
    }

    async updateAvailability(id, status, requestingUser) {
        const validStatuses = ['available', 'busy', 'offline'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid availability status');
        }
        
        // Only allow self-update
        if (requestingUser.id !== id && requestingUser.role !== 'admin') {
            throw new Error('You can only update your own availability');
        }
        
        await doctorRepository.updateAvailability(id, status);
        return { message: 'Availability updated', status };
    }

    async deleteDoctor(id) {
        const deleted = await doctorRepository.delete(id);
        if (!deleted) {
            throw new Error('Doctor not found');
        }
        return { message: 'Doctor deleted successfully' };
    }
}

module.exports = new DoctorService();
