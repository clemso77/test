import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface WeatherData {
    TEMP: number;
    DEW_POINT_TEMP: number;
    HUMIDEX: number | null;
    PRECIP_AMOUNT: number;
    RELATIVE_HUMIDITY: number;
    STATION_PRESSURE: number;
    VISIBILITY: number;
    WEATHER_ENG_DESC: string;
    WIND_DIRECTION: number | null;
    WIND_SPEED: number | null;
    LOCAL_DATE: string;
    LOCAL_TIME: string;
    WEEK_DAY: string;
    LOCAL_MONTH: number;
    LOCAL_DAY: number;
}

interface CurrentWeather {
    temperature: number;
    dewPoint: number;
    humidity: number;
    pressure: number;
    visibility: number;
    description: string;
    windSpeed: number | null;
    windDirection: number | null;
    precipitation: number;
    humidex: number | null;
    timestamp: string;
}

interface ClimateRecord {
    TEMP: string;
    DEW_POINT_TEMP: string;
    HUMIDEX: string;
    PRECIP_AMOUNT: string;
    RELATIVE_HUMIDITY: string;
    STATION_PRESSURE: string;
    VISIBILITY: string;
    WEATHER_ENG_DESC: string;
    WIND_DIRECTION: string;
    WIND_SPEED: string;
    LOCAL_DATE: string;
    LOCAL_HOUR: string;
    LOCAL_MONTH: string;
    LOCAL_DAY: string;
}

let cachedWeatherData: WeatherData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

/**
 * Get the latest weather data from the most recent climate dataset
 * In a production environment, this would call a real-time weather API
 */
export async function getWeather(): Promise<CurrentWeather> {
    // Check cache
    const now = Date.now();
    if (cachedWeatherData && (now - cacheTimestamp) < CACHE_DURATION) {
        return formatWeatherForFrontend(cachedWeatherData);
    }

    try {
        // Read the most recent climate data file (2023 is the latest in our dataset)
        const dataDir = process.env.DATA_DIR || '../../../../data';
        const climatePath = path.join(__dirname, dataDir, 'climate/climate-hourly-2023.csv');
        const fileContent = fs.readFileSync(climatePath, 'utf-8');
        
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
        }) as ClimateRecord[];

        // Get the last record (most recent weather data)
        const latestRecord = records[records.length - 1];
        
        if (!latestRecord) {
            throw new Error('No weather data available');
        }

        // Parse the data
        const weatherData: WeatherData = {
            TEMP: parseFloat(latestRecord.TEMP) || 0,
            DEW_POINT_TEMP: parseFloat(latestRecord.DEW_POINT_TEMP) || 0,
            HUMIDEX: latestRecord.HUMIDEX ? parseFloat(latestRecord.HUMIDEX) : null,
            PRECIP_AMOUNT: parseFloat(latestRecord.PRECIP_AMOUNT) || 0,
            RELATIVE_HUMIDITY: parseFloat(latestRecord.RELATIVE_HUMIDITY) || 0,
            STATION_PRESSURE: parseFloat(latestRecord.STATION_PRESSURE) || 0,
            VISIBILITY: parseFloat(latestRecord.VISIBILITY) || 0,
            WEATHER_ENG_DESC: latestRecord.WEATHER_ENG_DESC || 'Unknown',
            WIND_DIRECTION: latestRecord.WIND_DIRECTION ? parseFloat(latestRecord.WIND_DIRECTION) : null,
            WIND_SPEED: latestRecord.WIND_SPEED ? parseFloat(latestRecord.WIND_SPEED) : null,
            LOCAL_DATE: latestRecord.LOCAL_DATE,
            LOCAL_TIME: `${latestRecord.LOCAL_HOUR}:00:00`,
            WEEK_DAY: getDayOfWeek(latestRecord.LOCAL_DATE),
            LOCAL_MONTH: parseInt(latestRecord.LOCAL_MONTH),
            LOCAL_DAY: parseInt(latestRecord.LOCAL_DAY),
        };

        // Update cache
        cachedWeatherData = weatherData;
        cacheTimestamp = now;

        return formatWeatherForFrontend(weatherData);
    } catch (error) {
        console.error('Error reading weather data:', error);
        // Return default weather data if file cannot be read
        return getDefaultWeather();
    }
}

/**
 * Get weather data formatted for prediction API
 */
export async function getWeatherForPrediction(): Promise<Omit<WeatherData, 'LOCAL_DATE' | 'WEEK_DAY'>> {
    const weather = await getWeather();
    
    // Use current time and day instead of dataset time
    const now = new Date();
    
    // Calculate humidex if not available (simplified formula)
    // In production, use a proper meteorological library
    let humidex = weather.humidex;
    if (humidex === null && weather.temperature > 0) {
        // Simplified humidex approximation when not available
        // Real humidex formula is more complex and depends on dewpoint
        humidex = weather.temperature;
    } else if (humidex === null) {
        humidex = weather.temperature;
    }
    
    return {
        TEMP: weather.temperature,
        DEW_POINT_TEMP: weather.dewPoint,
        HUMIDEX: humidex,
        PRECIP_AMOUNT: weather.precipitation,
        RELATIVE_HUMIDITY: weather.humidity,
        STATION_PRESSURE: weather.pressure,
        VISIBILITY: weather.visibility,
        WEATHER_ENG_DESC: weather.description,
        WIND_DIRECTION: weather.windDirection || 0,
        WIND_SPEED: weather.windSpeed || 0,
        LOCAL_TIME: now.toTimeString().split(' ')[0],
        LOCAL_MONTH: now.getMonth() + 1,
        LOCAL_DAY: now.getDate(),
    };
}

/**
 * Format weather data for frontend display
 */
function formatWeatherForFrontend(data: WeatherData): CurrentWeather {
    return {
        temperature: data.TEMP,
        dewPoint: data.DEW_POINT_TEMP,
        humidity: data.RELATIVE_HUMIDITY,
        pressure: data.STATION_PRESSURE,
        visibility: data.VISIBILITY,
        description: data.WEATHER_ENG_DESC,
        windSpeed: data.WIND_SPEED,
        windDirection: data.WIND_DIRECTION,
        precipitation: data.PRECIP_AMOUNT,
        humidex: data.HUMIDEX,
        timestamp: data.LOCAL_DATE,
    };
}

/**
 * Get day of week from date string
 */
function getDayOfWeek(dateString: string): string {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const date = new Date(dateString);
    return days[date.getDay()];
}

/**
 * Get default weather data as fallback
 */
function getDefaultWeather(): CurrentWeather {
    return {
        temperature: 5.0,
        dewPoint: 2.0,
        humidity: 75.0,
        pressure: 101.3,
        visibility: 15.0,
        description: 'Clear',
        windSpeed: 10.0,
        windDirection: 180.0,
        precipitation: 0.0,
        humidex: 3.5,
        timestamp: new Date().toISOString(),
    };
}