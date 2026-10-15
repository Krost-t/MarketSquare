import { z } from "zod";

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const paginate = <T>(items: T[], total: number, page: number, limit: number) => ({
    status: "Success",
    data: items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
});

const optionalUrl = z.url({ protocol: /^https?$/ }).max(2048).optional().nullable();

export { paginationSchema, paginate, optionalUrl };
