import {Router} from "express";
import {getGlobalStats, getTopLines, getIncidentTypePredictions} from "../services/statsService";

const router = Router();

router.get("/global", async (_, res) => {
  console.log("GET /stats/global");
  try {
    const stats = await getGlobalStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting global stats:", error);
    res.status(500).json({ error: "Failed to get global stats" });
  }
});

router.get("/top-lines", async (req, res) => {
  console.log("GET /stats/top-lines");
  try {
    const count = parseInt(req.query.count as string) || 5;
    const topLines = await getTopLines(count);
    res.json(topLines);
  } catch (error) {
    console.error("Error getting top lines:", error);
    res.status(500).json({ error: "Failed to get top lines" });
  }
});

router.get("/incident-predictions", async (_, res) => {
  console.log("GET /stats/incident-predictions");
  try {
    const predictions = await getIncidentTypePredictions();
    res.json(predictions);
  } catch (error) {
    console.error("Error getting incident predictions:", error);
    res.status(500).json({ error: "Failed to get incident predictions" });
  }
});

export default router;