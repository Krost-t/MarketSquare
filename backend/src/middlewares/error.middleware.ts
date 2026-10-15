import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/client.ts";
import { HttpError } from "../utils/http-error.ts";

const notFoundMiddleware = (req: Request, res: Response): void => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorMiddleware = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }

    if (error instanceof ZodError) {
        res.status(400).json({
            message: "Validation error",
            errors: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        });
        return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002":
                res.status(409).json({ message: "Resource already exists" });
                return;
            case "P2003":
                res.status(409).json({ message: "Resource is still referenced by other records" });
                return;
            case "P2025":
                res.status(404).json({ message: "Resource not found" });
                return;
        }
    }

    if (error instanceof SyntaxError && "body" in error) {
        res.status(400).json({ message: "Malformed JSON body" });
        return;
    }

    console.error(error);
    res.status(500).json({ message: "Internal server error" });
};

export { notFoundMiddleware, errorMiddleware };
