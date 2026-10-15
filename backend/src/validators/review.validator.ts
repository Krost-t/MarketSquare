import { z } from "zod";
import { paginationSchema } from "./common.validator.ts";

const ratingSchema = z.coerce.number().int().min(1).max(5);

const createReviewSchema = z.object({
    rating: ratingSchema,
    comment: z.string().trim().max(2000).optional().nullable(),
    productId: z.uuid().optional(),
    shopId: z.uuid().optional(),
}).refine((data) => Boolean(data.productId) !== Boolean(data.shopId), {
    message: "Provide exactly one of productId or shopId",
});

const updateReviewSchema = z.object({
    rating: ratingSchema.optional(),
    comment: z.string().trim().max(2000).optional().nullable(),
});

const listReviewsQuerySchema = paginationSchema.extend({
    maxRating: z.coerce.number().int().min(1).max(5).optional(),
    target: z.enum(["product", "shop"]).optional(),
});

export { createReviewSchema, updateReviewSchema, listReviewsQuerySchema };
