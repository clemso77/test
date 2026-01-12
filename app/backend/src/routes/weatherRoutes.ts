import {Router} from "express";
import {getWeather} from "../services/weatherService";

const router = Router();

router.get("/current", async (req, res) => {
  console.log("GET /current");
  res.json(getWeather());
});

export default router;