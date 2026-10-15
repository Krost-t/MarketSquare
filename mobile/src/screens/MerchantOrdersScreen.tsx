import { useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    DELIVERY_METHOD_LABELS,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_TRANSITIONS,
    PAYMENT_METHOD_LABELS,
    formatDate,
    formatPrice,
    type OrderStatus,
} from "@marketsquare/shared";
import { Receipt } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { useStackNavigation } from "../hooks";
import { Button, Chip, ChipRow, Empty, ErrorText, Loading, StatusBadge } from "../components/ui";
import { colors, fonts, ui } from "../theme";

const FILTERS: (OrderStatus | "")[] = ["", "PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];

export function MerchantOrdersScreen() {
    const navigation = useStackNavigation();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<OrderStatus | "">("");

    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ["shop-orders", status],
        queryFn: () => api.orders.shopOrders({ limit: 50, ...(status && { status }) }),
        placeholderData: keepPreviousData,
    });

    const update = useMutation({
        mutationFn: ({ id, next }: { id: string; next: OrderStatus }) => api.orders.updateStatus(id, next),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shop-orders"] }),
    });

    return (
        <FlatList
            style={ui.screen}
            contentContainerStyle={ui.content}
            data={isLoading ? [] : data?.data ?? []}
            keyExtractor={(order) => order.id}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.text} />}
            ListHeaderComponent={
                <View style={{ gap: 10 }}>
                    <ChipRow>
                        {FILTERS.map((filter) => (
                            <Chip key={filter || "all"} label={filter ? ORDER_STATUS_LABELS[filter] : "Toutes"} active={status === filter} onPress={() => setStatus(filter)} />
                        ))}
                    </ChipRow>
                    <ErrorText message={error || update.error ? errorMessage(error ?? update.error) : null} />
                    {isLoading && <Loading />}
                </View>
            }
            ListEmptyComponent={isLoading ? null : <Empty icon={<Receipt size={36} color={colors.text} />} title="Aucune commande reçue" />}
            renderItem={({ item: order }) => (
                <View style={[ui.card, { gap: 6 }]}>
                    <View style={[ui.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
                        <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate("Order", { id: order.id })}>
                            <Text style={{ fontFamily: fonts.medium, color: colors.text, textDecorationLine: "underline" }}>
                                {order.customer?.firstname} {order.customer?.lastname}
                            </Text>
                        </Pressable>
                        <Text style={ui.price}>{formatPrice(order.totalAmount)}</Text>
                    </View>
                    <Text style={ui.muted}>
                        {formatDate(order.createdAt)} · {DELIVERY_METHOD_LABELS[order.deliveryMethod]} · {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                    </Text>
                    {order.deliveryMethod === "DELIVERY" && (
                        <Text style={ui.muted}>{order.shippingStreet}, {order.shippingPostalCode} {order.shippingLocality}</Text>
                    )}
                    {order.customer?.phone ? <Text style={ui.muted}>Tél. {order.customer.phone}</Text> : null}
                    <StatusBadge status={order.status} />
                    {order.items.map((item) => (
                        <Text key={item.id} style={[ui.body, { fontSize: 14 }]}>{item.quantity} × {item.productName}</Text>
                    ))}
                    {ORDER_STATUS_TRANSITIONS[order.status].length > 0 && (
                        <View style={[ui.row, { flexWrap: "wrap", marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderColor: colors.borderSoft }]}>
                            {ORDER_STATUS_TRANSITIONS[order.status].map((next) => (
                                <Button
                                    key={next}
                                    compact
                                    title={ORDER_STATUS_LABELS[next]}
                                    variant={next === "CANCELLED" || next === "RETURNED" ? "danger" : "ghost"}
                                    disabled={update.isPending}
                                    onPress={() => update.mutate({ id: order.id, next })}
                                />
                            ))}
                        </View>
                    )}
                </View>
            )}
        />
    );
}
