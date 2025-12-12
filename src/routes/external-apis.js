/**
 * External APIs Routes
 * Endpoints for external API integrations:
 * - Translation Service (MyMemory API)
 * - Weather & Health Alerts (Open-Meteo API)
 */

const express = require('express');
const router = express.Router();

const TranslationService = require('../services/TranslationService');
const WeatherHealthService = require('../services/WeatherHealthService');

// ============================================
// TRANSLATION ENDPOINTS
// ============================================

/**
 * @route   POST /api/external/translate
 * @desc    Translate text between Arabic and English
 * @access  Public
 */
router.post('/translate', async (req, res) => {
    try {
        const { text, from, to } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }

        const result = await TranslationService.translate(text, from, to);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/external/translate/auto
 * @desc    Auto-detect language and translate
 * @access  Public
 */
router.post('/translate/auto', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }

        const result = await TranslationService.autoTranslate(text);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/external/translate/medical
 * @desc    Translate medical term (instant from cache)
 * @access  Public
 */
router.post('/translate/medical', async (req, res) => {
    try {
        const { term, targetLang } = req.body;

        if (!term) {
            return res.status(400).json({ success: false, error: 'Term is required' });
        }

        const translation = TranslationService.getMedicalTerm(term, targetLang || 'ar');
        
        if (translation) {
            res.json({ success: true, term, translation, cached: true });
        } else {
            // Fall back to API translation
            const result = await TranslationService.autoTranslate(term);
            res.json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/external/translate/stats
 * @desc    Get translation cache statistics
 * @access  Public
 */
router.get('/translate/stats', (req, res) => {
    const stats = TranslationService.getCacheStats();
    res.json({ success: true, data: stats });
});

// ============================================
// WEATHER & HEALTH ENDPOINTS
// ============================================

/**
 * @route   GET /api/external/weather/:location
 * @desc    Get current weather for health assessment
 * @access  Public
 */
router.get('/weather/:location', async (req, res) => {
    try {
        const { location } = req.params;
        const result = await WeatherHealthService.getCurrentWeather(location);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/external/weather
 * @desc    Get weather for default location (Gaza)
 * @access  Public
 */
router.get('/weather', async (req, res) => {
    try {
        const result = await WeatherHealthService.getCurrentWeather('gaza');
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/external/air-quality/:location
 * @desc    Get air quality data
 * @access  Public
 */
router.get('/air-quality/:location', async (req, res) => {
    try {
        const { location } = req.params;
        const result = await WeatherHealthService.getAirQuality(location);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/external/air-quality
 * @desc    Get air quality for default location (Gaza)
 * @access  Public
 */
router.get('/air-quality', async (req, res) => {
    try {
        const result = await WeatherHealthService.getAirQuality('gaza');
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/external/health-alerts/:location
 * @desc    Get weather-based health alerts
 * @access  Public
 */
router.get('/health-alerts/:location', async (req, res) => {
    try {
        const { location } = req.params;
        const result = await WeatherHealthService.getWeatherHealthAlerts(location);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/external/health-alerts
 * @desc    Get health alerts for default location
 * @access  Public
 */
router.get('/health-alerts', async (req, res) => {
    try {
        const result = await WeatherHealthService.getWeatherHealthAlerts('gaza');
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/external/forecast/:location
 * @desc    Get 7-day health forecast
 * @access  Public
 */
router.get('/forecast/:location', async (req, res) => {
    try {
        const { location } = req.params;
        const result = await WeatherHealthService.getHealthForecast(location);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/external/locations
 * @desc    Get supported locations
 * @access  Public
 */
router.get('/locations', (req, res) => {
    const locations = WeatherHealthService.getSupportedLocations();
    res.json({ success: true, data: locations });
});

// ============================================
// API DOCUMENTATION ENDPOINT
// ============================================

/**
 * @route   GET /api/external
 * @desc    Get external APIs documentation
 * @access  Public
 */
router.get('/', (req, res) => {
    res.json({
        name: 'HealthPal External APIs',
        version: '1.0.0',
        description: 'External API integrations for translation and weather services',
        apis_used: {
            translation: {
                name: 'MyMemory Translation API',
                url: 'https://mymemory.translated.net/',
                type: 'Free (1000 words/day)',
                features: ['Arabic ↔ English', 'Medical terminology cache', 'Auto-detect language']
            },
            weather: {
                name: 'Open-Meteo API',
                url: 'https://open-meteo.com/',
                type: 'Free (no API key)',
                features: ['Current weather', 'Air quality', '7-day forecast', 'UV index', 'Health alerts']
            }
        },
        endpoints: {
            translation: {
                'POST /translate': 'Translate text (specify from/to)',
                'POST /translate/auto': 'Auto-detect and translate',
                'POST /translate/medical': 'Translate medical term (cached)',
                'GET /translate/stats': 'Translation cache statistics'
            },
            weather: {
                'GET /weather': 'Current weather (Gaza default)',
                'GET /weather/:location': 'Weather for specific location',
                'GET /air-quality': 'Air quality (Gaza default)',
                'GET /air-quality/:location': 'Air quality for location',
                'GET /health-alerts': 'Weather-based health alerts',
                'GET /health-alerts/:location': 'Health alerts for location',
                'GET /forecast/:location': '7-day health forecast',
                'GET /locations': 'List supported locations'
            }
        },
        supported_locations: WeatherHealthService.getSupportedLocations()
    });
});

module.exports = router;
