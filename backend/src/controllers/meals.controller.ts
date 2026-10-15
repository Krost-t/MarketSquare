import type { Request, Response } from "express";
import { z } from "zod";
import { getMeal, mealCategories, mealsByCategory, randomMeals, searchMeals } from "../services/meals.service.ts";

const searchHandler = async (req: Request, res: Response): Promise<void> => {
    const { q } = z.object({ q: z.string().trim().max(100).default("") }).parse(req.query);
    res.status(200).json({ status: "Success", data: q ? await searchMeals(q) : await randomMeals(8) });
};

const randomHandler = async (req: Request, res: Response): Promise<void> => {
    const { count } = z.object({ count: z.coerce.number().int().min(1).max(12).default(8) }).parse(req.query);
    res.status(200).json({ status: "Success", data: await randomMeals(count) });
};

const categoriesHandler = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: "Success", data: await mealCategories() });
};

const categoryHandler = async (req: Request, res: Response): Promise<void> => {
    const { name } = z.object({ name: z.string().trim().min(1).max(50) }).parse(req.params);
    res.status(200).json({ status: "Success", data: await mealsByCategory(name) });
};

const mealHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = z.object({ id: z.string().regex(/^\d{1,10}$/) }).parse(req.params);
    res.status(200).json({ status: "Success", data: await getMeal(id) });
};

export { searchHandler, randomHandler, categoriesHandler, categoryHandler, mealHandler };
