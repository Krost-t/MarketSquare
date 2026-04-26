import { Router } from "express";
import type { Request, Response } from "express";
import express from "express";

const authRouter: Router = express.Router();

authRouter.get("/login", (_req:Request, res:Response) => {
  res.json({"message": "Login route"});
});

authRouter.post("/register", (_req:Request, res:Response) => {
  res.json({"message": "Register route"});
});

export default authRouter;