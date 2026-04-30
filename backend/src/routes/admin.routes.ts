import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.ts";
import { adminMiddleware } from '../middlewares/admin.middleware.ts';
import { showAllUsersHandler, showOneUserHandler, deleteOneUserHandler } from '../controllers/admin.controller.ts';


const adminRouter: Router = Router();

adminRouter.use(authMiddleware, adminMiddleware)

// get all users
adminRouter.get("/users", showAllUsersHandler)

// get user by id
adminRouter.get("/users/:id",showOneUserHandler)
/* 
// create user
adminRouter.post("/create",createUserHandler)

// update user by id
adminRouter.put("/users/:id", updateUserHandler)

// update user by id just one field
adminRouter.patch("/users/:id", updateOneFieldUserHandler)
 */
// delete user by id
adminRouter.delete("/user/:id", deleteOneUserHandler)

export default adminRouter;