import express from "express";
import type { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { notFoundMiddleware, errorMiddleware } from "./middlewares/error.middleware.ts";

import authRouter from "./routes/auth.routes.ts";
import adminRouter from "./routes/admin.routes.ts";
import userRouter from "./routes/users.routes.ts";
import addressRouter from "./routes/address.routes.ts";
import shopRouter from "./routes/shop.routes.ts";
import productRouter from "./routes/product.routes.ts";
import reviewRouter from "./routes/review.routes.ts";
import cartRouter from "./routes/cart.routes.ts";
import orderRouter from "./routes/order.routes.ts";
import { mealPlanRouter, mealsRouter, placesRouter, shoppingListRouter } from "./routes/discover.routes.ts";


const app: Express = express();

app.use(helmet());
app.use(cors({
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((origin) => origin.trim()),
    credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: { message: "Too many requests, please try again later" },
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: { message: "Too many attempts, please try again later" },
});

const externalApiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: { message: "Too many requests, please try again later" },
});


app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok", service: "marketsquare-api" });
});


app.use(["/auth/login", "/auth/forgot-password"], loginLimiter);
app.use("/auth", authLimiter, authRouter);
app.use("/admin", adminRouter);
app.use("/user", userRouter);
app.use("/addresses", addressRouter);
app.use("/shops", shopRouter);
app.use("/products", productRouter);
app.use("/reviews", reviewRouter);
app.use("/cart", cartRouter);
app.use("/orders", orderRouter);
app.use("/places", externalApiLimiter, placesRouter);
app.use("/meals", externalApiLimiter, mealsRouter);
app.use("/shopping-list", externalApiLimiter, shoppingListRouter);
app.use("/meal-plan", externalApiLimiter, mealPlanRouter);


app.use(notFoundMiddleware);
app.use(errorMiddleware);


export default app;
