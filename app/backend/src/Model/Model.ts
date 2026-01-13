export type Ligne = {
    nom?: string,
    couleur?: string,
    long_nom?: string
    id: number;
    geometries?: [number, number][];
    stopIds?:  number[];
};

export type Arret = {
    nom: string;
    id: number;
    position: {
        lat: number;
        long: number;
    };
    sequence: number;
};

export type WeatherData = {
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

export type PredictionInput = {
    ROUTE: number;
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

export type LinePrediction = {
    lineId: number;
    predictedDelay: number;
    byIncident: Record<IncidentType, number>;
    topIncident?: IncidentType;
    isLoading: boolean;
    error?: string;
}

export type PredictionOutput = {
    status: number;
    prediction: number;
    incident: IncidentType;
    route: number;
}

export type IncidentType = 'Safety' | 'Operational' |'Technical' | 'External' |'Other';