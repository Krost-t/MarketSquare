import type { MealSlot } from "@marketsquare/shared";

export const SLOT_LABELS: Record<MealSlot, string> = { LUNCH: "Midi", DINNER: "Soir" };
export const SLOTS: MealSlot[] = ["LUNCH", "DINNER"];

export const MEAL_CATEGORY_LABELS: Record<string, string> = {
    Beef: "Bœuf",
    Chicken: "Poulet",
    Dessert: "Desserts",
    Lamb: "Agneau",
    Miscellaneous: "Divers",
    Pasta: "Pâtes",
    Pork: "Porc",
    Seafood: "Poisson",
    Side: "Accompagnements",
    Starter: "Entrées",
    Vegan: "Vegan",
    Vegetarian: "Végétarien",
    Breakfast: "Petit-déjeuner",
    Goat: "Chèvre",
};

export const dayFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric" });
export const longFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
export const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const parseISODate = (value: string) => {
    const [y, m, d] = value.slice(0, 10).split("-").map(Number);
    return new Date(y!, m! - 1, d!);
};
