import express from "express";
import http from "http";
import { authRoute } from "./Routes/AuthRouter.js";
import { initWebSocket } from "./websockets/index.js";
import { RoomRoute } from "./Routes/RoomRouter.js";
import cors from "cors";
import { userRoute } from "./Routes/UserRotuer.js";
import { chatRoute } from "./Routes/ChatRouter.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}))

// REQUIRED: handle preflight requests
app.options("/(.*)", cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json())
app.use(cookieParser())

app.use("/api", authRoute)
app.use("/api", RoomRoute)
app.use("/api", userRoute)
app.use("/api/", chatRoute)

const server = http.createServer(app);
initWebSocket(server)

server.listen(PORT, () => {
    console.log(`Listening On Port ${PORT} with Both HTTP & WS`)
});