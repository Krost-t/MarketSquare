import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@marketsquare/shared";
import { Basket, Heart, MapPin, Minus, Plus } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useCartMutation } from "../lib/cart";
import { useStackNavigation, useStackRoute } from "../hooks";
import { Button, ErrorText, LinkText, Loading, Rating, SuccessText, Thumb } from "../components/ui";
import { Reviews } from "../components/Reviews";
import { colors, fonts, radius, ui } from "../theme";

export function ProductScreen() {
    const navigation = useStackNavigation();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { id } = useStackRoute<"Product">().params;
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);

    const { data: product, isLoading, error } = useQuery({ queryKey: ["product", id, user?.id], queryFn: () => api.products.get(id) });
    const addToCart = useCartMutation(() => api.cart.add(id, quantity));
    const toggleFavorite = useMutation({
        mutationFn: () => (product?.isFavorite ? api.user.removeFavorite(id) : api.user.addFavorite(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
        },
    });

    if (isLoading) return <Loading />;
    if (!product) return <ErrorText message={errorMessage(error) || "Produit introuvable"} />;

    const outOfStock = product.stock <= 0;
    const isOwner = user?.id === product.shop?.merchantId;

    const onAdd = () => {
        if (!user) {
            navigation.navigate("Login");
            return;
        }
        setAdded(false);
        addToCart.mutate(undefined, { onSuccess: () => setAdded(true) });
    };

    return (
        <ScrollView style={ui.screen} contentContainerStyle={[ui.content, { gap: 14 }]}>
            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.panel, overflow: "hidden", backgroundColor: colors.card }}>
                <Thumb uri={product.imageUrl} height={300} contain />
            </View>
            {product.shop && (
                <Text
                    accessibilityRole="link"
                    style={{ color: colors.accentDark, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 0.6, textTransform: "uppercase" }}
                    onPress={() => navigation.navigate("Shop", { id: product.shop!.id, name: product.shop!.name })}
                >
                    {product.shop.name}
                </Text>
            )}
            <Text style={[ui.title, { fontSize: 28 }]}>{product.name}</Text>
            <Rating value={product.averageRating} count={product.reviewCount} />
            <Text style={[ui.price, { fontSize: 26 }]}>{formatPrice(product.price)}</Text>
            {product.description ? <Text style={ui.body}>{product.description}</Text> : null}
            <Text style={{ fontFamily: fonts.medium, color: outOfStock ? colors.danger : colors.success }}>
                {outOfStock ? "Épuisé" : product.stock <= 5 ? `Plus que ${product.stock} en stock` : "En stock"}
            </Text>
            {!product.isActive && <Text style={{ color: colors.accentDark }}>Produit désactivé (visible uniquement par vous)</Text>}

            {!isOwner && (
                <View style={ui.row}>
                    <View style={[ui.row, { borderWidth: 1, borderColor: colors.border, borderRadius: radius.ui, backgroundColor: colors.card, gap: 0 }]}>
                        <Pressable accessibilityRole="button" accessibilityLabel="Diminuer la quantité" disabled={quantity <= 1} onPress={() => setQuantity(quantity - 1)} style={{ padding: 12, opacity: quantity <= 1 ? 0.4 : 1 }}>
                            <Minus size={16} color={colors.text} />
                        </Pressable>
                        <Text style={{ width: 32, textAlign: "center", fontFamily: fonts.medium, color: colors.text }}>{quantity}</Text>
                        <Pressable accessibilityRole="button" accessibilityLabel="Augmenter la quantité" disabled={quantity >= product.stock} onPress={() => setQuantity(quantity + 1)} style={{ padding: 12, opacity: quantity >= product.stock ? 0.4 : 1 }}>
                            <Plus size={16} color={colors.text} />
                        </Pressable>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Button title="Ajouter au panier" icon={<Basket size={17} color="#fff" />} disabled={outOfStock || addToCart.isPending} onPress={onAdd} />
                    </View>
                    {user && (
                        <Button
                            variant="ghost"
                            icon={<Heart size={18} color={product.isFavorite ? "#ef4444" : colors.text} weight={product.isFavorite ? "fill" : "regular"} />}
                            onPress={() => toggleFavorite.mutate()}
                        />
                    )}
                </View>
            )}
            <ErrorText message={addToCart.error ? errorMessage(addToCart.error) : null} />
            {added && (
                <SuccessText>
                    Ajouté au panier. <LinkText color={colors.success} onPress={() => navigation.navigate("Cart")}>Voir le panier</LinkText>
                </SuccessText>
            )}

            {product.shop?.address && (
                <View style={[ui.card, { gap: 4 }]}>
                    <View style={ui.row}>
                        <MapPin size={16} color={colors.accentDark} />
                        <Text style={{ fontFamily: fonts.medium, color: colors.text }}>Retrait possible en boutique</Text>
                    </View>
                    <Text style={ui.muted}>{product.shop.address.streetAddress}, {product.shop.address.postalCode} {product.shop.address.addressLocality}</Text>
                </View>
            )}

            <View style={{ marginTop: 16 }}>
                <Reviews target={{ productId: id }} ownerId={product.shop?.merchantId} />
            </View>
        </ScrollView>
    );
}
