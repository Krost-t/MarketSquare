
import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import {prisma} from "../lib/prisma.ts"
import { getIdParam } from "../utils/request.ts";


const extractToken = (req: Request): string | undefined => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        return req.headers.authorization.split(" ")[1];
    }
    if (req.cookies?.jwt) {
        return req.cookies.jwt;
    }
    return undefined;
}

const findUserFromToken = async (token: string) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; iat: number };

    const user = await prisma.user.findUnique({
        where: { id: decoded.id }
    });

    if (user?.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
        return null;
    }
    return user;
}


 const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if(req.user && req.user.role === "ADMIN") {
        next();
    } else {
        res.status(403).json({ message: "Forbidden: Admin access required" });
    }
}

const merchantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (req.user && (req.user.role === "MERCHANT" || req.user.role === "ADMIN")) {
        next();
    } else {
        res.status(403).json({ message: "Forbidden: Merchant access required" });
    }
}


const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);

    if (!token) {
         res.status(401).json({ message: "Unauthorized: No token provided" });
         return;
    }

    try {
        const user = await findUserFromToken(token);

        if (!user) {
             res.status(401).json({ message: " User not found" });
             return;
        }

       req.user = user

    } catch (error) {
         res.status(401).json({ message: "Unauthorized: Invalid token" });
         return;
    }
    next();
}

const optionalAuthMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);

    if (token) {
        try {
            const user = await findUserFromToken(token);
            if (user) req.user = user;
        } catch {
        }
    }
    next();
}



const ownsShopMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const shop = await prisma.shop.findUnique({ where: { id: getIdParam(req) } });

    if (!shop) {
        res.status(404).json({ message: "Shop not found" });
        return;
    }
    if (shop.merchantId !== req.user?.id && req.user?.role !== "ADMIN") {
        res.status(403).json({ message: "Forbidden: you don't own this shop" });
        return;
    }
    next();
}

const ownsProductMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const product = await prisma.product.findUnique({
        where: { id: getIdParam(req) },
        include: { shop: { select: { merchantId: true } } },
    });

    if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
    }
    if (product.shop.merchantId !== req.user?.id && req.user?.role !== "ADMIN") {
        res.status(403).json({ message: "Forbidden: you don't own this product" });
        return;
    }
    next();
}

const ownsReviewMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const review = await prisma.review.findUnique({ where: { id: getIdParam(req) } });

    if (!review) {
        res.status(404).json({ message: "Review not found" });
        return;
    }
    if (review.authorId !== req.user?.id && req.user?.role !== "ADMIN") {
        res.status(403).json({ message: "Forbidden: you are not the author of this review" });
        return;
    }
    next();
}

export {
    adminMiddleware,
    merchantMiddleware,
    authMiddleware,
    optionalAuthMiddleware,
    ownsShopMiddleware,
    ownsProductMiddleware,
    ownsReviewMiddleware,
};
