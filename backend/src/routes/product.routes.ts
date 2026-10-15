import { Router } from "express";
import {authMiddleware, merchantMiddleware, optionalAuthMiddleware, ownsProductMiddleware} from "../middlewares/user.middleware.ts";
import {
    listProductsHandler,
    getProductHandler,
    listProductReviewsHandler,
    createProductHandler,
    updateProductHandler,
    deleteProductHandler,
    lookupBarcodeHandler,
} from "../controllers/product.controller.ts";


const productRouter: Router = Router();


productRouter.get("/", listProductsHandler);

productRouter.get("/lookup/:barcode", authMiddleware, merchantMiddleware, lookupBarcodeHandler);

productRouter.get("/:id", optionalAuthMiddleware, getProductHandler);

productRouter.get("/:id/reviews", listProductReviewsHandler);

productRouter.post("/", authMiddleware, merchantMiddleware, createProductHandler);

productRouter.patch("/:id", authMiddleware, merchantMiddleware, ownsProductMiddleware, updateProductHandler);

productRouter.delete("/:id", authMiddleware, merchantMiddleware, ownsProductMiddleware, deleteProductHandler);


export default productRouter;
