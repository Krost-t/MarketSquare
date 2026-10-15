import { z } from "zod";

const addressFieldsSchema = z.object({
    housingType: z.enum(["HOUSE", "APARTMENT", "STUDIO", "OFFICE", "OTHER"]).default("HOUSE"),
    streetAddress: z.string().trim().min(1).max(255),
    postalCode: z.string().trim().min(2).max(12),
    addressLocality: z.string().trim().min(1).max(100),
    addressRegion: z.string().trim().min(1).max(100),
    addressCountry: z.string().trim().length(2).toUpperCase(),
});

const createAddressSchema = addressFieldsSchema.extend({
    type: z.enum(["SHIPPING", "BILLING", "BOTH"]).default("SHIPPING"),
});

const updateAddressSchema = createAddressSchema.partial();

export { addressFieldsSchema, createAddressSchema, updateAddressSchema };
