import { z } from "zod";

const addItemSchema = z.object({
    productId: z.uuid(),
    quantity: z.coerce.number().int().min(1).max(99).default(1),
});

const updateItemQuantitySchema = z.object({
    quantity: z.coerce.number().int().min(1).max(99),
});

export { addItemSchema, updateItemQuantitySchema };
