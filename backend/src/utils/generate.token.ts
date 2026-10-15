import jwt from "jsonwebtoken";
import type { Response } from "express";

const generateToken = (userId: string, res: Response): string => {
    const payload: { id: string } = { id: userId };
     const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    } as jwt.SignOptions);

    res.cookie("jwt",token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN ?? "7") * 24 * 60 * 60 * 1000, // Convert days to milliseconds
    })
    return token;
};

const resetPasswordToken = (userId: string, passwordHash: string): string => {
    const payload: { id: string; purpose: "reset" } = { id: userId, purpose: "reset" };
    return jwt.sign(payload, process.env.JWT_SECRET! + passwordHash, { expiresIn: "15m" });
};

const verifyResetPasswordToken = (token: string, passwordHash: string): { id: string } => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET! + passwordHash) as { id: string; purpose?: string };
    if (decoded.purpose !== "reset") {
        throw new Error("Invalid token purpose");
    }
    return { id: decoded.id };
};

export { generateToken , resetPasswordToken, verifyResetPasswordToken};
