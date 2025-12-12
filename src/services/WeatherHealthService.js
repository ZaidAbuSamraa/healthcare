/**
 * Weather & Health Service - External API Integration
 * Uses Open-Meteo API (Free, no API key required)
 * 
 * Features:
 * - Weather data for health alerts
 * - Air quality monitoring
 * - UV index for skin health
 * - Pollen/allergy alerts
 */

const axios = require('axios');

class WeatherHealthService {
    constructor() {
        // Open-Meteo API - Free weather API (no key required)
        this.weatherApiUrl = 'https://api.open-meteo.com/v1/forecast';
        this.airQualityApiUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality';
        
        // Gaza coordinates (default)
        this.defaultLocation = {
            latitude: 31.5,
            longitude: 34.47,
            name: 'Gaza'
        };

        // Palestinian cities coordinates
        this.locations = {
            'gaza': { latitude: 31.5, longitude: 34.47, name: 'Gaza City', name_ar: 'مدينة غزة' },
            'gaza_city': { latitude: 31.5, longitude: 34.47, name: 'Gaza City', name_ar: 'مدينة غزة' },
            'khan_yunis': { latitude: 31.34, longitude: 34.30, name: 'Khan Yunis', name_ar: 'خان يونس' },
            'rafah': { latitude: 31.28, longitude: 34.25, name: 'Rafah', name_ar: 'رفح' },
            'jabalia': { latitude: 31.53, longitude: 34.48, name: 'Jabalia', name_ar: 'جباليا' },
            'beit_hanoun': { latitude: 31.54, longitude: 34.53, name: 'Beit Hanoun', name_ar: 'بيت حانون' },
            'deir_al_balah': { latitude: 31.42, longitude: 34.35, name: 'Deir al-Balah', name_ar: 'دير البلح' },
            'ramallah': { latitude: 31.90, longitude: 35.20, name: 'Ramallah', name_ar: 'رام الله' },
            'nablus': { latitude: 32.22, longitude: 35.26, name: 'Nablus', name_ar: 'نابلس' },
            'hebron': { latitude: 31.53, longitude: 35.10, name: 'Hebron', name_ar: 'الخليل' },
            'bethlehem': { latitude: 31.70, longitude: 35.20, name: 'Bethlehem', name_ar: 'بيت لحم' },
            'jenin': { latitude: 32.46, longitude: 35.30, name: 'Jenin', name_ar: 'جنين' },
            'jericho': { latitude: 31.86, longitude: 35.46, name: 'Jericho', name_ar: 'أريحا' }
        };
    }

