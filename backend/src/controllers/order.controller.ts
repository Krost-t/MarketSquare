import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import type { OrderStatus, Prisma } from "../generated/client.ts";
import { getCurrentUser, getIdParam } from "../utils/request.ts";
import { HttpError } from "../utils/http-error.ts";
import { paginate } from "../validators/common.validator.ts";
import { checkoutSchema, listOrdersQuerySchema, updateOrderStatusSchema } from "../validators/order.validator.ts";
import { CUSTOMER_CANCELLABLE_STATUSES, ORDER_STATUS_LABELS, canTransition } from "../services/order.service.ts";
import { sendPushNotification } from "../services/notification.service.ts";


const orderInclude = {
    items: { include: { product: { select: { id: true, imageUrl: true } } } },
    shop: { select: { id: true, name: true, address: true } },
    customer: { select: { id: true, username: true, firstname: true, lastname: true, phone: true } },
} satisfies Prisma.OrderInclude;

const claimStatusChange = async (tx: Prisma.TransactionClient, orderId: string, from: OrderStatus, to: OrderStatus): Promise<void> => {
    const { count } = await tx.order.updateMany({ where: { id: orderId, status: from }, data: { status: to } });
    if (count === 0) {
        throw new HttpError(409, "Order was updated in the meantime, please retry");
    }
};

const restockOrderItems = async (tx: Prisma.TransactionClient, orderId: string): Promise<void> => {
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
        if (item.productId) {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
    }
};

const listOrders = async (req: Request, res: Response, baseWhere: Prisma.OrderWhereInput): Promise<void> => {
    const { page, limit, status } = listOrdersQuerySchema.parse(req.query);
    const where: Prisma.OrderWhereInput = { ...baseWhere, ...(status && { status }) };

    const [orders, total] = await prisma.$transaction([
        prisma.order.findMany({
            where,
            include: orderInclude,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.order.count({ where }),
    ]);

    res.status(200).json(paginate(orders, total, page, limit));
};


const listMyOrdersHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);
    await listOrders(req, res, { customerId: id });
};

const getMyOrderHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);

    const order = await prisma.order.findUnique({
        where: { id: getIdParam(req) },
        include: { ...orderInclude, shop: { select: { id: true, name: true, address: true, merchantId: true } } },
    });

    const canSee = order && (order.customerId === user.id || order.shop?.merchantId === user.id || user.role === "ADMIN");
    if (!canSee) {
        throw new HttpError(404, "Order not found");
    }

    res.status(200).json({ status: "Success", data: order });
};

const checkoutHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: customerId } = getCurrentUser(req);
    const { deliveryMethod, paymentMethod, addressId } = checkoutSchema.parse(req.body);

    let shippingAddress: Partial<Pick<Prisma.OrderUncheckedCreateInput,
        "shippingStreet" | "shippingPostalCode" | "shippingLocality" | "shippingRegion" | "shippingCountry">> = {};
    if (deliveryMethod === "DELIVERY") {
        const address = await prisma.address.findFirst({ where: { id: addressId!, userId: customerId } });
        if (!address) {
            throw new HttpError(404, "Address not found");
        }
        shippingAddress = {
            shippingStreet: address.streetAddress,
            shippingPostalCode: address.postalCode,
            shippingLocality: address.addressLocality,
            shippingRegion: address.addressRegion,
            shippingCountry: address.addressCountry,
        };
    }

    const orders = await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
            where: { customerId },
            include: { items: { include: { product: true } } },
        });

        if (!cart || cart.items.length === 0) {
            throw new HttpError(400, "Your cart is empty");
        }

        const itemsByShop = new Map<string, typeof cart.items>();
        for (const item of cart.items) {
            if (!item.product.isActive) {
                throw new HttpError(400, `Product "${item.product.name}" is no longer available`);
            }
            const shopItems = itemsByShop.get(item.product.shopId) ?? [];
            shopItems.push(item);
            itemsByShop.set(item.product.shopId, shopItems);
        }

        const created = [];
        for (const [shopId, items] of itemsByShop) {
            for (const item of items) {
                const { count } = await tx.product.updateMany({
                    where: { id: item.productId, stock: { gte: item.quantity } },
                    data: { stock: { decrement: item.quantity } },
                });
                if (count === 0) {
                    throw new HttpError(409, `Not enough stock for "${item.product.name}"`);
                }
            }

            const totalAmount = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

            const order = await tx.order.create({
                data: {
                    ...shippingAddress,
                    customerId,
                    shopId,
                    deliveryMethod,
                    paymentMethod,
                    totalAmount: totalAmount.toFixed(2),
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            productName: item.product.name,
                            quantity: item.quantity,
                            unitPrice: item.product.price,
                        })),
                    },
                },
                include: { ...orderInclude, shop: { select: { id: true, name: true, address: true, merchant: { select: { pushToken: true } } } } },
            });
            created.push(order);
        }

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return created;
    });

    for (const order of orders) {
        void sendPushNotification(order.shop?.merchant.pushToken, "Nouvelle commande", `Commande de ${order.totalAmount} €`, { orderId: order.id });
    }

    res.status(201).json({
        status: "Success",
        message: `${orders.length} order(s) created`,
        data: orders.map(({ shop, ...order }) => ({ ...order, shop: shop && { id: shop.id, name: shop.name, address: shop.address } })),
    });
};

const cancelMyOrderHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: customerId } = getCurrentUser(req);
    const orderId = getIdParam(req);

    const order = await prisma.order.findFirst({ where: { id: orderId, customerId } });
    if (!order) {
        throw new HttpError(404, "Order not found");
    }
    if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
        throw new HttpError(400, `Order can no longer be cancelled (status: ${order.status})`);
    }

    const updated = await prisma.$transaction(async (tx) => {
        await claimStatusChange(tx, orderId, order.status, "CANCELLED");
        await restockOrderItems(tx, orderId);
        return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });
    });

    res.status(200).json({ status: "Success", data: updated });
};


const listShopOrdersHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);

    const shop = await prisma.shop.findUnique({ where: { merchantId: id } });
    if (!shop) {
        throw new HttpError(404, "You don't have a shop yet");
    }

    await listOrders(req, res, { shopId: shop.id });
};

const updateOrderStatusHandler = async (req: Request, res: Response): Promise<void> => {
    const user = getCurrentUser(req);
    const orderId = getIdParam(req);
    const { status } = updateOrderStatusSchema.parse(req.body);

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { shop: true, customer: { select: { pushToken: true } } },
    });

    if (!order || (order.shop?.merchantId !== user.id && user.role !== "ADMIN")) {
        throw new HttpError(404, "Order not found");
    }
    if (!canTransition(order.status, status)) {
        throw new HttpError(400, `Invalid status transition: ${order.status} -> ${status}`);
    }

    const restockStatuses: OrderStatus[] = ["CANCELLED", "RETURNED"];

    const updated = await prisma.$transaction(async (tx) => {
        await claimStatusChange(tx, orderId, order.status, status);
        if (restockStatuses.includes(status)) {
            await restockOrderItems(tx, orderId);
        }
        return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });
    });

    void sendPushNotification(
        order.customer.pushToken,
        `Commande ${order.shop?.name ?? ""}`.trim(),
        `Votre commande est ${ORDER_STATUS_LABELS[status]}`,
        { orderId },
    );

    res.status(200).json({ status: "Success", data: updated });
};

export {
    listMyOrdersHandler,
    getMyOrderHandler,
    checkoutHandler,
    cancelMyOrderHandler,
    listShopOrdersHandler,
    updateOrderStatusHandler,
};
