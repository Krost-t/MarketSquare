import jwt from "jsonwebtoken";
import type { Response } from "express";

const generateToken = (userId: string, res: Response): string => {
    const payload: { id: string } = { id: userId };
     const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    res.cookie("jwt",token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN!) * 24 * 60 * 60 * 1000, // Convert days to milliseconds
    })
    return token;
};

export { generateToken };