    /**
     * Get current weather for health assessment
     */
    async getCurrentWeather(location = 'gaza') {
        const coords = this.locations[location.toLowerCase()] || this.defaultLocation;

        try {
            const response = await axios.get(this.weatherApiUrl, {
                params: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index',
                    timezone: 'Asia/Gaza',
                    forecast_days: 1
                },
                timeout: 5000
            });

            const current = response.data.current;
            
            return {
                success: true,
                location: coords.name,
                location_ar: coords.name_ar,
                data: {
                    temperature: current.temperature_2m,
                    feels_like: current.apparent_temperature,
                    humidity: current.relative_humidity_2m,
                    precipitation: current.precipitation,
                    wind_speed: current.wind_speed_10m,
                    uv_index: current.uv_index,
                    weather_code: current.weather_code
                },
                health_advice: this.getHealthAdvice(current),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Weather API error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get air quality data
     */
    async getAirQuality(location = 'gaza') {
        const coords = this.locations[location.toLowerCase()] || this.defaultLocation;

        try {
            const response = await axios.get(this.airQualityApiUrl, {
                params: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index,european_aqi',
                    timezone: 'Asia/Gaza'
                },
                timeout: 5000
            });

            const current = response.data.current;
            const aqi = current.european_aqi;
            
            return {
                success: true,
                location: coords.name,
                location_ar: coords.name_ar,
                data: {
                    aqi: aqi,
                    aqi_level: this.getAQILevel(aqi),
                    pm2_5: current.pm2_5,
                    pm10: current.pm10,
                    ozone: current.ozone,
                    dust: current.dust,
                    uv_index: current.uv_index
                },
                health_advice: this.getAirQualityAdvice(aqi, current.dust),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Air Quality API error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get health alerts based on weather conditions
     */
    async getWeatherHealthAlerts(location = 'gaza') {
        const [weather, airQuality] = await Promise.all([
            this.getCurrentWeather(location),
            this.getAirQuality(location)
        ]);

        const alerts = [];

        if (weather.success) {
            // Heat alert
            if (weather.data.temperature > 35) {
                alerts.push({
                    type: 'heat_wave',
                    severity: weather.data.temperature > 40 ? 'critical' : 'warning',
                    title: 'تحذير من موجة حر',
                    title_en: 'Heat Wave Warning',
                    message: `درجة الحرارة ${weather.data.temperature}°C. تجنب التعرض للشمس واشرب الكثير من الماء.`,
                    message_en: `Temperature is ${weather.data.temperature}°C. Avoid sun exposure and stay hydrated.`
                });
            }

            // Cold alert
            if (weather.data.temperature < 10) {
                alerts.push({
                    type: 'cold_weather',
                    severity: weather.data.temperature < 5 ? 'warning' : 'info',
                    title: 'طقس بارد',
                    title_en: 'Cold Weather Alert',
                    message: `درجة الحرارة ${weather.data.temperature}°C. حافظ على الدفء خاصة لكبار السن والأطفال.`,
                    message_en: `Temperature is ${weather.data.temperature}°C. Stay warm, especially elderly and children.`
                });
            }

            // High UV alert
            if (weather.data.uv_index > 8) {
                alerts.push({
                    type: 'uv_warning',
                    severity: weather.data.uv_index > 10 ? 'critical' : 'warning',
                    title: 'تحذير من الأشعة فوق البنفسجية',
                    title_en: 'High UV Index Warning',
                    message: `مؤشر الأشعة فوق البنفسجية ${weather.data.uv_index}. استخدم واقي الشمس وتجنب التعرض المباشر.`,
                    message_en: `UV Index is ${weather.data.uv_index}. Use sunscreen and avoid direct exposure.`
                });
            }

            // Humidity alert (affects respiratory patients)
            if (weather.data.humidity > 80) {
                alerts.push({
                    type: 'high_humidity',
                    severity: 'info',
                    title: 'رطوبة عالية',
                    title_en: 'High Humidity Alert',
                    message: `نسبة الرطوبة ${weather.data.humidity}%. مرضى الجهاز التنفسي يجب الحذر.`,
                    message_en: `Humidity is ${weather.data.humidity}%. Respiratory patients should be cautious.`
                });
            }
        }

        if (airQuality.success) {
            // Poor air quality alert
            if (airQuality.data.aqi > 50) {
                alerts.push({
                    type: 'air_quality',
                    severity: airQuality.data.aqi > 100 ? 'critical' : 'warning',
                    title: 'تنبيه جودة الهواء',
                    title_en: 'Air Quality Alert',
                    message: `جودة الهواء: ${airQuality.data.aqi_level.ar}. ${airQuality.data.aqi_level.advice_ar}`,
                    message_en: `Air Quality: ${airQuality.data.aqi_level.en}. ${airQuality.data.aqi_level.advice_en}`
                });
            }

            // Dust alert
            if (airQuality.data.dust > 100) {
                alerts.push({
                    type: 'dust_storm',
                    severity: airQuality.data.dust > 200 ? 'critical' : 'warning',
                    title: 'تحذير من الغبار',
                    title_en: 'Dust Warning',
                    message: 'مستوى الغبار مرتفع. مرضى الربو والحساسية يجب البقاء في الداخل.',
                    message_en: 'High dust levels. Asthma and allergy patients should stay indoors.'
                });
            }
        }

        return {
            success: true,
            location: weather.success ? weather.location : location,
            alerts: alerts,
            weather: weather.success ? weather.data : null,
            airQuality: airQuality.success ? airQuality.data : null,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get 7-day health forecast
     */
    async getHealthForecast(location = 'gaza') {
        const coords = this.locations[location.toLowerCase()] || this.defaultLocation;

        try {
            const response = await axios.get(this.weatherApiUrl, {
                params: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    daily: 'temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max',
                    timezone: 'Asia/Gaza',
                    forecast_days: 7
                },
                timeout: 5000
            });

            const daily = response.data.daily;
            const forecast = [];

            for (let i = 0; i < daily.time.length; i++) {
                forecast.push({
                    date: daily.time[i],
                    temp_max: daily.temperature_2m_max[i],
                    temp_min: daily.temperature_2m_min[i],
                    uv_max: daily.uv_index_max[i],
                    rain_probability: daily.precipitation_probability_max[i],
                    health_tips: this.getDailyHealthTips(
                        daily.temperature_2m_max[i],
                        daily.uv_index_max[i],
                        daily.precipitation_probability_max[i]
                    )
                });
            }

            return {
                success: true,
                location: coords.name,
                forecast: forecast
            };
        } catch (error) {
            console.error('Forecast API error:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Helper methods
    getHealthAdvice(weather) {
        const advice = [];
        
        if (weather.temperature_2m > 30) {
            advice.push({
                ar: 'اشرب الكثير من الماء وتجنب أشعة الشمس المباشرة',
                en: 'Drink plenty of water and avoid direct sunlight'
            });
        }
        
        if (weather.uv_index > 6) {
            advice.push({
                ar: 'استخدم واقي الشمس وارتدِ قبعة',
                en: 'Use sunscreen and wear a hat'
            });
        }
        
        if (weather.relative_humidity_2m > 70) {
            advice.push({
                ar: 'مرضى الربو: احتفظ بالبخاخ معك',
                en: 'Asthma patients: Keep your inhaler handy'
            });
        }

        return advice;
    }

    getAQILevel(aqi) {
        if (aqi <= 20) return { en: 'Good', ar: 'جيد', advice_ar: 'الهواء نقي.', advice_en: 'Air quality is good.' };
        if (aqi <= 40) return { en: 'Fair', ar: 'مقبول', advice_ar: 'جودة الهواء مقبولة.', advice_en: 'Air quality is acceptable.' };
        if (aqi <= 60) return { en: 'Moderate', ar: 'متوسط', advice_ar: 'قد يتأثر الأشخاص الحساسون.', advice_en: 'Sensitive people may be affected.' };
        if (aqi <= 80) return { en: 'Poor', ar: 'سيء', advice_ar: 'تجنب النشاط في الهواء الطلق.', advice_en: 'Avoid outdoor activities.' };
        if (aqi <= 100) return { en: 'Very Poor', ar: 'سيء جداً', advice_ar: 'البقاء في الداخل.', advice_en: 'Stay indoors.' };
        return { en: 'Extremely Poor', ar: 'خطير', advice_ar: 'تجنب الخروج تماماً!', advice_en: 'Avoid going outside!' };
    }

    getAirQualityAdvice(aqi, dust) {
        const advice = [];
        
        if (aqi > 50) {
            advice.push({
                ar: 'مرضى الجهاز التنفسي يجب تجنب الخروج',
                en: 'Respiratory patients should avoid going outside'
            });
        }
        
        if (dust > 50) {
            advice.push({
                ar: 'ارتدِ كمامة عند الخروج',
                en: 'Wear a mask when going outside'
            });
        }

        return advice;
    }

    getDailyHealthTips(maxTemp, uvMax, rainProb) {
        const tips = [];
        
        if (maxTemp > 32) tips.push({ ar: 'يوم حار - اشرب الماء بكثرة', en: 'Hot day - Stay hydrated' });
        if (uvMax > 7) tips.push({ ar: 'أشعة UV قوية - استخدم واقي شمس', en: 'High UV - Use sunscreen' });
        if (rainProb > 50) tips.push({ ar: 'احتمال مطر - احمل مظلة', en: 'Chance of rain - Carry umbrella' });
        
        return tips;
    }

    /**
     * Get list of supported locations
     */
    getSupportedLocations() {
        return Object.entries(this.locations).map(([key, value]) => ({
            id: key,
            name: value.name,
            name_ar: value.name_ar
        }));
    }
}

module.exports = new WeatherHealthService();
