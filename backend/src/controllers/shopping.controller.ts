import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { getCurrentUser, getIdParam } from "../utils/request.ts";
import { stripUndefined } from "../utils/object.ts";
import { HttpError } from "../utils/http-error.ts";
import { classifyItem, normalize, significantWords } from "../services/ingredients.service.ts";
import { findNearbyPlaces, type Place, type PlaceCategory } from "../services/places.service.ts";
import { findPartnerShopsNear } from "./places.controller.ts";
import { addItemsSchema, planSchema, updateItemSchema } from "../validators/planner.validator.ts";

const listItems = (userId: string) =>
    prisma.shoppingListItem.findMany({ where: { userId }, orderBy: [{ checked: "asc" }, { createdAt: "asc" }] });

const findMyItemOrThrow = async (req: Request) => {
    const { id: userId } = getCurrentUser(req);
    const item = await prisma.shoppingListItem.findFirst({ where: { id: getIdParam(req), userId } });
    if (!item) throw new HttpError(404, "Item not found");
    return item;
};

const getListHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = getCurrentUser(req);
    const items = await listItems(id);
    res.status(200).json({ status: "Success", data: items.map((item) => ({ ...item, category: classifyItem(item.label) })) });
};

const addItemsHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = getCurrentUser(req);
    const body = addItemsSchema.parse(req.body);
    const items = "items" in body ? body.items : [body];

    await prisma.shoppingListItem.createMany({
        data: items.map((item) => ({ userId, label: item.label, quantity: item.quantity ?? null, source: "manual" })),
    });

    const all = await listItems(userId);
    res.status(201).json({ status: "Success", data: all.map((item) => ({ ...item, category: classifyItem(item.label) })) });
};

const updateItemHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = await findMyItemOrThrow(req);
    const item = await prisma.shoppingListItem.update({ where: { id }, data: stripUndefined(updateItemSchema.parse(req.body)) });
    res.status(200).json({ status: "Success", data: { ...item, category: classifyItem(item.label) } });
};

const deleteItemHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = await findMyItemOrThrow(req);
    await prisma.shoppingListItem.delete({ where: { id } });
    res.status(200).json({ status: "Success", message: "Item deleted" });
};

const clearCheckedHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = getCurrentUser(req);
    await prisma.shoppingListItem.deleteMany({ where: { userId, checked: true } });
    res.status(200).json({ status: "Success", message: "Checked items removed" });
};

const PLACE_FALLBACKS: Record<PlaceCategory, PlaceCategory[]> = {
    bakery: ["bakery", "supermarket"],
    butcher: ["butcher", "supermarket"],
    greengrocer: ["greengrocer", "market", "supermarket"],
    cheese: ["cheese", "supermarket"],
    seafood: ["seafood", "market", "supermarket"],
    grocery: ["grocery", "supermarket"],
    supermarket: ["supermarket"],
    wine: ["wine", "supermarket"],
    market: ["market"],
    books: ["books"],
    florist: ["florist"],
};

const planHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = getCurrentUser(req);
    const { lat, lon, radius } = planSchema.parse(req.body);

    const items = (await listItems(userId)).filter((item) => !item.checked);
    if (items.length === 0) {
        res.status(200).json({ status: "Success", data: { groups: [] } });
        return;
    }

    const byCategory = new Map<PlaceCategory, typeof items>();
    for (const item of items) {
        const category = classifyItem(item.label);
        byCategory.set(category, [...(byCategory.get(category) ?? []), item]);
    }

    const [places, partners] = await Promise.all([
        findNearbyPlaces(lat, lon, radius).catch((): Place[] => []),
        findPartnerShopsNear(lat, lon, radius),
    ]);
    const partnerById = new Map(partners.map((shop) => [shop.id, shop]));
    const claimed = new Set(partners.map((shop) => shop.osmId).filter(Boolean));

    const groups = await Promise.all(
        [...byCategory.entries()].map(async ([category, groupItems]) => {
            const wanted = PLACE_FALLBACKS[category];
            const nearestPlaces = wanted
                .flatMap((c) => places.filter((place) => place.category === c && !claimed.has(place.id)).slice(0, 3))
                .slice(0, 4);

            const matches = await Promise.all(
                groupItems.map(async (item) => {
                    const words = significantWords(item.label);
                    if (words.length === 0 || partnerById.size === 0) return [];
                    const products = await prisma.product.findMany({
                        where: {
                            isActive: true,
                            stock: { gt: 0 },
                            shopId: { in: [...partnerById.keys()] },
                            OR: words.map((word) => ({ name: { contains: word, mode: "insensitive" as const } })),
                        },
                        take: 10,
                    });
                    const startsWithWord = (name: string) =>
                        normalize(name).split(/[^a-z]+/).some((part) => words.some((word) => part.startsWith(word)));
                    return products.filter((product) => startsWithWord(product.name)).slice(0, 3).map((product) => {
                        const shop = partnerById.get(product.shopId)!;
                        return { itemId: item.id, product, shop: { id: shop.id, name: shop.name, distance: shop.distance } };
                    });
                }),
            );

            return {
                category,
                items: groupItems,
                places: nearestPlaces,
                partnerProducts: matches.flat().sort((a, b) => a.shop.distance - b.shop.distance),
            };
        }),
    );

    const order: PlaceCategory[] = ["greengrocer", "bakery", "butcher", "seafood", "cheese", "grocery", "wine"];
    groups.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));

    res.status(200).json({
        status: "Success",
        data: {
            origin: { lat, lon },
            groups,
            partners: partners.map((shop) => ({
                id: shop.id,
                name: shop.name,
                category: shop.category,
                distance: shop.distance,
                lat: shop.address!.latitude,
                lon: shop.address!.longitude,
            })),
        },
    });
};

export { getListHandler, addItemsHandler, updateItemHandler, deleteItemHandler, clearCheckedHandler, planHandler };
