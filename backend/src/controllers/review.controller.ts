import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { getCurrentUser, getIdParam } from "../utils/request.ts";
import { stripUndefined } from "../utils/object.ts";
import { HttpError } from "../utils/http-error.ts";
import { refreshRating } from "../services/rating.service.ts";
import { createReviewSchema, updateReviewSchema } from "../validators/review.validator.ts";


const createReviewHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: authorId } = getCurrentUser(req);
    const { rating, comment, productId, shopId } = createReviewSchema.parse(req.body);

    if (productId) {
        const product = await prisma.product.findUnique({ where: { id: productId }, include: { shop: true } });
        if (!product) throw new HttpError(404, "Product not found");
        if (product.shop.merchantId === authorId) throw new HttpError(403, "You can't review your own product");
    }
    if (shopId) {
        const shop = await prisma.shop.findUnique({ where: { id: shopId } });
        if (!shop) throw new HttpError(404, "Shop not found");
        if (shop.merchantId === authorId) throw new HttpError(403, "You can't review your own shop");
    }

    const review = await prisma.review.create({
        data: stripUndefined({ rating, comment, productId, shopId, authorId }),
        include: { author: { select: { id: true, username: true, avatarUrl: true } } },
    });

    await refreshRating(review);

    res.status(201).json({ status: "Success", data: review });
};

const updateReviewHandler = async (req: Request, res: Response): Promise<void> => {
    const data = stripUndefined(updateReviewSchema.parse(req.body));

    const review = await prisma.review.update({
        where: { id: getIdParam(req) },
        data,
        include: { author: { select: { id: true, username: true, avatarUrl: true } } },
    });

    await refreshRating(review);

    res.status(200).json({ status: "Success", data: review });
};

const deleteReviewHandler = async (req: Request, res: Response): Promise<void> => {
    const review = await prisma.review.delete({ where: { id: getIdParam(req) } });

    await refreshRating(review);

    res.status(200).json({ status: "Success", message: "Review deleted successfully" });
};

export { createReviewHandler, updateReviewHandler, deleteReviewHandler };
