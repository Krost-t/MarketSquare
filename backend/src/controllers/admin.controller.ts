import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

const showAllUsersHandler = async (_req: Request, res: Response): Promise<Response> => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            username: true,
            firstname: true,
            surname: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true
        }
    });
    return res.json(users);
};

export { showAllUsersHandler };