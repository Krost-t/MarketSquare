import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { getCurrentUser, getIdParam } from "../utils/request.ts";
import { HttpError } from "../utils/http-error.ts";
import { addItemSchema, updateItemQuantitySchema } from "../validators/cart.validator.ts";


const getOrCreateCart = (customerId: string) =>
    prisma.cart.upsert({
        where: { customerId },
        create: { customerId },
        update: {},
    });

const buildCartResponse = async (customerId: string) => {
    const cart = await prisma.cart.findUniqueOrThrow({
        where: { customerId },
        include: {
            items: {
                orderBy: { createdAt: "asc" },
                include: { product: { include: { shop: { select: { id: true, name: true } } } } },
            },
        },
    });

    const total = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { ...cart, total: total.toFixed(2), itemCount };
};

const findMyCartItemOrThrow = async (customerId: string, itemId: string) => {
    const item = await prisma.cartItem.findFirst({
        where: { id: itemId, cart: { customerId } },
        include: { product: true },
    });
    if (!item) {
        throw new HttpError(404, "Cart item not found");
    }
    return item;
};

const getMyCartHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);
    await getOrCreateCart(id);

    res.status(200).json({ status: "Success", data: await buildCartResponse(id) });
};

const addItemHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);
    const { productId, quantity } = addItemSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
        throw new HttpError(404, "Product not found");
    }

    const cart = await getOrCreateCart(id);
    const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
    });
    const newQuantity = (existing?.quantity ?? 0) + quantity;

    if (newQuantity > product.stock) {
        throw new HttpError(400, `Only ${product.stock} item(s) left in stock`);
    }

    await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        create: { cartId: cart.id, productId, quantity },
        update: { quantity: newQuantity },
    });

    res.status(201).json({ status: "Success", data: await buildCartResponse(id) });
};

const updateItemQuantityHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);
    const { quantity } = updateItemQuantitySchema.parse(req.body);
    const item = await findMyCartItemOrThrow(id, getIdParam(req, "itemId"));

    if (quantity > item.product.stock) {
        throw new HttpError(400, `Only ${item.product.stock} item(s) left in stock`);
    }

    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });

    res.status(200).json({ status: "Success", data: await buildCartResponse(id) });
};

const removeItemHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);
    const item = await findMyCartItemOrThrow(id, getIdParam(req, "itemId"));

    await prisma.cartItem.delete({ where: { id: item.id } });

    res.status(200).json({ status: "Success", data: await buildCartResponse(id) });
};

const clearCartHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);
    const cart = await getOrCreateCart(id);

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    res.status(200).json({ status: "Success", data: await buildCartResponse(id) });
};

export { getMyCartHandler, addItemHandler, updateItemQuantityHandler, removeItemHandler, clearCartHandler };
