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

let cache: WeatherData | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000;

export async function getWeather(): Promise<CurrentWeather> {
    const now = Date.now();
    if (cache && (now - cacheTime) < CACHE_DURATION) {
        return formatWeatherForFrontend(cache);
    }

    try {
        const dataDir = process.env.DATA_DIR || '../../../../data';
        const climatePath = path.join(__dirname, dataDir, 'climate/climate-hourly-2023.csv');
        const fileContent = fs.readFileSync(climatePath, 'utf-8');
        
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
        }) as ClimateRecord[];

        const latest = records[records.length - 1];
        
        if (!latest) {
            throw new Error('No weather data available');
        }

        const weatherData: WeatherData = {
            TEMP: parseFloat(latest.TEMP) || 0,
            DEW_POINT_TEMP: parseFloat(latest.DEW_POINT_TEMP) || 0,
            HUMIDEX: latest.HUMIDEX ? parseFloat(latest.HUMIDEX) : null,
            PRECIP_AMOUNT: parseFloat(latest.PRECIP_AMOUNT) || 0,
            RELATIVE_HUMIDITY: parseFloat(latest.RELATIVE_HUMIDITY) || 0,
            STATION_PRESSURE: parseFloat(latest.STATION_PRESSURE) || 0,
            VISIBILITY: parseFloat(latest.VISIBILITY) || 0,
            WEATHER_ENG_DESC: latest.WEATHER_ENG_DESC || 'Unknown',
            WIND_DIRECTION: latest.WIND_DIRECTION ? parseFloat(latest.WIND_DIRECTION) : null,
            WIND_SPEED: latest.WIND_SPEED ? parseFloat(latest.WIND_SPEED) : null,
            LOCAL_DATE: latest.LOCAL_DATE,
            LOCAL_TIME: `${latest.LOCAL_HOUR}:00:00`,
            WEEK_DAY: getDayOfWeek(latest.LOCAL_DATE),
            LOCAL_MONTH: parseInt(latest.LOCAL_MONTH),
            LOCAL_DAY: parseInt(latest.LOCAL_DAY),
        };

        cache = weatherData;
        cacheTime = now;

        return formatWeatherForFrontend(weatherData);
    } catch (error) {
        console.error('Weather data error:', error);
        return getDefaultWeather();
    }
}

export async function getWeatherForPrediction(): Promise<Omit<WeatherData, 'LOCAL_DATE' | 'WEEK_DAY'>> {
    const weather = await getWeather();
    const now = new Date();
    
    let humidex = weather.humidex;
    if (humidex === null) {
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

function getDayOfWeek(dateString: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateString);
    return days[date.getDay()];
}

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