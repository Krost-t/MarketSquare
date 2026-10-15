import { prisma } from "../lib/prisma.ts";

const refreshRating = async (target: { productId?: string | null; shopId?: string | null }): Promise<void> => {
    if (target.productId) {
        const stats = await prisma.review.aggregate({
            where: { productId: target.productId },
            _avg: { rating: true },
            _count: { _all: true },
        });
        await prisma.product.update({
            where: { id: target.productId },
            data: {
                averageRating: Number(stats._avg.rating ?? 0).toFixed(1),
                reviewCount: stats._count._all,
            },
        });
    }

    if (target.shopId) {
        const stats = await prisma.review.aggregate({
            where: { shopId: target.shopId },
            _avg: { rating: true },
            _count: { _all: true },
        });
        await prisma.shop.update({
            where: { id: target.shopId },
            data: {
                averageRating: Number(stats._avg.rating ?? 0).toFixed(1),
                reviewCount: stats._count._all,
            },
        });
    }
};

export { refreshRating };
