import { ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Package } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { useStackRoute } from "../hooks";
import { Empty, ErrorText, Loading, Rating, Thumb } from "../components/ui";
import { ProductGrid } from "../components/ProductCard";
import { Reviews } from "../components/Reviews";
import { colors, ui } from "../theme";

export function ShopScreen() {
    const { id } = useStackRoute<"Shop">().params;

    const shop = useQuery({ queryKey: ["shop", id], queryFn: () => api.shops.get(id) });
    const products = useQuery({ queryKey: ["shop-products", id], queryFn: () => api.shops.products(id, { limit: 100 }) });

    if (shop.isLoading) return <Loading />;
    if (!shop.data) return <ErrorText message={errorMessage(shop.error) || "Boutique introuvable"} />;

    const { data } = shop;

    return (
        <ScrollView style={ui.screen} contentContainerStyle={[ui.content, { gap: 20 }]}>
            <View style={[ui.card, { padding: 0, overflow: "hidden" }]}>
                {data.imageUrl ? <Thumb uri={data.imageUrl} height={190} /> : null}
                <View style={{ padding: 18, gap: 8 }}>
                    <Text style={[ui.title, { fontSize: 26 }]}>{data.name}</Text>
                    <Rating value={data.averageRating} count={data.reviewCount} />
                    {data.description ? <Text style={[ui.body, { color: colors.muted }]}>{data.description}</Text> : null}
                    {data.address && (
                        <View style={ui.row}>
                            <MapPin size={16} color={colors.accentDark} />
                            <Text style={[ui.muted, { flex: 1 }]}>{data.address.streetAddress}, {data.address.postalCode} {data.address.addressLocality}</Text>
                        </View>
                    )}
                    {data.merchant ? <Text style={ui.muted}>Tenue par {data.merchant.firstname}</Text> : null}
                </View>
            </View>

            <View style={{ gap: 14 }}>
                <Text style={[ui.title, { fontSize: 20 }]}>Produits</Text>
                {products.isLoading ? (
                    <Loading />
                ) : products.data?.data.length ? (
                    <ProductGrid products={products.data.data} />
                ) : (
                    <Empty icon={<Package size={36} color={colors.text} />} title="Aucun produit en vente pour le moment" />
                )}
            </View>

            <Reviews target={{ shopId: id }} ownerId={data.merchantId} />
        </ScrollView>
    );
}
