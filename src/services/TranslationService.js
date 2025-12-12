/**
 * Translation Service - External API Integration
 * Uses MyMemory Translation API (Free, no API key required)
 * 
 * Features:
 * - Arabic ↔ English translation
 * - Medical terminology support
 * - Caching for common phrases
 */

const axios = require('axios');

class TranslationService {
    constructor() {
        // MyMemory API - Free translation API (1000 words/day free)
        this.apiUrl = 'https://api.mymemory.translated.net/get';
        
        // Cache for common translations
        this.cache = new Map();
        
        // Common medical terms (pre-cached)
        this.medicalTerms = {
            // English to Arabic
            'en-ar': {
                'fever': 'حمى',
                'headache': 'صداع',
                'cough': 'سعال',
                'pain': 'ألم',
                'diabetes': 'السكري',
                'blood pressure': 'ضغط الدم',
                'heart': 'قلب',
                'surgery': 'جراحة',
                'medication': 'دواء',
                'prescription': 'وصفة طبية',
                'diagnosis': 'تشخيص',
                'symptoms': 'أعراض',
                'treatment': 'علاج',
                'emergency': 'طوارئ',
                'hospital': 'مستشفى',
                'doctor': 'طبيب',
                'nurse': 'ممرض/ة',
                'patient': 'مريض',
                'vaccine': 'لقاح',
                'infection': 'عدوى',
                'allergy': 'حساسية',
                'asthma': 'ربو',
                'cancer': 'سرطان',
                'kidney': 'كلية',
                'liver': 'كبد',
                'lung': 'رئة',
                'stomach': 'معدة',
                'bone': 'عظم',
                'muscle': 'عضلة',
                'blood': 'دم',
                'oxygen': 'أكسجين',
                'insulin': 'أنسولين',
                'antibiotic': 'مضاد حيوي',
                'painkiller': 'مسكن',
                'ambulance': 'إسعاف',
                'wheelchair': 'كرسي متحرك',
                'first aid': 'إسعافات أولية',
                'wound': 'جرح',
                'fracture': 'كسر',
                'burn': 'حرق',
                'bleeding': 'نزيف',
                'unconscious': 'فاقد الوعي',
                'breathing': 'تنفس',
                'pulse': 'نبض',
                'temperature': 'درجة الحرارة'
            },
            // Arabic to English
            'ar-en': {
                'حمى': 'fever',
                'صداع': 'headache',
                'سعال': 'cough',
                'ألم': 'pain',
                'السكري': 'diabetes',
                'ضغط الدم': 'blood pressure',
                'قلب': 'heart',
                'جراحة': 'surgery',
                'دواء': 'medication',
                'وصفة طبية': 'prescription',
                'تشخيص': 'diagnosis',
                'أعراض': 'symptoms',
                'علاج': 'treatment',
                'طوارئ': 'emergency',
                'مستشفى': 'hospital',
                'طبيب': 'doctor',
                'مريض': 'patient',
                'لقاح': 'vaccine',
                'عدوى': 'infection',
                'حساسية': 'allergy',
                'إسعاف': 'ambulance',
                'إسعافات أولية': 'first aid',
                'جرح': 'wound',
                'كسر': 'fracture',
                'نزيف': 'bleeding'
            }
        };
    }

