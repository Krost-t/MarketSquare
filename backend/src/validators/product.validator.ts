import { z } from "zod";
import { optionalUrl, paginationSchema } from "./common.validator.ts";

const createProductSchema = z.object({
    name: z.string().trim().min(1).max(150),
    description: z.string().trim().max(5000).optional().nullable(),
    price: z.coerce.number().positive().max(99_999_999),
    stock: z.coerce.number().int().min(0).default(0),
    imageUrl: optionalUrl,
    isActive: z.boolean().default(true),
});

const updateProductSchema = z.object({
    name: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    price: z.coerce.number().positive().max(99_999_999).optional(),
    stock: z.coerce.number().int().min(0).optional(),
    imageUrl: optionalUrl,
    isActive: z.boolean().optional(),
});

const listProductsQuerySchema = paginationSchema.extend({
    search: z.string().trim().optional(),
    shopId: z.uuid().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    inStock: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
    sort: z.enum(["newest", "price_asc", "price_desc", "rating"]).default("newest"),
});

export { createProductSchema, updateProductSchema, listProductsQuerySchema };
