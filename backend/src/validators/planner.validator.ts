import { z } from "zod";
import { coordinatesSchema } from "./places.validator.ts";

const itemSchema = z.object({
    label: z.string().trim().min(1).max(120),
    quantity: z.string().trim().max(60).optional().nullable(),
});

const addItemsSchema = z.union([
    itemSchema,
    z.object({ items: z.array(itemSchema).min(1).max(100) }),
]);

const updateItemSchema = z.object({
    label: z.string().trim().min(1).max(120).optional(),
    quantity: z.string().trim().max(60).optional().nullable(),
    checked: z.boolean().optional(),
});

const planSchema = coordinatesSchema.extend({
    radius: z.coerce.number().int().min(200).max(5000).default(1500),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const rangeSchema = z.object({ from: isoDate, to: isoDate });

const setMealSchema = z.object({
    date: isoDate,
    slot: z.enum(["LUNCH", "DINNER"]),
    mealId: z.string().regex(/^\d{1,10}$/),
});

export { addItemsSchema, updateItemSchema, planSchema, rangeSchema, setMealSchema };
