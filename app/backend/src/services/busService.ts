// src/services/bus.service.ts
import {parse} from "csv-parse/sync";
import {readFile} from "node:fs/promises";
import {Arret, Ligne,} from "../Model/Model";
import {getPrediction} from "./predictionService";

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

export async function getLinePrediction(id: string, predictionData?: PredictionData) {
    if (!predictionData) {
        return {
            success: false,
            error: "No prediction data provided. Please provide weather and temporal data."
        };
    }

    try {
        // Add the route ID to the prediction data
        const inputData = {
            ROUTE: Number.parseInt(id),
            ...predictionData
        };

        const prediction = await getPrediction(inputData);

        if (prediction !== null) {
            return {
                success: true,
                lineId: id,
                predictedDelay: prediction,
                unit: "minutes"
            };
        } else {
            return {
                success: false,
                error: "Prediction API returned null"
            };
        }
    } catch (error) {
        console.error("Error in getLinePrediction:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}