    /**
     * Translate text using MyMemory API
     * @param {string} text - Text to translate
     * @param {string} from - Source language (ar or en)
     * @param {string} to - Target language (ar or en)
     */
    async translate(text, from = 'en', to = 'ar') {
        if (!text || text.trim() === '') {
            return { success: true, translation: '' };
        }

        const cacheKey = `${from}-${to}:${text.toLowerCase()}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return { success: true, translation: this.cache.get(cacheKey), cached: true };
        }

        // Check medical terms
        const langPair = `${from}-${to}`;
        if (this.medicalTerms[langPair] && this.medicalTerms[langPair][text.toLowerCase()]) {
            const translation = this.medicalTerms[langPair][text.toLowerCase()];
            this.cache.set(cacheKey, translation);
            return { success: true, translation, cached: true };
        }

        try {
            const response = await axios.get(this.apiUrl, {
                params: {
                    q: text,
                    langpair: `${from}|${to}`
                },
                timeout: 5000
            });

            if (response.data && response.data.responseStatus === 200) {
                const translation = response.data.responseData.translatedText;
                
                // Cache the result
                this.cache.set(cacheKey, translation);
                
                return {
                    success: true,
                    translation: translation,
                    match: response.data.responseData.match,
                    cached: false
                };
            } else {
                return {
                    success: false,
                    error: 'Translation failed',
                    originalText: text
                };
            }
        } catch (error) {
            console.error('Translation error:', error.message);
            return {
                success: false,
                error: error.message,
                originalText: text
            };
        }
    }

    /**
     * Translate Arabic to English
     */
    async translateToEnglish(text) {
        return await this.translate(text, 'ar', 'en');
    }

    /**
     * Translate English to Arabic
     */
    async translateToArabic(text) {
        return await this.translate(text, 'en', 'ar');
    }

    /**
     * Detect language (simple heuristic)
     */
    detectLanguage(text) {
        const arabicRegex = /[\u0600-\u06FF]/;
        return arabicRegex.test(text) ? 'ar' : 'en';
    }

    /**
     * Auto-translate based on detected language
     */
    async autoTranslate(text) {
        const detected = this.detectLanguage(text);
        const targetLang = detected === 'ar' ? 'en' : 'ar';
        
        const result = await this.translate(text, detected, targetLang);
        return {
            ...result,
            detectedLanguage: detected,
            targetLanguage: targetLang
        };
    }

    /**
     * Translate consultation message
     * Preserves medical terminology accuracy
     */
    async translateConsultationMessage(message, targetLang) {
        const sourceLang = this.detectLanguage(message);
        
        if (sourceLang === targetLang) {
            return { success: true, translation: message, sameLanguage: true };
        }

        return await this.translate(message, sourceLang, targetLang);
    }

    /**
     * Translate health guide content
     */
    async translateHealthGuide(content, targetLang) {
        const sourceLang = this.detectLanguage(content);
        
        if (sourceLang === targetLang) {
            return { success: true, translation: content };
        }

        // For longer content, split into paragraphs
        const paragraphs = content.split('\n').filter(p => p.trim());
        const translations = [];

        for (const paragraph of paragraphs) {
            const result = await this.translate(paragraph, sourceLang, targetLang);
            if (result.success) {
                translations.push(result.translation);
            } else {
                translations.push(paragraph); // Keep original if translation fails
            }
        }

        return {
            success: true,
            translation: translations.join('\n'),
            paragraphCount: paragraphs.length
        };
    }

    /**
     * Get medical term translation (instant, from cache)
     */
    getMedicalTerm(term, targetLang = 'ar') {
        const sourceLang = this.detectLanguage(term);
        const langPair = `${sourceLang}-${targetLang}`;
        
        if (this.medicalTerms[langPair]) {
            return this.medicalTerms[langPair][term.toLowerCase()] || null;
        }
        return null;
    }

    /**
     * Translate alert for bilingual notification
     */
    async translateAlert(title, content, recommendations) {
        const sourceLang = this.detectLanguage(title);
        const targetLang = sourceLang === 'ar' ? 'en' : 'ar';

        const [titleResult, contentResult, recsResult] = await Promise.all([
            this.translate(title, sourceLang, targetLang),
            this.translate(content, sourceLang, targetLang),
            recommendations ? this.translate(recommendations, sourceLang, targetLang) : { success: true, translation: '' }
        ]);

        return {
            success: titleResult.success && contentResult.success,
            original: { title, content, recommendations },
            translated: {
                title: titleResult.translation,
                content: contentResult.translation,
                recommendations: recsResult.translation
            },
            sourceLang,
            targetLang
        };
    }

    /**
     * Clear cache (for memory management)
     */
    clearCache() {
        this.cache.clear();
        return { success: true, message: 'Cache cleared' };
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            medicalTermsCount: {
                'en-ar': Object.keys(this.medicalTerms['en-ar']).length,
                'ar-en': Object.keys(this.medicalTerms['ar-en']).length
            }
        };
    }
}

module.exports = new TranslationService();
