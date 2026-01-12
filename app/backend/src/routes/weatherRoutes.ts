import {Router} from "express";
import {getWeather, getWeatherForPrediction} from "../services/weatherService";

const router = Router();

router.get("/current", async (_, res) => {
  console.log("GET /weather/current");
  try {
    const weather = await getWeather();
    res.json(weather);
  } catch (error) {
    console.error("Error getting weather:", error);
    res.status(500).json({ error: "Failed to get weather data" });
  }
});

router.get("/prediction-data", async (_, res) => {
  console.log("GET /weather/prediction-data");
  try {
    const weatherData = await getWeatherForPrediction();
    res.json(weatherData);
  } catch (error) {
    console.error("Error getting weather for prediction:", error);
    res.status(500).json({ error: "Failed to get weather prediction data" });
  }
});

export default router;