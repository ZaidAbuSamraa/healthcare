const BaseRepository = require('./BaseRepository');
const bcrypt = require('bcryptjs');

class NgoRepository extends BaseRepository {
    constructor() {
        super('ngos');
    }

    async findAllVerified(lang = 'en', type = null) {
        const nameCol = lang === 'ar' ? 'name_ar as name' : 'name';
        const descCol = lang === 'ar' ? 'description_ar as description' : 'description';
        
        let query = `SELECT id, ${nameCol}, ${descCol}, email, phone, website, logo_url, 
                     organization_type, specializations, operating_regions, headquarters_country, is_verified
                     FROM ngos WHERE is_active = TRUE AND is_verified = TRUE`;
        const params = [];
        
        if (type) {
            query += ' AND organization_type = ?';
            params.push(type);
        }
        query += ' ORDER BY name';
        
        return this.query(query, params);
    }

    async findByIdWithLang(id, lang = 'en') {
        const nameCol = lang === 'ar' ? 'name_ar as name' : 'name';
        const descCol = lang === 'ar' ? 'description_ar as description' : 'description';
        
        const rows = await this.query(
            `SELECT id, ${nameCol}, ${descCol}, email, phone, website, logo_url, 
             organization_type, specializations, operating_regions, headquarters_country, 
             is_verified, verification_date
             FROM ngos WHERE id = ? AND is_active = TRUE`,
            [id]
        );
        return rows[0] || null;
    }

    async findByUsername(username) {
        return this.findOne({ username });
    }

    async createWithHashedPassword(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.create({ ...data, password: hashedPassword });
    }

    async validatePassword(ngo, password) {
        if (ngo.password.startsWith('$2')) {
            return bcrypt.compare(password, ngo.password);
        }
        return ngo.password === password;
    }

    async verify(id, verifiedBy) {
        return this.query(
            'UPDATE ngos SET is_verified = TRUE, verification_date = CURDATE(), verified_by = ? WHERE id = ?',
            [verifiedBy, id]
        );
    }

    async getMissions(ngoId, lang = 'en') {
        const titleCol = lang === 'ar' ? 'title_ar as title' : 'title';
        const descCol = lang === 'ar' ? 'description_ar as description' : 'description';
        const areaCol = lang === 'ar' ? 'target_area_ar as target_area' : 'target_area';
        
        return this.query(
            `SELECT id, ${titleCol}, ${descCol}, mission_type, specialties_offered, 
             ${areaCol}, start_date, end_date, status, is_free
             FROM medical_missions WHERE ngo_id = ? ORDER BY start_date DESC`,
            [ngoId]
        );
    }
}

module.exports = new NgoRepository();
