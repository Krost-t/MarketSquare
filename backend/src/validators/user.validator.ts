import { z } from "zod";
import { passwordSchema, registerSchema } from "./auth.validator.ts";
import { optionalUrl, paginationSchema } from "./common.validator.ts";

const roleSchema = z.enum(["USER", "MERCHANT", "ADMIN"]);

const updateProfileSchema = z.object({
    lastname: z.string().trim().min(1).max(100).optional(),
    firstname: z.string().trim().min(1).max(100).optional(),
    username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    dateOfBirth: z.coerce.date().max(new Date()).optional(),
    phone: z.string().trim().min(6).max(20).optional(),
    avatarUrl: optionalUrl,
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
});

const pushTokenSchema = z.object({
    pushToken: z.string().min(1).max(255).nullable(),
});


const adminCreateUserSchema = registerSchema.extend({
    role: roleSchema.default("USER"),
});

const adminUpdateUserSchema = updateProfileSchema.extend({
    email: z.email().trim().toLowerCase().optional(),
});

const adminRoleSchema = z.object({ role: roleSchema });

const adminUsersQuerySchema = paginationSchema.extend({
    search: z.string().trim().optional(),
    role: roleSchema.optional(),
});

export {
    updateProfileSchema,
    changePasswordSchema,
    pushTokenSchema,
    adminCreateUserSchema,
    adminUpdateUserSchema,
    adminRoleSchema,
    adminUsersQuerySchema,
};
