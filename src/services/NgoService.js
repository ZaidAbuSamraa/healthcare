const { ngoRepository } = require('../repositories');

class NgoService {
    async getAllVerifiedNgos(lang, type) {
        return ngoRepository.findAllVerified(lang, type);
    }

    async getNgoById(id, lang) {
        const ngo = await ngoRepository.findByIdWithLang(id, lang);
        if (!ngo) {
            throw new Error('NGO not found');
        }
        return ngo;
    }

    async registerNgo(data) {
        // Validate required fields
        const required = ['username', 'password', 'name', 'email', 'organization_type', 'specializations'];
        for (const field of required) {
            if (!data[field]) {
                throw new Error(`${field} is required`);
            }
        }
        
        // Check if username exists
        const existing = await ngoRepository.findByUsername(data.username);
        if (existing) {
            throw new Error('Username already exists');
        }
        
        const ngo = await ngoRepository.createWithHashedPassword(data);
        const { password: _, ...ngoWithoutPassword } = ngo;
        
        return {
            message: 'NGO registered successfully. Pending verification.',
            ngo: ngoWithoutPassword
        };
    }

    async verifyNgo(ngoId, verifiedBy) {
        const ngo = await ngoRepository.findById(ngoId);
        if (!ngo) {
            throw new Error('NGO not found');
        }
        
        if (ngo.is_verified) {
            throw new Error('NGO is already verified');
        }
        
        await ngoRepository.verify(ngoId, verifiedBy);
        return { message: 'NGO verified successfully' };
    }

    async getNgoMissions(ngoId, lang) {
        const ngo = await ngoRepository.findById(ngoId);
        if (!ngo) {
            throw new Error('NGO not found');
        }
        
        return ngoRepository.getMissions(ngoId, lang);
    }
}

module.exports = new NgoService();
