import { config } from "dotenv";

export const getTestEnv = () => {
    config({ quiet: true });

    let databaseUrl = process.env.TEST_DATABASE_URL;
    if (!databaseUrl) {
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL or TEST_DATABASE_URL must be set to run the tests");
        }
        const url = new URL(process.env.DATABASE_URL);
        url.pathname = `${url.pathname}_test`;
        databaseUrl = url.toString();
    }

    return {
        NODE_ENV: "test",
        EXPOSE_RESET_TOKEN: "true",
        DATABASE_URL: databaseUrl,
        JWT_SECRET: process.env.JWT_SECRET ?? "test-secret",
        JWT_EXPIRES_IN: "1h",
        JWT_COOKIE_EXPIRES_IN: "1",
    };
};
