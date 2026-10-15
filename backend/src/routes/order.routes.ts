import { Router } from "express";
import {authMiddleware, merchantMiddleware} from "../middlewares/user.middleware.ts";
import {
    listMyOrdersHandler,
    getMyOrderHandler,
    checkoutHandler,
    cancelMyOrderHandler,
    listShopOrdersHandler,
    updateOrderStatusHandler,
} from "../controllers/order.controller.ts";


const orderRouter: Router = Router();

orderRouter.use(authMiddleware);


orderRouter.get("/", listMyOrdersHandler);

orderRouter.get("/shop/mine", merchantMiddleware, listShopOrdersHandler);

orderRouter.get("/:id", getMyOrderHandler);

orderRouter.post("/checkout", checkoutHandler);

orderRouter.patch("/:id/cancel", cancelMyOrderHandler);

orderRouter.patch("/:id/status", merchantMiddleware, updateOrderStatusHandler);


export default orderRouter;
