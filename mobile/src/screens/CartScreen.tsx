import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    DELIVERY_METHOD_LABELS,
    PAYMENT_METHOD_LABELS,
    formatPrice,
    type CartItem,
    type DeliveryMethod,
    type PaymentMethod,
} from "@marketsquare/shared";
import { Basket, Minus, Plus, Trash } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { CART_QUERY_KEY, useCart, useCartMutation } from "../lib/cart";
import { useStackNavigation } from "../hooks";
import { Button, Chip, Empty, ErrorText, LinkText, Loading, Thumb } from "../components/ui";
import { colors, fonts, radius, ui } from "../theme";

export function CartScreen() {
    const navigation = useStackNavigation();
    const queryClient = useQueryClient();
    const { data: cart, isLoading, refetch, isRefetching } = useCart();
    const addresses = useQuery({ queryKey: ["addresses"], queryFn: () => api.addresses.list() });

    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ON_SITE");
    const [addressId, setAddressId] = useState<string | null>(null);

    const updateQuantity = useCartMutation(({ id, quantity }: { id: string; quantity: number }) => api.cart.update(id, quantity));
    const removeItem = useCartMutation((id: string) => api.cart.remove(id));
    const selectedAddress = addressId ?? addresses.data?.[0]?.id;

    const checkout = useMutation({
        mutationFn: () =>
            api.orders.checkout({
                deliveryMethod,
                paymentMethod,
                ...(deliveryMethod === "DELIVERY" && selectedAddress && { addressId: selectedAddress }),
            }),
        onSuccess: (orders) => {
            queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            navigation.navigate("Orders", { created: orders.length });
        },
    });

    if (isLoading) return <Loading />;

    if (!cart || cart.items.length === 0) {
        return (
            <Empty icon={<Basket size={36} color={colors.text} />} title="Votre panier est vide">
                Le panier sert à commander en ligne chez les commerçants partenaires, en retrait ou en livraison.
                <Button title="Parcourir le catalogue" variant="ghost" onPress={() => navigation.navigate("Products")} />
            </Empty>
        );
    }

    const byShop = cart.items.reduce<Record<string, { name: string; items: CartItem[] }>>((groups, item) => {
        const shopId = item.product.shopId;
        groups[shopId] ??= { name: item.product.shop?.name ?? "Boutique", items: [] };
        groups[shopId].items.push(item);
        return groups;
    }, {});
    const shopCount = Object.keys(byShop).length;

    const changeDelivery = (method: DeliveryMethod) => {
        setDeliveryMethod(method);
        if (method === "DELIVERY" && paymentMethod === "ON_SITE") setPaymentMethod("CARD");
    };

    const paymentOptions = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).filter((method) => method !== "ON_SITE" || deliveryMethod === "PICKUP");
    const needsAddress = deliveryMethod === "DELIVERY" && !addresses.data?.length;

    return (
        <ScrollView
            style={ui.screen}
            contentContainerStyle={[ui.content, { gap: 16 }]}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.text} />}
        >
            <Text style={ui.muted}>{cart.itemCount} article(s) à commander en ligne chez les commerçants partenaires.</Text>

            {Object.entries(byShop).map(([shopId, group]) => (
                <View key={shopId} style={[ui.card, { padding: 0, overflow: "hidden" }]}>
                    <Pressable onPress={() => navigation.navigate("Shop", { id: shopId, name: group.name })} style={{ backgroundColor: colors.paper, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontFamily: fonts.semibold, color: colors.text }}>{group.name}</Text>
                    </Pressable>
                    {group.items.map((item, index) => (
                        <View key={item.id} style={[ui.row, { padding: 12, gap: 12 }, index > 0 && { borderTopWidth: 1, borderColor: colors.borderSoft }]}>
                            <Thumb uri={item.product.imageUrl} size={56} contain />
                            <View style={{ flex: 1, gap: 2 }}>
                                <Text style={{ fontFamily: fonts.medium, color: colors.text }} numberOfLines={2} onPress={() => navigation.navigate("Product", { id: item.productId, name: item.product.name })}>
                                    {item.product.name}
                                </Text>
                                <Text style={[ui.muted, { fontSize: 12 }]}>{formatPrice(item.product.price)} / unité</Text>
                                <View style={[ui.row, { marginTop: 6, justifyContent: "space-between" }]}>
                                    <View style={[ui.row, { borderWidth: 1, borderColor: colors.border, borderRadius: radius.ui, gap: 0 }]}>
                                        <Pressable accessibilityRole="button" accessibilityLabel="Diminuer" disabled={item.quantity <= 1} style={{ padding: 8, opacity: item.quantity <= 1 ? 0.4 : 1 }}
                                            onPress={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity - 1 })}>
                                            <Minus size={14} color={colors.text} />
                                        </Pressable>
                                        <Text style={{ width: 28, textAlign: "center", fontFamily: fonts.medium, color: colors.text }}>{item.quantity}</Text>
                                        <Pressable accessibilityRole="button" accessibilityLabel="Augmenter" disabled={item.quantity >= item.product.stock} style={{ padding: 8, opacity: item.quantity >= item.product.stock ? 0.4 : 1 }}
                                            onPress={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity + 1 })}>
                                            <Plus size={14} color={colors.text} />
                                        </Pressable>
                                    </View>
                                    <Text style={ui.price}>{formatPrice(Number(item.product.price) * item.quantity)}</Text>
                                    <Pressable accessibilityRole="button" accessibilityLabel={`Retirer ${item.product.name}`} onPress={() => removeItem.mutate(item.id)} hitSlop={8}>
                                        <Trash size={18} color={colors.faint} />
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            ))}
            <ErrorText message={updateQuantity.error || removeItem.error ? errorMessage(updateQuantity.error ?? removeItem.error) : null} />

            <View style={[ui.card, { gap: 12 }]}>
                <Text style={[ui.title, { fontSize: 20 }]}>Finaliser</Text>
                <Text style={ui.label}>Mode de retrait</Text>
                <View style={[ui.row, { flexWrap: "wrap" }]}>
                    {(Object.keys(DELIVERY_METHOD_LABELS) as DeliveryMethod[]).map((method) => (
                        <Chip key={method} label={DELIVERY_METHOD_LABELS[method]} active={deliveryMethod === method} onPress={() => changeDelivery(method)} />
                    ))}
                </View>
                {deliveryMethod === "DELIVERY" && (
                    needsAddress ? (
                        <Text style={[ui.muted, { color: colors.accentDark }]}>
                            Ajoutez une adresse dans <LinkText color={colors.accentDark} onPress={() => navigation.navigate("Profile")}>votre profil</LinkText> pour être livré.
                        </Text>
                    ) : (
                        <>
                            <Text style={ui.label}>Adresse de livraison</Text>
                            <View style={{ gap: 6 }}>
                                {addresses.data?.map((address) => (
                                    <Chip key={address.id} label={`${address.streetAddress}, ${address.postalCode} ${address.addressLocality}`} active={selectedAddress === address.id} onPress={() => setAddressId(address.id)} />
                                ))}
                            </View>
                        </>
                    )
                )}
                <Text style={ui.label}>Paiement</Text>
                <View style={[ui.row, { flexWrap: "wrap" }]}>
                    {paymentOptions.map((method) => (
                        <Chip key={method} label={PAYMENT_METHOD_LABELS[method]} active={paymentMethod === method} onPress={() => setPaymentMethod(method)} />
                    ))}
                </View>
                <View style={[ui.row, { justifyContent: "space-between", borderTopWidth: 1, borderColor: colors.border, paddingTop: 12 }]}>
                    <Text style={ui.muted}>Total</Text>
                    <Text style={[ui.price, { fontSize: 24 }]}>{formatPrice(cart.total)}</Text>
                </View>
                {shopCount > 1 && <Text style={[ui.muted, { fontSize: 12 }]}>Votre panier sera découpé en {shopCount} commandes, une par boutique.</Text>}
                <ErrorText message={checkout.error ? errorMessage(checkout.error) : null} />
                <Button title="Commander" disabled={checkout.isPending || needsAddress} onPress={() => checkout.mutate()} />
            </View>
        </ScrollView>
    );
}
