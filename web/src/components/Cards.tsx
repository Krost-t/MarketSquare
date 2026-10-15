import { Link } from "react-router";
import { formatDistance, formatPrice, PLACE_CATEGORY_LABELS, type Product, type Shop } from "@marketsquare/shared";
import { CategoryIcon } from "./categories.tsx";
import { Stars, Thumb } from "./ui.tsx";

export function ProductCard({ product }: { product: Product }) {
    const outOfStock = product.stock <= 0;
    return (
        <Link to={`/products/${product.id}`} className="group flex flex-col">
            <div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white dark:border-ink-800">
                <Thumb src={product.imageUrl} alt={product.name} contain className="aspect-square w-full transition duration-300 group-hover:scale-[1.03]" />
            </div>
            <div className="mt-3 flex flex-1 flex-col gap-0.5">
                {product.shop && <p className="truncate text-xs text-ink-500 dark:text-ink-400">{product.shop.name}</p>}
                <h3 className="line-clamp-2 text-sm font-medium text-ink-900 group-hover:underline dark:text-white">{product.name}</h3>
                <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="num text-[15px] font-semibold">{formatPrice(product.price)}</span>
                    {outOfStock ? (
                        <span className="text-xs font-medium text-tomato-600">Épuisé</span>
                    ) : (
                        product.reviewCount > 0 && <Stars value={product.averageRating} />
                    )}
                </div>
            </div>
        </Link>
    );
}

export function ShopCard({ shop, distance }: { shop: Shop; distance?: number }) {
    return (
        <Link
            to={`/shops/${shop.id}`}
            className="group flex items-start gap-4 rounded-[var(--radius-panel)] border border-ink-200 bg-white p-4 transition hover:border-ink-400 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-ink-600"
        >
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-ui)] bg-tomato-500 text-white">
                <CategoryIcon category={shop.category} size={22} />
            </span>
            <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold group-hover:underline">{shop.name}</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">
                    {shop.category ? PLACE_CATEGORY_LABELS[shop.category] : "Commerce"}
                    {shop.address && ` à ${shop.address.addressLocality}`}
                    {distance !== undefined && <span className="num"> {formatDistance(distance)}</span>}
                </p>
                {shop.description && <p className="mt-1.5 line-clamp-2 text-sm text-ink-600 dark:text-ink-300">{shop.description}</p>}
                <div className="mt-2 flex items-center gap-3 text-xs text-ink-500">
                    {shop.reviewCount > 0 && <Stars value={shop.averageRating} count={shop.reviewCount} />}
                    {shop._count && <span><span className="num">{shop._count.products}</span> produits en ligne</span>}
                </div>
            </div>
        </Link>
    );
}
