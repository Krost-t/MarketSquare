
import type { Request, Response, NextFunction } from "express";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if((req as any).user && (req as any).user.role === "ADMIN") {
        next();
    } else {
        res.status(403).json({ message: "Forbidden: Admin access required" });
    }
}