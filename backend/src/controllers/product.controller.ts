import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import type { Prisma } from "../generated/client.ts";
import { getCurrentUser, getIdParam } from "../utils/request.ts";
import { stripUndefined } from "../utils/object.ts";
import { HttpError } from "../utils/http-error.ts";
import { paginate, paginationSchema } from "../validators/common.validator.ts";
import { lookupBarcode } from "../services/foodfacts.service.ts";
import { createProductSchema, listProductsQuerySchema, updateProductSchema } from "../validators/product.validator.ts";


const PRODUCT_SORTS = {
    newest: { createdAt: "desc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    rating: { averageRating: "desc" },
} satisfies Record<string, Prisma.ProductOrderByWithRelationInput>;


const listProductsHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, shopId, minPrice, maxPrice, inStock, sort } = listProductsQuerySchema.parse(req.query);

    const where: Prisma.ProductWhereInput = {
        isActive: true,
        ...(shopId && { shopId }),
        ...(inStock && { stock: { gt: 0 } }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ],
        }),
        ...((minPrice !== undefined || maxPrice !== undefined) && {
            price: stripUndefined({ gte: minPrice, lte: maxPrice }),
        }),
    };

    const [products, total] = await prisma.$transaction([
        prisma.product.findMany({
            where,
            include: { shop: { select: { id: true, name: true } } },
            orderBy: PRODUCT_SORTS[sort],
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.product.count({ where }),
    ]);

    res.status(200).json(paginate(products, total, page, limit));
};

const getProductHandler = async (req: Request, res: Response): Promise<void> => {
    const product = await prisma.product.findUnique({
        where: { id: getIdParam(req) },
        include: { shop: { include: { address: true } } },
    });

    const canSeeInactive = req.user && (req.user.role === "ADMIN" || req.user.id === product?.shop.merchantId);

    if (!product || (!product.isActive && !canSeeInactive)) {
        throw new HttpError(404, "Product not found");
    }

    const isFavorite = req.user
        ? (await prisma.favorite.count({ where: { userId: req.user.id, productId: product.id } })) > 0
        : false;

    res.status(200).json({ status: "Success", data: { ...product, isFavorite } });
};

const listProductReviewsHandler = async (req: Request, res: Response): Promise<void> => {
    const productId = getIdParam(req);
    const { page, limit } = paginationSchema.parse(req.query);

    const where: Prisma.ReviewWhereInput = { productId };

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


const createProductHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: merchantId } = getCurrentUser(req);
    const data = createProductSchema.parse(req.body);

    const shop = await prisma.shop.findUnique({ where: { merchantId } });
    if (!shop) {
        throw new HttpError(400, "Create your shop before adding products");
    }

    const product = await prisma.product.create({
        data: { ...stripUndefined(data), shopId: shop.id },
    });

    res.status(201).json({ status: "Success", data: product });
};

const updateProductHandler = async (req: Request, res: Response): Promise<void> => {
    const data = stripUndefined(updateProductSchema.parse(req.body));

    const product = await prisma.product.update({ where: { id: getIdParam(req) }, data });

    res.status(200).json({ status: "Success", data: product });
};

const deleteProductHandler = async (req: Request, res: Response): Promise<void> => {
    await prisma.product.delete({ where: { id: getIdParam(req) } });

    res.status(200).json({ status: "Success", message: "Product deleted successfully" });
};

const lookupBarcodeHandler = async (req: Request, res: Response): Promise<void> => {
    const { barcode } = req.params;
    if (typeof barcode !== "string" || !/^\d{8,14}$/.test(barcode)) {
        throw new HttpError(400, "Invalid barcode");
    }
    res.status(200).json({ status: "Success", data: await lookupBarcode(barcode) });
};

export {
    lookupBarcodeHandler,
    listProductsHandler,
    getProductHandler,
    listProductReviewsHandler,
    createProductHandler,
    updateProductHandler,
    deleteProductHandler,
};
