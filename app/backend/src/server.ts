import express from "express"
import cors from "cors";
import busRoutes from "./routes/busRoutes";
import dotenv from "dotenv";
import statsRoutes from "./routes/statsRoutes";
import weatherRoutes from "./routes/weatherRoutes";

dotenv.config();
const app = express()
app.use(cors());
app.use(express.json());

app.use("/stats", statsRoutes);
app.use("/weather", weatherRoutes);
app.use("/lines", busRoutes)
app.use("/stops", busRoutes)

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Backend running @ http://localhost:${PORT}`));
