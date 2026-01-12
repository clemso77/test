import {Router} from "express";
import {getGlobalStats} from "../services/statsService";

const router = Router();

router.get("/stats/global", async (_, res) => {
  console.log("GET /stats/global");
  res.json(await getGlobalStats());
});

export default router;