// src/services/bus.service.ts
import {parse} from "csv-parse/sync";
import {readFile} from "node:fs/promises";
import {Arret, IncidentType, Ligne, LinePrediction, PredictionInput, PredictionOutput,} from "../Model/Model";
import {getPrediction} from "./predictionService";
import {getWeather} from "./weatherService";

// Define the prediction data interface for type safety
interface PredictionData {
    LOCAL_TIME: string;
    WEEK_DAY: string;
    INCIDENT: string;
    LOCAL_MONTH: number;
    LOCAL_DAY: number;
    TEMP: number;
    DEW_POINT_TEMP: number;
    HUMIDEX: number;
    PRECIP_AMOUNT: number;
    RELATIVE_HUMIDITY: number;
    STATION_PRESSURE: number;
    VISIBILITY: number;
    WEATHER_ENG_DESC: string;
    WIND_DIRECTION: number;
    WIND_SPEED: number;
}


export async function getAllLines() {
    var filePath = "../res/extract/lignes_bus.json"
    return await readFile(filePath).then((data) => {
        let json = JSON.parse(data.toString());
        let lignes: Ligne[] = [];
        for (let i = 0; i < json.lignes.length; i++) {
            let l: Ligne = {id: json.lignes[i]};
            lignes.push(l);
        }
        return lignes;
    }).catch((err) => {
        console.error(err);
        return null;
    });
}

export async function getLineDetails(id: string){
    //const apiKey = process.env.MAPBOX_ACCESS_TOKEN;

    //const query = await fetch('https://api.mapbox.com/directions/v5/mapbox/driving/'+depLat+','+depLong+';'+arrLat+','+arrLong+'?geometries=geojson&access_token=' + apiKey);
    //const data = await query.json();
    var filePath = "../res/extract/lines_normalized.json"
    return await readFile(filePath).then((data) => {
        let json = JSON.parse(data.toString());
        return json.lignes.find((line: any) => line.id === Number.parseInt(id)) as Ligne;
    }).catch((err) => {
        console.error(err);
        return null;
    });
}

export async function getStopsBulk(ids: number[]) {
    const filePath = "../res/extract/stops_normalized.json";

    try {
        if (!Array.isArray(ids) || ids.length === 0) return [];

        // dédoublonner et sécuriser
        const wanted = new Set(ids.map(Number).filter(Number.isFinite));

        const data = await readFile(filePath);
        const json = JSON.parse(data.toString());

        const stops: Arret[] = json.stops ?? [];
        return stops.filter((s) => wanted.has(s.id));
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function getLineTraffic(id: string) {
    return {}
}

export async function getLineIncidents(id: string) {
    return {}
}

export async function getLinePrediction(id: string, incidents: IncidentType) {
    if (!incidents) {
        return {
            success: false,
            error: "No prediction data provided. Please provide weather and temporal data."
        };
    }

    try {
        getWeather().then((data) => {
            if(!data) throw new Error("Weather API returned null");
            const inputData = {
                ROUTE: Number(id),
                LOCAL_TIME: data.LOCAL_TIME,
                WEEK_DAY: data.WEEK_DAY,

                INCIDENT: incidents,
                LOCAL_MONTH: data.LOCAL_MONTH,
                LOCAL_DAY: data.LOCAL_DAY,

                TEMP: data.TEMP,
                DEW_POINT_TEMP: data.DEW_POINT_TEMP,
                HUMIDEX: data.HUMIDEX,
                PRECIP_AMOUNT: data.PRECIP_AMOUNT,
                RELATIVE_HUMIDITY: data.RELATIVE_HUMIDITY,
                STATION_PRESSURE: data.STATION_PRESSURE,
                VISIBILITY: data.VISIBILITY,
                WEATHER_ENG_DESC: data.WEATHER_ENG_DESC,
                WIND_DIRECTION: data.WIND_DIRECTION,
                WIND_SPEED: data.WIND_SPEED,

            }as PredictionInput;

            getPrediction(inputData).then((prediction) => {
                if (prediction.status == 200) {
                    console.log("Prediction reussi:", prediction);
                    return {
                        status: prediction.status,
                        prediction: prediction.prediction,
                        incident: incidents,
                        route: Number(id)
                    } as PredictionOutput;
                } else {
                    return {
                        status: prediction.status,
                        prediction: null,
                        incident: incidents,
                        route: Number(id)
                    }as PredictionOutput;
                }
            });
        })
    } catch (error) {
        console.error("Error in getLinePrediction:", error);
        return {
            status: 500,
            prediction: null,
            incident: incidents,
            route: Number(id)
        } as PredictionOutput;
    }
}