import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    CUSTOMER_CANCELLABLE_STATUSES,
    DELIVERY_METHOD_LABELS,
    PAYMENT_METHOD_LABELS,
    formatDate,
    formatPrice,
} from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useStackNavigation, useStackRoute } from "../hooks";
import { Button, ErrorText, LinkText, Loading, StatusBadge, Thumb } from "../components/ui";
import { colors, fonts, ui } from "../theme";

function Line({ label, children }: { label: string; children: ReactNode }) {
    return (
        <View style={[ui.row, { justifyContent: "space-between" }]}>
            <Text style={ui.muted}>{label}</Text>
            {typeof children === "string" ? <Text style={{ fontFamily: fonts.medium, color: colors.text }}>{children}</Text> : children}
        </View>
    );
}

export function OrderScreen() {
    const navigation = useStackNavigation();
    const { id } = useStackRoute<"Order">().params;
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: order, isLoading, error } = useQuery({ queryKey: ["order", id], queryFn: () => api.orders.get(id) });

    const cancel = useMutation({
        mutationFn: () => api.orders.cancel(id),
        onSuccess: (updated) => {
            queryClient.setQueryData(["order", id], updated);
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });

    if (isLoading) return <Loading />;
    if (!order) return <ErrorText message={errorMessage(error) || "Commande introuvable"} />;

    const isCustomer = order.customerId === user?.id;
    const canCancel = isCustomer && CUSTOMER_CANCELLABLE_STATUSES.includes(order.status);
    const pickupAddress = order.shop?.address;

    return (
        <ScrollView style={ui.screen} contentContainerStyle={[ui.content, { gap: 14 }]}>
            <View style={{ gap: 2 }}>
                <Text style={ui.title}>Commande du {formatDate(order.createdAt)}</Text>
                <Text style={ui.muted}>
                    Chez {order.shop ? <LinkText onPress={() => navigation.navigate("Shop", { id: order.shop!.id, name: order.shop!.name })}>{order.shop.name}</LinkText> : "une boutique supprimée"}
                </Text>
            </View>

            <View style={[ui.card, { padding: 0, overflow: "hidden" }]}>
                {order.items.map((item) => (
                    <Pressable
                        key={item.id}
                        disabled={!item.productId}
                        onPress={() => item.productId && navigation.navigate("Product", { id: item.productId, name: item.productName })}
                        style={[ui.row, { padding: 12, gap: 12, borderBottomWidth: 1, borderColor: colors.borderSoft }]}
                    >
                        <Thumb uri={item.product?.imageUrl} size={48} contain />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: fonts.medium, color: colors.text }}>{item.productName}</Text>
                            <Text style={ui.muted}>{item.quantity} × {formatPrice(item.unitPrice)}</Text>
                        </View>
                        <Text style={{ fontFamily: fonts.semibold, color: colors.text }}>{formatPrice(Number(item.unitPrice) * item.quantity)}</Text>
                    </Pressable>
                ))}
                <View style={[ui.row, { justifyContent: "space-between", padding: 14 }]}>
                    <Text style={ui.subtitle}>Total</Text>
                    <Text style={[ui.price, { fontSize: 18 }]}>{formatPrice(order.totalAmount)}</Text>
                </View>
            </View>

            <View style={[ui.card, { gap: 10 }]}>
                <Line label="Statut"><StatusBadge status={order.status} /></Line>
                <Line label="Mode">{DELIVERY_METHOD_LABELS[order.deliveryMethod]}</Line>
                <Line label="Paiement">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Line>
                <View style={{ borderTopWidth: 1, borderColor: colors.border, paddingTop: 10, gap: 2 }}>
                    {order.deliveryMethod === "DELIVERY" ? (
                        <>
                            <Text style={{ fontFamily: fonts.medium, color: colors.text }}>Adresse de livraison</Text>
                            <Text style={ui.muted}>{order.shippingStreet}, {order.shippingPostalCode} {order.shippingLocality}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={{ fontFamily: fonts.medium, color: colors.text }}>Retrait en boutique</Text>
                            {pickupAddress ? <Text style={ui.muted}>{pickupAddress.streetAddress}, {pickupAddress.postalCode} {pickupAddress.addressLocality}</Text> : null}
                        </>
                    )}
                </View>
                {!isCustomer && order.customer && (
                    <View style={{ borderTopWidth: 1, borderColor: colors.border, paddingTop: 10, gap: 2 }}>
                        <Text style={{ fontFamily: fonts.medium, color: colors.text }}>Client</Text>
                        <Text style={ui.muted}>{order.customer.firstname} {order.customer.lastname} · {order.customer.phone}</Text>
                    </View>
                )}
            </View>

            <ErrorText message={cancel.error ? errorMessage(cancel.error) : null} />
            {canCancel && <Button title="Annuler la commande" variant="danger" disabled={cancel.isPending} onPress={() => cancel.mutate()} />}
        </ScrollView>
    );
}
