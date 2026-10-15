import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.ts";
import { hashPassword } from "./auth.controller.ts";
import { getCurrentUser, getIdParam, toPublicUser } from "../utils/request.ts";
import { stripUndefined } from "../utils/object.ts";
import { HttpError } from "../utils/http-error.ts";
import { generateToken } from "../utils/generate.token.ts";
import { changePasswordSchema, pushTokenSchema, updateProfileSchema } from "../validators/user.validator.ts";

// ========== User Handlers ==========

const getProfileHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);

    const user = await prisma.user.findUniqueOrThrow({
        where: { id },
        include: { shop: { select: { id: true, name: true } } },
    });

    res.status(200).json({ status: "Success", data: toPublicUser(user) });
};

const updateProfileHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);
    const data = stripUndefined(updateProfileSchema.parse(req.body));

    const user = await prisma.user.update({ where: { id }, data });

    res.status(200).json({ status: "Success", message: "Profile updated successfully", data: toPublicUser(user) });
};

const changePasswordHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        res.status(400).json({ message: "Current password is incorrect" });
        return;
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(newPassword), passwordChangedAt: new Date() },
    });

    const token = generateToken(user.id, res);
    res.status(200).json({ status: "Success", message: "Password changed successfully", token });
};

const deleteProfileHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);

    const ordersCount = await prisma.order.count({ where: { customerId: id } });
    if (ordersCount > 0) {
        throw new HttpError(409, "Account has orders and cannot be deleted, contact an administrator");
    }

    await prisma.user.delete({ where: { id } });

    res.cookie("jwt", "", { expires: new Date(0), httpOnly: true, sameSite: "strict" });
    res.status(200).json({ status: "Success", message: "Account deleted successfully" });
};

const updatePushTokenHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);
    const { pushToken } = pushTokenSchema.parse(req.body);

    await prisma.user.update({ where: { id }, data: { pushToken } });

    res.status(200).json({ status: "Success", message: "Push token updated" });
};


const listFavoritesHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);

    const favorites = await prisma.favorite.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        include: { product: { include: { shop: { select: { id: true, name: true } } } } },
    });

    res.status(200).json({ status: "Success", data: favorites });
};

const addFavoriteHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);
    const productId = getIdParam(req, "productId");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        throw new HttpError(404, "Product not found");
    }

    const favorite = await prisma.favorite.upsert({
        where: { userId_productId: { userId: id, productId } },
        create: { userId: id, productId },
        update: {},
    });

    res.status(201).json({ status: "Success", data: favorite });
};

const removeFavoriteHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);
    const productId = getIdParam(req, "productId");

    await prisma.favorite.deleteMany({ where: { userId: id, productId } });

    res.status(200).json({ status: "Success", message: "Favorite removed" });
};

export {
    getProfileHandler,
    updateProfileHandler,
    changePasswordHandler,
    deleteProfileHandler,
    updatePushTokenHandler,
    listFavoritesHandler,
    addFavoriteHandler,
    removeFavoriteHandler,
};
