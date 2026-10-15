import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { api, auth, prisma, registerUser, resetDatabase } from "./helpers.ts";

beforeAll(resetDatabase);
afterAll(async () => {
    await prisma.$disconnect();
});

describe("Auth", () => {
    it("registers a user without leaking the password", async () => {
        const { user, token } = await registerUser();

        expect(token).toEqual(expect.any(String));
        expect(user).not.toHaveProperty("password");
        expect(user).toHaveProperty("username");
    });

    it("sets an httpOnly JWT cookie on login", async () => {
        const { email } = await registerUser();

        const res = await api().post("/auth/login").send({ email, password: "Password123!" });

        expect(res.status).toBe(200);
        expect(res.headers["set-cookie"]?.[0]).toMatch(/jwt=.*HttpOnly/);
    });

    it("rejects a wrong password", async () => {
        const { email } = await registerUser();

        const res = await api().post("/auth/login").send({ email, password: "wrong-password" });

        expect(res.status).toBe(400);
    });

    it("refuses a duplicated email", async () => {
        const { email } = await registerUser();

        const res = await api().post("/auth/register").send({
            lastname: "Doe", firstname: "Jane", gender: "FEMALE", dateOfBirth: "1990-01-01",
            phone: "0601020304", email, password: "Password123!",
        });

        expect(res.status).toBe(400);
    });

    it("validates the register payload", async () => {
        const res = await api().post("/auth/register").send({ email: "not-an-email" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Validation error");
    });

    it("resets the password with a single-use token", async () => {
        const { email } = await registerUser();

        const forgot = await api().post("/auth/forgot-password").send({ email });
        expect(forgot.status).toBe(200);
        const { userId, token } = forgot.body;

        const reset = await api().post("/auth/reset-password").send({ userId, token, password: "NewPassword456!" });
        expect(reset.status).toBe(200);

        const reuse = await api().post("/auth/reset-password").send({ userId, token, password: "Another789!" });
        expect(reuse.status).toBe(400);

        const login = await api().post("/auth/login").send({ email, password: "NewPassword456!" });
        expect(login.status).toBe(200);
    });

    it("revokes older tokens after a password change", async () => {
        const { token } = await registerUser();
        await new Promise((resolve) => setTimeout(resolve, 1100));

        const change = await api().patch("/user/change-password").set(auth(token)).send({ currentPassword: "Password123!", newPassword: "NewPassword456!" });
        expect(change.status).toBe(200);

        expect((await api().get("/user/user-profile").set(auth(token))).status).toBe(401);
        expect((await api().get("/user/user-profile").set(auth(change.body.token))).status).toBe(200);
    });

    it("protects private routes", async () => {
        expect((await api().get("/user/user-profile")).status).toBe(401);

        const { token } = await registerUser();
        const res = await api().get("/user/user-profile").set(auth(token));
        expect(res.status).toBe(200);
        expect(res.body.data).not.toHaveProperty("password");
    });

    it("changes the password of the current user", async () => {
        const { token, email } = await registerUser();

        const res = await api().patch("/user/change-password").set(auth(token))
            .send({ currentPassword: "Password123!", newPassword: "Changed123!" });
        expect(res.status).toBe(200);

        const login = await api().post("/auth/login").send({ email, password: "Changed123!" });
        expect(login.status).toBe(200);
    });
});
