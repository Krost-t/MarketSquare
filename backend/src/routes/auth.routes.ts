import { Router } from "express";
import express from "express";
import {registerHandler, loginHandler, logoutHandler} from "../controllers/auth.controller.ts";


const authRouter: Router = express.Router();

authRouter.post("/login", loginHandler);

authRouter.post("/register", registerHandler);

authRouter.post("/logout", logoutHandler);



export default authRouter;