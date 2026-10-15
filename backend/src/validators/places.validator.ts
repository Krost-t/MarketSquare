import { z } from "zod";
import { PLACE_CATEGORIES } from "../services/places.service.ts";

const coordinatesSchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
});

const nearbyQuerySchema = coordinatesSchema.extend({
    radius: z.coerce.number().int().min(100).max(5000).default(1200),
    category: z.enum(PLACE_CATEGORIES as [string, ...string[]]).optional(),
    partnersOnly: z.literal("true").optional(),
});

const geocodeQuerySchema = z.object({
    q: z.string().trim().min(3).max(200),
});

export { coordinatesSchema, nearbyQuerySchema, geocodeQuerySchema };
