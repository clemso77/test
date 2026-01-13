import {Router} from "express";
import {getWeather} from "../services/weatherService";

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

export default router;