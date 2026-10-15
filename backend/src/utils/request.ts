import type { Request } from "express";
import type { User } from "../generated/client.ts";
import { HttpError } from "./http-error.ts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getIdParam = (req: Request, name = "id"): string => {
    const value = req.params[name];

    if (!value || typeof value !== "string" || !UUID_REGEX.test(value)) {
        throw new HttpError(400, `Invalid or missing parameter: ${name}`);
    }
    return value;
};

const getCurrentUser = (req: Request): User => {
    if (!req.user) {
        throw new HttpError(401, "Unauthorized");
    }
    return req.user;
};

const toPublicUser = <T extends { password: string; pushToken?: string | null }>(user: T): Omit<T, "password" | "pushToken"> => {
    const { password: _password, pushToken: _pushToken, ...publicUser } = user;
    return publicUser;
};

export { getIdParam, getCurrentUser, toPublicUser };
