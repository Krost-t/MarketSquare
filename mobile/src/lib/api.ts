import { ApiError, createApiClient } from "@marketsquare/shared";
import { tokenStorage } from "./storage";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4896";

let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
    unauthorizedHandler = handler;
};

export const api = createApiClient({
    baseUrl: API_URL,
    getToken: () => tokenStorage.get(),
    onUnauthorized: () => unauthorizedHandler?.(),
});

export const errorMessage = (error: unknown): string => {
    if (error instanceof ApiError) {
        if (error.errors.length) return error.errors.map((e) => e.message).join("\n");
        return error.message;
    }
    if (error instanceof Error) return error.message;
    return "Une erreur est survenue";
};
