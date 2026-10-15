import { z } from "zod";
import { paginationSchema } from "./common.validator.ts";

const orderStatusSchema = z.enum(["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]);

const checkoutSchema = z.object({
    deliveryMethod: z.enum(["PICKUP", "DELIVERY"]),
    paymentMethod: z.enum(["CARD", "PAYPAL", "BANK_TRANSFER", "ON_SITE"]),
    addressId: z.uuid().optional(),
}).refine((data) => data.deliveryMethod === "PICKUP" || data.addressId, {
    message: "addressId is required for delivery",
    path: ["addressId"],
}).refine((data) => data.paymentMethod !== "ON_SITE" || data.deliveryMethod === "PICKUP", {
    message: "ON_SITE payment is only available for pickup",
    path: ["paymentMethod"],
});

const updateOrderStatusSchema = z.object({ status: orderStatusSchema });

const listOrdersQuerySchema = paginationSchema.extend({
    status: orderStatusSchema.optional(),
});

export { checkoutSchema, updateOrderStatusSchema, listOrdersQuerySchema };
