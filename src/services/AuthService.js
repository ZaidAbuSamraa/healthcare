const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { doctorRepository, patientRepository, ngoRepository } = require('../repositories');

class AuthService {
    // Login for any user type
    async login(username, password, userType) {
        let repository;
        let role;
        
        switch (userType) {
            case 'doctor':
                repository = doctorRepository;
                role = 'doctor';
                break;
            case 'patient':
                repository = patientRepository;
                role = 'patient';
                break;
            case 'ngo':
                repository = ngoRepository;
                role = 'ngo';
                break;
            default:
                throw new Error('Invalid user type');
        }
        
        const user = await repository.findByUsername(username);
        if (!user) {
            throw new Error('Invalid username or password');
        }
        
        const isValid = await repository.validatePassword(user, password);
        if (!isValid) {
            throw new Error('Invalid username or password');
        }
        
        const tokens = generateTokens({ ...user, role });
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        return {
            user: { ...userWithoutPassword, role },
            ...tokens
        };
    }

    // Register new patient
    async registerPatient(data) {
        const existing = await patientRepository.findByUsername(data.username);
        if (existing) {
            throw new Error('Username already exists');
        }
        
        const emailExists = await patientRepository.findByEmail(data.email);
        if (emailExists) {
            throw new Error('Email already registered');
        }
        
        const patient = await patientRepository.createWithHashedPassword(data);
        const { password: _, ...patientWithoutPassword } = patient;
        
        const tokens = generateTokens({ ...patient, role: 'patient' });
        
        return {
            user: { ...patientWithoutPassword, role: 'patient' },
            ...tokens
        };
    }

    // Register new doctor
    async registerDoctor(data) {
        const existing = await doctorRepository.findByUsername(data.username);
        if (existing) {
            throw new Error('Username already exists');
        }
        
        const doctor = await doctorRepository.createWithHashedPassword(data);
        const { password: _, ...doctorWithoutPassword } = doctor;
        
        const tokens = generateTokens({ ...doctor, role: 'doctor' });
        
        return {
            user: { ...doctorWithoutPassword, role: 'doctor' },
            ...tokens
        };
    }

    // Refresh tokens
    async refreshToken(refreshToken) {
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            throw new Error('Invalid refresh token');
        }
        
        return generateTokens(decoded);
    }
}

module.exports = new AuthService();
