import {useEffect, useRef} from "react";
import {WeatherTempControl} from "./WeatherTempControl.ts";

interface WeatherProps {
    map: mapboxgl.Map;
    temperature: number;
    condition: string;
}

export function Weather({ map, temperature, condition }: WeatherProps) {

    const tempControlRef = useRef<WeatherTempControl | null>(null);

    useEffect(() => {
        const zoomBasedReveal = (value: any) => {
            return ['interpolate', ['linear'], ['zoom'], 11, 0.0, 13, value];
        };

        // @ts-ignore
        map.setRain({ density: 0 });
        // @ts-ignore
        map.setSnow({ density: 0 });

        switch (condition) {
            case "rain":
                // @ts-ignore
                map.setRain({
                    density: zoomBasedReveal(0.2),
                    intensity: 1.0,
                    color: '#a8adbc',
                    opacity: 0.4,
                    direction: [0, 80],
                    'droplet-size': [2.6, 18.2],
                    'distortion-strength': 0.7,
                    'center-thinning': 0
                })
                break;
            case "snow":
                // @ts-ignore
                map.setSnow({
                    density: zoomBasedReveal(0.4),
                    intensity: 1.0,
                    'center-thinning': 0.1,
                    direction: [0, 50],
                    opacity: 1.0,
                    color: `#ffffff`,
                    'flake-size': 0.71,
                    vignette: zoomBasedReveal(0.3),
                    'vignette-color': `#ffffff`
                });
                break;
        }

        // Contrôle température
        if (!tempControlRef.current) {
            tempControlRef.current = new WeatherTempControl(temperature);
            map.addControl(tempControlRef.current, "top-right");
            setInterval(() => {
                temperature += (Math.random() * 2 - 1);
                tempControlRef.current?.updateTemperature(temperature);
            }, 1000);
        } else {
            tempControlRef.current.updateTemperature(temperature);
        }

        return () => {
            if (tempControlRef.current) {
                map.removeControl(tempControlRef.current);
                tempControlRef.current = null;
            }
        };



    }, [map, condition]);

    return null;
}
