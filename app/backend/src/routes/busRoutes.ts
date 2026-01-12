import { Router } from "express";
import {
    getAllLines,
    getLineDetails,
    getLineTraffic,
    getLineIncidents,
    getLinePrediction,
    getStopsBulk
} from "../services/busService";

const router = Router();

router.get("/", async (_, res) => {
  console.log("GET /lines");
  res.json(await getAllLines());
});

router.get("/:id", async (req, res) => {
  console.log(`GET /lines/${req.params.id}`);
  let rep = await getLineDetails(req.params.id);
  res.json(rep);
});
router.get("/:id/traffic", async (req, res) => {
  console.log(`GET /lines/${req.params.id}/traffic`);
  res.json(await getLineTraffic(req.params.id));
});
router.get("/:id/incidents", async (req, res) => {
  console.log(`GET /lines/${req.params.id}/incidents`);
  res.json(await getLineIncidents(req.params.id));
});
router.get("/:id/prediction", async (req, res) => {
  console.log(`GET /lines/${req.params.id}/prediction`);
  res.json(await getLinePrediction(req.params.id));
});
router.post("/bulk", async (req, res) => {
    console.log("POST /lines/bulk");
    res.json(await getStopsBulk(req.body.ids));
})

export default router;