import { cached, fetchJson } from "./http.service.ts";
import { classifyItem, translateIngredient } from "./ingredients.service.ts";
import { HttpError } from "../utils/http-error.ts";
import type { PlaceCategory } from "./places.service.ts";

const MEALDB_URL = `https://www.themealdb.com/api/json/v1/${process.env.MEALDB_API_KEY ?? "1"}`;
const HOUR = 60 * 60 * 1000;

type RawMeal = Record<string, string | null>;

interface MealSummary {
    id: string;
    name: string;
    thumbnail: string;
    category: string | null;
    area: string | null;
}

interface Ingredient {
    name: string;
    original: string;
    measure: string | null;
    image: string;
    category: PlaceCategory;
}

interface Meal extends MealSummary {
    instructions: string;
    youtube: string | null;
    source: string | null;
    ingredients: Ingredient[];
}

const ingredientImage = (name: string) => `https://www.themealdb.com/images/ingredients/${encodeURIComponent(name)}-small.png`;

const toSummary = (raw: RawMeal): MealSummary => ({
    id: raw.idMeal ?? "",
    name: raw.strMeal ?? "",
    thumbnail: raw.strMealThumb ?? "",
    category: raw.strCategory ?? null,
    area: raw.strArea ?? null,
});

const toMeal = (raw: RawMeal): Meal => {
    const ingredients: Ingredient[] = [];
    for (let i = 1; i <= 20; i++) {
        const original = raw[`strIngredient${i}`]?.trim();
        if (!original) continue;
        ingredients.push({
            name: translateIngredient(original),
            original,
            measure: raw[`strMeasure${i}`]?.trim() || null,
            image: ingredientImage(original),
            category: classifyItem(original),
        });
    }

    return {
        ...toSummary(raw),
        instructions: raw.strInstructions ?? "",
        youtube: raw.strYoutube || null,
        source: raw.strSource || null,
        ingredients,
    };
};

const searchMeals = (query: string): Promise<MealSummary[]> =>
    cached(`meals:search:${query.toLowerCase()}`, 6 * HOUR, async () => {
        const data = await fetchJson<{ meals: RawMeal[] | null }>(`${MEALDB_URL}/search.php?s=${encodeURIComponent(query)}`);
        return (data.meals ?? []).map(toSummary);
    });

const mealsByCategory = (category: string): Promise<MealSummary[]> =>
    cached(`meals:category:${category}`, 24 * HOUR, async () => {
        const data = await fetchJson<{ meals: RawMeal[] | null }>(`${MEALDB_URL}/filter.php?c=${encodeURIComponent(category)}`);
        return (data.meals ?? []).map((raw) => ({ ...toSummary(raw), category }));
    });

const mealCategories = (): Promise<{ name: string; thumbnail: string }[]> =>
    cached("meals:categories", 24 * HOUR, async () => {
        const data = await fetchJson<{ categories: { strCategory: string; strCategoryThumb: string }[] }>(`${MEALDB_URL}/categories.php`);
        return data.categories.map((c) => ({ name: c.strCategory, thumbnail: c.strCategoryThumb }));
    });

const getMeal = (id: string): Promise<Meal> =>
    cached(`meals:lookup:${id}`, 24 * HOUR, async () => {
        const data = await fetchJson<{ meals: RawMeal[] | null }>(`${MEALDB_URL}/lookup.php?i=${encodeURIComponent(id)}`);
        const raw = data.meals?.[0];
        if (!raw) throw new HttpError(404, "Meal not found");
        return toMeal(raw);
    });

const randomMeals = async (count: number): Promise<MealSummary[]> => {
    const results = await Promise.allSettled(
        Array.from({ length: count }, () => fetchJson<{ meals: RawMeal[] | null }>(`${MEALDB_URL}/random.php`)),
    );
    const meals = results.flatMap((result) => (result.status === "fulfilled" ? (result.value.meals ?? []).map(toSummary) : []));
    return [...new Map(meals.map((meal) => [meal.id, meal])).values()];
};

export { searchMeals, mealsByCategory, mealCategories, getMeal, randomMeals, ingredientImage };
export type { Meal, MealSummary, Ingredient };
