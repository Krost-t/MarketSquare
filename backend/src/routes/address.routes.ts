import { Router } from "express";
import {authMiddleware} from "../middlewares/auth.middleware.ts";
import {
    listMyAddressesHandler,
    getOneAddressHandler,
    createAddressHandler,
    updateAddressHandler,
    deleteAddressHandler,
} from "../controllers/address.controller.ts";


const addressRouter: Router = Router();

addressRouter.use(authMiddleware);

addressRouter.get("/", listMyAddressesHandler);

addressRouter.get("/:id", getOneAddressHandler);

addressRouter.post("/", createAddressHandler);

addressRouter.patch("/:id", updateAddressHandler);

addressRouter.delete("/:id", deleteAddressHandler);


export default addressRouter;
