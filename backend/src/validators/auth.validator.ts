import { z } from "zod";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128);

const registerSchema = z.object({
    lastname: z.string().trim().min(1).max(100),
    firstname: z.string().trim().min(1).max(100),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    dateOfBirth: z.coerce.date().max(new Date(), "Date of birth must be in the past"),
    phone: z.string().trim().min(6).max(20),
    email: z.email().trim().toLowerCase(),
    password: passwordSchema,
    role: z.enum(["USER", "MERCHANT"]).default("USER"),
});

const loginSchema = z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
    email: z.email().trim().toLowerCase().optional(),
    phone: z.string().trim().min(6).optional(),
}).refine((data) => data.email || data.phone, { message: "Email or phone is required" });

const resetPasswordSchema = z.object({
    userId: z.uuid(),
    token: z.string().min(1),
    password: passwordSchema,
});

export { passwordSchema, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
