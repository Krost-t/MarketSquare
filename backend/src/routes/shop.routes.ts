import { Router } from "express";
import { authMiddleware, merchantMiddleware, optionalAuthMiddleware, ownsShopMiddleware } from "../middlewares/user.middleware.ts";

import {
    listShopsHandler,
    getShopHandler,
    listShopProductsHandler,
    listShopReviewsHandler,
    getMyShopHandler,
    createShopHandler,
    updateShopHandler,
    deleteShopHandler,
} from "../controllers/shop.controller.ts";


const shopRouter: Router = Router();

shopRouter.get("/mine", authMiddleware, merchantMiddleware, getMyShopHandler);

// ===== Public =====

// liste de toutes les boutiques (catalogue vendeurs)
shopRouter.get("/", listShopsHandler);

// page d'une boutique (style Amazon)
shopRouter.get("/:id", getShopHandler);

// tous les produits d'une boutique
shopRouter.get("/:id/products", optionalAuthMiddleware, listShopProductsHandler);

// tous les avis sur une boutique
shopRouter.get("/:id/reviews", listShopReviewsHandler);


// ===== MERCHANT uniquement =====

// creation de sa boutique (un seul shop par merchant -> Shop.merchantId @unique)
shopRouter.post("/", authMiddleware, merchantMiddleware, createShopHandler);

// modification de sa propre boutique
shopRouter.patch("/:id", authMiddleware, merchantMiddleware, ownsShopMiddleware, updateShopHandler);

// suppression de sa propre boutique
shopRouter.delete("/:id", authMiddleware, merchantMiddleware, ownsShopMiddleware, deleteShopHandler);


export default shopRouter;
