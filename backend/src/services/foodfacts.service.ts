import { cached, fetchJson } from "./http.service.ts";
import { HttpError } from "../utils/http-error.ts";

interface FoodProduct {
    barcode: string;
    name: string;
    brand: string | null;
    quantity: string | null;
    imageUrl: string | null;
}

interface OffProduct {
    code?: string;
    product_name?: string;
    product_name_fr?: string;
    brands?: string | string[];
    quantity?: string;
    image_front_url?: string;
    image_url?: string;
}

const FIELDS = "code,product_name,product_name_fr,brands,quantity,image_front_url,image_url";

const toFoodProduct = (product: OffProduct, barcode?: string): FoodProduct => ({
    barcode: product.code ?? barcode ?? "",
    name: product.product_name_fr || product.product_name || "Produit",
    brand: Array.isArray(product.brands) ? product.brands[0] ?? null : product.brands?.split(",")[0]?.trim() || null,
    quantity: product.quantity ?? null,
    imageUrl: product.image_front_url ?? product.image_url ?? null,
});

const lookupBarcode = (barcode: string): Promise<FoodProduct> =>
    cached(`off:barcode:${barcode}`, 24 * 60 * 60 * 1000, async () => {
        const data = await fetchJson<{ status: number; product?: OffProduct }>(
            `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`,
        );
        if (data.status !== 1 || !data.product) {
            throw new HttpError(404, "Product not found on Open Food Facts");
        }
        return toFoodProduct(data.product, barcode);
    });

const searchFoodProducts = (query: string, limit = 12): Promise<FoodProduct[]> =>
    cached(`off:search:${query.toLowerCase()}:${limit}`, 6 * 60 * 60 * 1000, async () => {
        const data = await fetchJson<{ hits: OffProduct[] }>(
            `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=${limit}&langs=fr&fields=${FIELDS}`,
            { timeoutMs: 20000 },
        );
        return data.hits.filter((hit) => hit.image_front_url || hit.image_url).map((hit) => toFoodProduct(hit));
    });

export { lookupBarcode, searchFoodProducts };
export type { FoodProduct };
