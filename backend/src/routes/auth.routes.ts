import { Router } from "express";
import {registerHandler, loginHandler, logoutHandler} from "../controllers/auth.controller.ts";


const authRouter: Router = Router();

authRouter.post("/login", loginHandler);

authRouter.post("/register", registerHandler);

authRouter.post("/logout", logoutHandler);



export default authRouter;