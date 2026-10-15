import { Pressable, Text, View } from "react-native";
import { formatPrice, type Product } from "@marketsquare/shared";
import { useStackNavigation } from "../hooks";
import { Rating, Thumb } from "./ui";
import { colors, fonts, radius, ui } from "../theme";

export function ProductCard({ product }: { product: Product }) {
    const navigation = useStackNavigation();
    const outOfStock = product.stock <= 0;
    return (
        <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [{ flex: 1, gap: 2 }, pressed && { opacity: 0.8 }]}
            onPress={() => navigation.navigate("Product", { id: product.id, name: product.name })}
        >
            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.panel, overflow: "hidden", backgroundColor: colors.card, marginBottom: 8 }}>
                <Thumb uri={product.imageUrl} height={150} contain />
            </View>
            {product.shop ? <Text style={[ui.muted, { fontSize: 12 }]} numberOfLines={1}>{product.shop.name}</Text> : null}
            <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.text }} numberOfLines={2}>{product.name}</Text>
            <View style={[ui.row, { justifyContent: "space-between", marginTop: 2 }]}>
                <Text style={[ui.price, { fontSize: 15 }]}>{formatPrice(product.price)}</Text>
                {outOfStock ? (
                    <Text style={{ fontSize: 12, fontFamily: fonts.medium, color: colors.accentDark }}>Épuisé</Text>
                ) : product.reviewCount > 0 ? (
                    <Rating value={product.averageRating} />
                ) : null}
            </View>
        </Pressable>
    );
}

export function ProductGrid({ products }: { products: Product[] }) {
    const rows: Product[][] = [];
    for (let i = 0; i < products.length; i += 2) rows.push(products.slice(i, i + 2));
    return (
        <View style={{ gap: 18 }}>
            {rows.map((row) => (
                <View key={row[0]!.id} style={{ flexDirection: "row", gap: 14 }}>
                    {row.map((product) => <ProductCard key={product.id} product={product} />)}
                    {row.length === 1 && <View style={{ flex: 1 }} />}
                </View>
            ))}
        </View>
    );
}
