import { Router } from "express";
import {
    getAllLines,
    getLineDetails,
    getLineTraffic,
    getLineIncidents,
    getLinePrediction,
    getStopsBulk
} from "../services/busService";
import {IncidentType} from "../Model/Model";

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
router.get("/:id/prediction/:incident", async (req, res) => {
  console.log(`POST /lines/${req.params.id}/prediction/${req.params.incident}`);
  res.json(await getLinePrediction(req.params.id, req.params.incident as IncidentType));
});
router.post("/bulk", async (req, res) => {
    console.log("POST /lines/bulk");
    res.json(await getStopsBulk(req.body.ids));
})

export default router;