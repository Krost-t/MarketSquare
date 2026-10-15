import { Router } from "express";
import {authMiddleware, ownsReviewMiddleware} from "../middlewares/user.middleware.ts";
import {
    createReviewHandler,
    updateReviewHandler,
    deleteReviewHandler,
} from "../controllers/review.controller.ts";


const reviewRouter: Router = Router();


reviewRouter.post("/", authMiddleware, createReviewHandler);


reviewRouter.patch("/:id", authMiddleware, ownsReviewMiddleware, updateReviewHandler);


reviewRouter.delete("/:id", authMiddleware, ownsReviewMiddleware, deleteReviewHandler);


export default reviewRouter;
