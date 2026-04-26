import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client.ts";

const connectionString: string = `${process.env.DATABASE_URL}`;

const adapter: PrismaPg = new PrismaPg({ connectionString });
const prisma: PrismaClient = new PrismaClient({
    log:
    process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    adapter });

export { prisma };