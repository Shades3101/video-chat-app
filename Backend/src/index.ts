import express from "express";
import http from "http";
import { authRoute } from "./Routes/AuthRouter.js";
import { initWebSocket } from "./websockets/index.js";
import { RoomRoute } from "./Routes/RoomRouter.js";
import cors from "cors";
import { userRoute } from "./Routes/UserRotuer.js";


const app = express();
app.use(cors)
app.use(express.json())

app.use("/api", authRoute)
app.use("/api", RoomRoute);
app.use("/api", userRoute)

const server = http.createServer(app);

initWebSocket(server)

server.listen(3001, () => {
    console.log("Listening On Port 3001 with Both HTTP & WS")
});