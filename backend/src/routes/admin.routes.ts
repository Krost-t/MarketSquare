import expres from 'express';
import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.ts";
import { adminMiddleware } from '../middlewares/admin.middleware.ts';
import { showAllUsersHandler } from '../controllers/admin.controller.ts';


const adminRouter: Router = expres.Router();

adminRouter.use(authMiddleware, adminMiddleware)

// get all users
adminRouter.get("/users", showAllUsersHandler)
/* 
// get user by id
adminRouter.get("/users/:id", (req: Request, res: Response) => {})

// create user
adminRouter.post("/create", (req: Request, res: Response) => {})

// update user by id
adminRouter.put("/update", (req: Request, res: Response) => {})

// update user by id just one field
adminRouter.patch("/update", (req: Request, res: Response) => {})

// delete user by id
adminRouter.delete("/delete/:id", (req: Request, res: Response) => {})
 */
export default adminRouter;