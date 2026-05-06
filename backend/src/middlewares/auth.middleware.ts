
import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import {prisma} from "../lib/prisma.ts"


 const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if((req as any).user && (req as any).user.role === "ADMIN") {
        next();
    } else {
        res.status(403).json({ message: "Forbidden: Admin access required" });
    }
}


const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token 

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
         res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        })

        if (!user) {
             res.status(401).json({ message: " User not found" });
        }


       (req as any).user = user

        next();
    } catch (error) {
         res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}

export { adminMiddleware, authMiddleware };