import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import type { Prisma } from "../generated/client.ts";
import { getCurrentUser, getIdParam, toPublicUser } from "../utils/request.ts";
import { stripUndefined } from "../utils/object.ts";
import { HttpError } from "../utils/http-error.ts";
import { generateFreeUsername, hashPassword } from "./auth.controller.ts";
import { refreshRating } from "../services/rating.service.ts";
import { paginate, paginationSchema } from "../validators/common.validator.ts";
import { listReviewsQuerySchema } from "../validators/review.validator.ts";
import { listShopsQuerySchema } from "../validators/shop.validator.ts";
import {
    adminCreateUserSchema,
    adminRoleSchema,
    adminUpdateUserSchema,
    adminUsersQuerySchema,
} from "../validators/user.validator.ts";

const publicUserSelect = {
    id: true,
    email: true,
    username: true,
    firstname: true,
    lastname: true,
    role: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true
} satisfies Prisma.UserSelect;


export const AdminDashboardHandler = async (_req: Request, res: Response): Promise<void> => {
    const [users, merchants, shops, products, orders, reviews, revenue] = await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({ where: { role: "MERCHANT" } }),
        prisma.shop.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.review.count(),
        prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { notIn: ["CANCELLED", "RETURNED"] } } }),
    ]);

    res.status(200).json({
        status: "Success",
        data: { users, merchants, shops, products, orders, reviews, revenue: Number(revenue._sum.totalAmount ?? 0).toFixed(2) },
    });
};

export const AdminProfileHandler = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: "Success", data: toPublicUser(getCurrentUser(req)) });
};

export const AdminShowAllUsersHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, role } = adminUsersQuerySchema.parse(req.query);

    const where: Prisma.UserWhereInput = {
        ...(role && { role }),
        ...(search && {
            OR: [
                { email: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
                { lastname: { contains: search, mode: "insensitive" } },
                { firstname: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            select: publicUserSelect,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.user.count({ where }),
    ]);

    res.status(200).json(paginate(users, total, page, limit));
};

export const AdminShowOneUserHandler = async (req: Request, res: Response): Promise<void> => {
    const id = getIdParam(req);

    const user = await prisma.user.findUnique({
        where: { id: id },
        include: { shop: { select: { id: true, name: true } }, addresses: true, _count: { select: { orders: true, reviews: true } } },
    })

    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }

    res.status(200).json({ status: "Success", data: toPublicUser(user) });
}

export const AdminDeleteOneUserHandler = async (req: Request, res: Response): Promise<void> => {
    const id = getIdParam(req);

    if (id === getCurrentUser(req).id) {
        throw new HttpError(400, "You can't delete your own account from the admin panel");
    }

    const user = await prisma.user.findUnique({ where: { id: id } });

    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }

    await prisma.user.delete({
        where: { id: id },
    });

    res.status(200).json({ status: "Success", message: "User deleted successfully", });
};

export const AdminCreateUserHandler = async (req: Request, res: Response): Promise<void> => {
    const { password, ...data } = adminCreateUserSchema.parse(req.body);

    const userExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) {
        throw new HttpError(409, "User already exists");
    }

    const user = await prisma.user.create({
        data: {
            ...data,
            password: await hashPassword(password),
            username: await generateFreeUsername(),
        },
        select: publicUserSelect,
    });

    res.status(201).json({ status: "Success", data: user });
}

export const AdminUpdateOneFieldUserHandler = async (req: Request, res: Response): Promise<void> => {
    const data = stripUndefined(adminUpdateUserSchema.parse(req.body));

    const user = await prisma.user.update({
        where: { id: getIdParam(req) },
        data,
        select: publicUserSelect,
    });

    res.status(200).json({ status: "Success", data: user });
}

export const AdminUpdateOneRoleUserHandler = async (req: Request, res: Response): Promise<void> => {
    const id = getIdParam(req);
    const { role } = adminRoleSchema.parse(req.body);

    if (id === getCurrentUser(req).id) {
        throw new HttpError(400, "You can't change your own role");
    }

    const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: publicUserSelect,
    });

    res.status(200).json({ status: "Success", data: user });
}


export const AdminListAllReviewsHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, maxRating, target } = listReviewsQuerySchema.parse(req.query);

    const where: Prisma.ReviewWhereInput = {
        ...(maxRating && { rating: { lte: maxRating } }),
        ...(target === "product" && { productId: { not: null } }),
        ...(target === "shop" && { shopId: { not: null } }),
    };

    const [reviews, total] = await prisma.$transaction([
        prisma.review.findMany({
            where,
            include: {
                author: { select: { id: true, username: true, email: true } },
                product: { select: { id: true, name: true } },
                shop: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.review.count({ where }),
    ]);

    res.status(200).json(paginate(reviews, total, page, limit));
}

export const AdminDeleteAnyReviewHandler = async (req: Request, res: Response): Promise<void> => {
    const review = await prisma.review.delete({ where: { id: getIdParam(req) } });

    await refreshRating(review);

    res.status(200).json({ status: "Success", message: "Review deleted successfully" });
}


export const AdminListAllShopsForModerationHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search } = listShopsQuerySchema.parse(req.query);

    const where: Prisma.ShopWhereInput = search ? { name: { contains: search, mode: "insensitive" } } : {};

    const [shops, total] = await prisma.$transaction([
        prisma.shop.findMany({
            where,
            include: {
                merchant: { select: { id: true, username: true, email: true } },
                address: true,
                _count: { select: { products: true, orders: true, reviews: true } },
            },
            orderBy: [{ averageRating: "asc" }, { createdAt: "desc" }],
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.shop.count({ where }),
    ]);

    res.status(200).json(paginate(shops, total, page, limit));
}

export const AdminDeleteAnyShopHandler = async (req: Request, res: Response): Promise<void> => {
    await prisma.shop.delete({ where: { id: getIdParam(req) } });

    res.status(200).json({ status: "Success", message: "Shop deleted successfully" });
}

export const AdminListAllOrdersHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = paginationSchema.parse(req.query);

    const [orders, total] = await prisma.$transaction([
        prisma.order.findMany({
            include: {
                customer: { select: { id: true, username: true, email: true } },
                shop: { select: { id: true, name: true } },
                _count: { select: { items: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.order.count(),
    ]);

    res.status(200).json(paginate(orders, total, page, limit));
}
