import { Router } from "express";
import {authMiddleware} from "../middlewares/user.middleware.ts";
import {
    getMyCartHandler,
    addItemHandler,
    updateItemQuantityHandler,
    removeItemHandler,
    clearCartHandler,
} from "../controllers/cart.controller.ts";


const cartRouter: Router = Router();

cartRouter.use(authMiddleware);

cartRouter.get("/", getMyCartHandler);


cartRouter.post("/items", addItemHandler);

cartRouter.patch("/items/:itemId", updateItemQuantityHandler);

cartRouter.delete("/items/:itemId", removeItemHandler);

cartRouter.delete("/", clearCartHandler);


export default cartRouter;
