import { ApiError, createApiClient } from "@marketsquare/shared";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4896";

export const api = createApiClient({ baseUrl: API_URL });

export const errorMessage = (error: unknown): string => {
    if (error instanceof ApiError) {
        if (error.errors.length) {
            return error.errors.map((e) => (e.path ? `${e.path} : ${e.message}` : e.message)).join(" · ");
        }
        return error.message;
    }
    if (error instanceof Error) return error.message;
    return "Une erreur est survenue";
};
