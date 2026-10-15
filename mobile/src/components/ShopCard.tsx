import { Pressable, Text, View } from "react-native";
import { Basket, BookOpen, Bread, Carrot, Cheese, Fish, Flower, Knife, ShoppingCart, Storefront, Wine, type Icon } from "./icons";
import { PLACE_CATEGORY_LABELS, formatDistance, type PlaceCategory, type Shop } from "@marketsquare/shared";
import { useStackNavigation } from "../hooks";
import { Rating } from "./ui";
import { colors, radius, ui } from "../theme";

const CATEGORY_ICONS: Record<PlaceCategory, Icon> = {
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

export function CategoryIcon({ category, size = 18, color = colors.text }: { category: PlaceCategory | null; size?: number; color?: string }) {
    const Glyph = category ? CATEGORY_ICONS[category] : Storefront;
    return <Glyph size={size} color={color} />;
}

export const categoryLabel = (category: PlaceCategory | null) => (category ? PLACE_CATEGORY_LABELS[category] : "Commerce");

export function ShopCard({ shop, distance }: { shop: Shop; distance?: number }) {
    const navigation = useStackNavigation();
    return (
        <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [ui.card, { flexDirection: "row", gap: 14, padding: 14 }, pressed && { borderColor: colors.faint }]}
            onPress={() => navigation.navigate("Shop", { id: shop.id, name: shop.name })}
        >
            <View style={{ width: 44, height: 44, borderRadius: radius.ui, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                <CategoryIcon category={shop.category} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
                <Text style={ui.subtitle} numberOfLines={1}>{shop.name}</Text>
                <Text style={ui.muted}>
                    {categoryLabel(shop.category)}
                    {shop.address ? ` à ${shop.address.addressLocality}` : ""}
                    {distance !== undefined ? ` · ${formatDistance(distance)}` : ""}
                </Text>
                {shop.description ? <Text style={[ui.body, { fontSize: 14, color: colors.muted }]} numberOfLines={2}>{shop.description}</Text> : null}
                <View style={[ui.row, { marginTop: 2 }]}>
                    {shop.reviewCount > 0 && <Rating value={shop.averageRating} count={shop.reviewCount} />}
                    {shop._count ? <Text style={[ui.muted, { fontSize: 12 }]}>{shop._count.products} produits en ligne</Text> : null}
                </View>
            </View>
        </Pressable>
    );
}
