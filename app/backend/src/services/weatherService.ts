import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import {WeatherData} from "../Model/Model";



let cache: WeatherData | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000;

export async function getWeather(): Promise<WeatherData> {
    const now = Date.now();
    const API_URL = process.env.WEATHER_API_URL + process.env.WEATHER_API_KEY;
    if (cache && (now - cacheTime) < CACHE_DURATION) {
        return cache
    }

    try {
        fetch(API_URL).then((res) => {
            res.json().then((data) => {
                const now = new Date();
                const h0 = data.hourly?.data?.[0];

                const TEMP = data.current?.temperature ?? h0?.temperature;

                // Données non disponibles dans le jeu
                // on prends des valeurs moyennes
                const DEW_POINT_TEMP = 10;
                const RELATIVE_HUMIDITY = 0;
                const VISIBILITY = 50;
                const STATION_PRESSURE = 80;
                const HUMIDEX = 0;

                const PRECIP_AMOUNT =
                    data.current?.precipitation?.total ?? h0?.precipitation?.total ?? 0;

                const WEATHER_ENG_DESC =
                    data.current?.summary ?? h0?.summary ?? "Unknown";

                const WIND_SPEED =
                    data.current?.wind?.speed ?? h0?.wind?.speed;

                const WIND_DIRECTION =
                    data.current?.wind?.angle ?? h0?.wind?.angle;

                const localDateTime = h0?.date ? new Date(h0.date) : now;

                const weather: WeatherData = {
                    TEMP: Number(TEMP),
                    LOCAL_DATE: localDateTime.toISOString().slice(0, 10),
                    LOCAL_TIME: localDateTime.toTimeString().slice(0, 8),
                    WEEK_DAY: localDateTime.toLocaleDateString("en-US", { weekday: "long" }),

                    WIND_SPEED: Number(WIND_SPEED),
                    WIND_DIRECTION: Number(WIND_DIRECTION),

                    PRECIP_AMOUNT: Number(PRECIP_AMOUNT),
                    WEATHER_ENG_DESC,

                    RELATIVE_HUMIDITY: RELATIVE_HUMIDITY,
                    // Pas de données actuel
                    VISIBILITY: VISIBILITY, // Pas de données actuel
                    STATION_PRESSURE: STATION_PRESSURE,
                    DEW_POINT_TEMP: DEW_POINT_TEMP,

                    HUMIDEX: HUMIDEX,

                    LOCAL_MONTH: localDateTime.getMonth() + 1,
                    LOCAL_DAY: localDateTime.getDate(),
                };
                cache = weather ?? cache;
            })
        });
        cacheTime = now;
        return cache;
    } catch (error) {
        console.error('Weather data error:', error);
    }
}

function getDayOfWeek(dateString: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateString);
    return days[date.getDay()];
}
function computeHumidex(tempC: number, dewPointC: number): number {
    // e = 6.11 * exp(5417.7530 * (1/273.16 - 1/(273.15 + Td)))
    const e =
        6.11 *
        Math.exp(5417.7530 * (1 / 273.16 - 1 / (273.15 + dewPointC)));

    // humidex = T + 0.5555*(e - 10)
    return tempC + 0.5555 * (e - 10);
}
