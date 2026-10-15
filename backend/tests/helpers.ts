import request from "supertest";
import app from "../src/app.ts";
import { prisma } from "../src/lib/prisma.ts";

const api = () => request(app);

const resetDatabase = async (): Promise<void> => {
    await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "OrderItem", "Order", "CartItem", "Cart", "Favorite", "Review", "Product", "Address", "Shop", "User" CASCADE`
    );
};

let counter = 0;

const registerUser = async (role: "USER" | "MERCHANT" = "USER") => {
    counter += 1;
    const email = `user${counter}_${Date.now()}@test.dev`;
    const res = await api().post("/auth/register").send({
        lastname: "Doe",
        firstname: "John",
        gender: "MALE",
        dateOfBirth: "1995-04-12",
        phone: "0601020304",
        email,
        password: "Password123!",
        role,
    });
    if (res.status !== 201) {
        throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
    }
    return { token: res.body.token as string, user: res.body.user as { id: string; email: string }, email };
};

const createAdmin = async () => {
    const { token, user } = await registerUser();
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    return { token, user };
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export { api, prisma, resetDatabase, registerUser, createAdmin, auth };
