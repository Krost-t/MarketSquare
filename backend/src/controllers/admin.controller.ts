import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

const showAllUsersHandler = async (_req: Request, res: Response): Promise<void> => {
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

     res.status(200).json({ status: "Success", data: users });
};

const showOneUserHandler = async (req: Request, res: Response): Promise<void> => {
    const {id} = req.params

    if (!id || typeof id !== "string") {
        res.status(400).json({ message: "User ID is required" });
        return;
    }

    const user = await prisma.user.findUnique({
        where: { id: id },
    })

    if (!user) {
         res.status(404).json({ message: "User not found" });
     }

     res.status(200).json({ status: "Success", data: user });
}

const deleteOneUserHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
        res.status(400).json({ message: "User ID is required" });
        return;
    }

    const user = await prisma.user.delete({
        where: { id: id},
    });

    if (!user) {
        res.status(404).json({ message: "User not found" });
    }

    res.status(201).json({ status: "Success",   message: "User deleted successfully", });
};

export { showAllUsersHandler, showOneUserHandler, deleteOneUserHandler };