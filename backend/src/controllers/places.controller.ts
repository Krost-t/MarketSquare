import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { distanceInMeters, geocode, reverseGeocode } from "../services/geo.service.ts";
import { findNearbyPlaces, type PlaceCategory } from "../services/places.service.ts";
import { coordinatesSchema, geocodeQuerySchema, nearbyQuerySchema } from "../validators/places.validator.ts";

const findPartnerShopsNear = async (lat: number, lon: number, radius: number, category?: string) => {
    const delta = radius / 111000;
    const shops = await prisma.shop.findMany({
        where: {
            ...(category && { category }),
            address: {
                is: {
                    latitude: { gte: lat - delta, lte: lat + delta },
                    longitude: { gte: lon - delta * 1.6, lte: lon + delta * 1.6 },
                },
            },
        },
        include: { address: true, _count: { select: { products: { where: { isActive: true } } } } },
    });

    return shops
        .map((shop) => ({
            ...shop,
            distance: distanceInMeters({ lat, lon }, { lat: shop.address!.latitude!, lon: shop.address!.longitude! }),
        }))
        .filter((shop) => shop.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
};

const nearbyHandler = async (req: Request, res: Response): Promise<void> => {
    const { lat, lon, radius, category, partnersOnly } = nearbyQuerySchema.parse(req.query);

    const [partners, places] = await Promise.all([
        findPartnerShopsNear(lat, lon, radius, category),
        partnersOnly ? [] : findNearbyPlaces(lat, lon, radius, category ? [category as PlaceCategory] : undefined).catch(() => []),
    ]);

    const claimed = new Set(partners.map((shop) => shop.osmId).filter(Boolean));

    res.status(200).json({
        status: "Success",
        data: {
            partners,
            places: places.filter((place) => !claimed.has(place.id)),
        },
    });
};

const geocodeHandler = async (req: Request, res: Response): Promise<void> => {
    const { q } = geocodeQuerySchema.parse(req.query);
    res.status(200).json({ status: "Success", data: await geocode(q) });
};

const reverseHandler = async (req: Request, res: Response): Promise<void> => {
    const { lat, lon } = coordinatesSchema.parse(req.query);
    res.status(200).json({ status: "Success", data: await reverseGeocode(lat, lon) });
};

export { nearbyHandler, geocodeHandler, reverseHandler, findPartnerShopsNear };
