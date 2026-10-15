import type { Meal, NearbyResult, PartnerShop, Place, PlaceCategory } from "./types";

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
    bakery: "Boulangerie",
    butcher: "Boucherie",
    greengrocer: "Primeur",
    cheese: "Fromagerie",
    seafood: "Poissonnerie",
    grocery: "Épicerie",
    supermarket: "Supermarché",
    wine: "Caviste",
    market: "Marché",
    books: "Librairie",
    florist: "Fleuriste",
};

export const FOOD_CATEGORIES: PlaceCategory[] = [
    "bakery",
    "greengrocer",
    "butcher",
    "cheese",
    "seafood",
    "grocery",
    "market",
    "wine",
    "supermarket",
];

export const formatDistance = (meters: number): string =>
    meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1).replace(".", ",")} km`;

export const walkingMinutes = (meters: number): number => Math.max(1, Math.round(meters / 80));

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
    Mo: "lun.",
    Tu: "mar.",
    We: "mer.",
    Th: "jeu.",
    Fr: "ven.",
    Sa: "sam.",
    Su: "dim.",
};

const expandDays = (spec: string): number[] => {
    const days: number[] = [];
    for (const part of spec.split(",")) {
        const [start, end] = part.trim().split("-") as [string, string | undefined];
        const from = DAYS.indexOf(start as (typeof DAYS)[number]);
        if (from === -1) return [];
        const to = end ? DAYS.indexOf(end as (typeof DAYS)[number]) : from;
        if (to === -1) return [];
        for (let i = from; ; i = (i + 1) % 7) {
            days.push(i);
            if (i === to) break;
        }
    }
    return days;
};

const toMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
};

export interface OpeningStatus {
    isOpen: boolean | null;
    todayLabel: string | null;
    raw: string;
}

export const openingStatus = (hours: string | null | undefined, now: Date = new Date()): OpeningStatus | null => {
    if (!hours) return null;
    const raw = hours.trim();
    if (raw === "24/7") return { isOpen: true, todayLabel: "24h/24", raw };

    const today = (now.getDay() + 6) % 7;
    const minutes = now.getHours() * 60 + now.getMinutes();
    let todayRanges: [number, number][] | null = null;
    let todayClosed = false;
    let understood = false;

    for (const rule of raw.split(";")) {
        const match = rule.trim().match(/^([A-Za-z,\s-]+?)\s+(off|closed|[\d:,\s-]+)$/);
        if (!match) continue;
        const days = expandDays(match[1]!.replace(/\s/g, "").replace(/PH,?/g, ""));
        if (days.length === 0) continue;
        understood = true;
        if (!days.includes(today)) continue;

        if (/off|closed/.test(match[2]!)) {
            todayClosed = true;
            todayRanges = [];
            continue;
        }
        todayClosed = false;
        todayRanges = match[2]!.split(",").flatMap((range) => {
            const [open, close] = range.trim().split("-");
            if (!open || !close) return [];
            const end = toMinutes(close);
            return [[toMinutes(open), end <= toMinutes(open) ? end + 1440 : end] as [number, number]];
        });
    }

    if (!understood) return { isOpen: null, todayLabel: null, raw };

    if (todayClosed || !todayRanges || todayRanges.length === 0) {
        return { isOpen: false, todayLabel: `Fermé ${DAY_LABELS[DAYS[today]!]}`, raw };
    }

    const isOpen = todayRanges.some(([open, close]) => minutes >= open && minutes < close);
    const format = (value: number) => `${String(Math.floor((value % 1440) / 60)).padStart(2, "0")}h${String(value % 60).padStart(2, "0")}`;
    const todayLabel = todayRanges.map(([open, close]) => `${format(open)}-${format(close)}`).join(", ");
    return { isOpen, todayLabel, raw };
};

export const toISODate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

export const startOfWeek = (date: Date): Date => {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
    return result;
};

export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const directionsUrl = (to: { lat: number; lon: number }, from?: { lat: number; lon: number }): string =>
    `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${from ? `${from.lat}%2C${from.lon}` : ""}%3B${to.lat}%2C${to.lon}`;

const DAY_NAMES: Record<string, string> = { Mo: "Lun", Tu: "Mar", We: "Mer", Th: "Jeu", Fr: "Ven", Sa: "Sam", Su: "Dim", PH: "Fériés" };

export const formatOpeningHours = (raw: string): string[] =>
    raw
        .split(";")
        .map((rule) => rule.trim())
        .filter(Boolean)
        .map((rule) =>
            rule
                .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (day) => DAY_NAMES[day] ?? day)
                .replace(/\boff\b|\bclosed\b/g, "fermé")
                .replace(/(\d{2}):(\d{2})/g, "$1h$2")
                .replace(/,(?=\S)/g, ", "),
        );

export type NearbyEntry =
    | { kind: "partner"; id: string; name: string; category: PlaceCategory | null; distance: number; lat: number; lon: number; shop: PartnerShop }
    | { kind: "place"; id: string; name: string; category: PlaceCategory; distance: number; lat: number; lon: number; place: Place };

export type MealNeeds = Map<PlaceCategory, string[]>;

const SELLS_EVERYTHING: PlaceCategory[] = ["supermarket", "market"];

export const mealNeeds = (meal: Meal): MealNeeds => {
    const result: MealNeeds = new Map();
    for (const ingredient of meal.ingredients) {
        const names = result.get(ingredient.category) ?? [];
        if (!names.includes(ingredient.name)) names.push(ingredient.name);
        result.set(ingredient.category, names);
    }
    return result;
};

export const fitsMeal = (category: PlaceCategory | null, needs: MealNeeds | null): boolean =>
    !needs || (category !== null && (needs.has(category) || SELLS_EVERYTHING.includes(category)));

export const nearbyEntries = (
    data: NearbyResult,
    { category = null, partnersOnly = false, needs = null }: { category?: PlaceCategory | null; partnersOnly?: boolean; needs?: MealNeeds | null } = {},
): NearbyEntry[] => {
    const partners: NearbyEntry[] = data.partners
        .filter((shop) => shop.address.latitude !== null && shop.address.longitude !== null)
        .map((shop) => ({
            kind: "partner",
            id: `partner-${shop.id}`,
            name: shop.name,
            category: shop.category,
            distance: shop.distance,
            lat: shop.address.latitude!,
            lon: shop.address.longitude!,
            shop,
        }));
    const places: NearbyEntry[] = partnersOnly
        ? []
        : data.places
              .filter((place) => FOOD_CATEGORIES.includes(place.category))
              .map((place) => ({ kind: "place", id: place.id, name: place.name, category: place.category, distance: place.distance, lat: place.lat, lon: place.lon, place }));
    return [...partners, ...places]
        .filter((entry) => (entry.kind === "partner" && entry.category === null) || fitsMeal(entry.category, needs))
        .filter((entry) => !category || entry.category === category)
        .sort((a, b) => (a.kind === b.kind ? a.distance - b.distance : a.kind === "partner" ? -1 : 1));
};

export const categoryCounts = (data: NearbyResult): Map<PlaceCategory, number> => {
    const result = new Map<PlaceCategory, number>();
    data.places.forEach((place) => result.set(place.category, (result.get(place.category) ?? 0) + 1));
    data.partners.forEach((shop) => shop.category && result.set(shop.category, (result.get(shop.category) ?? 0) + 1));
    return result;
};
