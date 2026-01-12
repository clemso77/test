// src/map/WeatherTempControl.ts
import mapboxgl from "mapbox-gl";

export class WeatherTempControl implements mapboxgl.IControl {
    private _container!: HTMLDivElement;
    private temperature: number;
    // @ts-ignore
    private _map?: mapboxgl.Map;

    constructor(temperature: number) {
        this.temperature = temperature;
    }

    onAdd(map: mapboxgl.Map) {
        this._map = map;
        this._container = document.createElement("div");
        this._container.className = "weather-temp-control";
        this._container.textContent = `${Math.round(this.temperature)}°C`;
        return this._container;
    }

    onRemove() {
        this._container?.parentNode?.removeChild(this._container);
        this._map = undefined;
    }

    updateTemperature(nextTemp: number) {
        this.temperature = nextTemp;
        this._container.textContent = `${Math.round(this.temperature)}°C`;
    }
}
