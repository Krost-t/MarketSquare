import { Router } from "express";
import {registerHandler, loginHandler, logoutHandler, forgotPasswordHandler, resetPasswordHandler} from "../controllers/auth.controller.ts";


const authRouter: Router = Router();

authRouter.post("/login", loginHandler);

authRouter.post("/register", registerHandler);

authRouter.post("/logout", logoutHandler);

authRouter.post("/forgot-password",forgotPasswordHandler)

authRouter.post("/reset-password",resetPasswordHandler)


export default authRouter;
