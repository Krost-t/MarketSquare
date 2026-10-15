import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { getCurrentUser, getIdParam } from "../utils/request.ts";
import { HttpError } from "../utils/http-error.ts";
import { getMeal } from "../services/meals.service.ts";
import { normalize } from "../services/ingredients.service.ts";
import { rangeSchema, setMealSchema } from "../validators/planner.validator.ts";

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

const checkRange = (from: string, to: string) => {
    const days = (toDate(to).getTime() - toDate(from).getTime()) / 86400000;
    if (days < 0 || days > 62) throw new HttpError(400, "Range must be between 0 and 62 days");
};

const listPlanHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = getCurrentUser(req);
    const { from, to } = rangeSchema.parse(req.query);
    checkRange(from, to);

    const entries = await prisma.mealPlanEntry.findMany({
        where: { userId, date: { gte: toDate(from), lte: toDate(to) } },
        orderBy: [{ date: "asc" }, { slot: "asc" }],
    });

    res.status(200).json({ status: "Success", data: entries });
};

const setMealHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = getCurrentUser(req);
    const { date, slot, mealId } = setMealSchema.parse(req.body);
    const meal = await getMeal(mealId);

    const entry = await prisma.mealPlanEntry.upsert({
        where: { userId_date_slot: { userId, date: toDate(date), slot } },
        create: { userId, date: toDate(date), slot, mealId, name: meal.name, thumbnail: meal.thumbnail },
        update: { mealId, name: meal.name, thumbnail: meal.thumbnail },
    });

    res.status(200).json({ status: "Success", data: entry });
};

const deleteMealHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = getCurrentUser(req);
    const { count } = await prisma.mealPlanEntry.deleteMany({ where: { id: getIdParam(req), userId } });
    if (count === 0) throw new HttpError(404, "Entry not found");
    res.status(200).json({ status: "Success", message: "Entry removed" });
};

const ingredientsToListHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = getCurrentUser(req);
    const { from, to } = rangeSchema.parse(req.body);
    checkRange(from, to);

    const entries = await prisma.mealPlanEntry.findMany({
        where: { userId, date: { gte: toDate(from), lte: toDate(to) } },
    });
    if (entries.length === 0) throw new HttpError(400, "No meal planned in this period");

    const meals = await Promise.all([...new Set(entries.map((entry) => entry.mealId))].map((id) => getMeal(id)));
    const countByMeal = new Map<string, number>();
    entries.forEach((entry) => countByMeal.set(entry.mealId, (countByMeal.get(entry.mealId) ?? 0) + 1));

    const merged = new Map<string, { label: string; measures: string[] }>();
    for (const meal of meals) {
        const times = countByMeal.get(meal.id) ?? 1;
        for (const ingredient of meal.ingredients) {
            const key = normalize(ingredient.name);
            if (key === "eau" || key === "water") continue;
            const current = merged.get(key) ?? { label: ingredient.name, measures: [] };
            if (ingredient.measure) {
                current.measures.push(times > 1 ? `${times} × ${ingredient.measure}` : ingredient.measure);
            }
            merged.set(key, current);
        }
    }

    const existing = await prisma.shoppingListItem.findMany({ where: { userId, checked: false } });
    const existingLabels = new Set(existing.map((item) => normalize(item.label)));
    const toCreate = [...merged.entries()].filter(([key]) => !existingLabels.has(key));

    await prisma.shoppingListItem.createMany({
        data: toCreate.map(([, value]) => ({
            userId,
            label: value.label.charAt(0).toUpperCase() + value.label.slice(1),
            quantity: value.measures.join(" + ").slice(0, 60) || null,
            source: "meal",
        })),
    });

    res.status(201).json({
        status: "Success",
        message: `${toCreate.length} ingredient(s) added`,
        data: { added: toCreate.length, skipped: merged.size - toCreate.length },
    });
};

export { listPlanHandler, setMealHandler, deleteMealHandler, ingredientsToListHandler };
