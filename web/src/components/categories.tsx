import {
    Basket,
    BookOpen,
    Bread,
    Cheese,
    Fish,
    Flower,
    Carrot,
    Knife,
    ShoppingCart,
    Storefront,
    Wine,
    type Icon,
} from "@phosphor-icons/react";
import type { PlaceCategory } from "@marketsquare/shared";

export const CATEGORY_ICONS: Record<PlaceCategory, Icon> = {
    bakery: Bread,
    butcher: Knife,
    greengrocer: Carrot,
    cheese: Cheese,
    seafood: Fish,
    grocery: Basket,
    supermarket: ShoppingCart,
    wine: Wine,
    market: Storefront,
    books: BookOpen,
    florist: Flower,
};

export function CategoryIcon({ category, size = 18, className }: { category: PlaceCategory | null | undefined; size?: number; className?: string }) {
    const IconComponent = (category && CATEGORY_ICONS[category]) || Storefront;
    return <IconComponent size={size} weight="duotone" className={className} aria-hidden />;
}
