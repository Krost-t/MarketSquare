import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import type { Prisma } from "../generated/client.ts";
import { getCurrentUser, getIdParam } from "../utils/request.ts";
import { stripUndefined } from "../utils/object.ts";
import { HttpError } from "../utils/http-error.ts";
import { geocodeAddress } from "../services/geo.service.ts";
import { paginate, paginationSchema } from "../validators/common.validator.ts";
import { createShopSchema, listShopsQuerySchema, updateShopSchema } from "../validators/shop.validator.ts";


const shopInclude = {
    address: true,
    merchant: { select: { id: true, username: true, firstname: true } },
    _count: { select: { products: { where: { isActive: true } } } },
} satisfies Prisma.ShopInclude;


const listShopsHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, postalCode, locality, region } = listShopsQuerySchema.parse(req.query);

    const where: Prisma.ShopWhereInput = {
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ],
        }),
        ...((postalCode || locality || region) && {
            address: {
                is: stripUndefined({
                    postalCode: postalCode ? { startsWith: postalCode } : undefined,
                    addressLocality: locality ? { contains: locality, mode: "insensitive" as const } : undefined,
                    addressRegion: region ? { contains: region, mode: "insensitive" as const } : undefined,
                }),
            },
        }),
    };

    const [shops, total] = await prisma.$transaction([
        prisma.shop.findMany({
            where,
            include: shopInclude,
            orderBy: [{ averageRating: "desc" }, { createdAt: "desc" }],
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.shop.count({ where }),
    ]);

    res.status(200).json(paginate(shops, total, page, limit));
};

const getShopHandler = async (req: Request, res: Response): Promise<void> => {
    const shop = await prisma.shop.findUnique({
        where: { id: getIdParam(req) },
        include: shopInclude,
    });

    if (!shop) {
        throw new HttpError(404, "Shop not found");
    }

    res.status(200).json({ status: "Success", data: shop });
};

const listShopProductsHandler = async (req: Request, res: Response): Promise<void> => {
    const shopId = getIdParam(req);
    const { page, limit } = paginationSchema.parse(req.query);

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
        throw new HttpError(404, "Shop not found");
    }

    const isOwner = req.user?.id === shop.merchantId;
    const where: Prisma.ProductWhereInput = { shopId, ...(!isOwner && { isActive: true }) };

    const [products, total] = await prisma.$transaction([
        prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
        prisma.product.count({ where }),
    ]);

    res.status(200).json(paginate(products, total, page, limit));
};

const listShopReviewsHandler = async (req: Request, res: Response): Promise<void> => {
    const shopId = getIdParam(req);
    const { page, limit } = paginationSchema.parse(req.query);

    const where: Prisma.ReviewWhereInput = { shopId };

    const [reviews, total] = await prisma.$transaction([
        prisma.review.findMany({
            where,
            include: { author: { select: { id: true, username: true, avatarUrl: true } } },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.review.count({ where }),
    ]);

    res.status(200).json(paginate(reviews, total, page, limit));
};


const getMyShopHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);

    const shop = await prisma.shop.findUnique({
        where: { merchantId: id },
        include: shopInclude,
    });

    if (!shop) {
        throw new HttpError(404, "You don't have a shop yet");
    }

    res.status(200).json({ status: "Success", data: shop });
};

const createShopHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: merchantId } = getCurrentUser(req);
    const { address, ...data } = createShopSchema.parse(req.body);

    const existing = await prisma.shop.findUnique({ where: { merchantId } });
    if (existing) {
        throw new HttpError(409, "You already have a shop");
    }

    const shop = await prisma.shop.create({
        data: {
            ...stripUndefined(data),
            merchantId,
            ...(address && { address: { create: { ...address, ...(await geocodeAddress(address)), type: "SHOP" } } }),
        },
        include: shopInclude,
    });

    res.status(201).json({ status: "Success", data: shop });
};

const updateShopHandler = async (req: Request, res: Response): Promise<void> => {
    const id = getIdParam(req);
    const { address, ...data } = updateShopSchema.parse(req.body);
    const coordinates = address ? await geocodeAddress(address) : null;

    const shop = await prisma.shop.update({
        where: { id },
        data: {
            ...stripUndefined(data),
            ...(address && {
                address: {
                    upsert: {
                        create: { ...address, ...coordinates, type: "SHOP" },
                        update: { ...address, ...coordinates },
                    },
                },
            }),
        },
        include: shopInclude,
    });

    res.status(200).json({ status: "Success", data: shop });
};

const deleteShopHandler = async (req: Request, res: Response): Promise<void> => {
    await prisma.shop.delete({ where: { id: getIdParam(req) } });

    res.status(200).json({ status: "Success", message: "Shop deleted successfully" });
};

export {
    listShopsHandler,
    getShopHandler,
    listShopProductsHandler,
    listShopReviewsHandler,
    getMyShopHandler,
    createShopHandler,
    updateShopHandler,
    deleteShopHandler,
};
