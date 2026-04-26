import { prisma } from "./lib/prisma.ts";
import express from "express";
import { config } from "dotenv";
import type { Express } from "express";


// ==== Setting ====
config();
prisma.$connect()

// ==== Importing routes ====
import authRouter from "./routes/auth.routes.ts";

const app: Express = express();

const PORT = process.env.EXPRESS_PORT || 4896;

// ==== Middleware ==== 
// Parse JSON bodies
app.use(express.json());


// ==== API Routes ====
app.use("/auth", authRouter);

const server =app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled Rejection:", reason);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(1);
  })
})

process.on("uncaughtException", async (error: Error) => {
  console.error("Uncaught Exception:", error);
  await prisma.$disconnect();
  process.exit(1);
})

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Server closed, database connection disconnected.");
    process.exit(0);
  });
})