import { execSync } from "node:child_process";
import { getTestEnv } from "./test-env.js";

export default async () => {
    const env = getTestEnv();
    try {
        execSync("npx prisma migrate deploy", {
            env: { ...process.env, ...env },
            stdio: "pipe",
        });
    } catch (error) {
        throw new Error(`prisma migrate deploy a échoué (base démarrée ? docker compose up -d)\n${error.stdout ?? ""}${error.stderr ?? error.message}`);
    }
};
