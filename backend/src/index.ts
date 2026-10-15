import "dotenv/config";
import { prisma } from "./lib/prisma.ts";
import app from "./app.ts";


if ((process.env.JWT_SECRET ?? "").length < 32) {
  throw new Error("JWT_SECRET must be set and at least 32 characters long");
}

// ==== Setting ====
await prisma.$connect()

const PORT = process.env.EXPRESS_PORT ?? 4896;


const server =app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// Handle unhandled promise rejections and uncaught exceptions
process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled Rejection:", reason);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(1);
  })
})
// Handle uncaught exceptions
process.on("uncaughtException", async (error: Error) => {
  console.error("Uncaught Exception:", error);
  await prisma.$disconnect();
  process.exit(1);
})
// Handle graceful shutdown on SIGTERM
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Server closed, database connection disconnected.");
    process.exit(0);
  });
})
