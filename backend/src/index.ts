import { prisma } from "./lib/prisma.ts";
import express from "express";
import { config } from "dotenv";
import type { Express } from "express";


// ==== Setting ====
config();
prisma.$connect()

const app: Express = express();

const PORT = process.env.EXPRESS_PORT;

// ==== Importing routes ====
import authRouter from "./routes/auth.routes.ts";
import adminRouter from "./routes/admin.routes.ts";
import userRouter from "./routes/user.routes.ts";
import addressRouter from "./routes/address.routes.ts";
import shopRouter from "./routes/shop.routes.ts";
import productRouter from "./routes/product.routes.ts";
import reviewRouter from "./routes/review.routes.ts";
import cartRouter from "./routes/cart.routes.ts";
import orderRouter from "./routes/order.routes.ts";


// ==== Middleware ====
// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ==== API Routes ====
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/users", userRouter);
app.use("/addresses", addressRouter);
app.use("/shops", shopRouter);
app.use("/products", productRouter);
app.use("/reviews", reviewRouter);
app.use("/cart", cartRouter);
app.use("/orders", orderRouter);


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