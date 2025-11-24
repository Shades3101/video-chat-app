import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { response } from "../utils/responseHandler.js";
import dotenv from "dotenv"
dotenv.config()

export const secret = process.env.JWT_SECRET || "12345678bfdksjfkjsf";
console.log(secret)
export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
    
    const token = req.headers["authorization"] ?? "";

    const vtoken = jwt.verify(token, secret) as JwtPayload;
    
    if(token) {
        req.userId = vtoken.userId;
        next();
    } else {
        return response(res, 403, "Unauthorized Access")
    }
}