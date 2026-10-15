import type { User } from "../generated/client.ts";

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export {};
