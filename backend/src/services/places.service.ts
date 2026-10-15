import { cached, fetchJson, firstSuccessful } from "./http.service.ts";
import { distanceInMeters } from "./geo.service.ts";

type PlaceCategory =
    | "bakery"
    | "butcher"
    | "greengrocer"
    | "cheese"
    | "seafood"
    | "grocery"
    | "supermarket"
    | "wine"
    | "market"
    | "books"
    | "florist";

interface Place {
    id: string;
    name: string;
    category: PlaceCategory;
    lat: number;
    lon: number;
    distance: number;
    address: string | null;
    openingHours: string | null;
    phone: string | null;
    website: string | null;
    source: "osm";
}

const CATEGORY_TAGS: Record<PlaceCategory, { key: "shop" | "amenity"; values: string[] }> = {
    bakery: { key: "shop", values: ["bakery", "pastry"] },
    butcher: { key: "shop", values: ["butcher"] },
    greengrocer: { key: "shop", values: ["greengrocer"] },
    cheese: { key: "shop", values: ["cheese", "dairy"] },
    seafood: { key: "shop", values: ["seafood", "fish"] },
    grocery: { key: "shop", values: ["convenience", "deli", "health_food", "organic", "frozen_food", "chocolate", "confectionery"] },
    supermarket: { key: "shop", values: ["supermarket"] },
    wine: { key: "shop", values: ["wine", "alcohol", "beverages"] },
    market: { key: "amenity", values: ["marketplace"] },
    books: { key: "shop", values: ["books"] },
    florist: { key: "shop", values: ["florist"] },
};

const PLACE_CATEGORIES = Object.keys(CATEGORY_TAGS) as PlaceCategory[];

const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

interface OverpassElement {
    type: "node" | "way" | "relation";
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
}

interface NominatimPlace {
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    name?: string;
    category: string;
    type: string;
    display_name: string;
    extratags?: Record<string, string> | null;
}

const categoryOf = (tags: Record<string, string>): PlaceCategory | null => {
    for (const category of PLACE_CATEGORIES) {
        const { key, values } = CATEGORY_TAGS[category];
        const value = tags[key];
        if (value && values.includes(value)) return category;
    }
    return null;
};

const formatAddress = (tags: Record<string, string>): string | null => {
    const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
    const city = [tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" ");
    const address = [street, city].filter(Boolean).join(", ");
    return address || null;
};

const buildOverpassQuery = (lat: number, lon: number, radius: number, categories: PlaceCategory[]): string => {
    const selectors = categories.map((category) => {
        const { key, values } = CATEGORY_TAGS[category];
        return `nwr(around:${radius},${lat},${lon})["${key}"~"^(${values.join("|")})$"]["name"];`;
    });
    return `[out:json][timeout:25];(${selectors.join("")});out center tags 400;`;
};

const fromOverpass = (elements: OverpassElement[], origin: { lat: number; lon: number }): Place[] =>
    elements.flatMap((element) => {
        const tags = element.tags ?? {};
        const category = categoryOf(tags);
        const lat = element.lat ?? element.center?.lat;
        const lon = element.lon ?? element.center?.lon;
        if (!category || !tags.name || lat === undefined || lon === undefined) return [];

        return [{
            id: `osm-${element.type}-${element.id}`,
            name: tags.name,
            category,
            lat,
            lon,
            distance: distanceInMeters(origin, { lat, lon }),
            address: formatAddress(tags),
            openingHours: tags.opening_hours ?? null,
            phone: tags.phone ?? tags["contact:phone"] ?? null,
            website: tags.website ?? tags["contact:website"] ?? null,
            source: "osm" as const,
        }];
    });

const fromNominatim = (places: NominatimPlace[], origin: { lat: number; lon: number }): Place[] =>
    places.flatMap((place) => {
        const category = categoryOf({ [place.category]: place.type });
        if (!category || !place.name) return [];
        const lat = Number(place.lat);
        const lon = Number(place.lon);
        return [{
            id: `osm-${place.osm_type}-${place.osm_id}`,
            name: place.name,
            category,
            lat,
            lon,
            distance: distanceInMeters(origin, { lat, lon }),
            address: place.display_name.split(",").slice(0, 3).join(",").trim(),
            openingHours: place.extratags?.opening_hours ?? null,
            phone: place.extratags?.phone ?? null,
            website: place.extratags?.website ?? null,
            source: "osm" as const,
        }];
    });

const loadFromOverpass = async (lat: number, lon: number, radius: number, categories: PlaceCategory[]): Promise<Place[]> => {
    const body = new URLSearchParams({ data: buildOverpassQuery(lat, lon, radius, categories) });
    return firstSuccessful(
        OVERPASS_ENDPOINTS.map((endpoint) => async () => {
            const data = await fetchJson<{ elements: OverpassElement[] }>(endpoint, {
                method: "POST",
                body,
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                timeoutMs: 30000,
            });
            return fromOverpass(data.elements, { lat, lon });
        }),
    );
};

const loadFromNominatim = async (lat: number, lon: number, radius: number, categories: PlaceCategory[]): Promise<Place[]> => {
    const delta = radius / 111000;
    const viewbox = [lon - delta, lat + delta, lon + delta, lat - delta].join(",");
    const queries = categories.flatMap((category) => CATEGORY_TAGS[category].values.slice(0, 2));
    const results: Place[] = [];

    for (const query of queries) {
        const places = await fetchJson<NominatimPlace[]>(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`[${query}]`)}&viewbox=${viewbox}&bounded=1&format=jsonv2&extratags=1&limit=20`,
        );
        results.push(...fromNominatim(places, { lat, lon }));
    }
    return results;
};

const findNearbyPlaces = (
    lat: number,
    lon: number,
    radius: number,
    categories: PlaceCategory[] = PLACE_CATEGORIES,
): Promise<Place[]> => {
    const key = `places:${lat.toFixed(3)}:${lon.toFixed(3)}:${radius}:${[...categories].sort().join(",")}`;

    return cached(key, 15 * 60 * 1000, async () => {
        const places = await firstSuccessful([
            () => loadFromOverpass(lat, lon, radius, categories),
            () => loadFromNominatim(lat, lon, radius, categories),
        ]);

        const unique = new Map(places.map((place) => [place.id, place]));
        return [...unique.values()].filter((place) => place.distance <= radius).sort((a, b) => a.distance - b.distance);
    });
};

export { findNearbyPlaces, PLACE_CATEGORIES, CATEGORY_TAGS };
export type { Place, PlaceCategory };
