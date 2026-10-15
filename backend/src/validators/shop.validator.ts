import { z } from "zod";
import { addressFieldsSchema } from "./address.validator.ts";
import { optionalUrl, paginationSchema } from "./common.validator.ts";

const shopCategorySchema = z.enum(["bakery", "butcher", "greengrocer", "cheese", "seafood", "grocery", "supermarket", "wine", "market", "books", "florist"]);

const createShopSchema = z.object({
    name: z.string().trim().min(2).max(100),
    category: shopCategorySchema.optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
    imageUrl: optionalUrl,
    address: addressFieldsSchema.optional(),
});

const updateShopSchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    category: shopCategorySchema.optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
    imageUrl: optionalUrl,
    address: addressFieldsSchema.optional(),
});

const listShopsQuerySchema = paginationSchema.extend({
    search: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    locality: z.string().trim().optional(),
    region: z.string().trim().optional(),
});

export { createShopSchema, updateShopSchema, listShopsQuerySchema };
