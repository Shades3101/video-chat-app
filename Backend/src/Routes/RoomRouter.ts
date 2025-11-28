import { Router } from "express";
import CreateRoom, { getAllRoom, getRoomId, userRooms } from "../controllers/roomController.js";
import authMiddleware from "../middleware/authMiddleware.js";

export const RoomRoute = Router();

RoomRoute.post("/create-room", authMiddleware, CreateRoom);
RoomRoute.get("/user-room", authMiddleware, userRooms)
RoomRoute.get("/all-rooms", getAllRoom)
RoomRoute.get("/room/:slug", authMiddleware, getRoomId)