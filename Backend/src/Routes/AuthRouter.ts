import { Router } from "express";
import { SignIn, SignUp } from "../controllers/authControllers.js";

export const authRoute = Router();

authRoute.post("/signup", SignUp);
authRoute.post("/signin", SignIn);