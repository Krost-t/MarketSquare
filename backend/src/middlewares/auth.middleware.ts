import jwt from 'jsonwebtoken';
import {prisma} from "../lib/prisma.ts"
import type { Request, Response, NextFunction } from "express";


// This middleware checks for the presence of a JWT token in the cookies, verifies it, and attaches the user information to the request object if valid
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

export default authMiddleware;